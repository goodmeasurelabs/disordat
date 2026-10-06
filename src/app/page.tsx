import HomeClient, { type TrendingItem } from './HomeClient'
import HomeDebates from '@/components/HomeDebates'
import { getComparison, listRecentComparisonSlugs } from '@/lib/comparisons'
import { thisWeekMatchups, upcomingMatchups } from '@/lib/matchups'
import { displayName, isTrendable } from '@/lib/quality'

// Re-fetch trending data every 10 minutes so Google sees fresh internal links
// without hammering KV on every request.
export const dynamic = 'force-dynamic'
export const revalidate = 600

export default async function HomePage() {
  const trending = await loadTrending()
  const now = new Date()
  return (
    <HomeClient
      trending={trending}
      extra={<HomeDebates thisWeek={thisWeekMatchups(now)} next={upcomingMatchups(now)[0] ?? null} />}
    />
  )
}

async function loadTrending(): Promise<TrendingItem[]> {
  try {
    const slugs = await listRecentComparisonSlugs(30)
    const items: TrendingItem[] = []
    for (const slug of slugs) {
      const c = await getComparison(slug)
      // Only real verdicts: no test pairs ("nope vs yep"), no shrugs.
      if (!c || !isTrendable(c)) continue
      const item_a = displayName(c.item_a)
      const item_b = displayName(c.item_b)
      items.push({
        slug: c.slug,
        item_a,
        item_b,
        winner_label: c.winner === 'a' ? item_a : item_b,
      })
      if (items.length >= 10) break
    }
    return items
  } catch {
    return []
  }
}
