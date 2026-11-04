/**
 * The curated debate library: verdicts written ahead of time and shipped as
 * static JSON (src/data/debates/<hub>.json), grouped into hubs.
 *
 * Pairs come from real US search demand (see keyword-research.csv beside the
 * data). They cost nothing to serve: no model call happens for these slugs.
 * Each verdict carries an `as_of` date; anything older than FRESHNESS_DAYS is
 * flagged by `npm run debates:freshness` and refreshed with
 * `npm run debates:refresh` (see README).
 */
import type { StoredComparison } from '@/lib/comparisons'
import fandoms from '@/data/debates/fandoms.json'
import goat from '@/data/debates/goat.json'
import food from '@/data/debates/food.json'
import travel from '@/data/debates/travel.json'

export const FRESHNESS_DAYS = 90

export const HUB_IDS = ['fandoms', 'goat', 'food', 'travel'] as const
export type HubId = (typeof HUB_IDS)[number]

export interface Hub {
  id: HubId
  /** Short name used in nav and breadcrumbs. */
  name: string
  /** Page title, phrased the way people search. */
  title: string
  description: string
  intro: string
  /** The pair shown when the hub is previewed (homepage, /debates). */
  featured: string
  /**
   * Older verdicts in Redis (generated before the hubs existed) that belong
   * in this hub. Listed when they load; skipped otherwise.
   */
  legacySlugs: string[]
}

export const HUBS: Record<HubId, Hub> = {
  fandoms: {
    id: 'fandoms',
    featured: 'batman-vs-superman',
    name: 'Fandoms',
    title: 'Fandom debates: shows, films, games, music and heroes, settled',
    description:
      'Batman or Superman? Breaking Bad or The Sopranos? Dated verdicts on the fandom arguments people actually search for.',
    intro:
      'The arguments that never end in the group chat: heroes, villains, shows, sagas, consoles and artists. Every verdict picks a side and says why.',
    legacySlugs: [
      'game-of-thrones-vs-lord-of-the-rings',
      'harry-potter-vs-percy-jackson',
      'star-trek-vs-star-wars',
      'dc-vs-marvel',
      'how-i-met-your-mother-vs-its-always-sunny-in-philadelphia',
    ],
  },
  goat: {
    id: 'goat',
    featured: 'lionel-messi-vs-pele',
    name: 'Sports GOATs',
    title: 'Sports GOAT debates and rivalries, settled',
    description:
      'Messi or Pelé? Federer or Nadal? Yankees or Red Sox? Opinionated, dated verdicts on the biggest sports arguments.',
    intro:
      'Greatest-of-all-time arguments and the rivalries behind them. Team pages judge the all-time franchise, not tonight’s game.',
    legacySlugs: [
      'cristiano-ronaldo-vs-lionel-messi',
      'lebron-james-vs-michael-jordan',
      'patrick-mahomes-vs-tom-brady',
      'serena-williams-vs-steffi-graf',
      'babe-ruth-vs-shohei-ohtani',
      'aaron-judge-vs-shohei-ohtani',
    ],
  },
  food: {
    id: 'food',
    featured: 'kfc-vs-popeyes',
    name: 'Food & drink',
    title: 'Food and drink debates: chains, snacks and dishes, settled',
    description:
      'Popeyes or KFC? Coke Zero or Diet Coke? Pancakes or waffles? Verdicts on the food fights people search for.',
    intro:
      'Fast-food rivalries, snack aisles, coffee orders and the Thanksgiving table. One winner each, with the reasons.',
    legacySlugs: [
      'coke-vs-pepsi',
      'burger-king-vs-mcdonald-s',
      'dunkin-vs-starbucks',
      'cava-vs-chipotle',
      'five-guys-vs-in-n-out',
      'in-n-out-vs-shake-shack',
      'chicago-deep-dish-vs-new-york-pizza',
      'ramen-vs-sushi',
    ],
  },
  travel: {
    id: 'travel',
    featured: 'thailand-vs-vietnam',
    name: 'Travel',
    title: 'Travel debates: cities, islands, airlines and trips, settled',
    description:
      'Thailand or Vietnam? Maui or Kauai? Delta or United? Dated travel verdicts for the trips people are deciding between.',
    intro:
      'Where to go, how to fly and where to sleep. Each verdict says who it is for and picks the better trip.',
    legacySlugs: [
      'bali-vs-phuket',
      'iceland-vs-new-zealand',
      'banff-vs-yellowstone',
      'barcelona-vs-lisbon',
      'paris-vs-rome',
      'seoul-vs-tokyo',
    ],
  },
}

