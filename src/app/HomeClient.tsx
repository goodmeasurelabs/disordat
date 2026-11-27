'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { productUrl } from '@/lib/productUrl'
import { trackDecision, trackGenieInteraction, trackToolUse } from '@/lib/analytics'
import { addRecentComparison, getRecentComparisons, type RecentComparison } from '@/lib/recentComparisons'

// A generous pool. We show a few at a time and shuffle to show more.
// Tilted toward real purchase decisions — that's the sharpest use case.
const EXAMPLE_POOL: Array<[string, string]> = [
  // Tech / purchase
  ['MacBook Air M3', 'Framework Laptop 13'],
  ['iPhone 15 Pro', 'Pixel 8 Pro'],
  ['Sony WH-1000XM5', 'Bose QuietComfort Ultra'],
  ['Kindle Paperwhite', 'Boox Go 10.3'],
  ['Roomba j9+', 'Shark Matrix'],
  ['AirPods Pro 2', 'Beats Fit Pro'],
  ['Tesla Model Y', 'Hyundai Ioniq 5'],
  ['Tesla Model 3', 'Toyota Prius'],
  ['iPad Air', 'iPad Pro'],
  ['Apple Watch Ultra', 'Garmin Fenix 7'],
  ['Steam Deck OLED', 'ROG Ally X'],
  ['PS5', 'Xbox Series X'],
  // Life decisions
  ['Rent in the city', 'Buy in the suburbs'],
  ['Remote job', 'In-office job'],
  ['Adopt a cat', 'Adopt a dog'],
  ['CrossFit', 'Orangetheory'],
  ['Gym membership', 'Peloton'],
  // Food & drink
  ['New York pizza', 'Chicago deep dish'],
  ['In-N-Out', 'Shake Shack'],
  ['Chipotle', 'Cava'],
  ['Starbucks', 'Local third-wave coffee'],
  ['Sushi', 'Ramen'],
  // Travel / places
  ['Tokyo', 'Seoul'],
  ['Lisbon', 'Barcelona'],
  ['Banff', 'Yellowstone'],
  ['Iceland', 'New Zealand'],
  ['Brooklyn', 'Queens'],
  // People / sports
  ['Lionel Messi', 'Cristiano Ronaldo'],
  ['LeBron James', 'Michael Jordan'],
  ['Serena Williams', 'Steffi Graf'],
  ['Paul Skenes', 'Stephen Strasburg'],
  // Media / fictional
  ['Marvel', 'DC'],
  ['Lord of the Rings', 'Game of Thrones'],
  ['Succession', 'Mad Men'],
  ['Minecraft', 'Roblox'],
  // Services / subscriptions
  ['Notion', 'Obsidian'],
  ['Spotify', 'Apple Music'],
  ['Netflix', 'Max'],
  ['ChatGPT Plus', 'Claude Pro'],
  ['Linear', 'Jira'],
]

// Kept small so the row sits directly under the inputs, above the fold.
const VISIBLE_EXAMPLES = 4

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

