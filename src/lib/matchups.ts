/**
 * Timed matchups: dated verdicts published ahead of a moment (a game, an
 * awards night, a launch, a holiday). The calendar lives in
 * src/data/matchups.json; each entry points at a curated verdict in
 * src/data/debates. The homepage "This week" slot, /matchups and /llms.txt
 * all read from here, so adding a row is the whole weekly routine
 * (see docs/matchups.md).
 */
import matchupsJson from '@/data/matchups.json'
import { getStaticVerdict, type DebateVerdict } from '@/lib/debates'

export type DateConfidence = 'fixed' | 'scheduled' | 'approximate' | 'seasonal'

export interface Matchup {
  slug: string
  event: string
  /** YYYY-MM-DD, the day of the moment itself. */
  event_date: string
  date_confidence: DateConfidence
  note?: string
  /** Optional link out to one of Sean's fan sites for this matchup. */
  fan_site?: { name: string; url: string; utm_source: string }
}

export interface MatchupWithVerdict extends Matchup {
  verdict: DebateVerdict
}

/** Show a matchup on the homepage this many days before its moment... */
export const LEAD_DAYS = 7
/** ...and for this many days after. */
export const TRAIL_DAYS = 1

const MATCHUPS = (matchupsJson as Matchup[])
  .slice()
  .sort((a, b) => a.event_date.localeCompare(b.event_date))

export function allMatchups(): Matchup[] {
  return MATCHUPS
}

function withVerdict(m: Matchup): MatchupWithVerdict | null {
  const verdict = getStaticVerdict(m.slug)
  return verdict ? { ...m, verdict } : null
}

function dayIndex(isoDate: string): number {
  return Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / 86_400_000)
}

function todayIndex(now: Date): number {
  return Math.floor(now.getTime() / 86_400_000)
}

/** Matchups whose moment is within the next LEAD_DAYS (or just happened). */
export function thisWeekMatchups(now: Date = new Date()): MatchupWithVerdict[] {
  const today = todayIndex(now)
  return MATCHUPS.filter((m) => {
    const d = dayIndex(m.event_date)
    return d - today <= LEAD_DAYS && today - d <= TRAIL_DAYS
  })
    .map(withVerdict)
    .filter((m): m is MatchupWithVerdict => m !== null)
}

export function upcomingMatchups(now: Date = new Date()): MatchupWithVerdict[] {
  const today = todayIndex(now)
  return MATCHUPS.filter((m) => dayIndex(m.event_date) >= today)
    .map(withVerdict)
    .filter((m): m is MatchupWithVerdict => m !== null)
}

export function pastMatchups(now: Date = new Date()): MatchupWithVerdict[] {
  const today = todayIndex(now)
  return MATCHUPS.filter((m) => dayIndex(m.event_date) < today)
    .reverse()
    .map(withVerdict)
    .filter((m): m is MatchupWithVerdict => m !== null)
}

export function matchupForSlug(slug: string): Matchup | null {
  return MATCHUPS.find((m) => m.slug === slug) ?? null
}

/** Days until the last scheduled matchup (negative once the calendar runs dry). */
export function matchupRunwayDays(now: Date = new Date()): number {
  const last = MATCHUPS[MATCHUPS.length - 1]
  if (!last) return -1
  return dayIndex(last.event_date) - todayIndex(now)
}

export function formatEventDate(m: Matchup): string {
  const d = new Date(`${m.event_date}T12:00:00Z`)
  const label = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
  return m.date_confidence === 'approximate' ? `around ${label}` : label
}

export function fanSiteHref(m: Matchup): string | null {
  if (!m.fan_site) return null
  const u = new URL(m.fan_site.url)
  u.searchParams.set('utm_source', m.fan_site.utm_source)
  u.searchParams.set('utm_medium', 'referral')
  u.searchParams.set('utm_campaign', `matchup-${m.slug}`)
  return u.toString()
}
