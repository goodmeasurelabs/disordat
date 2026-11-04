'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { trackRemixStart, trackVerdictVote } from '@/lib/analytics'

type Side = 'agree' | 'disagree'

interface VoteState {
  available: boolean
  agree: number
  disagree: number
  agree_percent: number | null
  voted: Side | null
}

interface Props {
  slug: string
  itemA: string
  itemB: string
  /** "Coke wins" or "Too close to call". */
  headline: string
}

const LOCAL_KEY = (slug: string) => `disordat_vote_${slug}`

function readLocal(slug: string): Side | null {
  try {
    const v = localStorage.getItem(LOCAL_KEY(slug))
    return v === 'agree' || v === 'disagree' ? v : null
  } catch {
    return null
  }
}

/**
 * Agree / disagree with the verdict. One vote per browser (server-side cookie,
 * mirrored in localStorage). Counts are stored server-side; the split is shown
 * only after you vote, so it can't anchor your answer.
 */
export default function VerdictVote({ slug, itemA, itemB, headline }: Props) {
  const [state, setState] = useState<VoteState | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let cancelled = false
    const local = readLocal(slug)
    fetch(`/api/vote?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: VoteState | null) => {
        if (cancelled) return
        setState(
          data
            ? { ...data, voted: data.voted ?? local }
            : { available: false, agree: 0, disagree: 0, agree_percent: null, voted: local },
        )
      })
      .catch(() => {
        if (!cancelled) setState({ available: false, agree: 0, disagree: 0, agree_percent: null, voted: local })
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  async function vote(side: Side) {
    if (pending || state?.voted) return
    setPending(true)
    trackVerdictVote({ vote: side, slug })
    try {
      localStorage.setItem(LOCAL_KEY(slug), side)
    } catch {
      /* private mode */
    }
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, vote: side }),
      })
      const data = (await res.json()) as VoteState
      setState({ ...data, voted: data.voted ?? side })
    } catch {
      setState((s) => ({ ...(s ?? { available: false, agree: 0, disagree: 0, agree_percent: null }), voted: side }))
    } finally {
      setPending(false)
    }
  }

  const voted = state?.voted ?? null
  const total = (state?.agree ?? 0) + (state?.disagree ?? 0)
  const remixHref = `/?dis=${encodeURIComponent(itemA)}&dat=${encodeURIComponent(itemB)}`

  return (
    <div className="mt-5 border-t border-emerald-100 pt-4" data-testid="verdict-vote">
      {!voted ? (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-sm font-medium text-slate-700">
            Do you agree? <span className="text-slate-500">({headline})</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => vote('agree')}
              disabled={pending || state === null}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-60"
            >
              <span aria-hidden="true">👍</span> Agree
            </button>
            <button
              onClick={() => vote('disagree')}
              disabled={pending || state === null}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60"
            >
              <span aria-hidden="true">👎</span> Disagree
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2" aria-live="polite">
          {state?.available && state.agree_percent !== null ? (
            <>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold text-slate-900">{state.agree_percent}% agree</span>
                <span className="text-slate-500">
                  {total} {total === 1 ? 'vote' : 'votes'} · you {voted === 'agree' ? 'agreed' : 'disagreed'}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-rose-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${state.agree_percent}%` }} />
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-600">
              Thanks — you {voted === 'agree' ? 'agreed' : 'disagreed'}. The tally will show here once votes are counted.
            </p>
          )}
        </div>
      )}
      <p className="mt-3 text-center text-sm sm:text-left">
        <Link
          href={remixHref}
          onClick={() => trackRemixStart({ slug })}
          className="font-medium text-emerald-700 underline-offset-2 hover:underline"
        >
          Disagree? Make your own verdict →
        </Link>
      </p>
    </div>
  )
}
