/**
 * Weekly content check (run by .github/workflows/content-freshness.yml):
 *  - curated verdicts older than FRESHNESS_DAYS (90) that need a refresh
 *  - timed-matchup runway: warn when the calendar has < 14 days left
 *
 * No network, no spend. Prints a markdown report; with --github-output it
 * also writes `due=true|false` for the workflow.
 *
 *   npm run debates:freshness
 */
import { appendFileSync } from 'node:fs'
import { FRESHNESS_DAYS, daysSince, staleVerdicts } from '../src/lib/debates'
import { allMatchups, matchupRunwayDays, upcomingMatchups } from '../src/lib/matchups'

const MIN_RUNWAY_DAYS = 14

const now = process.env.FRESHNESS_NOW ? new Date(process.env.FRESHNESS_NOW) : new Date()
const stale = staleVerdicts(now)
const runway = matchupRunwayDays(now)
const upcoming = upcomingMatchups(now)

const lines: string[] = []
lines.push(`# disordat content freshness — ${now.toISOString().slice(0, 10)}`)
lines.push('')
lines.push(`## Verdicts older than ${FRESHNESS_DAYS} days: ${stale.length}`)
lines.push('')
if (stale.length === 0) {
  lines.push('Nothing to refresh.')
} else {
  lines.push('Refresh with `npm run debates:refresh -- --apply` (needs OPENAI_API_KEY; hard cap 30 model calls per run), review the diff, and commit. Winner flips are logged to docs/debates/winner-changes.md.')
  lines.push('')
  for (const v of stale) lines.push(`- [ ] \`${v.slug}\` — ${v.item_a} vs ${v.item_b} (as of ${v.updated_at}, ${daysSince(v.updated_at, now)} days)`)
}
lines.push('')
lines.push(`## Timed matchups: ${upcoming.length} upcoming, runway ${runway} days`)
lines.push('')
if (runway < MIN_RUNWAY_DAYS) {
  lines.push(`The calendar runs out in ${Math.max(runway, 0)} days. Add the next moments to src/data/matchups.json (see docs/matchups.md).`)
} else {
  for (const m of upcoming.slice(0, 5)) lines.push(`- ${m.event_date} ${m.event}: \`${m.slug}\` (${m.date_confidence})`)
}
const approximate = allMatchups().filter((m) => m.date_confidence === 'approximate' && upcoming.some((u) => u.slug === m.slug))
if (approximate.length > 0) {
  lines.push('')
  lines.push('Dates still marked approximate (confirm them): ' + approximate.map((m) => `\`${m.slug}\``).join(', '))
}
lines.push('')

const due = stale.length > 0 || runway < MIN_RUNWAY_DAYS
process.stdout.write(lines.join('\n'))

if (process.argv.includes('--github-output') && process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `due=${due}\n`)
}
