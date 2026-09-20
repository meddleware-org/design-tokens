#!/usr/bin/env node
// Validates that src/tokens.json (the JS/TS API surface) stays in sync with src/tokens.css
// (the authoritative source) and that src/index.ts re-exports the JSON subtrees.
//
// Why: tokens.css, tokens.json, and index.ts are hand-synced with no automated guard (see
// CLAUDE.md "Known footgun"). The most dangerous drift is a tokens.json value that no longer
// matches tokens.css — JS/tooling consumers would then read a stale colour. This script fails CI
// on that drift.
//
// What it checks (all deterministic, no network):
//   1. Forward JSON -> CSS: every value in tokens.json maps to a CSS custom property whose
//      resolved value is byte-identical. Semantic values resolve var(--mw-*) references.
//   2. Semantic light/dark symmetry: both themes declare the same key set (CLAUDE.md: "add it to
//      both blocks").
//   3. index.ts re-exports the brand/semantic/neutral subtrees that tokens.json declares.
//
// It intentionally does NOT flag CSS custom properties that are absent from tokens.json: the JSON
// is a curated partial mirror (e.g. --mw-oxblood-050, --mw-panel-*, --mw-font-* are CSS-only by
// design). The forward direction is the one that protects JS consumers.

import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const srcDir = join(here, '..', 'src')

const cssText = readFileSync(join(srcDir, 'tokens.css'), 'utf8')
const tokens = JSON.parse(readFileSync(join(srcDir, 'tokens.json'), 'utf8'))
const indexText = readFileSync(join(srcDir, 'index.ts'), 'utf8')
const seasonsPath = join(srcDir, 'seasons.css')

const errors = []

/** Parse a single CSS block's `--name: value;` declarations into a Map (last-wins). */
function parseDecls(block) {
  const decls = new Map()
  const re = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi
  let m
  while ((m = re.exec(block)) !== null) {
    decls.set(m[1].trim(), m[2].trim())
  }
  return decls
}

/** Extract the body of the first `<selector> { ... }` block whose selector matches `test`. */
function blockFor(test) {
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m
  const merged = new Map()
  while ((m = re.exec(cssText)) !== null) {
    const selector = m[1].trim()
    if (test(selector)) {
      for (const [k, v] of parseDecls(m[2])) merged.set(k, v)
    }
  }
  return merged
}

// :root (light + all theme-independent ramps). Exclude the dark selector.
const rootDecls = blockFor((s) => s.includes(':root') && !s.includes('data-theme'))
// dark overrides.
const darkDecls = blockFor((s) => s.includes('data-theme="dark"'))

/**
 * Resolve a CSS value to its concrete form, following `var(--x)` and `var(--x, fallback)`
 * references (theme override first, then :root ramp, then the fallback — mirroring CSS
 * cascade). A `--season-*` var is intentionally undefined here, so seasonal-first roles resolve
 * to their primary fallback (the no-season default the JSON snapshot records).
 */
function resolveValue(value, themeDecls) {
  value = value.trim()
  const m = value.match(/^var\(\s*(--[a-z0-9-]+)\s*(?:,\s*([\s\S]+))?\)$/i)
  if (!m) return value
  const ref = m[1]
  const fallback = m[2]
  const resolved = themeDecls.get(ref) ?? rootDecls.get(ref)
  if (resolved !== undefined) return resolveValue(resolved, themeDecls)
  if (fallback !== undefined) return resolveValue(fallback.trim(), themeDecls)
  return value
}

/**
 * Compute a `calc(var(--space-unit) * N)` spacing value to a `<num>rem` string, so the Fibonacci
 * space scale can be value-checked against the resolved rem in tokens.json. Returns null if the
 * CSS is not in the expected calc form (caller then falls back to plain resolution).
 */
function computeSpace(raw) {
  const m = raw.match(/^calc\(\s*var\(--space-unit\)\s*\*\s*([0-9.]+)\s*\)$/)
  if (!m) return null
  const unit = parseFloat(rootDecls.get('--space-unit') ?? '')
  if (Number.isNaN(unit)) return null
  return `${+(unit * parseFloat(m[1])).toFixed(4)}rem`
}

const norm = (v) => String(v).trim().toLowerCase()

/** Assert a JSON value maps to the resolved CSS custom property `cssVar` in the given theme. */
function expectMatch(jsonPath, jsonValue, cssVar, themeDecls) {
  const raw = themeDecls.get(cssVar) ?? rootDecls.get(cssVar)
  if (raw === undefined) {
    errors.push(`tokens.json ${jsonPath} = "${jsonValue}" -> CSS var ${cssVar} is MISSING from tokens.css`)
    return
  }
  const resolved = resolveValue(raw, themeDecls)
  if (norm(resolved) !== norm(jsonValue)) {
    errors.push(
      `tokens.json ${jsonPath} = "${jsonValue}" but CSS ${cssVar} resolves to "${resolved}" — drift`,
    )
  }
}

