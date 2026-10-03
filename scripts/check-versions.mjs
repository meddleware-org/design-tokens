// jsr.json must carry the package version: `jsr publish` reads it, and a stale value makes every
// JSR publish a silent no-op (JSR stayed at 0.1.2 through npm 0.1.7).
import { readFileSync } from 'node:fs'

const npm = JSON.parse(readFileSync('package.json', 'utf8')).version
const jsr = JSON.parse(readFileSync('jsr.json', 'utf8')).version
if (npm !== jsr) {
  console.error(`jsr.json version ${jsr} does not match package.json version ${npm}`)
  process.exit(1)
}
console.log(`✓ npm and JSR versions match (${npm})`)
