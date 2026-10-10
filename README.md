# @meddleware/design-tokens

Framework-agnostic design tokens for the `@meddleware` UIs — a **warm-neutral canvas with
functional primary/rainbow accents**, sacred-geometry spacing/type scales, and optional seasonal
theming. Delivered as CSS custom properties plus TypeScript/JSON exports.

## Philosophy (brief, non-dogmatic)

Design recedes; content dominates. A few principles shape the tokens — you never have to think about
them to use the package, but they explain the choices:

- **Sacred geometry as invisible structure.** The type and spacing scales derive from the golden
  ratio (φ ≈ 1.618) and Fibonacci. The maths governs rhythm; it is never drawn as ornament.
- **Colour is a warm-neutral canvas + functional accents.** Primary/rainbow hues (red, blue, yellow,
  green, orange) are used *functionally* — accents, status, focus — as human universals, not as a
  brand identity. We avoid royalty/priesthood signalling: **no gold, no purple, no black+gold**.
- **Controlled imperfection over corporate polish.** Subtle noise and intentional (not broken)
  asymmetry are available as opt-in utilities.
- **Open and transparent.** CSS-native, no build step, no external dependencies, `0BSD`.

## Two-layer naming discipline

- **Palette / ramp layer** — colour-**named** (`--mw-red-500`). A ramp legitimately names a hue. The
  palette is *expandable*; older brand ramps (`--mw-oxblood-*`, `--mw-gold-*`, …) remain as available
  swatches but are **not** referenced by any role.
- **Semantic / role layer** — colour-**agnostic** (`--accent`, `--warning`, `--focus-ring`,
  `--space-md`). **Components use only these.** Revaluing a role later never forces a rename — never
  name a role after a colour.

## Installation

```sh
npm install @meddleware/design-tokens
```

## Quick start

Import the CSS once at your app entry. Seasons are optional.

```ts
import '@meddleware/design-tokens/tokens.css'    // required — base light/dark theme
import '@meddleware/design-tokens/seasons.css'   // optional — enables data-season overrides
```

Then use the semantic roles and scale tokens in your styles:

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  padding: var(--space-md);          /* Fibonacci spacing scale */
  font-size: var(--font-size-base);  /* φ type scale */
}
.button-primary { background: var(--primary); color: var(--primary-contrast); }

.status-ok   { color: var(--ok); }
.status-warn { color: var(--warning); }   /* functional yellow — not gold */
.status-err  { color: var(--danger); }
.status-info { color: var(--info); }
```

## Theme hierarchy

```text
Seasonal tokens (optional, highest priority)   [data-season="spring|summer|autumn|winter"]
        ↓  silent fallback
Primary light / dark tokens (required, always present)   data-theme="dark"
        ↓
