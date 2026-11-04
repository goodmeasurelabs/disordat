import { NextRequest } from 'next/server'
import { getComparison } from '@/lib/comparisons'
import {
  agreePercent,
  getVotes,
  isVoteSide,
  recordVote,
  voteCookieName,
  type VoteCounts,
} from '@/lib/votes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*-vs-[a-z0-9]+(?:-[a-z0-9]+)*$/

function payload(slug: string, counts: VoteCounts | null, extra: Record<string, unknown> = {}) {
  return {
    slug,
    available: counts !== null,
    agree: counts?.agree ?? 0,
    disagree: counts?.disagree ?? 0,
    // The voter always sees the split after voting, even with few votes.
    agree_percent: agreePercent(counts, 1),
    ...extra,
  }
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') ?? ''
  if (!SLUG_RE.test(slug)) return Response.json({ error: 'Bad slug' }, { status: 400 })
  const counts = await getVotes(slug)
  const voted = req.cookies.get(voteCookieName(slug))?.value
  return Response.json(payload(slug, counts, { voted: isVoteSide(voted) ? voted : null }), {
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function POST(req: NextRequest) {
  let body: { slug?: unknown; vote?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const slug = typeof body.slug === 'string' ? body.slug : ''
  const vote = body.vote
  if (!SLUG_RE.test(slug) || !isVoteSide(vote)) {
    return Response.json({ error: 'Send { slug, vote: "agree" | "disagree" }' }, { status: 400 })
  }

  const cookie = voteCookieName(slug)
  const previous = req.cookies.get(cookie)?.value
  if (isVoteSide(previous)) {
    const counts = await getVotes(slug)
    return Response.json(payload(slug, counts, { voted: previous, duplicate: true }), { status: 409 })
  }

  // Only count votes on verdicts that exist, so junk keys can't pile up.
  if (!(await getComparison(slug))) {
    return Response.json({ error: 'Unknown verdict' }, { status: 404 })
  }

  const counts = await recordVote(slug, vote)
  if (!counts) {
    return Response.json(payload(slug, null, { voted: null }), { status: 503 })
  }

  const res = Response.json(payload(slug, counts, { voted: vote }))
  res.headers.append(
    'Set-Cookie',
    `${cookie}=${vote}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax; HttpOnly; Secure`,
  )
  return res
}
