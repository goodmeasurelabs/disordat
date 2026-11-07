import { buildComparisonSlug } from './slug'

// Where a request should live, or null when it's already right. Comparison slugs are
// alphabetical and lowercase ("batman-vs-superman"), but links and old URLs arrive
// reversed, capitalised or with spaces; each of those 404'd. Redirect them instead.
export function canonicalPath(pathname: string): string | null {
  if (pathname === '/vs') return '/matchups'
  const m = /^\/vs\/([^/]+)$/.exec(pathname)
  if (!m || m[1].endsWith('.md')) return null
  let raw = m[1]
  try { raw = decodeURIComponent(raw) } catch { return null }
  const parts = raw.toLowerCase().replace(/[\s_+]+/g, '-').split('-vs-')
  // Only an unambiguous "<a>-vs-<b>"; an item that itself contains "vs" is left alone.
  if (parts.length !== 2) return null
  const slug = buildComparisonSlug(parts[0].replace(/-/g, ' '), parts[1].replace(/-/g, ' '))
  return slug && slug !== m[1] ? `/vs/${slug}` : null
}
