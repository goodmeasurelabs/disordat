/**
 * Presentation helpers shared by the /vs/ page, its markdown twin, the share
 * card and /llms.txt, so every surface says the same thing about a verdict.
 */
import type { StoredComparison } from '@/lib/comparisons'

export const SITE_URL = 'https://disordat.org'

export function verdictUrl(slug: string): string {
  return `${SITE_URL}/vs/${slug}`
}

export function markdownUrl(slug: string): string {
  return `${SITE_URL}/vs/${slug}.md`
}

export function winnerLabelFor(c: StoredComparison): string {
  if (c.winner === 'tie') return 'Too close to call'
  return c.winner === 'a' ? c.item_a : c.item_b
}

export function loserLabelFor(c: StoredComparison): string {
  if (c.winner === 'tie') return ''
  return c.winner === 'a' ? c.item_b : c.item_a
}

/** "Coke wins" / "Too close to call" — the verdict in two or three words. */
export function verdictHeadline(c: StoredComparison): string {
  return c.winner === 'tie' ? 'Too close to call' : `${winnerLabelFor(c)} wins`
}

/**
 * One line for listings: the summary, led by the verdict unless the summary
 * already opens with the winner ("Batman wins: ...").
 */
export function verdictLine(c: StoredComparison): string {
  const lead = c.winner === 'tie' ? '' : winnerLabelFor(c).toLowerCase()
  if (lead && c.summary.toLowerCase().startsWith(lead)) return c.summary
  return `${verdictHeadline(c)} — ${c.summary}`
}

/** The search question the page answers; also its <title>. */
export function questionFor(c: StoredComparison): string {
  return c.question?.trim() || `${c.item_a} or ${c.item_b}: which is better?`
}

/** When the verdict was last written (ISO string). */
export function verdictDate(c: StoredComparison): string {
  return c.updated_at || c.created_at
}

function parseDate(iso: string): Date | null {
  // Bare dates (YYYY-MM-DD) are calendar days; pin them to noon UTC so the
  // label never slips a day in any timezone.
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00Z` : iso)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "November 4, 2026" */
export function formatLongDate(iso: string): string {
  const d = parseDate(iso)
  if (!d) return 'unknown date'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

/** "2026-11-04" */
export function isoDay(iso: string): string {
  const d = parseDate(iso)
  return d ? d.toISOString().slice(0, 10) : iso.slice(0, 10)
}

export interface Faq {
  q: string
  a: string
}

/**
 * FAQ entries using the exact phrasings people type into Google, led by the
 * page's own search question. Answers come from the stored verdict.
 */
export function buildFaqs(c: StoredComparison): Faq[] {
  const tie = c.winner === 'tie'
  const winner = winnerLabelFor(c)
  const loser = loserLabelFor(c)

  const firstAnswer = tie
    ? `${c.item_a} and ${c.item_b} are close enough that it depends on your priorities. ${c.summary}`
    : `${winner}. ${c.winner_reason}`

  const secondAnswer = tie
    ? `It depends on what matters most to you. ${c.summary}`
    : `${winner} comes out ahead overall. ${c.winner_reason}${loser ? ` That said, ${loser} still has real strengths — see the pros lists above.` : ''}`

  const faqs: Faq[] = [
    { q: `Should I pick ${c.item_a} or ${c.item_b}?`, a: firstAnswer },
    { q: `Is ${c.item_a} better than ${c.item_b}?`, a: secondAnswer },
    { q: `What's the difference between ${c.item_a} and ${c.item_b}?`, a: c.summary },
  ]
  const question = questionFor(c)
  if (c.question && !faqs.some((f) => f.q.toLowerCase() === question.toLowerCase())) {
    faqs.unshift({ q: question, a: firstAnswer })
  }
  return faqs
}

export interface Citations {
  apa: string
  mla: string
  plain: string
}

const MLA_MONTHS = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.']

/** Citation strings in the formats people (and assistants) actually paste. */
export function citationsFor(c: StoredComparison): Citations {
  const d = parseDate(verdictDate(c))
  const url = verdictUrl(c.slug)
  const question = questionFor(c)
  const year = d ? d.getUTCFullYear() : 'n.d.'
  const apaDate = d
    ? `${year}, ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })}`
    : 'n.d.'
  const mlaDate = d ? `${d.getUTCDate()} ${MLA_MONTHS[d.getUTCMonth()]} ${year}` : 'n.d.'
  return {
    apa: `disordat. (${apaDate}). ${question} [${c.item_a} vs ${c.item_b} verdict]. ${url}`,
    mla: `“${question}” disordat, ${mlaDate}, ${url.replace(/^https:\/\//, '')}.`,
    plain: `${verdictHeadline(c)} — ${c.summary} (disordat verdict as of ${formatLongDate(verdictDate(c))}, ${url})`,
  }
}

function mdCell(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
}

const EDGE: Record<'a' | 'b' | 'tie', (c: StoredComparison) => string> = {
  a: (c) => c.item_a,
  b: (c) => c.item_b,
  tie: () => 'Even',
}

/** The plain-markdown twin served at /vs/<slug>.md for agents and LLMs. */
export function toMarkdown(c: StoredComparison, opts: { hubName?: string; hubUrl?: string } = {}): string {
  const url = verdictUrl(c.slug)
  const date = formatLongDate(verdictDate(c))
  const cite = citationsFor(c)
  const lines: string[] = []
  lines.push(`# ${questionFor(c)}`)
  lines.push('')
  lines.push(`**Verdict (${c.item_a} vs ${c.item_b}), as of ${date}: ${verdictHeadline(c)}.**`)
  lines.push('')
  lines.push(c.summary)
  lines.push('')
  lines.push(c.winner === 'tie' ? '## Why it is too close to call' : `## Why ${winnerLabelFor(c)} wins`)
  lines.push('')
  lines.push(c.winner_reason)
  lines.push('')
  lines.push('## Head-to-head')
  lines.push('')
  lines.push(`| Category | ${mdCell(c.item_a)} | ${mdCell(c.item_b)} | Edge |`)
  lines.push('| --- | --- | --- | --- |')
  for (const d of c.dimensions) {
    lines.push(`| ${mdCell(d.name)} | ${mdCell(d.a)} | ${mdCell(d.b)} | ${mdCell(EDGE[d.winner](c))} |`)
  }
  lines.push('')
  lines.push(`## The case for ${c.item_a}`)
  lines.push('')
  for (const p of c.pros_a) lines.push(`- ${p}`)
  lines.push('')
  lines.push(`## The case for ${c.item_b}`)
  lines.push('')
  for (const p of c.pros_b) lines.push(`- ${p}`)
  lines.push('')
  lines.push('## FAQ')
  lines.push('')
  for (const f of buildFaqs(c)) {
    lines.push(`### ${f.q}`)
    lines.push('')
    lines.push(f.a)
    lines.push('')
  }
  lines.push('---')
  lines.push('')
  lines.push(`- Canonical URL: ${url}`)
  lines.push(`- Verdict as of: ${isoDay(verdictDate(c))}`)
  if (opts.hubName && opts.hubUrl) lines.push(`- Debate hub: [${opts.hubName}](${opts.hubUrl})`)
  lines.push(`- Cite (APA): ${cite.apa}`)
  lines.push(`- Cite (MLA): ${cite.mla}`)
  lines.push(`- Agree or disagree? Vote at ${url}`)
  lines.push('')
  lines.push('Published by disordat (https://disordat.org): honest, dated verdicts on "X vs Y" debates. No ads, no sign-up.')
  lines.push('')
  return lines.join('\n')
}
