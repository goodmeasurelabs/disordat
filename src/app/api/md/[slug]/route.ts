import { getComparison } from '@/lib/comparisons'
import { HUBS, hubForSlug } from '@/lib/debates'
import { SITE_URL, toMarkdown, verdictUrl } from '@/lib/verdict'

export const runtime = 'nodejs'

/**
 * Markdown twin of /vs/<slug>. Reached as /vs/<slug>.md via the rewrite in
 * next.config.mjs; the HTML page links to it with rel="alternate".
 */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug
  const c = await getComparison(slug)
  if (!c) {
    return new Response(`# Not found\n\nNo verdict at ${verdictUrl(slug)}. Start one at ${SITE_URL}\n`, {
      status: 404,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    })
  }
  const hub = hubForSlug(slug)
  const body = toMarkdown(c, hub ? { hubName: HUBS[hub].name, hubUrl: `${SITE_URL}/debates/${hub}` } : {})
  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Link: `<${verdictUrl(slug)}>; rel="canonical"`,
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  })
}
