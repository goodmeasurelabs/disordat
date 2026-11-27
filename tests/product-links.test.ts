import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/unfurl/route'
import { productUrl } from '@/lib/productUrl'

const bose = 'amazon.com/Bose-SoundLink-Bluetooth-Waterproof-Dustproof/dp/B0D6WD2QSQ/ref=sr_1_5?crid=example&sr=8-5'
const marshall = 'https://www.amazon.com/Marshall-Emberton-Portable-Bluetooth-Waterproof/dp/B0GXH3N61Z/ref=sr_1_4?dib_tag=se&th=1'

function unfurl(url: string) {
  return POST(new NextRequest('https://disordat.org/api/unfurl', {
    method: 'POST',
    body: JSON.stringify({ url }),
  }))
}

afterEach(() => vi.unstubAllGlobals())

describe('product links', () => {
  it('recognizes addresses with and without a scheme, and leaves ordinary names alone', () => {
    expect(productUrl(bose)).toBe(`https://${bose}`)
    expect(productUrl(marshall)).toBe(marshall)
    expect(productUrl('www.example.com/item')).toBe('https://www.example.com/item')
    expect(productUrl('Bose SoundLink')).toBeNull()
    expect(productUrl('Best 2.0 Speaker')).toBeNull()
    expect(productUrl('ftp://amazon.com/dp/B0D6WD2QSQ')).toBeNull()
  })

  it('returns distinct product names from descriptive Amazon paths when the pages are unavailable', async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response('<title>Robot Check</title>'))
    vi.stubGlobal('fetch', fetchPage)
    const first = await unfurl(bose)
    const second = await unfurl(marshall)
    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(await first.json()).toEqual({ title: 'Bose SoundLink Bluetooth Waterproof Dustproof', host: 'amazon.com' })
    expect(await second.json()).toEqual({ title: 'Marshall Emberton Portable Bluetooth Waterproof', host: 'www.amazon.com' })
    expect(fetchPage.mock.calls.map(([url]) => url)).toEqual([
      'https://amazon.com/dp/B0D6WD2QSQ',
      'https://www.amazon.com/dp/B0GXH3N61Z',
    ])
  })

  it('prefers the actual product name over its path, and strips Amazon title prefixes', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response('<title>Amazon.com</title><span id="productTitle">Bose SoundLink Flex (2nd Gen)</span>'))
      .mockResolvedValueOnce(new Response('<title>Amazon.com: Marshall Emberton III</title>')))
    expect((await (await unfurl(bose)).json()).title).toBe('Bose SoundLink Flex (2nd Gen)')
    expect((await (await unfurl(marshall)).json()).title).toBe('Marshall Emberton III')
  })

  it('reports an unreadable ASIN-only URL without returning the identifier or a challenge title', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<title>Amazon.com</title>')))
    const response = await unfurl('https://www.amazon.com/dp/B0D6WD2QSQ')
    expect(response.status).toBe(422)
    expect(await response.json()).toHaveProperty('error')
  })

  it('preserves meaningful query parameters on other retail sites', async () => {
    const fetchPage = vi.fn().mockResolvedValue(new Response('<title>Portable Speaker | Best Buy</title>'))
    vi.stubGlobal('fetch', fetchPage)
    const url = 'https://www.bestbuy.com/site/item?skuId=12345'
    const response = await unfurl(url)
    expect(fetchPage.mock.calls[0][0]).toBe(url)
    expect((await response.json()).title).toBe('Portable Speaker')
  })
})
