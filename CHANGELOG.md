# Changelog

All notable changes to `@meddleware/design-tokens` are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [Semantic Versioning](https://semver.org/).

## [0.1.9] - 2026-10-08

### Fixed

- **Seasonal palettes meet WCAG AA in both themes.** Each season now has a light block (darker stops,
  white labels) and a dark block (lighter stops, dark labels); before, one mid-tone value served both
  canvases and failed (autumn button labels 3.3:1, winter dark-mode links 2.6:1, the winter light focus ring
  2.2:1). The summer focus ring is slate, not red. New ramp stops: `--mw-copper-400`, `--mw-copper-600`,
  `--mw-yellow-700`.
- **`--warning-text`**: a text-safe warning role (`#8a6500` on light, 4.86:1; the dark `--warning` already
  reads as text). `--warning` stays the bright fill, 2.0:1 on the light canvas, and must not be used for
  `color:`. The 0.1.8 claim that the status roles met AA was true of every role except light `--warning`.
- The sync check ignores commented-out declarations (a stale value in a comment was read as live).

### Added

- `npm run check:contrast` measures every role pairing in every theme × season (4.5:1 text and labels, 3:1
  focus ring, focus never red) and `npm run check:css` asserts both CSS files contain custom properties
  only (the `--noise-overlay` data URI is pinned by SHA-256). Both run in CI and before every publish, with
  tests that feed the gates the payloads they exist to catch.
- The package contents are checked (`npm pack --dry-run`) in CI.

### Changed

- **`.dark` is `:root.dark`.** The class form now applies on the root element only (VitePress sets
  `html.dark`); before, any element with class `dark` flipped its subtree to the dark roles.
- Release: the tag workflow runs the CI workflow (lint and the checks above were missing there), and npm and
  JSR publish in separate jobs; the JSR CLI is a pinned devDependency instead of `npx jsr` at publish time.
- Documentation drift corrected (role table values, workflow names, palette naming, TSDoc examples).

## [0.1.2]–[0.1.7] - 2026-08-24 … 2026-10-02

### Changed

- Palette refinement (terracotta / moss / slate triad, warm neutrals), VitePress light/dark support,
  `--mw-tool-content-max`, stylelint and browserslist, theme-aware status roles and the split verify-gated
  publish workflow. (These releases were published without changelog entries; this summary is from the
  commit history.)

## [0.1.8] - 2026-10-03

### Added

- Panel status tokens (`--mw-panel-{light,dark}-{ok,info,danger}`) used by `@meddleware/ui` 0.1.29+;
  status roles are theme-aware and meet WCAG AA.

### Fixed

- JSR releases had stayed at 0.1.2: `jsr.json` now carries the package version and CI fails when the
  two differ (`check:versions`).

### Changed

- `repository` declared for npm provenance; CI actions pinned by SHA; `npm audit` gated through an
  expiring allowlist.

## [0.1.1] - 2026-08-27

### Fixed

- Corrected `license` field in `package.json` from `CC0-1.0` to `0BSD` to match the `LICENSE` file.

## [0.1.0] - 2026-08-24

### Added
- Initial release: Oxblood/Indigo design token set as CSS custom properties (`tokens.css`) and JSON (`tokens.json`).
- TypeScript re-export (`src/index.ts`) for typed token access.
