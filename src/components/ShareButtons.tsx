'use client'

import { useEffect, useState, type ReactElement } from 'react'
import { trackShareClick } from '@/lib/analytics'

interface Props {
  url: string
  summary: string
  itemA: string
  itemB: string
  /** Comparison slug, sent with share_click so shares can be tied to a page. */
  slug?: string
  /** "Coke wins" — leads the share text so the verdict travels with the link. */
  headline?: string
}

const pill =
  'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors'
const quiet = `${pill} border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700`

export default function ShareButtons({ url, summary, itemA, itemB, slug, headline }: Props) {
  const [copied, setCopied] = useState(false)
  // navigator.share only exists in the browser (mostly on phones); render the
  // button after mount so server and client HTML match.
  const [canNativeShare, setCanNativeShare] = useState(false)
  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  const track = (method: string) =>
    trackShareClick({ method, content_type: 'comparison', content_id: url, slug })

  const lead = headline ? `${headline}: ${itemA} vs ${itemB}.` : `${itemA} vs ${itemB} —`
  const text = `${lead} ${summary}`
  const shortText = `${lead} Agree?`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      track('copy_link')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard may be blocked; silent fail is fine */
    }
  }

  const handleNativeShare = async () => {
    track('native_share')
    try {
      await navigator.share({ title: `${itemA} vs ${itemB}`, text: shortText, url })
    } catch {
      /* user cancelled */
    }
  }

  const targets: Array<{ method: string; label: string; href: string; icon: ReactElement }> = [
    {
      method: 'twitter',
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      method: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${shortText} ${url}`)}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2z" />
        </svg>
      ),
    },
    {
      method: 'reddit',
      label: 'Reddit',
      href: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(
        `${itemA} vs ${itemB}: ${headline ?? 'the verdict'}`,
      )}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M22 12.1a2.2 2.2 0 0 0-3.7-1.6 10.7 10.7 0 0 0-5.7-1.8l1-4.6 3.2.7a1.6 1.6 0 1 0 .2-1l-3.6-.8a.5.5 0 0 0-.6.4l-1.1 5.3a10.8 10.8 0 0 0-5.8 1.8 2.2 2.2 0 1 0-2.4 3.6 4.3 4.3 0 0 0 0 .7c0 3.6 4.2 6.5 9.3 6.5s9.3-2.9 9.3-6.5a4.3 4.3 0 0 0 0-.7 2.2 2.2 0 0 0 1.3-2zM7 13.6a1.6 1.6 0 1 1 1.6 1.6A1.6 1.6 0 0 1 7 13.6zm9 4.2a5.9 5.9 0 0 1-4 1.2 5.9 5.9 0 0 1-4-1.2.4.4 0 0 1 .6-.6 5 5 0 0 0 3.4 1 5 5 0 0 0 3.4-1 .4.4 0 1 1 .6.6zm-.3-2.6a1.6 1.6 0 1 1 1.6-1.6 1.6 1.6 0 0 1-1.6 1.6z" />
        </svg>
      ),
    },
    {
      method: 'bluesky',
      label: 'Bluesky',
      href: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${shortText} ${url}`)}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6.3 3.8C8.6 5.5 11 9 12 10.9c1-1.9 3.4-5.4 5.7-7.1 1.7-1.2 4.3-2.1 4.3.8 0 .6-.3 4.9-.5 5.6-.7 2.4-3.2 3-5.4 2.7 3.9.7 4.9 2.9 2.7 5.1-4 4.2-5.8-1.1-6.3-2.4l-.5-1.2-.5 1.2c-.5 1.3-2.3 6.6-6.3 2.4-2.2-2.2-1.2-4.4 2.7-5.1-2.2.3-4.7-.3-5.4-2.7C2.3 9.5 2 5.2 2 4.6c0-2.9 2.6-2 4.3-.8z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      {canNativeShare && (
        <button
          onClick={handleNativeShare}
          className={`${pill} border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="m16 6-4-4-4 4" />
            <path d="M12 2v13" />
          </svg>
          Share
        </button>
      )}
      <button
        onClick={handleCopy}
        className={
          copied
            ? `${pill} border-emerald-400 bg-emerald-50 text-emerald-700`
            : canNativeShare
              ? quiet
              : `${pill} border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700`
        }
      >
        {copied ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Link copied!
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy link
          </>
        )}
      </button>
      {targets.map((t) => (
        <a
          key={t.method}
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track(t.method)}
          className={quiet}
          aria-label={`Share on ${t.label}`}
        >
          {t.icon}
          {t.label}
        </a>
      ))}
    </div>
  )
}
