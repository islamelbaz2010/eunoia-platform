import type { CollectedSource, SourceType } from './types'

const FETCH_TIMEOUT_MS = 8000
const MAX_HTML_BYTES = 500_000

/**
 * Domains never fetched directly, per the "no LinkedIn scraping / no browser
 * automation" constraint. Evidence for these comes only from the search
 * snippet Google already indexed — the URL is real and public, but the page
 * itself is never requested by this app.
 */
const NO_FETCH_DOMAINS = ['linkedin.com', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com']

const DIRECTORY_DOMAINS = [
  'yellowpages',
  'kompass.com',
  'europages',
  'opencorporates.com',
  'tradeford.com',
  'egyptyp.com',
  'yelp.com',
  'crunchbase.com',
]

/** Classifies a discovered URL into one of the three approved source types — never a 4th, invented category. */
export function classifySourceType(url: string): SourceType {
  let host: string
  try {
    host = new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'company_website'
  }
  if (NO_FETCH_DOMAINS.some(d => host.includes(d))) return 'public_listing'
  if (DIRECTORY_DOMAINS.some(d => host.includes(d))) return 'business_directory'
  return 'company_website'
}

export function isNoFetchDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return NO_FETCH_DOMAINS.some(d => host.includes(d))
  } catch {
    return false
  }
}

export interface SourceCollector {
  name: string
  collect(url: string): Promise<CollectedSource | null>
}

/**
 * Mirrors SourceProvider's shape: a single async method, no class state
 * beyond config. Plain `fetch` + a hand-rolled HTML→text pass — no headless
 * browser, no JS execution, no DOM library — per the "no browser automation"
 * constraint and to keep Phase 1's operating cost at $0 incremental.
 */
export class FetchSourceCollector implements SourceCollector {
  readonly name = 'fetch-html-to-text'

  async collect(url: string): Promise<CollectedSource | null> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'EunoiaResearchBot/1.0' },
      })

      if (!res.ok) return null

      const contentType = res.headers.get('content-type') ?? ''
      if (!contentType.includes('text/html')) return null

      const raw = await res.text()
      const html = raw.slice(0, MAX_HTML_BYTES)

      const text = htmlToText(html)
      if (!text) return null

      return { text, finalUrl: res.url || url, title: extractTitle(html) }
    } catch {
      return null
    } finally {
      clearTimeout(timeout)
    }
  }
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return decodeEntities(match?.[1]?.trim() ?? '')
}

function htmlToText(html: string): string {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
  return decodeEntities(stripped).replace(/\s+/g, ' ').trim()
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
