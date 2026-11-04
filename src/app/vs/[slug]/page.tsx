import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getComparison,
  listRecentComparisonSlugs,
  type ComparisonDimension,
  type StoredComparison,
} from '@/lib/comparisons'
import ShareButtons from '@/components/ShareButtons'
import VerdictVote from '@/components/VerdictVote'
import CiteVerdict from '@/components/CiteVerdict'
import { HUBS, hubForSlug, relatedVerdicts } from '@/lib/debates'
import { fanSiteHref, formatEventDate, matchupForSlug } from '@/lib/matchups'
import { isJunkComparison } from '@/lib/quality'
import {
  SITE_URL,
  buildFaqs,
  citationsFor,
  formatLongDate,
  markdownUrl,
  questionFor,
  verdictDate,
  verdictHeadline,
  winnerLabelFor,
} from '@/lib/verdict'

type RouteParams = { slug: string }

export async function generateMetadata({ params }: { params: RouteParams }): Promise<Metadata> {
  const { slug } = params
  const comparison = await getComparison(slug)
  if (!comparison) {
    return {
      title: 'Comparison not found · disordat',
      robots: { index: false, follow: false },
    }
  }

  // Each page is titled as the question people search for.
  const question = questionFor(comparison)
  const title = `${question} · disordat`
  const shortTitle = `${comparison.item_a} vs ${comparison.item_b}: ${verdictHeadline(comparison)}`
  const url = `${SITE_URL}/vs/${slug}`
  const ogImage = `${SITE_URL}/vs/${slug}/opengraph-image`
  const description = comparison.summary

  return {
    title,
    description,
    alternates: { canonical: url, types: { 'text/markdown': markdownUrl(slug) } },
    robots: isJunkComparison(comparison) ? { index: false, follow: true } : undefined,
    openGraph: {
      title: shortTitle,
      description,
      url,
      siteName: 'disordat',
      type: 'article',
      publishedTime: comparison.created_at,
      modifiedTime: verdictDate(comparison),
      images: [{ url: ogImage, width: 1200, height: 630, alt: shortTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: shortTitle,
      description,
      images: [ogImage],
    },
  }
}

export default async function ComparisonPage({ params }: { params: RouteParams }) {
  const { slug } = params
  const c = await getComparison(slug)
  if (!c) notFound()

  const pageUrl = `${SITE_URL}/vs/${slug}`
  const winnerLabel = winnerLabelFor(c)
  const question = questionFor(c)
  const headline = verdictHeadline(c)
  const asOf = verdictDate(c)
  const asOfLabel = formatLongDate(asOf)
  const hubId = hubForSlug(slug)
  const hub = hubId ? HUBS[hubId] : null
  const matchup = matchupForSlug(slug)
  const fanHref = matchup ? fanSiteHref(matchup) : null
  const cite = citationsFor(c)

  const related = await findRelatedComparisons(c)

  // FAQ entries — phrased in the exact shapes users type into Google.
  const faqs = buildFaqs(c)

  // Schema.org FAQPage JSON-LD — this is what earns "People Also Ask" rich snippets.
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  // Article schema: the verdict as a dated, citable piece.
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: question,
    alternativeHeadline: `${c.item_a} vs ${c.item_b}: ${headline}`,
    description: c.summary,
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    datePublished: c.created_at,
    dateModified: asOf,
    image: `${pageUrl}/opengraph-image`,
    author: { '@type': 'Organization', name: 'disordat', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'disordat',
      url: SITE_URL,
    },
    about: [
      { '@type': 'Thing', name: c.item_a },
      { '@type': 'Thing', name: c.item_b },
    ],
    ...(hub ? { articleSection: hub.name } : {}),
    encoding: {
      '@type': 'MediaObject',
      encodingFormat: 'text/markdown',
      contentUrl: markdownUrl(slug),
    },
  }

  const breadcrumbJsonLd = hub
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'disordat', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Debates', item: `${SITE_URL}/debates` },
          { '@type': 'ListItem', position: 3, name: hub.name, item: `${SITE_URL}/debates/${hub.id}` },
          { '@type': 'ListItem', position: 4, name: `${c.item_a} vs ${c.item_b}`, item: pageUrl },
        ],
      }
    : null

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}

      <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        {/* Top nav */}
        <div className="mb-6 flex items-center justify-between gap-3 text-sm">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-slate-500">
            <Link href="/" className="font-medium hover:text-emerald-600 transition-colors">
              ← disordat
            </Link>
            {hub && (
              <>
                <span aria-hidden="true">/</span>
                <Link href={`/debates/${hub.id}`} className="truncate font-medium hover:text-emerald-600 transition-colors">
                  {hub.name}
                </Link>
              </>
            )}
          </nav>
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-white font-medium hover:bg-emerald-700 transition-colors"
          >
            Settle your own
          </Link>
        </div>

        {matchup && (
          <div className="mb-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
            <span>
              <span className="font-semibold">Timed matchup:</span> {matchup.event}, {formatEventDate(matchup)}
            </span>
            {fanHref && matchup.fan_site && (
              <a href={fanHref} className="font-medium underline underline-offset-2 hover:text-amber-700">
                More on the {matchup.fan_site.name} →
              </a>
            )}
          </div>
        )}

        <p className="text-center text-sm font-semibold uppercase tracking-widest text-slate-400">
          {c.item_a} <span className="text-slate-300">vs</span> {c.item_b}
        </p>
        {/* The page answers one search question; it is the H1 and the <title>. */}
        <h1 className="mt-2 text-center text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight text-balance">
          {question}
        </h1>

        {/* Answer-first verdict card */}
        <section className="mt-6 rounded-2xl border border-emerald-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-2">
            The verdict
          </div>
          <div className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
            {c.winner === 'tie' ? (
              <>It&rsquo;s too close to call.</>
            ) : (
              <>
                <span className="text-emerald-700">{winnerLabel}</span> wins.
              </>
            )}
          </div>
          <p className="mt-3 text-base md:text-lg text-slate-700 leading-relaxed">{c.summary}</p>
          <p className="mt-3 text-sm text-slate-500" data-testid="verdict-as-of">
            Verdict as of <time dateTime={asOf}>{asOfLabel}</time>
            {' · '}
            <a href="#cite" className="underline underline-offset-2 hover:text-emerald-700">
              Cite this verdict
            </a>
          </p>
          <VerdictVote slug={slug} itemA={c.item_a} itemB={c.item_b} headline={headline} />
        </section>

        {/* Share buttons — important moment of truth */}
        <div className="mt-6">
          <ShareButtons url={pageUrl} summary={c.summary} itemA={c.item_a} itemB={c.item_b} slug={slug} headline={headline} />
        </div>

        {/* Side-by-side dimensions */}
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 text-center">
            Head-to-head
          </h2>
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
              <div className="p-4 text-sm font-semibold text-slate-900 text-center border-b border-slate-200 bg-slate-50">
                {c.item_a}
              </div>
              <div className="p-4 text-xs font-medium text-slate-500 text-center border-b border-slate-200 bg-slate-50 border-x">
                category
              </div>
              <div className="p-4 text-sm font-semibold text-slate-900 text-center border-b border-slate-200 bg-slate-50">
                {c.item_b}
              </div>
              {c.dimensions.map((d, i) => (
                <DimensionRow key={i} dim={d} isLast={i === c.dimensions.length - 1} />
              ))}
            </div>
          </div>
        </section>

        {/* Pros */}
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <ProsCard title={c.item_a} pros={c.pros_a} isWinner={c.winner === 'a'} />
          <ProsCard title={c.item_b} pros={c.pros_b} isWinner={c.winner === 'b'} />
        </section>

        {/* Why */}
        <section className="mt-8 rounded-2xl bg-slate-50 border border-slate-200 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
            {c.winner === 'tie' ? 'Why it’s too close to call' : `Why ${winnerLabel} wins`}
          </h2>
          <p className="text-slate-800 leading-relaxed">{c.winner_reason}</p>
        </section>

        {/* FAQ — written in the exact phrasings people type into Google */}
        <section className="mt-10">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Frequently asked</h2>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-900 mb-2">{f.q}</h3>
                <p className="text-slate-700 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cite this verdict — dated, so it can be quoted honestly */}
        <div className="mt-10">
          <CiteVerdict
            slug={slug}
            apa={cite.apa}
            mla={cite.mla}
            plain={cite.plain}
            markdownHref={`/vs/${slug}.md`}
            asOf={asOfLabel}
          />
        </div>

        {/* Related comparisons — internal linking for crawlers + humans */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">
              {hub ? 'Settle these next' : 'Related comparisons'}
            </h2>
            <ul className="grid gap-2 md:grid-cols-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/vs/${r.slug}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
                  >
                    <span className="text-sm text-slate-800 truncate">
                      {r.item_a} <span className="text-slate-400">vs</span> {r.item_b}
                    </span>
                    <span className="text-xs font-medium text-emerald-700 shrink-0">{verdictHeadline(r)} →</span>
                  </Link>
                </li>
              ))}
            </ul>
            {hub && (
              <p className="mt-4 text-center text-sm">
                <Link href={`/debates/${hub.id}`} className="font-medium text-emerald-700 hover:underline">
                  All {hub.name.toLowerCase()} debates →
                </Link>
              </p>
            )}
          </section>
        )}

        {/* Share again at bottom */}
        <div className="mt-10">
          <ShareButtons url={pageUrl} summary={c.summary} itemA={c.item_a} itemB={c.item_b} slug={slug} headline={headline} />
        </div>

        <footer className="mt-10 text-center text-xs text-slate-400 pb-8">
          Verdict by <Link href="/" className="underline hover:text-emerald-600">disordat</Link> ·{' '}
          <Link href="/debates" className="underline hover:text-emerald-600">more debates</Link> ·{' '}
          <a href={`/vs/${slug}.md`} className="underline hover:text-emerald-600">markdown</a>.
          Settle the debate — every verdict gets its own dated, shareable page.
        </footer>
      </div>
    </main>
  )
}