async function readProductTitle(url: string) {
  try {
    const res = await fetch('/api/unfurl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    const data = await res.json()
    const title = typeof data.title === 'string' ? data.title.trim() : ''
    if (res.ok && title && !productUrl(title)) {
      trackToolUse('unfurl', 'success', data.host)
      return { title, host: typeof data.host === 'string' ? data.host : '' }
    }
    trackToolUse('unfurl', 'failed', data.error)
  } catch {
    trackToolUse('unfurl', 'failed')
  }
  return null
}

function useComparisonField() {
  const [field, setField] = useState({ value: '', source: '', busy: false, failed: false })
  const lookup = useRef<Promise<string | null> | null>(null)

  const edit = useCallback((value: string) => {
    lookup.current = null
    setField({ value, source: '', busy: false, failed: false })
  }, [])

  function resolve(input: string) {
    const value = input.trim()
    const url = productUrl(value)
    if (!url) return value
    if (lookup.current) return lookup.current

    setField({ value, source: '', busy: true, failed: false })
    // A blur and the ensuing submit share this request. Editing the field
    // clears the reference so a late response cannot replace the new value.
    const request: Promise<string | null> = readProductTitle(url).then((product) => {
      if (lookup.current !== request) return null
      if (!product) {
        lookup.current = null
        setField({ value, source: '', busy: false, failed: true })
        return null
      }
      setField({ value: product.title, source: product.host, busy: false, failed: false })
      return product.title
    })
    lookup.current = request
    return request
  }

  return [field, edit, resolve] as const
}

export interface TrendingItem {
  slug: string
  item_a: string
  item_b: string
  winner_label: string
}

export default function HomeClient({
  trending = [],
  extra,
}: {
  trending?: TrendingItem[]
  /** Server-rendered block (timed matchups + debate hubs) shown under Trending. */
  extra?: React.ReactNode
}) {
  const router = useRouter()
  const [dis, setDis, resolveDis] = useComparisonField()
  const [dat, setDat, resolveDat] = useComparisonField()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recent, setRecent] = useState<RecentComparison[]>([])
  // Start with the first N of the pool (deterministic so SSR and client agree).
  // Shuffling happens on explicit user click to avoid hydration mismatch.
  const [visibleExamples, setVisibleExamples] = useState<Array<[string, string]>>(
    () => EXAMPLE_POOL.slice(0, VISIBLE_EXAMPLES),
  )

  useEffect(() => {
    const refresh = () => setRecent(getRecentComparisons())
    refresh()
    window.addEventListener('recent-comparisons-updated', refresh)
    return () => window.removeEventListener('recent-comparisons-updated', refresh)
  }, [])

  // `pair` lets example buttons submit immediately, before setDis/setDat have re-rendered.
  async function compare(e?: React.FormEvent, pair?: [string, string]) {
    e?.preventDefault()
    if (loading) return
    setError(null)

    const [a, b] = pair ?? [dis.value, dat.value]
    if (!a.trim() || !b.trim()) return

    setLoading(true)
    try {
      const [resolvedDis, resolvedDat] = await Promise.all([resolveDis(a), resolveDat(b)])
      if (!resolvedDis || !resolvedDat) {
        setLoading(false)
        return
      }
      trackGenieInteraction('decision_requested')
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dis: resolvedDis, dat: resolvedDat }),
      })
      const data = await res.json()
      if (!res.ok || !data.slug) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      const c = data.comparison
      const winnerLabel =
        c.winner === 'tie' ? 'Too close to call' : c.winner === 'a' ? c.item_a : c.item_b

      addRecentComparison({
        slug: data.slug,
        item_a: c.item_a,
        item_b: c.item_b,
        winner_label: winnerLabel,
        created_at: Date.now(),
      })
      trackDecision(c.item_a, c.item_b, c.winner)
      trackToolUse('compare', 'submit', data.cached ? 'cached' : 'new')

      router.push(`/vs/${data.slug}`)
    } catch (err) {
      console.error(err)
      setError('Network error. Try again?')
      setLoading(false)
    }
  }

  // "Disagree? Make your own verdict" links land here as /?dis=…&dat=…
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const preDis = params.get('dis')
    const preDat = params.get('dat')
    if (preDis) setDis(preDis.slice(0, 200))
    if (preDat) setDat(preDat.slice(0, 200))
    if (preDis || preDat) trackToolUse('compare', 'prefill', 'remix')
  }, [setDis, setDat])

  const disabled = loading || !dis.value.trim() || !dat.value.trim()
  let linkError = ''
  if (dis.failed && dat.failed) linkError = 'Couldn’t read either product link. Enter both product names to compare them.'
  else if (dis.failed) linkError = 'Couldn’t read the first product link. Enter its product name or retry.'
  else if (dat.failed) linkError = 'Couldn’t read the second product link. Enter its product name or retry.'

  return (
    <main className="min-h-dvh bg-gradient-to-b from-emerald-50 via-white to-white text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        {/* Hero */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-4">
            settle the debate
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">disordat</h1>
          <p className="mt-4 text-lg md:text-xl text-slate-600 max-w-xl mx-auto leading-relaxed">
            Type the two sides of any argument. Get a dated verdict with a winner and the reasons —
            and a card you can drop in the group chat.
          </p>
        </header>

        {/* Inputs */}
        <form id="compare-options" onSubmit={compare} className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
          <InputField
            value={dis.value}
            onChange={setDis}
            onBlur={resolveDis}
            disabled={loading}
            busy={dis.busy}
            source={dis.source}
            placeholder="this… (or paste a product URL)"
          />
          <div className="flex items-center justify-center text-sm font-semibold text-slate-400 uppercase tracking-widest">
            vs
          </div>
          <InputField
            value={dat.value}
            onChange={setDat}
            onBlur={resolveDat}
            disabled={loading}
            busy={dat.busy}
            source={dat.source}
            placeholder="…or that"
          />
        </form>

        {/* One-tap examples: fill both fields and run the verdict immediately */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              or try one
            </p>
            <button
              onClick={() => {
                setVisibleExamples(shuffle(EXAMPLE_POOL).slice(0, VISIBLE_EXAMPLES))
                trackGenieInteraction('examples_shuffled')
              }}
              className="inline-flex items-center gap-1 rounded-full text-xs font-medium text-slate-500 hover:text-emerald-700 transition-colors"
              title="Show different examples"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3h5v5" />
                <path d="M4 20 21 3" />
                <path d="M21 16v5h-5" />
                <path d="m15 15 6 6" />
                <path d="M4 4l5 5" />
              </svg>
              Shuffle
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {visibleExamples.map(([a, b], i) => (
              <button
                key={`${a}-${b}-${i}`}
                onClick={() => {
                  setDis(a)
                  setDat(b)
                  trackGenieInteraction('example_selected')
                  trackToolUse('example', 'select', `${a} vs ${b}`)
                  compare(undefined, [a, b])
                }}
                disabled={loading}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {a} <span className="text-slate-400">vs</span> {b}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>Tip: paste an Amazon or Best Buy link and we&rsquo;ll pull the product name automatically.</span>
          </span>
        </p>

        <div className="mt-5 flex justify-center">
          <button
            type="submit"
            form="compare-options"
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {dis.busy || dat.busy ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Reading link…
              </>
            ) : loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Deciding…
              </>
            ) : (
              <>Compare →</>
            )}
          </button>
        </div>

        {(linkError || error) && (
          <p role="alert" className="mt-4 text-center text-sm text-red-600">{linkError || error}</p>
        )}

        {/* Trending — server-rendered from KV, shared across all visitors.
            Doubles as internal-link fuel for Google to crawl the /vs/ graph. */}
        {trending.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 text-center">
              Trending comparisons
            </h2>
            <ul className="grid gap-2 md:grid-cols-2">
              {trending.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/vs/${t.slug}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
                  >
                    <span className="text-sm text-slate-800 truncate">
                      {t.item_a} <span className="text-slate-400">vs</span> {t.item_b}
                    </span>
                    <span className="text-xs font-medium text-emerald-700 shrink-0">
                      {t.winner_label} →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {extra}

        {/* Why disordat */}
        <section className="mt-14 rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-sm p-6 md:p-7">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500 mb-5">
            Why not just ask ChatGPT?
          </h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 text-sm">
            <ValueProp
              title="An honest verdict"
              body="Chatbots know you&rsquo;re asking and tune the answer to please you. disordat doesn&rsquo;t know who&rsquo;s asking — it just judges the matchup on its merits."
            />
            <ValueProp
              title="The link is the point"
              body="Every comparison lives at its own URL with a rich preview. Drop it in a group chat or a DM — it shows up as a card, not a wall of text."
            />
            <ValueProp
              title="No prompt crafting"
              body="Two inputs. Go. You don&rsquo;t need to remember to ask for pros and cons, a table, or a verdict — that&rsquo;s just what you get."
            />
            <ValueProp
              title="Your decisions have a home"
              body="Every comparison is saved and indexable, so you can come back to it. Chat history disappears; this doesn&rsquo;t."
            />
          </div>
        </section>

        {/* Recent */}
        {recent.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
              Your recent comparisons
            </h2>
            <ul className="space-y-2">
              {recent.slice(0, 8).map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/vs/${r.slug}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
                  >
                    <span className="text-sm text-slate-800 truncate">
                      {r.item_a} <span className="text-slate-400">vs</span> {r.item_b}
                    </span>
                    <span className="text-xs font-medium text-emerald-700 shrink-0">
                      {r.winner_label} →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-16 text-center text-xs text-slate-400">
          Every comparison gets its own shareable page. Paste the link anywhere.
        </footer>
      </div>
    </main>
  )
}

function InputField({
  value,
  onChange,
  onBlur,
  disabled,
  busy,
  source,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  onBlur: (v: string) => void
  disabled: boolean
  busy: boolean
  source: string | null
  placeholder: string
}) {
  return (
    <div className="relative">
      <input
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 pr-11 text-base md:text-lg placeholder-slate-400 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 disabled:opacity-70"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur(e.target.value)}
        disabled={disabled}
      />
      {busy && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-600" />
      )}
      {!busy && source && (
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 font-medium"
          title={`Resolved from ${source}`}
        >
          from {source.replace(/^www\./, '')}
        </span>
      )}
    </div>
  )
}

function ValueProp({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-semibold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{body}</p>
    </div>
  )
}
