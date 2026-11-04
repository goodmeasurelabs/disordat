/**
 * The set of verdicts we advertise to crawlers and agents: every curated
 * debate plus recent user-generated verdicts that pass the quality gate.
 * The sitemap and /llms.txt both read this, so they always agree.
 */
import { getComparison, listRecentComparisonSlugs, type StoredComparison } from '@/lib/comparisons'
import { allStaticVerdicts, getStaticVerdict } from '@/lib/debates'
import { isJunkComparison } from '@/lib/quality'

export interface IndexedVerdicts {
  curated: StoredComparison[]
  community: StoredComparison[]
}

export async function indexedVerdicts(recentLimit = 500): Promise<IndexedVerdicts> {
  const curated = allStaticVerdicts()
  const community: StoredComparison[] = []
  for (const slug of await listRecentComparisonSlugs(recentLimit)) {
    if (getStaticVerdict(slug) || community.some((c) => c.slug === slug)) continue
    const c = await getComparison(slug)
    if (c && !isJunkComparison(c)) community.push(c)
  }
  return { curated, community }
}
