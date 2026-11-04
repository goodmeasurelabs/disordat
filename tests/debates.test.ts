import { describe, expect, it } from 'vitest'
import { buildComparisonSlug } from '@/lib/slug'
import {
  FRESHNESS_DAYS,
  HUB_IDS,
  HUBS,
  allStaticVerdicts,
  hubVerdicts,
  relatedVerdicts,
  staleVerdicts,
} from '@/lib/debates'
import { isJunkComparison } from '@/lib/quality'

const verdicts = allStaticVerdicts()

describe('curated debate library', () => {
  it('has about 150 searched pairs across the four hubs', () => {
    expect(verdicts.length).toBeGreaterThanOrEqual(140)
    for (const id of HUB_IDS) expect(hubVerdicts(id).length).toBeGreaterThanOrEqual(25)
  })

  it('uses canonical, unique slugs that match the items', () => {
    const seen = new Set<string>()
    for (const v of verdicts) {
      expect(buildComparisonSlug(v.item_a, v.item_b), v.slug).toBe(v.slug)
      expect(seen.has(v.slug), v.slug).toBe(false)
      seen.add(v.slug)
    }
  })

  it('does not shadow verdicts already live in Redis', () => {
    const legacy = new Set(HUB_IDS.flatMap((id) => HUBS[id].legacySlugs))
    for (const v of verdicts) expect(legacy.has(v.slug), v.slug).toBe(false)
  })

  it('every verdict is complete, dated, and titled as a question', () => {
    for (const v of verdicts) {
      const at = v.slug
      expect(v.question.endsWith('?'), at).toBe(true)
      expect(v.summary.length, at).toBeLessThanOrEqual(220)
      expect(v.winner_reason.length, at).toBeLessThanOrEqual(400)
      expect(['a', 'b', 'tie']).toContain(v.winner)
      expect(v.dimensions.length, at).toBeGreaterThanOrEqual(4)
      expect(v.dimensions.length, at).toBeLessThanOrEqual(6)
      expect(v.pros_a.length, at).toBeGreaterThanOrEqual(3)
      expect(v.pros_b.length, at).toBeGreaterThanOrEqual(3)
      expect(v.updated_at, at).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(v.search_query.includes(' vs '), at).toBe(true)
      expect(isJunkComparison(v), at).toBe(false)
    }
  })

  it('takes a side almost every time', () => {
    const ties = verdicts.filter((v) => v.winner === 'tie').length
    expect(ties / verdicts.length).toBeLessThan(0.05)
  })

  it('links related pairs that share an item first', () => {
    const batman = verdicts.find((v) => v.slug === 'batman-vs-superman')!
    const related = relatedVerdicts(batman, 6)
    expect(related[0].slug).toMatch(/batman|superman/)
    expect(related.some((r) => r.slug === batman.slug)).toBe(false)
  })

  it('flags verdicts older than the refresh window', () => {
    const newest = verdicts.map((v) => v.updated_at).sort().at(-1)!
    const justAfter = new Date(Date.parse(newest) + (FRESHNESS_DAYS + 1) * 86_400_000)
    expect(staleVerdicts(new Date(newest))).toHaveLength(0)
    expect(staleVerdicts(justAfter)).toHaveLength(verdicts.length)
  })
})

describe('slugs', () => {
  it('fold accents and apostrophes so typed names reach curated pages', () => {
    expect(buildComparisonSlug('Pokémon', 'Digimon')).toBe('digimon-vs-pokemon')
    expect(buildComparisonSlug('Beyoncé', 'Taylor Swift')).toBe('beyonce-vs-taylor-swift')
    expect(buildComparisonSlug("Shaquille O'Neal", 'Kareem Abdul-Jabbar')).toBe('kareem-abdul-jabbar-vs-shaquille-oneal')
    // Live slugs keep their shape (the seed list used a curly apostrophe).
    expect(buildComparisonSlug('McDonald\u2019s', 'Burger King')).toBe('burger-king-vs-mcdonald-s')
  })
})

describe('hub previews', () => {
  it('lead with a real, hand-picked flagship verdict', async () => {
    const { hubPreview } = await import('@/lib/debates')
    for (const id of HUB_IDS) expect(hubPreview(id, 1)[0].slug).toBe(HUBS[id].featured)
  })
})