function DimensionRow({ dim, isLast }: { dim: ComparisonDimension; isLast: boolean }) {
  const border = isLast ? '' : 'border-b border-slate-200'
  return (
    <>
      <div className={`p-4 text-sm text-slate-800 ${border} ${dim.winner === 'a' ? 'bg-emerald-50' : ''}`}>
        <div className="flex items-start gap-2">
          {dim.winner === 'a' && <WinBadge />}
          <span>{dim.a}</span>
        </div>
      </div>
      <div className={`p-4 text-xs font-medium text-slate-500 text-center bg-white border-x border-slate-100 ${border}`}>
        {dim.name}
      </div>
      <div className={`p-4 text-sm text-slate-800 ${border} ${dim.winner === 'b' ? 'bg-emerald-50' : ''}`}>
        <div className="flex items-start gap-2">
          <span>{dim.b}</span>
          {dim.winner === 'b' && <WinBadge />}
        </div>
      </div>
    </>
  )
}

function WinBadge() {
  return (
    <span className="mt-0.5 shrink-0 text-emerald-600" title="Winner in this category">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 15 8l7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
      </svg>
    </span>
  )
}

function ProsCard({ title, pros, isWinner }: { title: string; pros: string[]; isWinner: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${
      isWinner
        ? 'border-emerald-300 bg-emerald-50/60'
        : 'border-slate-200 bg-white'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {isWinner && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
            winner
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {pros.map((p, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-700">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Up to 6 related verdicts: curated debates that share an item or a hub
 * first, then other cached comparisons that share one of the two items.
 */
async function findRelatedComparisons(c: StoredComparison): Promise<StoredComparison[]> {
  const related: StoredComparison[] = relatedVerdicts(c, 6)
  if (related.length >= 6) return related

  const [partA, partB] = c.slug.split('-vs-')
  if (!partA || !partB) return related

  const recentSlugs = await listRecentComparisonSlugs(80)
  const candidates = recentSlugs.filter((s) => {
    if (s === c.slug || related.some((r) => r.slug === s)) return false
    // Share one (and only one) of the two parts — same item, different opponent.
    const hitsA = s.includes(partA)
    const hitsB = s.includes(partB)
    return (hitsA && !hitsB) || (hitsB && !hitsA)
  })

  for (const s of candidates.slice(0, 20)) {
    if (related.length >= 6) break
    const stored = await getComparison(s)
    if (stored && !isJunkComparison(stored)) related.push(stored)
  }
  return related
}
