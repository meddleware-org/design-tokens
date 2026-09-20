# CLAUDE.md — @meddleware/design-tokens

Design token package for the `@meddleware` UI system: a warm-neutral canvas with **functional
primary/rainbow accents**, sacred-geometry (φ/Fibonacci) spacing/type scales, and optional seasonal
theming. Delivered as CSS custom properties and TypeScript/JSON exports. See `README.md` for the
design philosophy (design recedes; primary colours as functional human universals; no gold/purple as
identity; controlled imperfection).

## Package structure

```text
src/
  tokens.css    CSS custom properties — the canonical source of truth (what browsers load)
  seasons.css   OPTIONAL seasonal [data-season] overrides (silent-fallback --season-* vars)
  tokens.json   Mirror of the ramp/scale/semantic values as JSON — tooling, tests, non-CSS
  index.ts      TypeScript re-export of tokens.json with named exports and TSDoc
scripts/
  check-token-sync.mjs   Validator (npm run check:sync) — CSS ↔ JSON ↔ index parity + season symmetry
```

There is no build step. The package ships `src/` directly; consumers' bundlers handle processing.

> **Sync is now automated.** `scripts/check-token-sync.mjs` (run in CI via `npm run check:sync`)
> verifies `tokens.css` ↔ `tokens.json` ↔ `index.ts` value parity (resolving `var(--x, fallback)`
> and computing the `calc()` space scale) and that every `[data-season]` block overrides the same
> `--season-*` role set. Still update all files together, then run the check.

## Two-layer naming discipline (load-bearing)

- **Palette / ramp layer** — colour-NAMED (`--mw-red-500`, `--mw-oxblood-500`). A ramp names a hue;
  the palette is expandable and older brand ramps stay as swatches. Not referenced by roles.
- **Semantic / role layer** — colour-AGNOSTIC (`--accent`, `--warning`, `--space-md`, `--focus-ring`).
  Components use ONLY these. Never name a role after a colour — revaluing must not force a rename.

## Adding or changing a token

1. **`src/tokens.css`** — authoritative. Add the property with an inline comment. Seasonally-varying
   roles must read `var(--season-<role>, <primary-fallback>)`; structural neutrals do not vary by season.
2. **`src/tokens.json`** — mirror ramp/scale/semantic values into the right subtree (`primary`,
   `brand`, `secondary`, `neutral`, `status`, `radius`, `ratio`, `space`, `semantic.light/dark`).
3. **`src/index.ts`** — export any new subtree with TSDoc.
4. **`src/seasons.css`** — if you add a seasonal role, add the `--season-*` var to ALL four seasons.
5. Run `npm run check:sync`.

CSS vars absent from `tokens.json` (`--mw-panel-*`, `--mw-font-*`, `--noise-*`, `--transition-*`,
`--font-size-*`, `--leading-*`, `--tracking-*`) are intentionally CSS-only; the validator does not
require them in JSON.

## Token architecture

### Layer 1: Palette ramps

- Functional primaries: `--mw-red-*`, `--mw-orange-*`, `--mw-yellow-*`, `--mw-green-*`, `--mw-blue-*`
  (the human-universal accents the roles resolve to; derived + tunable).
- Legacy brand + secondary swatches: `--mw-oxblood-*`, `--mw-indigo-*`, `--mw-gold-*`, `--mw-pine-*`,
  `--mw-plum-*`, `--mw-copper-*` — retained, **not** used by roles (no gold/purple as identity).
- Warm neutrals: `--mw-neutral-000…950` (the canvas). Status ramps: `--mw-danger-*`, `--mw-ok-*`.

### Layer 2: Semantic / role tokens (`--bg`, `--accent`, `--warning`, `--focus-ring`, …)

What components use. Defined in `:root` (light) and `:root[data-theme="dark"]`. Interactive/status
roles use the seasonal-first fallback pattern. When adding a semantic token, add it to **both**
theme blocks (and, if seasonal, to all four seasons).

### Layer 3: Sacred-geometry scales (`--ratio-*`, `--font-size-*`, `--leading-*`, `--tracking-*`, `--space-*`)

Colour-agnostic, `calc()`-derived from `--ratio-phi`/`--ratio-phi-root` and a `--space-unit`. Nothing
is a magic number. `@meddleware/ui` components consume these for all type/spacing.

### Layer 4: Panel palettes (`--mw-panel-{dark,light}-*`)

Theme-independent by design (for `variant`-aware shell components). Do not put inside `[data-theme="dark"]`.

### Layer 5: Chaos / motion (`--noise-*`, `--hero-offset`, `--gap-irregular`, `--transition-*`)

Controlled imperfection + human easing. Consumed by `@meddleware/ui` utilities (`.mw-noise`, etc.).

## Colour mode

Light is the default (`:root`). Dark activates on `:root[data-theme="dark"]`; seasons on
`:root[data-season="…"]` (independent, composable). `@meddleware/ui`'s `useColorMode` manages the
`data-theme` attribute + `localStorage`. No CSS `prefers-color-scheme` media query by design — the UI
layer bridges OS preference so the attribute is always explicit.

## Exports

The `package.json` `exports` map has four entries:

```json
{
  ".":             "./src/index.ts",   // JS/TS token tree
  "./tokens.css":  "./src/tokens.css", // CSS custom properties (required)
  "./seasons.css": "./src/seasons.css",// OPTIONAL seasonal overrides
  "./tokens.json": "./src/tokens.json" // raw JSON
}
```

Do not add a default/wildcard export path — consumers should import an explicit entry. `seasons.css`
is opt-in; not importing it means every role uses its primary light/dark fallback (silently).

`"sideEffects": ["*.css"]` tells bundlers not to tree-shake CSS-only imports. This must stay.

## Publishing

Published to both **npmjs** and **JSR** on `v*` git tags using OIDC — no long-lived secrets required.

- **npmjs**: npm trusted publishing (`id-token: write`). One-time setup: configure a trusted publisher on npmjs.com pointing at this repo and `publish.yml`.
- **JSR**: `npx jsr publish`, which auto-detects the GitHub Actions OIDC environment. One-time setup: link the GitHub repository to the JSR package in the JSR dashboard.

To release: bump `version` in both `package.json` **and** `jsr.json` (they must match), add a CHANGELOG entry, commit, tag (`git tag v0.x.y`), push the tag.

## Relationship with `@meddleware/ui`

`@meddleware/ui` (`workspace/packages/ui`) consumes this package as a peer — it imports `tokens.css` at its own entry and references the CSS vars in component styles. The two packages are versioned independently; a token change here does not require a UI package version bump unless the UI consumes a renamed or removed variable.

## What to avoid

- Do not name a semantic role after a colour (`--gold`, `--red-accent`) — roles are colour-agnostic.
- Do not reference legacy `--mw-oxblood/indigo/gold/plum/copper-*` from roles or new components; they
  are retained swatches only (the philosophy avoids gold/purple as identity).
- Do not reference `--mw-panel-*` inside the `[data-theme="dark"]` block — panel palettes are intentionally theme-independent.
- Do not `@property`-register the `--season-*` vars — they must fail silently when undefined.
- Do not put hardcoded magic numbers in the scales — derive from `--ratio-*` / `--space-unit` via `calc()`.
- Do not remove the `sideEffects` field from `package.json`.
- Do not add a build script — the no-build model is intentional and simplifies the publish pipeline.
- Keep `tokens.json` a flat, human-readable snapshot mirrored by `check:sync` (the JSON records the
  no-season resolved values; the scales are computed by the validator).
