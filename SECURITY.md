# Security Policy

## Scope

This policy covers security issues in the `@meddleware/design-tokens` package source (`src/**`) —
the CSS custom properties (`tokens.css`, `seasons.css`), the JSON mirror (`tokens.json`), and the
TypeScript exports (`index.ts`).

It does not cover consuming applications or the `typescript` build-time dependency.

## Security model (invariants)

These invariants are load-bearing. A report demonstrating that any is violated is in scope and
treated as high severity:

1. **The CSS is custom properties and nothing else.** `tokens.css` and `seasons.css` are imported as
   global, unscoped CSS by every Meddleware UI, so they contain only `--*` declarations and
   `color-scheme` inside `:root`, `:root[data-theme="dark"]`, `:root.dark` and the four
   `:root[data-season="…"]` forms (each also with the dark selectors) — no other selector, no at-rule
   (`@import`), no `content`, no escape sequence. The single `url()` is the `--noise-overlay` value, an
   inline `data:` SVG filter whose `http://www.w3.org/2000/svg` is an XML namespace, not a load; its
   SHA-256 is pinned. `npm run check:css` enforces all of this in CI and before every publish.
2. **No code execution.** `index.ts` performs only static exports (no dynamic import, no side
   effects); the package has no runtime dependencies.
3. **No secrets and no network access.**

## Supported versions

Only the latest published npm version receives security fixes.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report vulnerabilities by emailing **<security@meddleware.co.uk>**. Include:

- A description of the vulnerability and its impact
- Steps to reproduce or a proof-of-concept (if available)
- The package version or commit SHA you tested against

You will receive an acknowledgement within **3 business days** and a resolution plan within
**14 days** for confirmed issues. Critical issues (CVSS ≥ 9.0) are prioritised for same-day
acknowledgement.

## Disclosure

Once a fix is released, a security advisory will be published on the GitHub repository. Reporters
may be credited by name unless they prefer to remain anonymous.