/** Shape of one entry in src/data/debates/<hub>.json. */
export interface DebateEntry {
  slug: string
  item_a: string
  item_b: string
  category: HubId
  question: string
  search_query: string
  search_volume: number | null
  summary: string
  winner: 'a' | 'b' | 'tie'
  winner_reason: string
  dimensions: StoredComparison['dimensions']
  pros_a: string[]
  pros_b: string[]
  /** Date the verdict was last written or refreshed (YYYY-MM-DD). */
  as_of: string
  /** Date the page was first published, if it has been refreshed since. */
  first_published?: string
}

export interface DebateVerdict extends StoredComparison {
  category: HubId
  question: string
  updated_at: string
  search_query: string
  search_volume: number | null
}

const RAW: Record<HubId, DebateEntry[]> = {
  fandoms: fandoms as DebateEntry[],
  goat: goat as DebateEntry[],
  food: food as DebateEntry[],
  travel: travel as DebateEntry[],
}

function toVerdict(e: DebateEntry): DebateVerdict {
  return {
    slug: e.slug,
    item_a: e.item_a,
    item_b: e.item_b,
    summary: e.summary,
    winner: e.winner,
    winner_reason: e.winner_reason,
    dimensions: e.dimensions,
    pros_a: e.pros_a,
    pros_b: e.pros_b,
    created_at: e.first_published ?? e.as_of,
    updated_at: e.as_of,
    category: e.category,
    question: e.question,
    search_query: e.search_query,
    search_volume: e.search_volume,
  }
}

const ALL: DebateVerdict[] = HUB_IDS.flatMap((h) => RAW[h].map(toVerdict))
const BY_SLUG = new Map(ALL.map((v) => [v.slug, v]))

export function getStaticVerdict(slug: string): DebateVerdict | null {
  return BY_SLUG.get(slug) ?? null
}

export function allStaticVerdicts(): DebateVerdict[] {
  return ALL
}

export function isHubId(id: string): id is HubId {
  return (HUB_IDS as readonly string[]).includes(id)
}

/** The hub's flagship verdict first, then the rest. */
export function hubPreview(hub: HubId, n = 3): DebateVerdict[] {
  const all = hubVerdicts(hub)
  const featured = all.find((v) => v.slug === HUBS[hub].featured)
  return (featured ? [featured, ...all.filter((v) => v !== featured)] : all).slice(0, n)
}

/** Verdicts in a hub, most-searched first. */
export function hubVerdicts(hub: HubId): DebateVerdict[] {
  return ALL.filter((v) => v.category === hub).sort(
    (a, b) => (b.search_volume ?? 0) - (a.search_volume ?? 0),
  )
}

/** Hub a slug belongs to, including legacy Redis slugs. */
export function hubForSlug(slug: string): HubId | null {
  const v = BY_SLUG.get(slug)
  if (v) return v.category
  for (const id of HUB_IDS) if (HUBS[id].legacySlugs.includes(slug)) return id
  return null
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/**
 * Related curated verdicts: first pairs that share an item ("If you liked
 * Batman vs Superman: Batman vs Iron Man"), then the most-searched pairs in
 * the same hub.
 */
export function relatedVerdicts(
  c: Pick<StoredComparison, 'slug' | 'item_a' | 'item_b' | 'category'>,
  limit = 6,
): DebateVerdict[] {
  const items = new Set([norm(c.item_a), norm(c.item_b)])
  const sharing = ALL.filter(
    (v) => v.slug !== c.slug && (items.has(norm(v.item_a)) || items.has(norm(v.item_b))),
  )
  const hub = (c.category && isHubId(c.category) ? c.category : null) ?? hubForSlug(c.slug)
  const sameHub = hub ? hubVerdicts(hub).filter((v) => v.slug !== c.slug) : []
  const out: DebateVerdict[] = []
  for (const v of [...sharing, ...sameHub]) {
    if (out.length >= limit) break
    if (!out.some((o) => o.slug === v.slug)) out.push(v)
  }
  return out
}

export function daysSince(isoDate: string, now: Date = new Date()): number {
  const t = Date.parse(isoDate)
  if (Number.isNaN(t)) return Infinity
  return Math.floor((now.getTime() - t) / 86_400_000)
}

/** Curated verdicts older than FRESHNESS_DAYS, oldest first. */
export function staleVerdicts(now: Date = new Date()): DebateVerdict[] {
  return ALL.filter((v) => daysSince(v.updated_at, now) > FRESHNESS_DAYS).sort((a, b) =>
    a.updated_at.localeCompare(b.updated_at),
  )
}
