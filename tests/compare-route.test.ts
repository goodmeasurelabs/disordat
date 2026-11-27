import https from 'node:https'
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/compare/route'
import { getComparison, saveComparison } from '@/lib/comparisons'

vi.mock('@/lib/comparisons', () => ({
  getComparison: vi.fn(), saveComparison: vi.fn(),
}))

function compare(dis = 'Bose SoundLink Flex', dat = 'Marshall Emberton III') {
  return POST(new NextRequest('https://disordat.org/api/compare', {
    method: 'POST', body: JSON.stringify({ dis, dat }),
  }))
}

beforeEach(() => {
  vi.spyOn(https, 'request').mockImplementation(() => { throw new Error('Unexpected Node HTTP transport') })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

it('generates a fresh speaker comparison through the runtime fetch and saves it', async () => {
  vi.stubEnv('OPENAI_API_KEY', 'test-key')
  const verdict = {
    summary: 'A comparison of two portable speakers.', winner: 'tie', winner_reason: 'It depends on use.',
    dimensions: ['Sound', 'Portability'].map(name => ({ name, a: 'Portable', b: 'Portable', winner: 'tie' })),
    pros_a: ['Small size'], pros_b: ['Portable design'],
  }
  const fetchModel = vi.fn().mockResolvedValue(Response.json({
    choices: [{ message: { content: JSON.stringify(verdict) } }],
  }))
  vi.stubGlobal('fetch', fetchModel)
  const response = await compare()
  const result = await response.json()
  expect(response.status).toBe(200)
  expect(fetchModel).toHaveBeenCalledOnce()
  expect(result).toMatchObject({ cached: false, slug: 'bose-soundlink-flex-vs-marshall-emberton-iii' })
  expect(saveComparison).toHaveBeenCalledWith(result.comparison)

  vi.mocked(getComparison).mockResolvedValue(result.comparison)
  vi.stubEnv('OPENAI_API_KEY', '')
  expect(await (await compare('Marshall Emberton III', 'Bose SoundLink Flex')).json()).toMatchObject({
    cached: true, slug: result.slug,
  })
  expect(fetchModel).toHaveBeenCalledOnce()
})

it('reports provider unavailability without saving a result or exposing provider error details', async () => {
  vi.stubEnv('OPENAI_API_KEY', 'test-key')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
    error: { message: 'Internal provider diagnostic', code: 'invalid_api_key' },
  }, { status: 401 })))
  const response = await compare()
  expect(response.status).toBe(503)
  expect(await response.text()).toContain('temporarily unavailable')
  expect(saveComparison).not.toHaveBeenCalled()
})
