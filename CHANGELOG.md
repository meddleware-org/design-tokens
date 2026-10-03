# Changelog

All notable changes to `@meddleware/design-tokens` are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [Semantic Versioning](https://semver.org/).

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
