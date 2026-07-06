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
  /** Enforces the per-tenant fair-share sub-quota in quota.ts — never sent to SerpAPI itself. */
  userId?: string
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

interface SerpApiOrganicResult {
  title?: string
  link?: string
  snippet?: string
}

interface SerpApiResponse {
  organic_results?: SerpApiOrganicResult[]
  error?: string
}

/**
 * Approved data source: SerpAPI (Google search results via serpapi.com).
 * Replaces the abandoned GoogleCustomSearchProvider (Google Custom Search
 * JSON API returned a persistent 403 PERMISSION_DENIED at the GCP-project
 * level — see SERPAPI_MIGRATION_PLAN.md). Only ever returns what SerpAPI's
 * underlying Google search actually returned — never invents a result.
 */
export class SerpApiProvider implements SearchProvider {
  readonly name = 'serpapi'
  private apiKey?: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.SERPAPI_API_KEY
  }

  async search(query: string, options: SearchProviderOptions = {}): Promise<SearchResult[]> {
    if (!this.apiKey) {
      throw new SearchProviderError('SerpAPI is not configured (SERPAPI_API_KEY missing)', this.name)
    }

    const quota = await checkSearchQuota(options.userId)
    if (!quota.ok) {
      throw new SearchProviderError(
        `Daily search quota exhausted (${quota.used}/${quota.limit} queries used today)`,
        this.name,
        429
      )
    }

    const num = Math.min(Math.max(options.num ?? 10, 1), 100)
    const q = options.siteRestrict ? `${query} ${options.siteRestrict}` : query

    const params = new URLSearchParams({ engine: 'google', api_key: this.apiKey, q, num: String(num) })

    let res: Response
    try {
      res = await fetch(`https://serpapi.com/search.json?${params.toString()}`)
    } catch (err) {
      throw new SearchProviderError(`SerpAPI request failed: ${String(err)}`, this.name)
    }

    const json = (await res.json()) as SerpApiResponse

    // SerpAPI sometimes returns HTTP 200 with an `error` field instead of a non-2xx status.
    if (!res.ok || json.error) {
      throw new SearchProviderError(json.error ?? `SerpAPI failed: ${res.status}`, this.name, res.ok ? 502 : res.status)
    }

    return (json.organic_results ?? [])
      .filter((item): item is Required<SerpApiOrganicResult> => Boolean(item.link && item.title))
      .map(item => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet ?? '',
      }))
  }
}
