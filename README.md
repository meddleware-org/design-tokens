# @meddleware/design-tokens

Framework-agnostic design tokens for the `@meddleware` UIs — the **Oxblood / Indigo** palette delivered as CSS custom properties and TypeScript/JSON exports.

- **Primary:** oxblood `#5e1622` — dominant brand hue.
- **Accent:** antique-gold `#b08d2a` — highlights and call-to-action.
- **Subtle:** indigo `#26346b` — secondary navigation and subtle highlights.
- **Secondary:** pine, plum, copper — depth and contrast on specific surfaces.
- **Neutrals:** warm steps (white → near-black), intentionally warm-toned to complement the brand palette.
- **Theming:** light by default; add `data-theme="dark"` to `<html>` for dark mode.

## Installation

```sh
npm install @meddleware/design-tokens
# or
yarn add @meddleware/design-tokens
```

## Quick start

Import the CSS once at your application entry point. The file registers all CSS custom properties on `:root`.

```ts
// src/main.ts (or equivalent)
import '@meddleware/design-tokens/tokens.css'
```

Then use the semantic tokens anywhere in your styles:

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
}

.button-primary {
  background: var(--primary);
  color: var(--primary-contrast);
}

.status-ok   { color: var(--ok); }
.status-warn { color: var(--gold); }
.status-err  { color: var(--danger); }
```

## Token reference

### Semantic tokens (use these in components)

These are the tokens components should consume. Their resolved values swap automatically between light and dark mode without any component changes.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--bg` | `#f7f4f1` | `#120e10` | Page / window background |
| `--surface` | `#ffffff` | `#1c1618` | Card, modal, elevated panel |
| `--lift` | `#efeae6` | `#241c1f` | Hover state / raised surface |
| `--border` | `#ded6cf` | `#372b2e` | Dividers, input outlines, card borders |
| `--text` | `#201b19` | `#f2eae6` | Primary body text |
| `--muted` | `#6e635c` | `#b7a9a3` | Secondary / helper text, placeholders |
| `--accent` | `#5e1622` | `#b0465a` | Interactive colour (links, focus rings, badges) |
| `--accent-contrast` | `#ffffff` | `#ffffff` | Text that sits on `--accent` |
| `--primary` | `#5e1622` | `#b0465a` | Alias for `--accent`; explicit CTA / button semantics |
| `--primary-contrast` | `#ffffff` | `#ffffff` | Text on `--primary` backgrounds |
| `--secondary` | `#26346b` | `#6e82c8` | Subtle secondary interactive colour |
| `--secondary-contrast` | `#ffffff` | `#0b0809` | Text on `--secondary` backgrounds |
| `--gold` | `#b08d2a` | `#c9a94e` | Highlight / premium indicator |
| `--danger` | `#b3261e` | `#f08a7e` | Error, destructive action, alert |
| `--ok` | `#1c5e4a` | `#5bb392` | Success / healthy state |
| `--radius` | `10px` | `10px` | Default border-radius (alias for `--mw-radius`) |

### Brand ramps (fixed, theme-independent)

Use these when a specific lightness stop is required (illustrations, data-vis, colour swatches). In components, prefer the semantic tokens above.

| Token | Value | Notes |
| --- | --- | --- |
| `--mw-oxblood-050` | `#f6eaec` | Near-white tint, subtle hover backgrounds |
| `--mw-oxblood-100` | `#e9c9cf` | Light fill, badge backgrounds |
| `--mw-oxblood-300` | `#c36674` | Mid tint, disabled-state accents |
| `--mw-oxblood-400` | `#a5384a` | Hover state for primary actions |
| `--mw-oxblood-500` | `#5e1622` | **PRIMARY** — canonical brand colour |
| `--mw-oxblood-600` | `#4e121c` | Pressed / active state |
| `--mw-oxblood-700` | `#3a0d15` | Borders on coloured surfaces |
| `--mw-indigo-300` | `#6e82c8` | Dark-mode secondary alias |
| `--mw-indigo-400` | `#3d4f92` | Secondary hover |
| `--mw-indigo-500` | `#26346b` | Canonical secondary (light mode) |
| `--mw-indigo-600` | `#1d2851` | Pressed / active state |
| `--mw-gold-400` | `#c9a94e` | Dark-mode gold alias |
| `--mw-gold-500` | `#b08d2a` | Canonical accent (light mode) |
| `--mw-gold-600` | `#8a6e1f` | Pressed / active state |

### Secondary palette

| Token | Value | Role |
| --- | --- | --- |
| `--mw-pine-500` | `#1c5e4a` | Deep green — alternative success / ok |
| `--mw-plum-500` | `#4b2a55` | Deep purple — alternative accent surface |
| `--mw-copper-500` | `#a65e2e` | Warm copper — warning / caution |

### Warm neutrals

| Token | Value | Notes |
| --- | --- | --- |
| `--mw-neutral-000` | `#ffffff` | Pure white |
| `--mw-neutral-050` | `#f7f4f1` | Page background (light) |
| `--mw-neutral-100` | `#efeae6` | Lifted surface / subtle hover |
| `--mw-neutral-200` | `#ded6cf` | Border / divider |
| `--mw-neutral-300` | `#c4b8ae` | Disabled text / placeholder |
| `--mw-neutral-500` | `#6e635c` | Muted / secondary text |
| `--mw-neutral-700` | `#332c29` | High-contrast text on light |
| `--mw-neutral-800` | `#201b19` | Body text (light mode) |
| `--mw-neutral-900` | `#120e10` | Page background (dark) |
| `--mw-neutral-950` | `#0b0809` | Deepest dark |

### Status hues

Kept visually distinct from oxblood so errors read as errors.

