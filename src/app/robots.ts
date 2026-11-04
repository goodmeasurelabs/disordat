import type { MetadataRoute } from 'next'

const SITE_URL = 'https://disordat.org'

/**
 * AI crawlers and assistants are welcome, by name: disordat has no ads to
 * protect, and being read and quoted is the point (unlike Diffen, which
 * blocks them). /api/ stays closed; the markdown twins live under /vs/.
 */
const AI_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Meta-ExternalAgent',
  'DuckAssistBot',
  'MistralAI-User',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: AI_AGENTS,
        allow: ['/', '/llms.txt', '/vs/'],
        disallow: ['/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
