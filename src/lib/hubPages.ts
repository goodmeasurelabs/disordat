import { getComparison, type StoredComparison } from '@/lib/comparisons'
import { HUBS, hubPreview, type HubId } from '@/lib/debates'
import { isJunkComparison } from '@/lib/quality'

/** Everything listed on a hub page: curated verdicts plus any legacy ones that load. */
export async function hubListing(hub: HubId): Promise<StoredComparison[]> {
  const curated: StoredComparison[] = hubPreview(hub, Infinity)
  const legacy: StoredComparison[] = []
  for (const slug of HUBS[hub].legacySlugs) {
    const c = await getComparison(slug)
    if (c && !isJunkComparison(c)) legacy.push(c)
  }
  return [...curated, ...legacy]
}
