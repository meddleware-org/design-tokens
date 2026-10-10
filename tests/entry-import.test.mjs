// The published `.` entry (src/index.ts) must import at runtime, not only type-check. A JSON module needs
// an import attribute under Node and Deno; without one `deno check` passes but `deno run` fails (F5).
//
// Node runs the source directly (type stripping, outside node_modules). Deno runs when it is on PATH; CI
// sets REQUIRE_DENO=1 so the Deno half cannot be skipped there.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const entry = join(root, 'src', 'index.ts')
const tokens = JSON.parse(readFileSync(join(root, 'src', 'tokens.json'), 'utf8'))

const SNIPPET = `
const m = await import(${JSON.stringify(pathToFileURL(entry).href)})
const names = Object.keys(m).sort()
console.log(JSON.stringify({ names, accent: m.semantic.light.accent, ok: m.semantic.dark.ok, same: m.default === m.designTokens }))
`

function assertExports(out) {
  const got = JSON.parse(out.trim().split('\n').pop())
  assert.deepEqual(got.names, ['brand', 'default', 'designTokens', 'neutral', 'primary', 'radius', 'ratio', 'secondary', 'semantic', 'space', 'status'])
  assert.equal(got.accent, tokens.semantic.light.accent)
  assert.equal(got.ok, tokens.semantic.dark.ok)
  assert.equal(got.same, true)
}

test('the JSON import carries an import attribute', () => {
  assert.match(readFileSync(entry, 'utf8'), /import tokens from '\.\/tokens\.json' with \{ type: 'json' \}/)
})

test('the entry imports under Node', { skip: !process.features.typescript && 'this Node cannot strip types' }, () => {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', SNIPPET], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assertExports(r.stdout)
})

const deno = spawnSync(process.env.DENO ?? 'deno', ['--version'], { encoding: 'utf8' })
const hasDeno = deno.status === 0

test('the entry imports under Deno (the JSR runtime)', { skip: !hasDeno && !process.env.REQUIRE_DENO && 'deno is not installed' }, () => {
  assert.ok(hasDeno, 'REQUIRE_DENO is set but deno is not on PATH')
  const r = spawnSync(process.env.DENO ?? 'deno', ['eval', '--ext=ts', `--allow-read`, SNIPPET], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assertExports(r.stdout)
})
