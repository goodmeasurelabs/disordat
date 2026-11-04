import type { Metadata } from 'next'
import Link from 'next/link'
import VerdictList from '@/components/VerdictList'
import { formatEventDate, pastMatchups, thisWeekMatchups, upcomingMatchups, type MatchupWithVerdict } from '@/lib/matchups'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'This week’s matchups: dated verdicts before the big moment · disordat',
  description:
    'Verdicts published ahead of games, awards, launches and holidays. Pick a side before it happens.',
  alternates: { canonical: 'https://disordat.org/matchups' },
}

function noteFor(list: MatchupWithVerdict[]) {
  return (c: { slug: string }) => {
    const m = list.find((x) => x.slug === c.slug)
    return m ? `${m.event} · ${formatEventDate(m)}` : null
  }
}

export default function MatchupsPage() {
  const week = thisWeekMatchups()
  const weekSlugs = new Set(week.map((m) => m.slug))
  const later = upcomingMatchups().filter((m) => !weekSlugs.has(m.slug))
  const past = pastMatchups().filter((m) => !weekSlugs.has(m.slug))

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white">
      <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        <nav className="mb-6 text-sm">
          <Link href="/" className="font-medium text-slate-500 hover:text-emerald-600">← disordat</Link>
        </nav>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-balance">
          Timed matchups
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-600">
          A dated verdict before the moment: awards nights, rivalry games, launches and holidays. Pick a side, then
          send it to whoever is wrong.
        </p>

        {week.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-3">This week</h2>
            <VerdictList items={week.map((m) => m.verdict)} note={noteFor(week)} />
          </section>
        )}
        {later.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Coming up</h2>
            <VerdictList items={later.map((m) => m.verdict)} note={noteFor(later)} showSummary={false} />
          </section>
        )}
        {past.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Already happened</h2>
            <VerdictList items={past.map((m) => m.verdict)} note={noteFor(past)} showSummary={false} />
          </section>
        )}
      </div>
    </main>
  )
}
