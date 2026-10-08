#!/usr/bin/env node
// CSS contract: tokens.css and seasons.css are imported as GLOBAL, unscoped CSS by every Meddleware UI,
// so they may declare custom properties and nothing else. A compromised publish that added a rule such as
// `.wallet-address::after { content: "0xattacker" }`, an `@import`, or an exfiltrating `url()` would run in
// every app; provenance proves where the tarball was built, not what it contains. This gate asserts, for
// both files:
//
//   1. selectors are only :root, :root[data-theme="dark"], :root.dark and the season forms (see SELECTOR);
//   2. declarations are only `--*` custom properties and `color-scheme`;
//   3. there is no at-rule, no escape (\), no `/*!` comment, no `expression(`, `javascript:` or `content`;
//   4. the only `url(` is the `--noise-overlay` value, pinned by SHA-256 (an inline `data:` SVG filter);
//   5. nothing outside well-formed flat blocks (no nesting, no stray text).
//
// Update NOISE_OVERLAY_SHA256 only after reviewing a deliberate change to that value.

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseBlocks, srcDir, stripComments } from './lib/css.mjs'

const NOISE_OVERLAY_SHA256 = '651aa5411e885078c92539d1a3b422cffba7e38fab3e3fad1f78f538b1219cc3'
const SEASON = '(?:spring|summer|autumn|winter)'
const SELECTOR = new RegExp(
  `^:root(?:\\[data-theme="dark"\\]|\\.dark)?(?:\\[data-season="${SEASON}"\\])?$`,
)
const FILES = ['tokens.css', 'seasons.css']
// `--src <dir>` points the check at another copy (the tests use it).
const srcArg = process.argv.indexOf('--src')
const dir = srcArg > 0 ? process.argv[srcArg + 1] : srcDir

const errors = []

/** Split a block body on top-level `;` (a `;` inside parentheses or quotes belongs to the value). */
function declarations(body) {
  const out = []
  let depth = 0
  let quote = ''
  let cur = ''
  for (const ch of body) {
    if (quote) {
      if (ch === quote) quote = ''
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(') depth++
    else if (ch === ')') depth--
    if (ch === ';' && depth === 0 && !quote) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  if (cur.trim()) out.push(cur)
  return out.map((d) => d.trim()).filter(Boolean)
}

for (const file of FILES) {
  const raw = readFileSync(join(dir, file), 'utf8')
  const fail = (msg) => errors.push(`${file}: ${msg}`)
  const text = stripComments(raw)

  if (/\/\*!/.test(raw)) fail('contains a /*! comment')
  if (/@/.test(text)) fail('contains an at-rule (@import, @media, …)')
  if (/\\/.test(text)) fail('contains a backslash escape')
  if (/expression\s*\(|javascript:/i.test(text)) fail('contains expression( or javascript:')

  // Everything must be inside a flat `selector { … }` block.
  const leftover = text.replace(/([^{}]+)\{([^{}]*)\}/g, '').trim()
  if (leftover) fail(`text outside well-formed blocks: ${JSON.stringify(leftover.slice(0, 60))}`)

  for (const block of parseBlocks(raw)) {
    for (const selector of block.selectors) {
      if (!SELECTOR.test(selector)) fail(`selector not allowed: ${selector}`)
    }
  }

  const re = /([^{}]+)\{([^{}]*)\}/g
  let m
  while ((m = re.exec(text)) !== null) {
    for (const decl of declarations(m[2])) {
      const colon = decl.indexOf(':')
      const name = decl.slice(0, colon).trim()
      const value = decl.slice(colon + 1).trim()
      if (colon < 0) fail(`malformed declaration: ${decl.slice(0, 60)}`)
      else if (!/^--[a-z0-9-]+$/i.test(name) && name !== 'color-scheme') fail(`property not allowed: ${name}`)
      else if (/url\s*\(/i.test(value)) {
        if (name !== '--noise-overlay') fail(`url() only allowed in --noise-overlay, found in ${name}`)
        else {
          const sha = createHash('sha256').update(value).digest('hex')
          if (sha !== NOISE_OVERLAY_SHA256) fail(`--noise-overlay changed (sha256 ${sha}); review it, then update the pin`)
        }
      }
    }
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} CSS contract violation(s):`)
  for (const e of errors) console.error('  ' + e)
  process.exit(1)
}
console.log('✓ CSS contract check passed (tokens.css, seasons.css)')
