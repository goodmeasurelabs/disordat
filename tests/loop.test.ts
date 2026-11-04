import { describe, expect, it } from 'vitest'
import { isJunkComparison, isTrendable, displayName } from '@/lib/quality'
import { agreePercent } from '@/lib/votes'
import { GET as voteGet, POST as votePost } from '@/app/api/vote/route'
import { NextRequest } from 'next/server'
import type { StoredComparison } from '@/lib/comparisons'
import {
  allMatchups,
  matchupRunwayDays,
  thisWeekMatchups,
  upcomingMatchups,
  fanSiteHref,
} from '@/lib/matchups'
import { getStaticVerdict } from '@/lib/debates'

const base: StoredComparison = {
  slug: 'x',
  item_a: 'a',
  item_b: 'b',
  summary: '',
  winner: 'a',
  winner_reason: '',
  dimensions: [],
  pros_a: [],
  pros_b: [],
  created_at: '2026-01-01',
}

describe('homepage quality gate', () => {
  it('hides junk pairs and shrugs from Trending', () => {
    expect(isJunkComparison({ ...base, slug: 'nope-vs-yep', item_a: 'nope', item_b: 'yep' })).toBe(true)
    expect(isJunkComparison({ ...base, slug: 'asdf-vs-pizza', item_a: 'asdf', item_b: 'Pizza' })).toBe(true)
    expect(isTrendable({ ...base, slug: 'android-vs-iphone', item_a: 'android', item_b: 'iphone' })).toBe(true)
    expect(isTrendable({ ...base, slug: 'pilates-vs-yoga', item_a: 'Pilates', item_b: 'Yoga', winner: 'tie' })).toBe(false)
  })

  it('fixes known typos in listed names', () => {
    expect(displayName('Luis CK')).toBe('Louis CK')
    expect(displayName('Mark Norman')).toBe('Mark Norman')
  })
})

describe('votes', () => {
  it('only shows a percentage once there are enough votes', () => {
    expect(agreePercent(null)).toBeNull()
    expect(agreePercent({ agree: 1, disagree: 0 })).toBeNull()
    expect(agreePercent({ agree: 5, disagree: 3 })).toBe(63)
    expect(agreePercent({ agree: 1, disagree: 0 }, 1)).toBe(100)
  })

  it('rejects bad input and reports storage as unavailable without Redis', async () => {
    const bad = await votePost(
      new NextRequest('http://localhost/api/vote', { method: 'POST', body: JSON.stringify({ slug: 'x', vote: 'maybe' }) }),
    )
    expect(bad.status).toBe(400)

    const unknown = await votePost(
      new NextRequest('http://localhost/api/vote', {
        method: 'POST',
        body: JSON.stringify({ slug: 'nobody-vs-nothing', vote: 'agree' }),
      }),
    )
    expect(unknown.status).toBe(404)

    const noStore = await votePost(
      new NextRequest('http://localhost/api/vote', {
        method: 'POST',
        body: JSON.stringify({ slug: 'batman-vs-superman', vote: 'agree' }),
      }),
    )
    expect(noStore.status).toBe(503)

    const get = await voteGet(new NextRequest('http://localhost/api/vote?slug=batman-vs-superman'))
    expect(await get.json()).toMatchObject({ available: false, voted: null })
  })

  it('refuses a second vote from the same browser', async () => {
    const res = await votePost(
      new NextRequest('http://localhost/api/vote', {
        method: 'POST',
        headers: { cookie: 'dv_batman-vs-superman=agree' },
        body: JSON.stringify({ slug: 'batman-vs-superman', vote: 'disagree' }),
      }),
    )
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ voted: 'agree', duplicate: true })
  })
})

describe('timed matchups', () => {
  it('every matchup points at a curated verdict and a real date', () => {
    for (const m of allMatchups()) {
      expect(getStaticVerdict(m.slug), m.slug).not.toBeNull()
      expect(Number.isNaN(Date.parse(m.event_date)), m.slug).toBe(false)
    }
  })

  it('fills the "This week" slot from the calendar', () => {
    const week = thisWeekMatchups(new Date('2026-11-22T12:00:00Z'))
    expect(week.map((m) => m.slug)).toEqual(
      expect.arrayContaining(['ham-vs-turkey', 'apple-pie-vs-pumpkin-pie', 'playstation-vs-xbox']),
    )
    expect(week.map((m) => m.slug)).not.toContain('army-vs-navy')
    expect(upcomingMatchups(new Date('2027-06-01'))).toHaveLength(0)
  })

  it('has at least a month of runway from launch', () => {
    expect(matchupRunwayDays(new Date('2026-11-04T12:00:00Z'))).toBeGreaterThanOrEqual(30)
  })

  it('tags fan-site links with utm_source', () => {
    const m = allMatchups().find((x) => x.slug === 'paul-skenes-vs-tarik-skubal')!
    expect(fanSiteHref(m)).toBe(
      'https://paulskenes.com/?utm_source=disordat&utm_medium=referral&utm_campaign=matchup-paul-skenes-vs-tarik-skubal',
    )
  })
})
