/**
 * Agree/disagree votes on a verdict. Stored in the Upstash Redis database the
 * site already uses for comparisons (hash `votes:<slug>`), so no new storage.
 * Without Redis (local dev, tests) votes are simply unavailable.
 */
import { hasRedis, redis } from '@/lib/comparisons'

export type VoteSide = 'agree' | 'disagree'

export interface VoteCounts {
  agree: number
  disagree: number
}

/** Don't print a percentage (on the page or the share card) below this many votes. */
export const MIN_VOTES_TO_SHOW = 3

const key = (slug: string) => `votes:${slug}`

export function isVoteSide(v: unknown): v is VoteSide {
  return v === 'agree' || v === 'disagree'
}

/** Cookie that marks "this browser already voted on this verdict". */
export function voteCookieName(slug: string): string {
  return `dv_${slug}`.slice(0, 120)
}

export async function getVotes(slug: string): Promise<VoteCounts | null> {
  if (!hasRedis()) return null
  try {
    const h = await redis().hgetall<Record<string, number | string>>(key(slug))
    return { agree: Number(h?.agree ?? 0), disagree: Number(h?.disagree ?? 0) }
  } catch (err) {
    console.error('getVotes failed:', err)
    return null
  }
}

export async function recordVote(slug: string, side: VoteSide): Promise<VoteCounts | null> {
  if (!hasRedis()) return null
  try {
    await redis().hincrby(key(slug), side, 1)
    return await getVotes(slug)
  } catch (err) {
    console.error('recordVote failed:', err)
    return null
  }
}

/** Share of votes that agree with the verdict, 0-100, or null if too few votes. */
export function agreePercent(v: VoteCounts | null, min = MIN_VOTES_TO_SHOW): number | null {
  if (!v) return null
  const total = v.agree + v.disagree
  if (total < Math.max(1, min)) return null
  return Math.round((v.agree / total) * 100)
}
