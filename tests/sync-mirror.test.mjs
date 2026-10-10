// The sync validator must catch a drifted mirror value and a semantic role missing from tokens.json (F4).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function runSync({ editJson = (t) => t, editIndex = (t) => t } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'tokens-mirror-'))
  mkdirSync(join(dir, 'scripts', 'lib'), { recursive: true })
  mkdirSync(join(dir, 'src'))
  cpSync(join(root, 'scripts', 'check-token-sync.mjs'), join(dir, 'scripts', 'check-token-sync.mjs'))
  cpSync(join(root, 'scripts', 'lib', 'css.mjs'), join(dir, 'scripts', 'lib', 'css.mjs'))
  for (const f of ['tokens.css', 'seasons.css']) cpSync(join(root, 'src', f), join(dir, 'src', f))
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
