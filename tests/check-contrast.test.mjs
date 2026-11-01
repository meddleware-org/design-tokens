// The contrast gate (WCAG 2.2 AAA, 7:1 for text and labels; 3:1 for non-text and graphics) must fail on the payloads it
// exists to catch. It measures text roles on --lift and the theme-independent panel palettes as well as --bg and --surface
// (F11), so each is mutated here.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function runContrast(editCss = (css) => css, editJson = (json) => json) {
  const dir = mkdtempSync(join(tmpdir(), 'tokens-contrast-'))
  mkdirSync(join(dir, 'scripts', 'lib'), { recursive: true })
  mkdirSync(join(dir, 'src'))
  cpSync(join(root, 'scripts', 'check-contrast.mjs'), join(dir, 'scripts', 'check-contrast.mjs'))
  cpSync(join(root, 'scripts', 'lib', 'css.mjs'), join(dir, 'scripts', 'lib', 'css.mjs'))
  cpSync(join(root, 'src', 'seasons.css'), join(dir, 'src', 'seasons.css'))
  writeFileSync(join(dir, 'src', 'tokens.json'), editJson(readFileSync(join(root, 'src', 'tokens.json'), 'utf8')))
  writeFileSync(join(dir, 'src', 'tokens.css'), editCss(readFileSync(join(root, 'src', 'tokens.css'), 'utf8')))
  return spawnSync(process.execPath, [join(dir, 'scripts', 'check-contrast.mjs')], { encoding: 'utf8' })
}

function mutate(css, from, to) {
  assert.ok(css.includes(from), `fixture drifted: ${from} not found in tokens.css`)
  return css.replace(from, to)
}

test('the shipped tokens pass', () => {
  const r = runContrast()
  assert.equal(r.status, 0, r.stdout + r.stderr)
})

test('a text role below 7:1 on --bg fails', () => {
  const r = runContrast((css) => mutate(css, '--mw-neutral-500: #544b46;', '--mw-neutral-500: #a39a94;'))
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /--muted/)
})

test('a text role below 7:1 on --lift fails even when it passes on --bg (F11)', () => {
  // #644a00 is 7.60:1 on the light --bg but 6.97:1 on --lift: only --lift sees it.
  const r = runContrast((css) => mutate(css, '--mw-yellow-700: #634900;', '--mw-yellow-700: #644a00;'))
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /--warning-text .* on --lift/)
})

test('a panel palette pairing below 7:1 fails (F11)', () => {
  const r = runContrast((css) => mutate(css, '--mw-panel-dark-muted:   #b7a9a3;', '--mw-panel-dark-muted:   #4a403d;'))
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /panel dark/)
})

test('an unresolvable role fails closed', () => {
  const r = runContrast((css) => mutate(css, '--warning-text: var(--mw-yellow-700);', '--warning-text: var(--mw-yellow-799);'))
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /does not resolve/)
})

test('a graphic role below 3:1 on the --lift track fails (a meter fill)', () => {
  const r = runSync_graphic()
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /on --lift/)
})

function runSync_graphic() {
  // Lightening the stop far enough fails the text gate AND the 3:1 graphic pairing on the --lift track.
  return runContrast((css) => mutate(css, '--mw-blue-600:   #124b99;', '--mw-blue-600:   #8fb4f0;'))
}

test('a label below 7:1 on its fill fails (a button label)', () => {
  // The light --accent-contrast is white on --accent; lightening --accent to a mid terracotta drops it below 7:1.
  const r = runContrast((css) => mutate(css, '--mw-terracotta-500: #86321d;', '--mw-terracotta-500: #b74427;'))
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /needs 7:1/)
})

test('the gate is AAA: a pairing that only meets AA (4.5:1) fails', () => {
  // #6e635c is the old AA-only muted: 4.88:1 on --lift, 5.32:1 on --bg.
  const r = runContrast((css) => mutate(css, '--mw-neutral-500: #544b46;', '--mw-neutral-500: #6e635c;'))
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /--muted .* is [4-6]\.\d\d:1, needs 7:1/)
})

test('a form-field boundary below 3:1 fails (WCAG 1.4.11)', () => {
  // #c4b8ae is the old placeholder grey: 1.9:1 on --bg, far below the 3:1 a field edge needs.
  const light = runContrast((css) => mutate(css, '--mw-neutral-400: #80746d;', '--mw-neutral-400: #c4b8ae;'))
  assert.notEqual(light.status, 0)
  assert.match(light.stderr, /--control-border .* on --bg/)
  const dark = runContrast((css) => mutate(css, '--control-border: #85777e;', '--control-border: #372b2e;'))
  assert.notEqual(dark.status, 0)
  assert.match(dark.stderr, /--control-border .* on --lift/)
})

test('a semantic role that no pairing measures fails, so a new role cannot ship unchecked', () => {
  const r = runContrast(
    (css) => css,
    (json) => mutate(json, '"focus-ring": "#3d4a7c"', '"focus-ring": "#3d4a7c", "brand-new": "#123456"'),
  )
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /--brand-new is a semantic role that no contrast pairing measures/)
})

test('an exemption for a role that no longer exists fails', () => {
  const r = runContrast((css) => css, (json) => mutate(json, '"border": "#ded6cf", ', ''))
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /EXEMPT names --border/)
})
