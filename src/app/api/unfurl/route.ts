import { NextRequest } from 'next/server'
import { productUrl } from '@/lib/productUrl'

export const runtime = 'nodejs'

// Domain-specific noise strippers. Add more as needed.
const DOMAIN_BOILERPLATE: Array<[RegExp, RegExp]> = [
  [/bestbuy\./i, /\s*[:|—–\-]\s*best\s*buy.*$/i],
  [/target\./i, /\s*[:|—–\-]\s*target.*$/i],
  [/walmart\./i, /\s*[:|—–\-]\s*walmart.*$/i],
  [/ebay\./i, /\s*[:|—–\-]\s*ebay.*$/i],
  [/bhphotovideo\./i, /\s*[|]\s*b&h\s*photo.*$/i],
  [/apple\.com/i, /\s*[-–—]\s*apple.*$/i],
]

const AMAZON_HOST = /^(?:www\.|smile\.|m\.)?amazon\.(?:com(?:\.(?:au|be|br|mx|tr))?|co\.(?:jp|uk|za)|ae|ca|cn|de|eg|es|fr|ie|in|it|nl|pl|sa|se|sg)$/i

function amazonProduct(url: URL) {
  if (!AMAZON_HOST.test(url.hostname)) return null
  const parts = url.pathname.match(/^\/(?:([^/]+)\/)?(?:dp|gp\/product)\/([a-z0-9]{10})(?:\/|$)/i)
  if (!parts) return null

  let fallbackTitle: string | null = null
  try {
    const words = decodeURIComponent(parts[1] ?? '').split('-').filter(Boolean)
    if (words.length >= 2 && words.every(word => /^[\p{L}\p{N}]+$/u.test(word)) && words.some(word => /\p{L}{2}/u.test(word))) {
      fallbackTitle = cleanTitle(words.join(' '), url.hostname)
    }
  } catch {
    // A malformed descriptive path can still identify a product by ASIN.
  }
  return { url: new URL(`/dp/${parts[2]}`, url.origin), fallbackTitle }
}

function extractTitle(html: string): string | null {
  // Prefer og:title
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)
  if (og?.[1]) return og[1].trim()

  // Then twitter:title
  const tw = html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:title["']/i)
  if (tw?.[1]) return tw[1].trim()

  // Fallback to <title>
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (t?.[1]) return t[1].replace(/\s+/g, ' ').trim()

  return null
}

function cleanTitle(raw: string, host: string): string {
  // HTML entity decode for the common ones
  let t = raw
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (AMAZON_HOST.test(host)) {
    t = t.replace(/^amazon\.[a-z.]+\s*[:|]\s*/i, '').replace(/\s*[:|—–-]\s*amazon(?:\.[a-z.]+)?$/i, '').trim()
  }
  // Strip domain-specific boilerplate suffixes
  for (const [hostPattern, stripPattern] of DOMAIN_BOILERPLATE) {
    if (hostPattern.test(host)) {
      t = t.replace(stripPattern, '').trim()
      break
    }
  }

  // Cap length so a giant product title doesn't break the UI
  if (t.length > 120) t = t.slice(0, 120).replace(/\s+\S*$/, '') + '…'
  return t
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (typeof url !== 'string' || !url.trim()) {
      return Response.json({ error: 'Missing url' }, { status: 400 })
    }

    const normalized = productUrl(url)
    if (!normalized) return Response.json({ error: 'Not a valid web address' }, { status: 400 })
    const parsed = new URL(normalized)
    if (parsed.username || parsed.password) {
      return Response.json({ error: 'Use a public product link' }, { status: 400 })
    }
    const product = amazonProduct(parsed)
    function fallbackOrError(error: string, status: number) {
      return product?.fallbackTitle
        ? Response.json({ title: product.fallbackTitle, host: parsed.host })
        : Response.json({ error }, { status })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)

    let html: string
    try {
      const res = await fetch((product?.url ?? parsed).href, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          // Many sites (Amazon, Best Buy) 503 without a realistic UA
          'User-Agent': 'Mozilla/5.0 (compatible; disordat-unfurl/1.0; +https://disordat.org)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })
      if (!res.ok) {
        return fallbackOrError(`Couldn't read that page (${res.status})`, 502)
      }
      // Cap at ~2MB to avoid pulling in a giant product page
      const reader = res.body?.getReader()
      if (!reader) {
        html = await res.text()
      } else {
        const chunks: Uint8Array[] = []
        let total = 0
        const max = 2 * 1024 * 1024
        while (total < max) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
          total += value.byteLength
        }
        html = new TextDecoder('utf-8').decode(
          new Uint8Array((() => {
            const merged = new Uint8Array(Math.min(total, max))
            let offset = 0
            for (const c of chunks) {
              if (offset + c.byteLength > max) {
                merged.set(c.slice(0, max - offset), offset)
                break
              }
              merged.set(c, offset)
              offset += c.byteLength
            }
            return merged
          })()),
        )
      }
    } catch (err: unknown) {
      const msg = err instanceof Error && err.name === 'AbortError' ? 'timed out' : 'fetch failed'
      return fallbackOrError(`Couldn't read that page (${msg})`, 502)
    } finally {
      clearTimeout(timeout)
    }

    const productName = product && html.match(/<span\b[^>]*\bid=["']productTitle["'][^>]*>([^<]+)<\/span>/i)?.[1]
    const rawTitle = productName || extractTitle(html)
    if (!rawTitle) {
      return fallbackOrError('No title found on that page', 422)
    }

    const title = cleanTitle(rawTitle, parsed.hostname)
    const unavailableTitle = /^(?:robot check|access denied|just a moment[.\u2026]*|service unavailable|sorry!?|page not found)$/i
    const amazonLandingTitle = /^(?:amazon(?:\.[a-z.]+)?(?:\s+(?:sign[- ]in|captcha)|\s*[-:]\s*(?:something went wrong|page not found))?|online shopping for .*)$/i
    if (!title || unavailableTitle.test(title) || (product && amazonLandingTitle.test(title))) {
      return fallbackOrError('Could not extract a usable title', 422)
    }

    return Response.json({ title, host: parsed.host })
  } catch (err) {
    console.error('Unfurl error:', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
