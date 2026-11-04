import Link from 'next/link'
import type { StoredComparison } from '@/lib/comparisons'
import { questionFor, verdictHeadline } from '@/lib/verdict'

/** A list of verdict links: the question, the winner and the one-line reason. */
export default function VerdictList({
  items,
  showSummary = true,
  note,
}: {
  items: StoredComparison[]
  showSummary?: boolean
  note?: (c: StoredComparison) => string | null
}) {
  return (
    <ul className="grid gap-2.5 md:grid-cols-2">
      {items.map((c) => (
        <li key={c.slug}>
          <Link
            href={`/vs/${c.slug}`}
            className="flex h-full flex-col gap-1 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-emerald-400 hover:bg-emerald-50/50"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="text-sm font-semibold text-slate-900">{questionFor(c)}</span>
              <span className="shrink-0 text-xs font-semibold text-emerald-700">{verdictHeadline(c)} →</span>
            </span>
            {note?.(c) && <span className="text-xs font-medium text-amber-700">{note(c)}</span>}
            {showSummary && <span className="text-xs leading-relaxed text-slate-600">{c.summary}</span>}
          </Link>
        </li>
      ))}
    </ul>
  )
}
