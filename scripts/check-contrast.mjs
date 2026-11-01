#!/usr/bin/env node
// Contrast gate: for every theme × season, the role pairings the components rely on must meet WCAG 2.2 AAA for
// text (7:1). `npm run check:contrast` fails on any miss; `--table` prints every measured pairing.
//
//   text (7:1) on --bg, --surface and --lift: --text, --muted, --accent, --primary, --secondary, --danger,
//                --warning-text, --ok, --info (links, labels and status text are drawn in these)
//   label (7:1) on its fill: --accent-contrast/--accent, --primary-contrast/--primary,
//                --secondary-contrast/--secondary, --highlight-contrast/--highlight,
//                --warning-contrast/--warning
//   panel palettes (theme-independent --mw-panel-{dark,light}-*): text, muted, ok, danger, info (7:1)
//                on the panel's bg and surface
//   non-text (3:1) on --bg, --surface and --lift: --focus-ring (which must also not read as an error: red hue) and
//                --control-border, the boundary of a form field (WCAG 1.4.11: a field identified only by its edge)
//   graphics (3:1) on --lift (a track) and --surface: --accent, --primary, --secondary, --ok, --info, --danger,
//                --warning-text — the fills of a meter or progress bar, which WCAG 1.4.11 treats as graphical objects
//
// 7:1 is AAA for text; AA (4.5:1) is implied. Non-text has no stricter level than 3:1. Seasons are composed with the
// dark theme exactly as the browser cascades them (see lib/css.mjs).

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { SEASONS, THEMES, cascade, contrast, hexToRgb, hue, loadBlocks, resolve, srcDir } from './lib/css.mjs'

const TEXT_ROLES = ['text', 'muted', 'accent', 'primary', 'secondary', 'danger', 'warning-text', 'ok', 'info']
const CANVASES = ['bg', 'surface', 'lift']
const LABELS = [
  ['accent-contrast', 'accent'],
  ['primary-contrast', 'primary'],
  ['secondary-contrast', 'secondary'],
  ['highlight-contrast', 'highlight'],
  ['warning-contrast', 'warning'],
]

const GRAPHIC_ROLES = ['accent', 'primary', 'secondary', 'ok', 'info', 'danger', 'warning-text']
const GRAPHIC_CANVASES = ['lift', 'surface']

const PANELS = ['dark', 'light']
const PANEL_TEXT_ROLES = ['text', 'muted', 'ok', 'danger', 'info']
const PANEL_CANVASES = ['bg', 'surface']

const blocks = loadBlocks()
const rows = []
const failures = []
/** Every role that takes part in a measured pairing. */
const measured = new Set()
/** WCAG AAA for text and labels. */
const TEXT_MIN = 7

function check(env, fg, bg, min, scope = `${env.theme}${env.season ? ' · ' + env.season : ''}`) {
  measured.add(fg)
  measured.add(bg)
  const vars = cascade(blocks, env)
  const a = resolve(`var(--${fg})`, vars)
  const b = resolve(`var(--${bg})`, vars)
  const ra = a && hexToRgb(a)
  const rb = b && hexToRgb(b)
  const label = scope
  if (!ra || !rb) {
    failures.push(`${label}: --${fg} on --${bg} does not resolve to a hex colour (${a} / ${b})`)
    return
  }
  const ratio = contrast(ra, rb)
  rows.push({ label, pair: `--${fg} on --${bg}`, ratio, min, fg: a, bg: b })
  if (ratio < min) failures.push(`${label}: --${fg} (${a}) on --${bg} (${b}) is ${ratio.toFixed(2)}:1, needs ${min}:1`)
}

for (const theme of THEMES) {
  for (const season of SEASONS) {
    const env = { theme, season }
    for (const fg of TEXT_ROLES) for (const bg of CANVASES) check(env, fg, bg, TEXT_MIN)
    for (const [fg, bg] of LABELS) check(env, fg, bg, TEXT_MIN)
    for (const bg of CANVASES) check(env, 'focus-ring', bg, 3)
    for (const bg of CANVASES) check(env, 'control-border', bg, 3)
    for (const fg of GRAPHIC_ROLES) for (const bg of GRAPHIC_CANVASES) check(env, fg, bg, 3)
    const ring = resolve('var(--focus-ring)', cascade(blocks, env))
    const rgb = ring && hexToRgb(ring)
    const h = rgb ? hue(rgb) : Number.NaN
    if (h >= 345 || h <= 20) {
      failures.push(`${theme}${season ? ' · ' + season : ''}: --focus-ring (${ring}) is red (hue ${Math.round(h)}°); focus must never read as an error`)
    }
  }
}

// Panel palettes do not depend on the page theme or season; the base cascade holds them.
for (const panel of PANELS) {
  for (const fg of PANEL_TEXT_ROLES) {
    for (const bg of PANEL_CANVASES) check({ theme: 'light', season: null }, `mw-panel-${panel}-${fg}`, `mw-panel-${panel}-${bg}`, TEXT_MIN, `panel ${panel}`)
  }
}

// Coverage: a colour role added to the tokens but not to the pairings above would ship unmeasured. Every semantic role is measured, or
// named here with the reason it needs no pairing of its own.
const EXEMPT = { border: 'a divider or decoration, not the only mark of a control (a field boundary is --control-border)' }
const roles = Object.keys(JSON.parse(readFileSync(join(srcDir, 'tokens.json'), 'utf8')).semantic.light)
for (const role of roles) {
  if (!measured.has(role) && !(role in EXEMPT)) failures.push(`--${role} is a semantic role that no contrast pairing measures: add it to check-contrast.mjs, or to EXEMPT with the reason`)
}
for (const role of Object.keys(EXEMPT)) {
  if (!roles.includes(role)) failures.push(`EXEMPT names --${role}, which is not a semantic role any more: remove it`)
}

if (process.argv.includes('--table')) {
  for (const r of rows) console.log(`${r.ratio.toFixed(2).padStart(6)}  ${r.ratio < r.min ? 'FAIL' : 'ok  '}  ${r.label.padEnd(16)} ${r.pair.padEnd(40)} ${r.fg} / ${r.bg}`)
}
if (failures.length) {
  console.error(`✗ ${failures.length} contrast failure(s):`)
  for (const f of failures) console.error('  ' + f)
  process.exit(1)
}
console.log(`✓ contrast check passed (${rows.length} pairings: ${THEMES.length} themes × ${SEASONS.length} seasons, plus ${PANELS.length} panel palettes)`)
