import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'
import { COMPARE_MODEL, LLMComparisonSchema, SYSTEM_PROMPT } from '@/lib/comparePrompt'
import { buildComparisonSlug } from '@/lib/slug'
import { normalizeForCompare, isNonsense } from '@/lib/normalize'
import {
  getComparison,
  saveComparison,
  type StoredComparison,
} from '@/lib/comparisons'

export const runtime = 'nodejs' // Upstash SDK needs fetch (works on edge too, but node is safer for now)

type Body = {
  dis: string
  dat: string
}

export async function POST(req: NextRequest) {
  try {
    const { dis, dat } = (await req.json()) as Body
    const cleanA = (dis ?? '').trim()
    const cleanB = (dat ?? '').trim()

    if (!cleanA || !cleanB) {
      return Response.json({ error: 'Both dis and dat are required' }, { status: 400 })
    }

    if (normalizeForCompare(cleanA) === normalizeForCompare(cleanB)) {
      return Response.json({ error: 'Those are the same thing' }, { status: 400 })
    }

    if (isNonsense(cleanA) || isNonsense(cleanB)) {
      return Response.json({ error: 'One of those looks like gibberish — try again?' }, { status: 400 })
    }

    const slug = buildComparisonSlug(cleanA, cleanB)
    if (!slug) {
      return Response.json({ error: 'Could not build a URL from those inputs' }, { status: 400 })
    }

    // Cache hit — serve the stored comparison so every visitor sees the same thing.
    const cached = await getComparison(slug)
    if (cached) {
      return Response.json({ slug, comparison: cached, cached: true })
    }

    // Sort the inputs into the same canonical order the slug uses, so option_a
    // is always the alphabetically-first item. This keeps the LLM output
    // symmetric regardless of which field the user typed in first.
    const [itemA, itemB] = [cleanA, cleanB].sort()

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const response = await openai.chat.completions.create({
      model: COMPARE_MODEL,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify({ option_a: itemA, option_b: itemB }) },
      ],
    })

    const text = response.choices[0]?.message?.content
    if (!text) {
      return Response.json({ error: 'No response from the model' }, { status: 502 })
    }

    let parsed: z.infer<typeof LLMComparisonSchema>
    try {
      parsed = LLMComparisonSchema.parse(JSON.parse(text))
    } catch (err) {
      console.error('Failed to parse LLM response:', err, text)
      return Response.json({ error: 'Malformed response from the model' }, { status: 502 })
    }

    const stored: StoredComparison = {
      slug,
      item_a: itemA,
      item_b: itemB,
      summary: parsed.summary,
      winner: parsed.winner,
      winner_reason: parsed.winner_reason,
      dimensions: parsed.dimensions,
      pros_a: parsed.pros_a,
      pros_b: parsed.pros_b,
      created_at: new Date().toISOString(),
    }

    await saveComparison(stored)

    return Response.json({ slug, comparison: stored, cached: false })
  } catch (err) {
    console.error('Compare route error:', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