// 1. Forward JSON -> CSS, via the explicit mapping between JSON paths and CSS custom properties.
// 1a. Functional primary + rainbow ramps.
for (const [family, ramp] of Object.entries(tokens.primary)) {
  for (const [stop, value] of Object.entries(ramp)) {
    expectMatch(`primary.${family}.${stop}`, value, `--mw-${family}-${stop}`, rootDecls)
  }
}
// 1b. Legacy brand ramps (retained swatches).
for (const [family, prefix] of [
  ['oxblood', '--mw-oxblood-'],
  ['indigo', '--mw-indigo-'],
  ['gold', '--mw-gold-'],
]) {
  for (const [stop, value] of Object.entries(tokens.brand[family])) {
    expectMatch(`brand.${family}.${stop}`, value, `${prefix}${stop}`, rootDecls)
  }
}
for (const [name, value] of Object.entries(tokens.secondary)) {
  expectMatch(`secondary.${name}`, value, `--mw-${name}-500`, rootDecls)
}
for (const [stop, value] of Object.entries(tokens.neutral)) {
  expectMatch(`neutral.${stop}`, value, `--mw-neutral-${stop}`, rootDecls)
}
for (const [name, value] of Object.entries(tokens.status)) {
  expectMatch(`status.${name}`, value, `--mw-${name}-500`, rootDecls)
}
const radiusMap = { sm: '--mw-radius-sm', md: '--mw-radius', lg: '--mw-radius-lg' }
for (const [name, value] of Object.entries(tokens.radius)) {
  const cssVar = radiusMap[name]
  if (!cssVar) {
    errors.push(`tokens.json radius.${name} has no known CSS mapping (update check-token-sync.mjs)`)
    continue
  }
  expectMatch(`radius.${name}`, value, cssVar, rootDecls)
}
// 1c. Sacred-geometry ratios (plain numeric values).
const ratioMap = { phi: '--ratio-phi', phiInv: '--ratio-phi-inv', phiRoot: '--ratio-phi-root' }
for (const [name, value] of Object.entries(tokens.ratio ?? {})) {
  const cssVar = ratioMap[name]
  if (!cssVar) {
    errors.push(`tokens.json ratio.${name} has no known CSS mapping (update check-token-sync.mjs)`)
    continue
  }
  expectMatch(`ratio.${name}`, value, cssVar, rootDecls)
}
// 1d. Fibonacci spacing scale — CSS is calc(var(--space-unit) * N); compute and compare.
for (const [name, value] of Object.entries(tokens.space ?? {})) {
  const cssVar = `--space-${name}`
  const raw = rootDecls.get(cssVar)
  if (raw === undefined) {
    errors.push(`tokens.json space.${name} = "${value}" -> CSS var ${cssVar} is MISSING from tokens.css`)
    continue
  }
  const computed = computeSpace(raw) ?? resolveValue(raw, rootDecls)
  if (norm(computed) !== norm(value)) {
    errors.push(`tokens.json space.${name} = "${value}" but CSS ${cssVar} computes to "${computed}" — drift`)
  }
}
for (const [key, value] of Object.entries(tokens.semantic.light)) {
  expectMatch(`semantic.light.${key}`, value, `--${key}`, rootDecls)
}
for (const [key, value] of Object.entries(tokens.semantic.dark)) {
  expectMatch(`semantic.dark.${key}`, value, `--${key}`, darkDecls)
}

// 2. Semantic light/dark symmetry.
const lightKeys = Object.keys(tokens.semantic.light).sort()
const darkKeys = Object.keys(tokens.semantic.dark).sort()
if (JSON.stringify(lightKeys) !== JSON.stringify(darkKeys)) {
  errors.push(
    `semantic.light and semantic.dark key sets differ: light=[${lightKeys}] dark=[${darkKeys}]`,
  )
}

// 3. index.ts re-exports the mirrored subtrees.
for (const subtree of ['brand', 'semantic', 'neutral', 'primary', 'ratio', 'space']) {
  if (!(subtree in tokens)) {
    errors.push(`tokens.json is missing the "${subtree}" subtree that index.ts re-exports`)
  }
  const re = new RegExp(`export const ${subtree}\\b`)
  if (!re.test(indexText)) {
    errors.push(`index.ts does not re-export "${subtree}" (expected \`export const ${subtree}\`)`)
  }
}

// 4. Seasonal symmetry (optional file): every [data-season="…"] block must define the SAME
// --season-* key set, so no season silently omits a role (which would fall back inconsistently).
if (existsSync(seasonsPath)) {
  const seasonsText = readFileSync(seasonsPath, 'utf8')
  const blockRe = /\[data-season="([a-z]+)"\]\s*\{([^{}]*)\}/gi
  const seasonKeys = {}
  let sm
  while ((sm = blockRe.exec(seasonsText)) !== null) {
    const season = sm[1]
    const keys = [...sm[2].matchAll(/(--season-[a-z0-9-]+)\s*:/gi)].map((k) => k[1]).sort()
    seasonKeys[season] = keys
  }
  const seasons = Object.keys(seasonKeys)
  if (seasons.length > 0) {
    const reference = JSON.stringify(seasonKeys[seasons[0]])
    for (const s of seasons.slice(1)) {
      if (JSON.stringify(seasonKeys[s]) !== reference) {
        errors.push(
          `seasons.css: [data-season="${s}"] defines a different --season-* key set than ` +
            `"${seasons[0]}" — every season must override the same roles.`,
        )
      }
    }
  }
}

if (errors.length > 0) {
  console.error('✗ design-token sync check FAILED:\n')
  for (const e of errors) console.error(`  - ${e}`)
  console.error(
    `\n${errors.length} problem(s). tokens.css is authoritative — update tokens.json / index.ts to match.`,
  )
  process.exit(1)
}

console.log('✓ design-token sync check passed (tokens.css ↔ tokens.json ↔ index.ts)')
