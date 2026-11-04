import { describe, expect, it } from 'vitest'
import sitemap from '@/app/sitemap'
import robots from '@/app/robots'
import { GET as llms } from '@/app/llms.txt/route'
import { GET as markdown } from '@/app/api/md/[slug]/route'
import { allStaticVerdicts } from '@/lib/debates'
import { citationsFor, toMarkdown } from '@/lib/verdict'
import nextConfig from '../next.config.mjs'

const vsUrls = async () =>
  (await sitemap()).map((e) => e.url).filter((u) => u.startsWith('https://disordat.org/vs/'))

describe('/llms.txt', () => {
  it('lists every /vs/ URL in the sitemap, with its markdown twin', async () => {
    const body = await (await llms()).text()
    const urls = await vsUrls()
    expect(urls.length).toBeGreaterThanOrEqual(140)
    for (const u of urls) {
      expect(body, u).toContain(`](${u})`)
      expect(body, u).toContain(`${u}.md`)
    }
  })

  it('opens with the one-paragraph description and the hubs', async () => {
    const body = await (await llms()).text()
    expect(body.startsWith('# disordat\n\n> disordat gives an honest, dated verdict')).toBe(true)
    expect(body).toContain('https://disordat.org/debates/goat')
    expect(body).toMatch(/\(updated \d{4}-\d{2}-\d{2}; markdown: /)
  })
})

describe('markdown twins', () => {
  it('returns 200 text/markdown for every verdict in the sitemap', async () => {
    for (const u of await vsUrls()) {
      const slug = u.split('/vs/')[1]
      const res = await markdown(new Request(`${u}.md`), { params: { slug } })
      expect(res.status, slug).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/markdown')
      expect(res.headers.get('link')).toBe(`<${u}>; rel="canonical"`)
    }
  })

  it('404s for unknown slugs', async () => {
    const res = await markdown(new Request('https://disordat.org/vs/a-vs-b.md'), { params: { slug: 'nope-vs-nothing' } })
    expect(res.status).toBe(404)
  })

  it('carries the verdict, the date, the table and the citation', () => {
    const v = allStaticVerdicts()[0]
    const md = toMarkdown(v)
    expect(md).toContain(`# ${v.question}`)
    expect(md).toContain('as of November 4, 2026')
    expect(md).toContain('| Category |')
    expect(md).toContain(`Canonical URL: https://disordat.org/vs/${v.slug}`)
    expect(md).toContain(citationsFor(v).apa)
  })

  it('is routed from /vs/<slug>.md ahead of the page route', async () => {
    const rewrites = await (nextConfig as { rewrites: () => Promise<{ beforeFiles: { source: string; destination: string }[] }> }).rewrites()
    expect(rewrites.beforeFiles).toContainEqual({ source: '/vs/:slug([a-z0-9-]+)\\.md', destination: '/api/md/:slug' })
  })
})

describe('citations', () => {
  it('are dated and point at the canonical URL', () => {
    const v = allStaticVerdicts().find((x) => x.slug === 'batman-vs-superman')!
    const c = citationsFor(v)
    expect(c.apa).toBe(
      `disordat. (2026, November 4). ${v.question} [Batman vs Superman verdict]. https://disordat.org/vs/batman-vs-superman`,
    )
    expect(c.mla).toBe(`“${v.question}” disordat, 4 Nov. 2026, disordat.org/vs/batman-vs-superman.`)
  })
})

describe('robots.txt', () => {
  it('explicitly allows the main AI crawlers', () => {
    const rules = robots().rules
    const list = Array.isArray(rules) ? rules : [rules]
    const agents = list.flatMap((r) => (Array.isArray(r.userAgent) ? r.userAgent : [r.userAgent]))
    for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) expect(agents).toContain(bot)
  })
})
