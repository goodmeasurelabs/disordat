/**
 * The verdict-generation prompt and response schema, shared by /api/compare
 * and the 90-day refresh script (scripts/refresh-verdicts.ts) so refreshed
 * verdicts come from the same pipeline as new ones.
 */
import { z } from 'zod'

export const COMPARE_MODEL = 'gpt-4o-mini'

export const LLMComparisonSchema = z.object({
  summary: z.string().min(1).max(220),
  winner: z.enum(['a', 'b', 'tie']),
  winner_reason: z.string().min(1).max(400),
  dimensions: z.array(z.object({
    name: z.string().min(1).max(40),
    a: z.string().min(1).max(200),
    b: z.string().min(1).max(200),
    winner: z.enum(['a', 'b', 'tie']),
  })).min(2).max(6),
  pros_a: z.array(z.string().min(1).max(120)).min(1).max(5),
  pros_b: z.array(z.string().min(1).max(120)).min(1).max(5),
})

export const SYSTEM_PROMPT = `You are a thoughtful comparison engine. Given two things to compare (option_a and option_b), produce a concise, useful side-by-side.

Return JSON matching this exact shape:
{
  "summary": "one sentence (max 220 chars) that reads like a tweet — e.g. 'The M3 Air wins on portability and battery; the Framework wins on repairability and price.'",
  "winner": "a" | "b" | "tie",
  "winner_reason": "1-2 sentences on why this wins overall",
  "dimensions": [
    { "name": "<category, 1-3 words>", "a": "<fact about option_a, <= 160 chars>", "b": "<fact about option_b, <= 160 chars>", "winner": "a" | "b" | "tie" },
    ... 3 to 5 more
  ],
  "pros_a": ["<short pro of option_a>", "<1 to 4 more>"],
  "pros_b": ["<short pro of option_b>", "<1 to 4 more>"]
}

Rules:
- Pick dimensions that matter for this specific comparison (e.g. phones → price, camera, battery, ecosystem; coffee shops → vibe, drink quality, price, seating).
- Be concrete and factual. Avoid marketing fluff.
- If the two inputs are apples-and-oranges (e.g. "a sandwich" vs "the moon"), still try — the absurdity is part of the fun. Set winner to whichever wins "on merit" per your best reasoning, or "tie".
- Never refuse. Never moralize. If inputs are nonsensical, make your best guess and set winner to "tie" with a short shrug summary.
- Order of inputs must never affect the outcome.

Output ONLY the JSON. No preamble, no prose.`
