import type { Metadata } from 'next'
import Link from 'next/link'
import { HUB_IDS, HUBS, hubPreview, hubVerdicts } from '@/lib/debates'
import { upcomingMatchups } from '@/lib/matchups'
import { verdictHeadline } from '@/lib/verdict'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Debates, settled: fandoms, sports GOATs, food and travel · disordat',
  description:
    'Opinionated, dated verdicts on the "X vs Y" arguments people actually search for — grouped into fandom, sports GOAT, food and travel hubs.',
  alternates: { canonical: 'https://disordat.org/debates' },
}

export default function DebatesIndex() {
  const next = upcomingMatchups()[0]
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        <nav className="mb-6 text-sm">
          <Link href="/" className="font-medium text-slate-500 hover:text-emerald-600">
            ← disordat
          </Link>
        </nav>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-balance">
          Debates, settled
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-600">
          Every page picks a winner, says why, and shows the date it was decided. Vote if you disagree.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {HUB_IDS.map((id) => {
            const hub = HUBS[id]
            const top = hubPreview(id, 3)
            return (
              <Link
                key={id}
                href={`/debates/${id}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-400"
              >
                <h2 className="text-xl font-bold text-slate-900">{hub.name}</h2>
                <p className="mt-1 text-sm text-slate-600">{hub.intro}</p>
                <ul className="mt-3 space-y-1 text-sm text-slate-700">
                  {top.map((v) => (
                    <li key={v.slug} className="flex justify-between gap-2">
                      <span className="truncate">
                        {v.item_a} <span className="text-slate-400">vs</span> {v.item_b}
                      </span>
                      <span className="shrink-0 text-xs font-medium text-emerald-700">{verdictHeadline(v)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm font-medium text-emerald-700">
                  {hubVerdicts(id).length} verdicts →
                </p>
              </Link>
            )
          })}
        </div>

        {next && (
          <p className="mt-8 text-center text-sm text-slate-600">
            Next timed matchup:{' '}
            <Link href={`/vs/${next.slug}`} className="font-medium text-emerald-700 hover:underline">
              {next.verdict.item_a} vs {next.verdict.item_b}
            </Link>{' '}
            for {next.event}.{' '}
            <Link href="/matchups" className="underline hover:text-emerald-700">
              All matchups
            </Link>
          </p>
        )}
      </div>
    </main>
  )
}
