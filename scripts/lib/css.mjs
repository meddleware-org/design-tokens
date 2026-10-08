// Shared helpers for the token checks: strip comments, read flat `selector { --x: y }` blocks, evaluate
// the cascade for a theme × season, resolve var() chains and compute WCAG contrast. Standard library only.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src')

export const THEMES = ['light', 'dark']
export const SEASONS = [null, 'spring', 'summer', 'autumn', 'winter']

/** CSS text without comments. */
export function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

/** Flat blocks `{ selectors: string[], decls: Map, order: number }` (no nesting, no at-rules expected). */
export function parseBlocks(css, firstOrder = 0) {
  const blocks = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m
  let order = firstOrder
  while ((m = re.exec(stripComments(css))) !== null) {
    const decls = new Map()
    const declRe = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi
    let d
    while ((d = declRe.exec(m[2])) !== null) decls.set(d[1], d[2].trim())
    blocks.push({ selectors: m[1].split(',').map((s) => s.trim()), decls, order: order++ })
  }
  return blocks
}

/** Does a selector from our two files apply to `{ theme, season }`? Returns its specificity, or null. */
export function matches(selector, env) {
  const base = selector.match(/^(:root)?((?:\.[a-z-]+|\[[^\]]+\])*)$/)
  if (!base) return null
  let specificity = base[1] ? 10 : 0
  for (const part of base[2].match(/\.[a-z-]+|\[[^\]]+\]/g) ?? []) {
    specificity += 10
    if (part === '.dark') {
      if (env.theme !== 'dark') return null
      continue
    }
    const attr = part.match(/^\[data-(theme|season)="([^"]+)"\]$/)
    if (!attr) return null
    const want = attr[2]
    const have = attr[1] === 'theme' ? env.theme : env.season
    if (have !== want) return null
  }
  return specificity
}

/** The custom properties in effect for a theme × season, with later/more specific blocks winning. */
export function cascade(blocks, env) {
  const applied = []
  for (const b of blocks) {
    const best = Math.max(-1, ...b.selectors.map((s) => matches(s, env) ?? -1))
    if (best >= 0) applied.push({ specificity: best, order: b.order, decls: b.decls })
  }
  applied.sort((a, b) => a.specificity - b.specificity || a.order - b.order)
  const out = new Map()
  for (const a of applied) for (const [k, v] of a.decls) out.set(k, v)
  return out
}

/** Resolve `var(--x[, fallback])` chains to a literal value, or null when something is undefined. */
export function resolve(value, vars, depth = 0) {
  if (depth > 20) throw new Error(`var() chain too deep: ${value}`)
  const m = value.match(/^var\(\s*(--[a-z0-9-]+)\s*(?:,\s*([\s\S]+))?\)$/i)
  if (!m) return value.trim()
  const direct = vars.get(m[1])
  if (direct !== undefined) return resolve(direct, vars, depth + 1)
  return m[2] !== undefined ? resolve(m[2], vars, depth + 1) : null
}

export function loadBlocks() {
  const tokens = readFileSync(join(srcDir, 'tokens.css'), 'utf8')
  const seasons = readFileSync(join(srcDir, 'seasons.css'), 'utf8')
  const a = parseBlocks(tokens)
  return [...a, ...parseBlocks(seasons, a.length)]
}

/** `#rgb` / `#rrggbb` → [r, g, b] (0–255), or null. */
export function hexToRgb(hex) {
  const m = hex.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) return null
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1]
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}

export function luminance([r, g, b]) {
  const lin = (c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Hue in degrees (0–360) of an RGB colour; NaN for greys. */
export function hue([r, g, b]) {
  const [R, G, B] = [r, g, b].map((c) => c / 255)
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  if (max === min) return Number.NaN
  const d = max - min
  const h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4
  return (h * 60 + 360) % 360
}