| Token | Value | Notes |
| --- | --- | --- |
| `--mw-danger-500` | `#b3261e` | Error / destructive (light mode) |
| `--mw-danger-300` | `#f08a7e` | Error / destructive (dark mode — lighter for legibility) |
| `--mw-ok-500` | `#1c5e4a` | Success / healthy (light mode) |
| `--mw-ok-300` | `#5bb392` | Success / healthy (dark mode — lighter for legibility) |

### Panel palettes (theme-independent)

Used by `AppHeader`, `AppSidebar`, and `AppFooter` when a `variant` prop forces a specific panel colour regardless of the global page theme. A `variant="dark"` header renders correctly on a light page, and vice-versa.

| Token | Value | Role |
| --- | --- | --- |
| `--mw-panel-dark-bg` | `#16110f` | Dark panel background |
| `--mw-panel-dark-surface` | `#1f1719` | Elevated surface within a dark panel |
| `--mw-panel-dark-text` | `#f2eae6` | Primary text on a dark panel |
| `--mw-panel-dark-muted` | `#b7a9a3` | Secondary text on a dark panel |
| `--mw-panel-dark-border` | `#372b2e` | Dividers within a dark panel |
| `--mw-panel-light-bg` | `#ffffff` | Light panel background |
| `--mw-panel-light-surface` | `#f7f4f1` | Elevated surface within a light panel |
| `--mw-panel-light-text` | `#201b19` | Primary text on a light panel |
| `--mw-panel-light-muted` | `#6e635c` | Secondary text on a light panel |
| `--mw-panel-light-border` | `#ded6cf` | Dividers within a light panel |

### Shape and typography constants

| Token | Value | Role |
| --- | --- | --- |
| `--mw-radius` | `10px` | Default border-radius (cards, modals, inputs) |
| `--mw-radius-sm` | `6px` | Small elements (tags, badges, small buttons) |
| `--mw-radius-lg` | `16px` | Large cards, bottom-sheet, hero images |
| `--mw-font-sans` | system-ui stack | Default sans-serif font stack |
| `--mw-font-mono` | ui-monospace stack | Default monospace font stack |
| `--mw-header-height` | `56px` | AppHeader height — use for layout offset calculations |
| `--mw-sidebar-width` | `240px` | AppSidebar width |

## Colour mode

Light is the default. Add `data-theme="dark"` to `<html>` to activate dark mode.

```ts
// Toggle dark mode
function setColorMode(mode: 'light' | 'dark' | 'system') {
  if (mode === 'system') {
    document.documentElement.removeAttribute('data-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    document.documentElement.setAttribute('data-theme', mode)
  }
}
```

The `@meddleware/ui` package ships a `ColorModeControl` component that manages this automatically and persists the preference to `localStorage`.

## JavaScript / TypeScript API

The package also exports the token values as typed JavaScript for tooling, tests, and non-CSS environments (e.g. Canvas, WebGL, server-side rendering).

```ts
import tokens, { brand, semantic, neutral, designTokens } from '@meddleware/design-tokens'
import type { ColorMode } from '@meddleware/design-tokens'

// Brand ramp
brand.oxblood['500'] // '#5e1622'
brand.indigo['300']  // '#6e82c8'
brand.gold['400']    // '#c9a94e'

// Semantic values per theme
semantic.light.bg    // '#f7f4f1'
semantic.dark.accent // '#b0465a'

// Neutral scale
neutral['800']       // '#201b19'

// Full token tree (for serialisation / snapshot testing)
designTokens         // { brand, secondary, neutral, status, radius, semantic }
```

### Exported identifiers

| Export | Type | Description |
| --- | --- | --- |
| `default` | token tree | Complete token tree (same as `designTokens`) |
| `designTokens` | token tree | Complete token tree |
| `brand` | object | Brand colour ramps: `oxblood`, `indigo`, `gold` |
| `semantic` | object | Semantic values per theme: `light` and `dark` |
| `neutral` | object | Warm neutral scale: steps `000`–`950` |
| `ColorMode` | type | `'light' \| 'dark' \| 'system'` |

## Bundler notes

`package.json` declares `"sideEffects": ["*.css"]`. This tells bundlers (Vite, webpack, Rollup) that `.css` imports must not be tree-shaken even if their exports are not referenced. Without this, some bundler configurations drop CSS-only imports, and the tokens are never registered.

The package ships source files directly (`"files": ["src"]`) with no build step. Consumers import CSS and TypeScript/JSON directly. This means:

- No separate build is required to publish.
- The consumer's bundler resolves and processes the files as part of its own build.
- TypeScript types are resolved from `src/index.ts` directly.

## Publishing

CI publishes on `v*` git tags via `.github/workflows/publish.yml` using **npm trusted publishing** (OIDC) — no long-lived npm tokens are needed.

### Setup (one-time)

1. On [npmjs.com](https://www.npmjs.com), go to the package settings → **Trusted Publisher** and configure a GitHub Actions publisher:
   - **Organization or user:** your GitHub username / org
   - **Repository:** the repository name
   - **Workflow filename:** `publish.yml`
   - **Allowed actions:** `npm publish`
2. No repository secrets are required. The `id-token: write` permission in the workflow is sufficient.

### Releasing

1. Update `version` in `package.json`.
2. Add an entry to `CHANGELOG.md`.
3. Commit and push the tag: `git tag v0.2.0 && git push origin v0.2.0`.

The workflow runs automatically, authenticates via OIDC, and publishes to npmjs. Provenance attestations are generated automatically (public repo + public package + GitHub Actions = automatic provenance).

## License

[0BSD](./LICENSE) — BSD Zero Clause License.
