// The sync validator must catch a drifted mirror value and a semantic role missing from tokens.json (F4).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function runSync({ editJson = (t) => t, editIndex = (t) => t, editCss = (t) => t, editSeasons = (t) => t } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'tokens-mirror-'))
  mkdirSync(join(dir, 'scripts', 'lib'), { recursive: true })
  mkdirSync(join(dir, 'src'))
  cpSync(join(root, 'scripts', 'check-token-sync.mjs'), join(dir, 'scripts', 'check-token-sync.mjs'))
  cpSync(join(root, 'scripts', 'lib', 'css.mjs'), join(dir, 'scripts', 'lib', 'css.mjs'))
  writeFileSync(join(dir, 'src', 'tokens.css'), editCss(readFileSync(join(root, 'src', 'tokens.css'), 'utf8')))
  writeFileSync(join(dir, 'src', 'seasons.css'), editSeasons(readFileSync(join(root, 'src', 'seasons.css'), 'utf8')))
  const json = JSON.parse(readFileSync(join(root, 'src', 'tokens.json'), 'utf8'))
  writeFileSync(join(dir, 'src', 'tokens.json'), JSON.stringify(editJson(json)))
  writeFileSync(join(dir, 'src', 'index.ts'), editIndex(readFileSync(join(root, 'src', 'index.ts'), 'utf8')))
  return spawnSync(process.execPath, [join(dir, 'scripts', 'check-token-sync.mjs')], { encoding: 'utf8' })
}

test('the shipped mirror passes', () => {
  const r = runSync()
  assert.equal(r.status, 0, r.stdout + r.stderr)
})

test('a drifted mirror value fails', () => {
  const r = runSync({ editJson: (j) => ((j.semantic.light.ok = '#000000'), j) })
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /semantic\.light\.ok/)
})

test('a semantic role missing from the mirror fails', () => {
  const r = runSync({ editJson: (j) => (delete j.semantic.light.lift, delete j.semantic.dark.lift, j) })
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /missing the "lift" role/)
})

test('a subtree that index.ts does not export by name fails', () => {
  const r = runSync({ editIndex: (t) => t.replace('export const status', 'const status') })
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /"status"/)
})

const mutate = (css, from, to) => {
  assert.ok(css.includes(from), `fixture drifted: ${from} not found`)
  return css.replace(from, to)
}

test('a shadow that reads a season value fails (theme-only tokens never vary by season)', () => {
  const r = runSync({ editCss: (css) => mutate(css, '--shadow-2: 0 4px 12px color-mix(in srgb, var(--mw-neutral-950) 14%', '--shadow-2: 0 4px 12px color-mix(in srgb, var(--season-accent, var(--mw-neutral-950)) 14%') })
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /--shadow-2 \(light\) reads a --season-\* value/)
})

test('a shadow missing from the dark theme fails', () => {
  const r = runSync({ editCss: (css) => mutate(css, '--shadow-3: 0 12px 32px color-mix(in srgb, var(--mw-neutral-950) 65%, transparent);', '') })
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /--shadow-3 is not defined in the dark theme block/)
})

test('a non-season custom property in seasons.css fails', () => {
  const r = runSync({ editSeasons: (css) => mutate(css, '--season-accent:              var(--mw-green-600);', '--season-accent:              var(--mw-green-600);\n  --accent: red;') })
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /seasons\.css declares --accent/)
})

test('a radius step missing from the CSS fails', () => {
  const r = runSync({ editCss: (css) => mutate(css, '--mw-radius-xs:   2px;', '') })
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /radius\.xs/)
})
