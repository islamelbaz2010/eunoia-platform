import type { SearchResult } from './types'
import { checkSearchQuota } from './quota'

export class SearchProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly statusCode?: number
  ) {
    super(message)
    this.name = 'SearchProviderError'
  }
}

export interface SearchProviderOptions {
  /** Max results, 1-10 (Google CSE's per-request cap). */
  num?: number
  /** Appended to the query verbatim, e.g. `site:*.eg` for a country-restricted search. */
  siteRestrict?: string
}

/**
 * Mirrors the AIProvider interface in services/legacy-ai-engine/providers/base.provider.ts —
 * same shape, so swapping or adding a provider later (e.g. Bing, or a future
 * confirmed Composio search action) is a drop-in, not a redesign.
 */
export interface SearchProvider {
  name: string
  search(query: string, options?: SearchProviderOptions): Promise<SearchResult[]>
}

interface GoogleCSEResponseItem {
  title?: string
  link?: string
  snippet?: string
}

interface GoogleCSEResponse {
  items?: GoogleCSEResponseItem[]
}

/**
 * Approved Phase 1 data source: Google Custom Search JSON API. Only ever
 * returns what Google's index actually returned — never invents a result.
 */
export class GoogleCustomSearchProvider implements SearchProvider {
  readonly name = 'google-custom-search'
  private apiKey?: string
  private cx?: string

  constructor(apiKey?: string, cx?: string) {
    this.apiKey = apiKey ?? process.env.GOOGLE_CSE_API_KEY
    this.cx = cx ?? process.env.GOOGLE_CSE_ID
  }

  async search(query: string, options: SearchProviderOptions = {}): Promise<SearchResult[]> {
    if (!this.apiKey || !this.cx) {
      throw new SearchProviderError(
        'Google Custom Search is not configured (GOOGLE_CSE_API_KEY / GOOGLE_CSE_ID missing)',
        this.name
      )
    }

    const quota = await checkSearchQuota()
    if (!quota.ok) {
      throw new SearchProviderError(
        `Daily Google Custom Search quota exhausted (${quota.used}/${quota.limit} free queries used today)`,
        this.name,
        429
      )
    }

    const num = Math.min(Math.max(options.num ?? 10, 1), 10)
    const q = options.siteRestrict ? `${query} ${options.siteRestrict}` : query

    const params = new URLSearchParams({ key: this.apiKey, cx: this.cx, q, num: String(num) })

    let res: Response
    try {
      res = await fetch(`https://www.googleapis.com/customsearch/v1?${params.toString()}`)
    } catch (err) {
      throw new SearchProviderError(`Google Custom Search request failed: ${String(err)}`, this.name)
    }

    if (!res.ok) {
      throw new SearchProviderError(`Google Custom Search failed: ${res.status}`, this.name, res.status)
    }

    const json = (await res.json()) as GoogleCSEResponse

    return (json.items ?? [])
      .filter((item): item is Required<GoogleCSEResponseItem> => Boolean(item.link && item.title))
      .map(item => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet ?? '',
      }))
  }
}
