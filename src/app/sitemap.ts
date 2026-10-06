import type { MetadataRoute } from 'next'
import { HUB_IDS } from '@/lib/debates'
import { indexedVerdicts } from '@/lib/indexing'
import { verdictDate } from '@/lib/verdict'

const SITE_URL = 'https://disordat.org'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // rebuild at most hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { curated, community } = await indexedVerdicts()

  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: 'daily',
      priority: 1,
      lastModified: new Date(),
    },
    { url: `${SITE_URL}/debates`, changeFrequency: 'weekly', priority: 0.8 },
    ...HUB_IDS.map((id) => ({
      url: `${SITE_URL}/debates/${id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/matchups`, changeFrequency: 'weekly', priority: 0.7 },
  ]

  for (const c of [...curated, ...community]) {
    const d = new Date(verdictDate(c))
    entries.push({
      url: `${SITE_URL}/vs/${c.slug}`,
      changeFrequency: 'weekly',
      priority: 0.7,
      lastModified: Number.isNaN(d.getTime()) ? new Date() : d,
    })
  }

  return entries
}
