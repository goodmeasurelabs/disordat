/**
 * Refresh curated verdicts older than 90 days through the same pipeline as
 * /api/compare, keeping each URL, question and hub. Dry run by default.
 *
 *   npm run debates:refresh                      # list what is due, no calls
 *   npm run debates:refresh -- --apply           # regenerate (needs OPENAI_API_KEY)
 *   npm run debates:refresh -- --apply --limit 5
 *
 * Spend: one gpt-4o-mini call per verdict (well under $0.01 each). HARD_CAP
 * bounds every run; --limit can only lower it. No retries: a failed call is
 * reported and skipped. Never run in CI.
 */
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import OpenAI from 'openai'
import { COMPARE_MODEL, LLMComparisonSchema, SYSTEM_PROMPT } from '../src/lib/comparePrompt'
import { HUB_IDS, staleVerdicts, type DebateEntry } from '../src/lib/debates'

const HARD_CAP = 30

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const limitArg = args.indexOf('--limit')
const requested = limitArg >= 0 ? Number(args[limitArg + 1]) : HARD_CAP
const limit = Math.max(0, Math.min(HARD_CAP, Number.isFinite(requested) ? requested : HARD_CAP))

const root = path.resolve(__dirname, '..')
const dataFile = (hub: string) => path.join(root, 'src/data/debates', `${hub}.json`)
const changelog = path.join(root, 'docs/debates/winner-changes.md')
const today = new Date().toISOString().slice(0, 10)

async function main() {
  const due = staleVerdicts().slice(0, limit)
  if (due.length === 0) {
    console.log('No verdicts are older than 90 days.')
    return
  }
  console.log(`${due.length} verdict(s) due${apply ? '' : ' (dry run; pass --apply to regenerate)'}:`)
  for (const v of due) console.log(`  ${v.slug} (as of ${v.updated_at})`)
  if (!apply) return

  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set.')
    process.exit(1)
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const files = Object.fromEntries(
    HUB_IDS.map((h) => [h, JSON.parse(readFileSync(dataFile(h), 'utf8')) as DebateEntry[]]),
  ) as Record<string, DebateEntry[]>

  let calls = 0
  const flips: string[] = []
  for (const v of due) {
    if (calls >= HARD_CAP) break
    calls++
    try {
      const res = await openai.chat.completions.create({
        model: COMPARE_MODEL,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify({ option_a: v.item_a, option_b: v.item_b }) },
        ],
      })
      const parsed = LLMComparisonSchema.parse(JSON.parse(res.choices[0]?.message?.content ?? ''))
      const list = files[v.category]
      const i = list.findIndex((e) => e.slug === v.slug)
      const old = list[i]
      list[i] = {
        ...old,
        ...parsed,
        as_of: today,
        first_published: old.first_published ?? old.as_of,
      }
      if (old.winner !== parsed.winner) {
        const name = (w: string) => (w === 'tie' ? 'too close to call' : w === 'a' ? v.item_a : v.item_b)
        flips.push(`- ${today}: [${v.item_a} vs ${v.item_b}](https://disordat.org/vs/${v.slug}) flipped from ${name(old.winner)} to ${name(parsed.winner)}`)
      }
      console.log(`  refreshed ${v.slug}`)
    } catch (err) {
      console.error(`  failed ${v.slug}:`, err instanceof Error ? err.message : err)
    }
  }

  for (const h of HUB_IDS) writeFileSync(dataFile(h), JSON.stringify(files[h], null, 2) + '\n')
  if (flips.length > 0) {
    if (!existsSync(changelog)) writeFileSync(changelog, '# Winner changes\n\nEach line is a verdict whose winner flipped on refresh — a ready-made social post.\n\n')
    appendFileSync(changelog, flips.join('\n') + '\n')
  }
  console.log(`Done: ${calls} model call(s), ${flips.length} winner change(s). Review the diff, then commit.`)
}

main()
