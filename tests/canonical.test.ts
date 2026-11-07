import { describe, expect, it } from 'vitest'
import { canonicalPath } from '@/lib/canonical'

describe('canonical comparison URLs', () => {
  it('leaves canonical pages alone', () => {
    expect(canonicalPath('/vs/batman-vs-superman')).toBeNull()
    expect(canonicalPath('/vs/batman-vs-superman.md')).toBeNull()
    expect(canonicalPath('/matchups')).toBeNull()
    expect(canonicalPath('/')).toBeNull()
  })

  it('redirects reversed, capitalised and spaced variants to the one page', () => {
    expect(canonicalPath('/vs/superman-vs-batman')).toBe('/vs/batman-vs-superman')
    expect(canonicalPath('/vs/Batman-vs-Superman')).toBe('/vs/batman-vs-superman')
    expect(canonicalPath('/vs/batman%20vs%20superman')).toBe('/vs/batman-vs-superman')
    expect(canonicalPath('/vs/In-N-Out-vs-Five-Guys')).toBe('/vs/five-guys-vs-in-n-out')
  })

  it('sends the bare /vs to the matchups list', () => {
    expect(canonicalPath('/vs')).toBe('/matchups')
  })

  it('does not guess when the split is ambiguous', () => {
    expect(canonicalPath('/vs/vs-code-vs-vim-vs-emacs')).toBeNull()
    expect(canonicalPath('/vs/%E0%A4%A')).toBeNull()
  })
})
