/**
 * Shared helpers for the token checks: strip comments, read the flat `selector { --x: y }` blocks of the two CSS files, evaluate the
 * cascade for one theme × season, resolve `var()` chains to literal values, and compute WCAG contrast. Standard library only, so the
 * checks run with nothing but Node installed.
 *
 * Used by: check-contrast.mjs (the AAA gate), check-token-sync.mjs (CSS ↔ JSON parity), check-css-contract.mjs (custom properties only).
 * Main exports: srcDir, THEMES, SEASONS, stripComments, parseBlocks, matches, cascade, resolve, loadBlocks, hexToRgb, luminance, contrast, hue.
 *
 * It is a deliberately small CSS reader, not a parser: the two files it reads hold only flat blocks of custom properties (the CSS
 * contract check enforces that), so nesting, at-rules and ordinary properties never need to be understood here.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The package's `src/` directory, found from this file so the checks work from any working directory. */
export const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src')

/** The two themes every colour pairing is measured in. */
export const THEMES = ['light', 'dark']
/** No season (the default palette) and the four optional seasons of `seasons.css`. */
export const SEASONS = [null, 'spring', 'summer', 'autumn', 'winter']

/**
 * CSS text with its comments removed, so a commented-out declaration is never read as a live one.
 * @param {string} css - the stylesheet text
 * @returns {string} the same text with its block comments removed
 */
export function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

/**
 * Read the flat blocks of a stylesheet: every `selectors { --name: value; … }` rule, keeping only custom properties.
 * @param {string} css - the stylesheet text
 * @param {number} [firstOrder=0] - the source order given to the first block, so blocks from a second file sort after the first file's
 * @returns {{ selectors: string[], decls: Map<string, string>, order: number }[]} one entry per block, in source order
 */
export function parseBlocks(css, firstOrder = 0) {
  const blocks = []
  // A block is a selector list and a brace body with no braces inside: the files are flat by contract.
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m
  let order = firstOrder
  while ((m = re.exec(stripComments(css))) !== null) {
    const decls = new Map()
    // Only custom properties count; anything else would fail the CSS contract check before it reached here.
    const declRe = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi
    let d
    while ((d = declRe.exec(m[2])) !== null) decls.set(d[1], d[2].trim())
    blocks.push({ selectors: m[1].split(',').map((s) => s.trim()), decls, order: order++ })
  }
  return blocks
}

/**
 * Does a selector used in our two files apply to a theme × season, and with what specificity?
 * Understands exactly the selector shapes the files use: `:root`, the `.dark` class, and `[data-theme="…"]` / `[data-season="…"]`.
 * @param {string} selector - one selector from a block's list
 * @param {{ theme: string, season: string | null }} env - the theme and season being evaluated
 * @returns {number | null} the selector's specificity (10 per part, as a simple ordinal), or null when it does not apply
 */
export function matches(selector, env) {
  const base = selector.match(/^(:root)?((?:\.[a-z-]+|\[[^\]]+\])*)$/)
  // Any other selector shape is not ours: it never applies, so a stray rule cannot change a measured colour.
  if (!base) return null
  let specificity = base[1] ? 10 : 0
  for (const part of base[2].match(/\.[a-z-]+|\[[^\]]+\]/g) ?? []) {
    specificity += 10
    // `.dark` is the class the colour-mode script sets; it is the dark theme regardless of `data-theme`.
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

/**
 * The custom properties in effect for a theme × season: every block that applies, lower specificity first and then source order, so a
 * later or more specific block wins as it would in a browser.
 * @param {{ selectors: string[], decls: Map<string, string>, order: number }[]} blocks - from parseBlocks or loadBlocks
 * @param {{ theme: string, season: string | null }} env - the theme and season being evaluated
 * @returns {Map<string, string>} property name to (unresolved) value
 */
export function cascade(blocks, env) {
  const applied = []
  for (const b of blocks) {
    // A block applies with the specificity of its most specific matching selector, as in CSS.
    const best = Math.max(-1, ...b.selectors.map((s) => matches(s, env) ?? -1))
    if (best >= 0) applied.push({ specificity: best, order: b.order, decls: b.decls })
  }
  applied.sort((a, b) => a.specificity - b.specificity || a.order - b.order)
  const out = new Map()
  for (const a of applied) for (const [k, v] of a.decls) out.set(k, v)
  return out
}

/**
 * Resolve a `var(--x[, fallback])` chain to a literal value.
 * @param {string} value - a declaration value, possibly a `var()` reference
 * @param {Map<string, string>} vars - the properties in effect (from cascade)
 * @param {number} [depth=0] - recursion depth, for the cycle guard
 * @returns {string | null} the literal value, or null when a referenced property is undefined and has no fallback
 * @throws {Error} when a chain is deeper than 20 references (a cycle, or a mistake worth stopping on)
 */
export function resolve(value, vars, depth = 0) {
  if (depth > 20) throw new Error(`var() chain too deep: ${value}`)
  const m = value.match(/^var\(\s*(--[a-z0-9-]+)\s*(?:,\s*([\s\S]+))?\)$/i)
  if (!m) return value.trim()
  const direct = vars.get(m[1])
  if (direct !== undefined) return resolve(direct, vars, depth + 1)
  // An undefined property falls back as the browser does: to the fallback if there is one, otherwise to nothing.
  return m[2] !== undefined ? resolve(m[2], vars, depth + 1) : null
}

/**
 * The blocks of both stylesheets, `tokens.css` first and `seasons.css` after it, in one source order (how a page loads them).
 * @returns {{ selectors: string[], decls: Map<string, string>, order: number }[]} every block of both files
 */
export function loadBlocks() {
  const tokens = readFileSync(join(srcDir, 'tokens.css'), 'utf8')
  const seasons = readFileSync(join(srcDir, 'seasons.css'), 'utf8')
  const a = parseBlocks(tokens)
  return [...a, ...parseBlocks(seasons, a.length)]
}

/**
 * A hex colour as its red, green and blue channels.
 * @param {string} hex - `#rgb` or `#rrggbb`
 * @returns {[number, number, number] | null} channels from 0 to 255, or null for anything else (a named colour, `rgb()`, a typo)
 */
export function hexToRgb(hex) {
  const m = hex.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) return null
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1]
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}

/**
 * Relative luminance of an sRGB colour, as WCAG defines it.
 * The linearisation threshold is WCAG 2.0's 0.03928 (WCAG 2.2 and the sRGB standard use 0.04045). For 8-bit channels the two give the same
 * result: no integer channel value lies between them (10/255 is below both, 11/255 above both), so every hex colour measures identically.
 * @param {[number, number, number]} rgb - channels from 0 to 255
 * @returns {number} luminance from 0 (black) to 1 (white)
 */
export function luminance([r, g, b]) {
  const lin = (c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/**
 * WCAG contrast ratio between two colours (order does not matter).
 * @param {[number, number, number]} a - one colour's channels
 * @param {[number, number, number]} b - the other colour's channels
 * @returns {number} from 1 (identical) to 21 (black on white); AAA text needs 7, large text and non-text 4.5 and 3
 */
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Hue of a colour, used to keep accents recognisably the hue they are named for.
 * @param {[number, number, number]} rgb - channels from 0 to 255
 * @returns {number} degrees from 0 to 360, or NaN for a grey (no hue)
 */
export function hue([r, g, b]) {
  const [R, G, B] = [r, g, b].map((c) => c / 255)
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  if (max === min) return Number.NaN
  const d = max - min
  // The standard HSL hue sextant formula; the final `+ 360) % 360` folds negative angles into range.
  const h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4
  return (h * 60 + 360) % 360
}
