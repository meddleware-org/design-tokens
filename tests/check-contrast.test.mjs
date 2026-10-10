// The contrast gate must fail on the payloads it exists to catch. It measures text roles on --lift and
// the theme-independent panel palettes as well as --bg and --surface (F11), so each is mutated here.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function runContrast(editCss = (css) => css) {
  const dir = mkdtempSync(join(tmpdir(), 'tokens-contrast-'))
  mkdirSync(join(dir, 'scripts', 'lib'), { recursive: true })
  mkdirSync(join(dir, 'src'))
  cpSync(join(root, 'scripts', 'check-contrast.mjs'), join(dir, 'scripts', 'check-contrast.mjs'))
  cpSync(join(root, 'scripts', 'lib', 'css.mjs'), join(dir, 'scripts', 'lib', 'css.mjs'))
  cpSync(join(root, 'src', 'seasons.css'), join(dir, 'src', 'seasons.css'))
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

test('a text role below 4.5:1 on --bg fails', () => {
  const r = runContrast((css) => mutate(css, '--mw-neutral-500: #6e635c;', '--mw-neutral-500: #a39a94;'))
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /--muted/)
})

test('a text role below 4.5:1 on --lift fails (F11)', () => {
  // The previous warning-text stop was 4.46:1 on the light --lift and 4.86:1 on --bg: only --lift sees it.
  const r = runContrast((css) => mutate(css, '--mw-yellow-700: #886400;', '--mw-yellow-700: #8a6500;'))
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /--warning-text .* on --lift/)
})

test('a panel palette pairing below 4.5:1 fails (F11)', () => {
  const r = runContrast((css) => mutate(css, '--mw-panel-dark-muted:   #b7a9a3;', '--mw-panel-dark-muted:   #4a403d;'))
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /panel dark/)
})

test('an unresolvable role fails closed', () => {
  const r = runContrast((css) => mutate(css, '--warning-text: var(--mw-yellow-700);', '--warning-text: var(--mw-yellow-799);'))
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /does not resolve/)
})
