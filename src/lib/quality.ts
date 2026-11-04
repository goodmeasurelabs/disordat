/**
 * Quality gate for user-generated verdicts. Anyone can type two things, so
 * the Redis cache holds some test pairs ("nope vs yep"). Those stay reachable
 * at their URL but are kept off the homepage, the sitemap and /llms.txt, and
 * are marked noindex.
 */
import type { StoredComparison } from '@/lib/comparisons'
import { isNonsense } from '@/lib/normalize'

const JUNK_WORDS = new Set([
  'a', 'b', 'x', 'y', 'yes', 'no', 'yep', 'nope', 'yeah', 'nah', 'ok', 'okay',
  'test', 'testing', 'asdf', 'qwerty', 'idk', 'lol', 'foo', 'bar', 'this', 'that',
  'dis', 'dat', 'something', 'nothing', 'thing', 'stuff', 'hi', 'hello',
])

/** Explicitly hidden slugs (reviewed by hand). */
const BLOCKED_SLUGS = new Set(['nope-vs-yep'])

/** Typos in stored item names, fixed wherever we list them. */
const DISPLAY_FIXES: Record<string, string> = {
  'Luis CK': 'Louis CK',
}

function junkItem(s: string): boolean {
  const t = s.trim().toLowerCase()
  return t.length < 2 || JUNK_WORDS.has(t) || isNonsense(s)
}

export function isJunkComparison(c: Pick<StoredComparison, 'slug' | 'item_a' | 'item_b'>): boolean {
  return BLOCKED_SLUGS.has(c.slug) || junkItem(c.item_a) || junkItem(c.item_b)
}

/** Good enough to promote on the homepage: not junk, and it actually picks a side. */
export function isTrendable(c: StoredComparison): boolean {
  return !isJunkComparison(c) && c.winner !== 'tie'
}

export function displayName(s: string): string {
  return DISPLAY_FIXES[s.trim()] ?? s
}
