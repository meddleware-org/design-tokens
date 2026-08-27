# AGENTS.md — @meddleware/design-tokens

Design token package for the `@meddleware` UI system. Delivers the Oxblood / Indigo palette as CSS custom properties and TypeScript/JSON exports.

## Package structure

```text
src/
  tokens.css    CSS custom properties — the canonical source of truth (what browsers load)
  tokens.json   Mirror of the same values as JSON — for tooling, tests, non-CSS consumers
  index.ts      TypeScript re-export of tokens.json with named exports and TSDoc
jsr.json        JSR registry configuration (name, version, exports, publish excludes)
package.json    npm registry configuration
```

There is no build step. The package ships `src/` directly; consumers' bundlers handle processing. This means `tokens.css`, `tokens.json`, and `index.ts` must always be kept in sync by hand.

## Adding or changing a token

Every token change requires three coordinated edits:

1. **`src/tokens.css`** — the authoritative source. Add the CSS custom property with an inline comment explaining the role and any theme-specific notes.
2. **`src/tokens.json`** — mirror the resolved value(s) into the appropriate JSON subtree (`brand`, `secondary`, `neutral`, `status`, `semantic.light`, `semantic.dark`, or `radius`).
3. **`src/index.ts`** — if the JSON structure changes, update the named exports and TSDoc accordingly.

CSS variables not in `tokens.json` (e.g. `--mw-panel-*`) are intentionally CSS-only — they are theme-independent layout/panel tokens consumed by `@meddleware/ui` components. They do not need a JS representation unless tooling demands it.

## Token architecture

### Layer 1: Brand ramps (`--mw-oxblood-*`, `--mw-indigo-*`, `--mw-gold-*`)

Fixed, theme-independent stops. Used directly only in illustrations, data-vis, or colour swatches. Components should not reference these directly.

### Layer 2: Semantic tokens (`--bg`, `--surface`, `--text`, …)

Thin aliases over the brand ramps. These are what components use. They are defined twice — once in `:root` (light) and once in `:root[data-theme="dark"]` — so they swap values without any component change. When adding a new semantic token, add it to **both** blocks.

### Layer 3: Panel palettes (`--mw-panel-{dark,light}-*`)

Theme-independent by design. `AppHeader`, `AppSidebar`, `AppFooter` in `@meddleware/ui` use these via their `variant` prop so a `variant="dark"` component renders correctly regardless of the global page theme. Do not put these inside `[data-theme="dark"]`.

### Shape / type constants (`--mw-radius*`, `--mw-font-*`, `--mw-header-height`, `--mw-sidebar-width`)

Fixed layout values. Reference the same value from `@meddleware/ui` layout components to keep spacing consistent.

## Colour mode

Light is the default (`:root`). Dark activates on `:root[data-theme="dark"]`. The `@meddleware/ui` `ColorModeControl` component manages the attribute and persists to `localStorage`. There is no CSS `prefers-color-scheme` media query in this package by design — the UI layer handles OS preference bridging so the attribute is always set explicitly.

## Exports

Both `package.json` and `jsr.json` declare the same three entry points:

| Entry | File | Description |
| --- | --- | --- |
| `.` | `./src/index.ts` | TypeScript token tree with named exports and TSDoc |
| `./tokens.css` | `./src/tokens.css` | CSS custom properties (what browsers load) |
| `./tokens.json` | `./src/tokens.json` | Raw JSON token values |

Do not add a default/wildcard export path — consumers should import one of these three explicitly.

`"sideEffects": ["*.css"]` in `package.json` tells bundlers not to tree-shake CSS-only imports. This must stay.

## Publishing

Published to both **npmjs** and **JSR** on `v*` git tags via `.github/workflows/publish.yml` using OIDC — no long-lived secrets required.

- **npmjs**: uses npm trusted publishing (`id-token: write`). One-time setup: configure a trusted publisher on npmjs.com pointing at this repo and `publish.yml`.
- **JSR**: uses `npx jsr publish`, which auto-detects the GitHub Actions OIDC environment. One-time setup: link the GitHub repository to the JSR package in the JSR dashboard.

To release: bump `version` in both `package.json` and `jsr.json`, add a CHANGELOG entry, commit, tag (`git tag v0.x.y`), push the tag.

## License

BSD Zero Clause License (`0BSD`). See `LICENSE`.

## Relationship with `@meddleware/ui`

`@meddleware/ui` consumes this package as a peer — it imports `tokens.css` at its own entry and references the CSS vars in component styles. The two packages are versioned independently; a token change here does not require a UI package version bump unless the UI consumes a renamed or removed variable.

## What to avoid

- Do not add computed or JS-generated token values. Keep `tokens.json` a flat, human-readable snapshot.
- Do not reference `--mw-panel-*` inside the `[data-theme="dark"]` block — panel palettes are intentionally theme-independent.
- Do not remove the `sideEffects` field from `package.json`.
- Do not add a build script — the no-build model is intentional and simplifies the publish pipeline.
- Do not change the version in only one of `package.json` and `jsr.json` — they must always match.
