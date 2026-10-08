// The CSS contract gate must catch the payloads it exists for. Each case appends to (or edits) a scratch
// copy of the two files and expects `check-css-contract.mjs --src <copy>` to fail.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const script = join(root, 'scripts', 'check-css-contract.mjs')

function run(edit) {
  const dir = mkdtempSync(join(tmpdir(), 'tokens-'))
  for (const f of ['tokens.css', 'seasons.css']) cpSync(join(root, 'src', f), join(dir, f))
  if (edit) edit(dir, (f, fn) => writeFileSync(join(dir, f), fn(readFileSync(join(dir, f), 'utf8'))))
  return spawnSync(process.execPath, [script, '--src', dir], { encoding: 'utf8' })
}

test('the shipped files pass', () => {
  const r = run()
  assert.equal(r.status, 0, r.stderr)
})

const BAD = {
  '@import': (t) => t + '\n@import url("https://evil.example/x.css");\n',
  'content rule on a page selector': (t) => t + '\n.wallet-address::after { content: "0xattacker"; }\n',
  'a stray declaration that is not a custom property': (t) => t.replace(':root {', ':root {\n  background: url(https://evil.example/p.png);'),
  'a lone ::after rule at the top': (t) => '.x::after { content: "x" }\n' + t,
  'an attribute selector': (t) => t + '\ninput[value^="a"] { --x: 1; }\n',
  'an unknown season': (t) => t + '\n:root[data-season="monsoon"] { --season-accent: red; }\n',
  'a url() outside --noise-overlay': (t) => t.replace('--hero-offset:', '--bg-image: url("https://evil.example/x.png");\n  --hero-offset:'),
  'a changed noise overlay': (t) => t.replace('baseFrequency=\'0.8\'', 'baseFrequency=\'0.9\''),
  'a /*! comment': (t) => t + '\n/*! injected */\n',
  'a backslash escape': (t) => t.replace('--transition-base:', '--x: \\75rl(a);\n  --transition-base:'),
  'nesting': (t) => t + '\n:root { .x { --y: 1; } }\n',
}

for (const [name, edit] of Object.entries(BAD)) {
  for (const file of ['tokens.css', 'seasons.css']) {
    test(`rejects ${name} in ${file}`, () => {
      const r = run((dir, change) => change(file, edit))
      // Edits that look for a marker only apply to the file that has it; the others are no-ops.
      const changed = readFileSync(join(root, 'src', file), 'utf8') !== edit(readFileSync(join(root, 'src', file), 'utf8'))
      if (!changed) return
      assert.notEqual(r.status, 0, `expected failure for ${name} in ${file}\n${r.stdout}`)
    })
  }
}
