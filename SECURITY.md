# Security Policy

## Scope

This policy covers security issues in the `@meddleware/design-tokens` package source (`src/**`) —
the CSS custom properties (`tokens.css`), the JSON mirror (`tokens.json`), and the TypeScript
exports (`index.ts`).

It does not cover consuming applications or the `typescript` build-time dependency.

## Security model (invariants)

These invariants are load-bearing. A report demonstrating that any is violated is in scope and
treated as high severity:

1. **No external or off-origin loads in shipped assets.** `tokens.css` contains no `@import`,
   `url()`, or `http(s):` reference — only custom-property declarations.
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
