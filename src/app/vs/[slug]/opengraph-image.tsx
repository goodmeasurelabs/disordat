import { ImageResponse } from 'next/og'
import { getComparison } from '@/lib/comparisons'
import { agreePercent, getVotes, MIN_VOTES_TO_SHOW } from '@/lib/votes'
import { formatLongDate, verdictDate } from '@/lib/verdict'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Verdict card on disordat'

type RouteParams = { slug: string }

function clip(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

/**
 * The verdict share card: what shows up when a /vs/ link is pasted into
 * iMessage, WhatsApp, Slack, Discord or X. It leads with the verdict
 * ("Coke beats Pepsi") so the argument starts in the chat, not on the page.
 */
export default async function OGImage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params
  const c = await getComparison(slug)

  if (!c) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f0fdf4',
            fontSize: 64,
            fontWeight: 700,
            color: '#065f46',
          }}
        >
          disordat
        </div>
      ),
      size,
    )
  }

  const tie = c.winner === 'tie'
  const winner = tie ? '' : c.winner === 'a' ? c.item_a : c.item_b
  const loser = tie ? '' : c.winner === 'a' ? c.item_b : c.item_a
  const percent = agreePercent(await getVotes(slug), MIN_VOTES_TO_SHOW)

  // Size the headline by its length so long names don't overflow.
  const headlineLen = tie ? c.item_a.length + c.item_b.length + 4 : winner.length + loser.length + 7
  const headlineSize = headlineLen > 44 ? 58 : headlineLen > 30 ? 70 : headlineLen > 20 ? 84 : 96

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 55%, #f0f9ff 100%)',
          padding: '56px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Brand + label */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, color: '#065f46', letterSpacing: '-0.01em' }}>
            disordat
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              fontWeight: 700,
              color: '#047857',
              background: '#d1fae5',
              padding: '8px 18px',
              borderRadius: 999,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            The verdict
          </div>
        </div>

        {/* Headline */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {tie ? (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                fontSize: headlineSize,
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
              }}
            >
              {`${c.item_a} vs ${c.item_b}: too close to call`}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'baseline',
                fontSize: headlineSize,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
              }}
            >
              <span style={{ color: '#047857', marginRight: 22 }}>{winner}</span>
              <span style={{ color: '#94a3b8', marginRight: 22, fontWeight: 700 }}>beats</span>
              <span style={{ color: '#0f172a' }}>{loser}</span>
            </div>
          )}
          <div style={{ display: 'flex', marginTop: 28, fontSize: 30, color: '#334155', lineHeight: 1.35 }}>
            {clip(c.summary, 150)}
          </div>
        </div>

        {/* Footer: agree % once there are votes, the date, and the domain */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {percent !== null ? (
              <div
                style={{
                  display: 'flex',
                  background: '#065f46',
                  color: 'white',
                  padding: '10px 22px',
                  borderRadius: 999,
                  fontWeight: 700,
                }}
              >
                {`${percent}% agree`}
              </div>
            ) : (
              <div style={{ display: 'flex', color: '#475569', fontWeight: 600 }}>Agree? Disagree? Vote on it.</div>
            )}
            <div style={{ display: 'flex', marginLeft: 20, color: '#64748b' }}>
              {`as of ${formatLongDate(verdictDate(c))}`}
            </div>
          </div>
          <div style={{ display: 'flex', fontWeight: 700, color: '#0f172a' }}>disordat.org</div>
        </div>
      </div>
    ),
    size,
  )
}
