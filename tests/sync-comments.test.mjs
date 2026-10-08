// The sync validator must ignore commented-out declarations (a stale `--text` in a comment inside :root
// was read as the live value: a false failure, or with the opposite order a false pass).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function runSync(editCss) {
  const dir = mkdtempSync(join(tmpdir(), 'tokens-sync-'))
  mkdirSync(join(dir, 'scripts', 'lib'), { recursive: true })
  mkdirSync(join(dir, 'src'))
  cpSync(join(root, 'scripts', 'check-token-sync.mjs'), join(dir, 'scripts', 'check-token-sync.mjs'))
  cpSync(join(root, 'scripts', 'lib', 'css.mjs'), join(dir, 'scripts', 'lib', 'css.mjs'))
  for (const f of ['tokens.json', 'index.ts', 'seasons.css']) cpSync(join(root, 'src', f), join(dir, 'src', f))
  writeFileSync(join(dir, 'src', 'tokens.css'), editCss(readFileSync(join(root, 'src', 'tokens.css'), 'utf8')))
  return spawnSync(process.execPath, [join(dir, 'scripts', 'check-token-sync.mjs')], { encoding: 'utf8' })
}

test('a commented-out stale declaration is not read as the live value', () => {
  const r = runSync((t) => t.replace('--bg:              var(--mw-neutral-050);', '--bg:              var(--mw-neutral-050); /* --bg: #ff00ff; (old) */'))
  assert.equal(r.status, 0, r.stdout + r.stderr)
})

test('a commented-out correct value does not mask a wrong live one', () => {
  const r = runSync((t) => t.replace('--bg:              var(--mw-neutral-050);', '--bg: #123456; /* --bg: var(--mw-neutral-050); */'))
  assert.notEqual(r.status, 0)
})
