import Link from 'next/link'
import { HUB_IDS, HUBS, hubPreview, hubVerdicts } from '@/lib/debates'
import { formatEventDate, type MatchupWithVerdict } from '@/lib/matchups'
import { verdictHeadline } from '@/lib/verdict'

/**
 * Homepage block (server-rendered): the "This week" timed-matchup slot and
 * links into the debate hubs. Passed to HomeClient as a slot.
 */
export default function HomeDebates({
  thisWeek,
  next,
}: {
  thisWeek: MatchupWithVerdict[]
  next: MatchupWithVerdict | null
}) {
  const slot = thisWeek.length > 0 ? thisWeek : next ? [next] : []
  return (
    <>
      {slot.length > 0 && (
        <section className="mt-14" aria-labelledby="this-week-heading">
          <h2
            id="this-week-heading"
            className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-3 text-center"
          >
            {thisWeek.length > 0 ? 'This week' : 'Next up'}
          </h2>
          <ul className="grid gap-2 md:grid-cols-2">
            {slot.map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/vs/${m.slug}`}
                  className="flex h-full flex-col gap-1 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 transition-colors hover:border-amber-400"
                >
                  <span className="text-xs font-medium text-amber-800">
                    {m.event} · {formatEventDate(m)}
                  </span>
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm text-slate-800">
                      {m.verdict.item_a} <span className="text-slate-400">vs</span> {m.verdict.item_b}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-emerald-700">
                      {verdictHeadline(m.verdict)} →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-center text-xs">
            <Link href="/matchups" className="text-slate-500 hover:text-emerald-700">
              All timed matchups →
            </Link>
          </p>
        </section>
      )}

      <section className="mt-14" aria-labelledby="hubs-heading">
        <h2 id="hubs-heading" className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 text-center">
          Debates, settled
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {HUB_IDS.map((id) => {
            const top = hubPreview(id, 1)[0]
            return (
              <Link
                key={id}
                href={`/debates/${id}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-emerald-400 hover:bg-emerald-50/50"
              >
                <span className="block text-sm font-semibold text-slate-900">{HUBS[id].name}</span>
                {top && (
                  <span className="block truncate text-xs text-slate-500">
                    {top.item_a} vs {top.item_b} · {hubVerdicts(id).length} verdicts
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </section>
    </>
  )
}
