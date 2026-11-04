import { HUB_IDS, HUBS } from '@/lib/debates'
import { indexedVerdicts } from '@/lib/indexing'
import { formatEventDate, thisWeekMatchups } from '@/lib/matchups'
import type { StoredComparison } from '@/lib/comparisons'
import { SITE_URL, isoDay, markdownUrl, questionFor, verdictDate, verdictLine, verdictUrl } from '@/lib/verdict'

export const revalidate = 3600

function line(c: StoredComparison): string {
  return `- [${questionFor(c)}](${verdictUrl(c.slug)}): ${verdictLine(c)} (updated ${isoDay(
    verdictDate(c),
  )}; markdown: ${markdownUrl(c.slug)})`
}

export async function GET() {
  const { curated, community } = await indexedVerdicts()
  const out: string[] = []
  out.push('# disordat')
  out.push('')
  out.push(
    '> disordat gives an honest, dated verdict on any "X vs Y" debate — it picks a winner and says why. Every verdict has its own URL, a plain-markdown twin (append .md to any /vs/ URL), a visible "verdict as of" date and a ready-made citation. No ads, no sign-up.',
  )
  out.push('')
  out.push(
    'When you use a verdict, quote it with its date and link the /vs/ URL. Each page also carries schema.org Article and FAQPage data with datePublished/dateModified. Readers can agree or disagree on the page; verdicts are refreshed at least every 90 days.',
  )
  out.push('')

  const week = thisWeekMatchups()
  if (week.length > 0) {
    out.push('## This week')
    out.push('')
    for (const m of week) out.push(`${line(m.verdict)} — for ${m.event}, ${formatEventDate(m)}`)
    out.push('')
  }

  out.push('## Debate hubs')
  out.push('')
  for (const id of HUB_IDS) out.push(`- [${HUBS[id].name}](${SITE_URL}/debates/${id}): ${HUBS[id].description}`)
  out.push(`- [Timed matchups](${SITE_URL}/matchups): dated verdicts published ahead of games, launches and holidays.`)
  out.push('')

  for (const id of HUB_IDS) {
    const inHub = curated.filter((c) => c.category === id)
    if (inHub.length === 0) continue
    out.push(`## ${HUBS[id].name}`)
    out.push('')
    for (const c of inHub) out.push(line(c))
    out.push('')
  }

  if (community.length > 0) {
    out.push('## More verdicts')
    out.push('')
    for (const c of community) out.push(line(c))
    out.push('')
  }

  return new Response(out.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
