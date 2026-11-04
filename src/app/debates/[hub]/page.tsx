import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import VerdictList from '@/components/VerdictList'
import { HUB_IDS, HUBS, isHubId } from '@/lib/debates'
import { hubListing } from '@/lib/hubPages'
import { questionFor, SITE_URL } from '@/lib/verdict'

export const revalidate = 3600

type RouteParams = { hub: string }

export function generateStaticParams() {
  return HUB_IDS.map((hub) => ({ hub }))
}

export async function generateMetadata({ params }: { params: RouteParams }): Promise<Metadata> {
  if (!isHubId(params.hub)) return { title: 'Not found · disordat', robots: { index: false } }
  const hub = HUBS[params.hub]
  return {
    title: `${hub.title} · disordat`,
    description: hub.description,
    alternates: { canonical: `${SITE_URL}/debates/${hub.id}` },
    openGraph: { title: hub.title, description: hub.description, url: `${SITE_URL}/debates/${hub.id}`, siteName: 'disordat' },
  }
}

export default async function HubPage({ params }: { params: RouteParams }) {
  if (!isHubId(params.hub)) notFound()
  const hub = HUBS[params.hub]
  const items = await hubListing(hub.id)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: hub.title,
    description: hub.description,
    url: `${SITE_URL}/debates/${hub.id}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: questionFor(c),
        url: `${SITE_URL}/vs/${c.slug}`,
      })),
    },
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-slate-500">
          <Link href="/" className="font-medium hover:text-emerald-600">← disordat</Link>
          <span aria-hidden="true">/</span>
          <Link href="/debates" className="font-medium hover:text-emerald-600">Debates</Link>
        </nav>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-balance">
          {hub.name} debates, settled
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-600">{hub.intro}</p>
        <p className="mt-2 text-sm text-slate-500">
          {items.length} verdicts, most-searched first. Each one is dated and refreshed at least every 90 days.
        </p>

        <div className="mt-8">
          <VerdictList items={items} />
        </div>

        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Other hubs</h2>
          <div className="flex flex-wrap gap-2">
            {HUB_IDS.filter((id) => id !== hub.id).map((id) => (
              <Link
                key={id}
                href={`/debates/${id}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-emerald-400 hover:text-emerald-700"
              >
                {HUBS[id].name}
              </Link>
            ))}
            <Link
              href="/matchups"
              className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-900 hover:border-amber-400"
            >
              Timed matchups
            </Link>
          </div>
        </section>

        <p className="mt-10 text-center text-sm text-slate-600">
          Missing one?{' '}
          <Link href="/" className="font-medium text-emerald-700 hover:underline">
            Settle your own debate →
          </Link>
        </p>
      </div>
    </main>
  )
}
