'use client'

import { useState } from 'react'
import { trackToolUse } from '@/lib/analytics'

interface Props {
  slug: string
  apa: string
  mla: string
  plain: string
  markdownHref: string
  asOf: string
}

const FORMATS = [
  { id: 'apa', label: 'APA' },
  { id: 'mla', label: 'MLA' },
  { id: 'plain', label: 'Plain text' },
] as const

type FormatId = (typeof FORMATS)[number]['id']

/** "Cite this verdict": dated citations people (and assistants) can paste. */
export default function CiteVerdict({ slug, apa, mla, plain, markdownHref, asOf }: Props) {
  const [format, setFormat] = useState<FormatId>('apa')
  const [copied, setCopied] = useState(false)
  const text = { apa, mla, plain }[format]

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      trackToolUse('cite', 'copy', `${format}:${slug}`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <section
      id="cite"
      aria-labelledby="cite-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      data-testid="cite-block"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="cite-heading" className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Cite this verdict
        </h2>
        <div className="flex gap-1" role="tablist" aria-label="Citation format">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={format === f.id}
              onClick={() => setFormat(f.id)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                format === f.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 break-words rounded-xl bg-slate-50 px-4 py-3 font-mono text-[13px] leading-relaxed text-slate-800">
        {text}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          Verdict as of {asOf} ·{' '}
          <a href={markdownHref} className="underline hover:text-emerald-700" type="text/markdown">
            Markdown version
          </a>
        </span>
        <button
          onClick={copy}
          className="rounded-full border border-slate-300 px-3 py-1 font-medium text-slate-700 hover:border-emerald-400 hover:text-emerald-700"
        >
          {copied ? 'Copied!' : 'Copy citation'}
        </button>
      </div>
    </section>
  )
}