Component-level overrides (in your components)
```

Each interactive role reads a seasonal override first, then falls back silently:

```css
--accent: var(--season-accent, var(--mw-terracotta-500));
```

If no season is active, `--season-accent` is simply undefined and the primary fallback is used —
**silently, with no console errors and no broken layout** (we deliberately do not register these with
`@property`, so an undefined seasonal var fails silent).

## Seasonal theming

### 1. Light/dark only (no seasonal code)

Do nothing. Import `tokens.css`, optionally toggle `data-theme="dark"`. Every role uses its primary
fallback. You never need `seasons.css`.

### 2. Enable a season

Import `seasons.css` and set the attribute on `<html>` (or any ancestor):

```html
<html data-season="autumn">          <!-- autumn accents on the light canvas -->
<html data-theme="dark" data-season="winter">  <!-- winter accents on the dark canvas -->
```

Seasons set only the **accent** roles; `data-theme` still owns the neutral canvas and the status
roles (`--danger`, `--warning`, `--ok`, `--info`), which are tuned per theme for legibility, so the two
compose. Remove the attribute (or don't import `seasons.css`) to opt out — silently.

### 3. Override one token while keeping the seasonal fallback

Because roles read `var(--season-*, <fallback>)`, you can set your own `--season-*` value (globally or
scoped) without importing `seasons.css` at all:

```css
/* Brand-tune just the accent; everything else keeps its fallback. */
:root { --season-accent: #0aa1dd; }
```

Or scope it to a subtree:

```css
.promo { --season-accent: var(--mw-green-500); }  /* accents inside .promo only */
```

## Token reference

### Semantic roles (use these in components)

Values swap automatically between light and dark, and are overridable per season.

| Token | Light fallback | Dark fallback | Role |
| --- | --- | --- | --- |
| `--bg` | `#f7f4f1` | `#120e10` | Page / window background |
| `--surface` | `#ffffff` | `#1c1618` | Card, modal, elevated panel |
| `--lift` | `#efeae6` | `#241c1f` | Hover / raised surface (text roles meet AA on it) |
| `--border` | `#ded6cf` | `#372b2e` | Dividers, outlines, borders |
| `--text` | `#201b19` | `#f2eae6` | Primary body text |
| `--muted` | `#6e635c` | `#b7a9a3` | Secondary / helper text |
| `--accent` | terracotta `#b74427` | terracotta `#e07850` | Primary interactive (links, CTAs, badges) |
| `--primary` | moss `#2a7754` | moss `#5aaa80` | Affirmative / constructive actions |
| `--accent-contrast` | `#ffffff` | `#201b19` | Text on accent |
| `--primary-contrast` | `#ffffff` | `#0b0809` | Text on primary |
| `--secondary` | slate `#4e5f9e` | slate `#9ba8d4` | Secondary interactive |
| `--secondary-contrast` | `#ffffff` | `#0b0809` | Text on secondary |
| `--danger` | `#b3261e` | `#f08a7e` | Error / destructive |
| `--warning` | yellow `#e0a500` | yellow `#f4d84f` | Caution / degraded — a **fill** (2.0:1 on the light canvas) |
| `--warning-text` | amber `#886400` | yellow `#f4d84f` | Warning drawn as **text** (4.95:1 on `--bg`, 4.54:1 on `--lift`) |
| `--ok` | green `#177542` | green `#5bb392` | Success / healthy |
| `--info` | blue `#1558b5` | blue `#6ea8fe` | Informational |
| `--highlight` | yellow `#f2c744` | yellow `#f4d84f` | Emphasis (the old "premium" role) |
| `--focus-ring` | slate `#4e5f9e` | slate `#9ba8d4` | Visible focus outline (distinct from accent; never red) |
| `--radius` / `--radius-sm` / `--radius-lg` | `10 / 6 / 16px` | — | Corner radius |

### Functional primary + rainbow ramps

The accents the roles resolve to. Values are **derived and tunable** — nudge to taste; the roles do
not change name when you do.

| Ramp | Stops |
| --- | --- |
| `--mw-red-*` | `300 #ef5a4c` · `500 #d92d20` · `600 #a81d13` |
| `--mw-orange-*` | `400 #f08a3c` · `500 #e06d10` · `600 #aa500c` |
| `--mw-yellow-*` | `300 #f4d84f` · `400 #f2c744` · `500 #e0a500` · `600 #a87c00` |
| `--mw-green-*` | `300 #5bb392` · `500 #1f9254` · `600 #177542` |
| `--mw-blue-*` | `300 #6ea8fe` · `500 #1d6fe0` · `600 #1558b5` |

### Sacred-geometry scales

Colour-agnostic, `calc()`-derived from ratio constants (no magic numbers).

| Group | Tokens |
| --- | --- |
| Ratios | `--ratio-phi` (1.618) · `--ratio-phi-inv` (0.618) · `--ratio-phi-root` (√φ 1.272) · `--split-major` (61.8%) · `--split-minor` (38.2%) |
| Type scale | `--font-size-xs … --font-size-3xl` (base 1rem, climbing by √φ; two steps = one φ octave) |
| Leading / tracking | `--leading-tight/normal/loose` · `--tracking-tight/normal/wide` |
| Spacing | `--space-3xs … --space-3xl` (Fibonacci ×0.25rem: 0.25·0.5·0.75·1.25·2·3.25·5.25·8.5·13.75) |

### Chaos / motion tokens

| Token | Role |
| --- | --- |
| `--noise-overlay` / `--noise-opacity` | Subtle CSS-native SVG turbulence for backgrounds (see `.mw-noise` in `@meddleware/ui`) |
| `--hero-offset` / `--gap-irregular` | φ-derived intentional-asymmetry hooks |
| `--transition-base` / `--transition-slow` | Human easing (deliberately not "slick") |

### Legacy brand ramps + secondary palette (available swatches, not used by roles)

`--mw-oxblood-*`, `--mw-indigo-*`, `--mw-gold-*`, `--mw-pine-*`, `--mw-plum-*`, `--mw-copper-*` remain
defined so the palette stays rich and nothing breaks, but **no semantic role references them** — the
design philosophy avoids gold/purple as identity. Prefer the functional primaries + roles above.

### Warm neutrals, panel palettes, shape/type constants

`--mw-neutral-000…950`, `--mw-panel-{dark,light}-*` (theme-independent, for `variant`-aware layout
shell components), `--mw-radius*`, `--mw-font-sans/mono`, `--mw-header-height`, `--mw-sidebar-width`
are unchanged.

## Colour mode

Light is the default; add `data-theme="dark"` to `<html>` for dark mode. `@meddleware/ui` ships a
`ColorModeControl` + `useColorMode()` that manage the attribute and persist to `localStorage`.

## JavaScript / TypeScript API

```ts
import tokens, { brand, primary, semantic, neutral, ratio, space, designTokens }
  from '@meddleware/design-tokens'

primary.blue['500']   // '#1d6fe0'
semantic.light.accent // '#b74427'  (no-season default)
ratio.phi             // 1.618
space.md              // '2rem'
neutral['800']        // '#201b19'
```

| Export | Description |
| --- | --- |
| `primary` | Functional primary ramps: `red`, `orange`, `yellow`, `green`, `blue` |
| `brand` | Legacy brand ramps (`oxblood`, `indigo`, `gold`) — retained swatches |
| `semantic` | No-season resolved value of every colour role per theme (`light`, `dark`); `check:sync` fails if a role is missing |
| `neutral` | Warm neutral scale `000`–`950` |
| `secondary` | Retained swatches `pine`, `plum`, `copper` |
| `status` | **Deprecated** — legacy `--mw-danger-500` / `--mw-ok-500` ramp stops, not the role values (`status.ok` differs from `--ok`); use `semantic.*.ok` / `.danger` |
| `radius` | Corner radii `sm`, `md`, `lg` |
| `ratio` | φ ratio constants |
| `space` | Fibonacci spacing scale |
| `designTokens` / `default` | The complete token tree |
| `ColorMode` | type `'light' \| 'dark' \| 'system'` |

The `.` entry ships TypeScript source and imports `tokens.json` with an import attribute
(`with { type: 'json' }`), which Node, Deno/JSR and bundlers accept. Node does not strip types under
`node_modules`, so from npm import it through a bundler or a TS loader; `tokens.json` itself
(`@meddleware/design-tokens/tokens.json`) imports anywhere. JSR serves only `.` and `tokens.json`
(CSS cannot be exported there) — use npm for `tokens.css` / `seasons.css`. `npm test` imports the entry
under Node and Deno.

## Migration note (internal)

No published external consumers, so no backwards-compat shims and no version bump is required — just
keep everything in lockstep:

- `--gold` (semantic) is **removed**; use `--warning` (caution) or `--highlight` (emphasis).
- `--accent`/`--primary`/`--secondary` are now terracotta, moss and slate (the 0.1.x functional triad;
  they were oxblood/indigo, then briefly red/blue).
- New: `--warning`, `--info`, `--highlight`, `--focus-ring`, the `--space-*`/`--font-size-*` scales,
  `--noise-*`, `--transition-*`, and the functional primary ramps.
- Legacy `--mw-oxblood/indigo/gold/plum/copper-*` ramps still resolve (kept as swatches) but should
  not be referenced by new code.

## Bundler notes

`"sideEffects": ["*.css"]` keeps CSS imports from being tree-shaken. The package ships `src/`
directly (no build step); consumers' bundlers process the CSS/TS/JSON. `check:sync`
(`scripts/check-token-sync.mjs`, run in CI) guards that `tokens.css` ↔ `tokens.json` ↔ `index.ts`
stay in sync and that every season overrides the same role set. `check:contrast` measures every
role pairing in every theme × season against WCAG AA (4.5:1 text and labels, 3:1 focus ring), and
`check:css` asserts both CSS files contain custom properties only (no rules, at-rules or `url()` beyond the
pinned noise overlay) — they are imported as global CSS by every app.

### Seasons and dark mode

Each season has two blocks in `seasons.css`: darker stops for light canvases and lighter stops for dark
canvases, because no single mid-tone reads at 4.5:1 on both. Set `data-season` on `<html>` together with
`data-theme="dark"` (or `class="dark"` on `<html>`; the class form is honoured on the root element only).

## Publishing

CI publishes on `v*` git tags via `.github/workflows/npm-publish.yml` using **npm trusted publishing**
(OIDC) — no long-lived tokens. Bump `version`, add a `CHANGELOG.md` entry, tag, and push.

## License

[0BSD](./LICENSE) — BSD Zero Clause License.
