/**
 * @packageDocumentation
 *
 * `@meddleware/design-tokens` — Oxblood / Indigo design tokens for the `@meddleware` UIs.
 *
 * ### Typical usage
 *
 * Import the CSS custom properties once at your application entry point:
 *
 * ```ts
 * import '@meddleware/design-tokens/tokens.css'
 * ```
 *
 * Then consume the semantic variables in your styles:
 *
 * ```css
 * .my-button {
 *   background: var(--accent);
 *   color: var(--accent-contrast);
 *   border-radius: var(--radius);
 * }
 * ```
 *
 * ### JavaScript / TypeScript consumers
 *
 * The JS exports expose the same values for tooling (Storybook, tests, generative
 * tooling, or non-CSS environments). They are never required at runtime by a
 * browser application — the CSS file is the source of truth.
 *
 * ```ts
 * import { brand, semantic, neutral } from '@meddleware/design-tokens'
 *
 * console.log(brand.oxblood[500]) // '#5e1622'
 * console.log(semantic.dark.accent)  // '#b0465a'
 * ```
 *
 * @module
 */
import tokens from './tokens.json'

/**
 * The three supported colour-mode states.
 *
 * - `'light'` — force light theme (set `data-theme="light"` on `<html>`, or omit the attribute).
 * - `'dark'`  — force dark theme (set `data-theme="dark"` on `<html>`).
 * - `'system'` — follow the OS preference via `prefers-color-scheme`; your component layer is
 *   responsible for reading `matchMedia('(prefers-color-scheme: dark)')` and toggling the attribute.
 */
export type ColorMode = 'light' | 'dark' | 'system'

/**
 * The complete design token tree, combining all sub-palettes.
 *
 * Prefer importing the individual named exports ({@link brand}, {@link semantic},
 * {@link neutral}) for narrower types and better tree-shaking. Use this only when
 * you need a single serialisable snapshot of every token value.
 */
export const designTokens = tokens

/**
 * Semantic colour tokens resolved per theme.
 *
 * Keys: `light` and `dark`. Each value is a flat map of semantic role → resolved hex.
 *
 * These mirror the CSS custom properties (`--bg`, `--surface`, `--text`, etc.) defined
 * in `tokens.css`. They are useful in server-rendered or headless environments where
 * CSS variables are not available.
 *
 * @example
 * ```ts
 * import { semantic } from '@meddleware/design-tokens'
 * const bgColor = isDark ? semantic.dark.bg : semantic.light.bg
 * ```
 */
export const semantic = tokens.semantic

/**
 * Brand colour ramps (theme-independent, fixed values).
 *
 * Contains three primary brand hues — `oxblood`, `indigo`, and `gold` — each
 * with multiple lightness stops (e.g. `brand.oxblood[500]`). Use these when you
 * need a specific brand stop rather than a semantic role (e.g. for illustrations,
 * data-vis, or documentation colour swatches).
 *
 * @example
 * ```ts
 * import { brand } from '@meddleware/design-tokens'
 * document.body.style.background = brand.oxblood['050']
 * ```
 */
export const brand = tokens.brand

/**
 * Functional primary + rainbow colour ramps (`red`, `orange`, `yellow`, `green`, `blue`).
 *
 * These are the human-universal accents the semantic roles (`--accent`, `--warning`, `--ok`,
 * `--info`, `--focus-ring`, …) resolve to. Prefer the semantic CSS roles in components; reach for
 * a specific primary stop only for illustrations/data-vis. Values are derived and tunable.
 *
 * @example
 * ```ts
 * import { primary } from '@meddleware/design-tokens'
 * primary.blue['500'] // '#1d6fe0'
 * ```
 */
export const primary = tokens.primary

/**
 * Sacred-geometry ratios. `phi` (φ ≈ 1.618) is the structural ratio; `phiRoot` (√φ ≈ 1.272) is the
 * finer type-scale step (two steps = one φ octave); `phiInv` is 1/φ. Mirrors the `--ratio-*` CSS
 * custom properties — use these when computing layout ratios in JS/tooling.
 */
export const ratio = tokens.ratio

/**
 * Spacing scale — Fibonacci multiples of a 0.25rem unit (`3xs`…`3xl`). Mirrors the `--space-*` CSS
 * custom properties. Prefer the CSS tokens in styles; these are for tooling/JS-driven layout.
 */
export const space = tokens.space

/**
 * Warm neutral scale (theme-independent, fixed values).
 *
 * Steps: `000` (white) through `950` (near-black), intentionally warm-toned to
 * complement the oxblood/indigo brand palette. Prefer the semantic tokens
 * (`--text`, `--muted`, `--bg`, `--surface`, `--border`) in components; reach for
 * these only when you need a specific neutral stop (e.g. for shadows or illustrations).
 *
 * @example
 * ```ts
 * import { neutral } from '@meddleware/design-tokens'
 * const shadowColor = neutral['700'] // '#332c29'
 * ```
 */
export const neutral = tokens.neutral

/**
 * Default export — the complete token tree.
 *
 * Equivalent to {@link designTokens}. Named exports are preferred for most consumers.
 */
export default tokens
