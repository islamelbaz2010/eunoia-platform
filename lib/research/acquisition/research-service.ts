import crypto from 'crypto'
import { cacheGet, cacheSet, CACHE_TTL } from '@/lib/redis/cache'
import type { AIProvider } from '@/services/legacy-ai-engine/providers/base.provider'
import { OpenAIProvider } from '@/services/legacy-ai-engine/providers/openai.provider'
import { SerpApiProvider, type SearchProvider } from './search-provider'
import { FetchSourceCollector, classifySourceType, isNoFetchDomain, type SourceCollector } from './source-collector'
import { normalizeSources, type CollectedItem } from './normalizer'
import { rankSources } from './ranker'
import { analyzeRankedSources } from './ai-analysis'
import { ResearchResultSchema, type ResearchResult } from './types'

export interface ResearchServiceOptions {
  searchProvider?: SearchProvider
  sourceCollector?: SourceCollector
  aiProvider?: AIProvider
}

export interface RunResearchInput {
  /** The fully-built search query, e.g. from a Query Builder step upstream (industry + location + ...). */
  query: string
  /** core/data/sectors.data.ts key, used only to boost ranking — never to filter or invent results. */
  sectorHint?: string
  /** core/data/cities.data.ts key, same purpose. */
  cityHint?: string
  /** Appended verbatim to the query, e.g. `site:*.eg` */
  siteRestrict?: string
  /** Caps both the number of search results requested and the number of AI-summarized items returned. */
  maxResults?: number
}

const CACHE_PREFIX = 'research:acquisition'

function buildQueryHash(input: RunResearchInput): string {
  const payload = JSON.stringify(input)
  return crypto.createHash('sha256').update(payload).digest('hex')
}

/**
 * Research Service Layer — the one orchestrator every research module
 * (Lead Finder, Talent Finder, Competitor/Supplier/Market Intelligence)
 * calls. Wires Search → Collect → Normalize → Rank → AI Analysis together,
 * with the same cache-by-input-hash pattern as
 * services/legacy-ai-engine/orchestrator.ts so repeat queries don't re-spend
 * the SerpAPI daily quota or an OpenAI call.
 */
export class ResearchService {
  private searchProvider: SearchProvider
  private sourceCollector: SourceCollector
  private aiProviderOverride?: AIProvider
  private _aiProvider?: AIProvider

  constructor(options: ResearchServiceOptions = {}) {
    this.searchProvider = options.searchProvider ?? new SerpApiProvider()
    this.sourceCollector = options.sourceCollector ?? new FetchSourceCollector()
    this.aiProviderOverride = options.aiProvider
  }

  /**
   * Constructed lazily, only once the search step has already succeeded —
   * so a missing OPENAI_API_KEY doesn't crash the singleton at first touch
   * (which previously hid a missing GOOGLE_CSE_API_KEY behind an unrelated
   * OpenAI SDK error) and instead surfaces a clear error at the actual point
   * the AI Analysis stage is needed.
   */
  private getAIProvider(): AIProvider {
    if (!this._aiProvider) {
      try {
        this._aiProvider = this.aiProviderOverride ?? new OpenAIProvider()
      } catch (err) {
        throw new Error(`AI Analysis provider is not configured: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    return this._aiProvider
  }

  async run(input: RunResearchInput): Promise<ResearchResult> {
    const start = Date.now()
    const cacheKey = `${CACHE_PREFIX}:${buildQueryHash(input)}`

    const cached = await cacheGet<ResearchResult>(cacheKey)
    if (cached) {
      const parsed = ResearchResultSchema.safeParse(cached)
      if (parsed.success) return { ...parsed.data, cached: true }
    }

    const maxResults = Math.min(Math.max(input.maxResults ?? 10, 1), 10)

    const searchResults = await this.searchProvider.search(input.query, {
      num: maxResults,
      siteRestrict: input.siteRestrict,
    })

    const collectedItems: CollectedItem[] = await Promise.all(
      searchResults.map(async searchResult => {
        const sourceType = classifySourceType(searchResult.url)
        if (isNoFetchDomain(searchResult.url)) {
          return { searchResult, collected: null, sourceType }
        }
        const collected = await this.sourceCollector.collect(searchResult.url)
        return { searchResult, collected, sourceType }
      })
    )

    const normalized = normalizeSources(collectedItems)
    const ranked = rankSources(normalized, { sectorHint: input.sectorHint, cityHint: input.cityHint })
    const items = await analyzeRankedSources(ranked, input.query, this.getAIProvider(), { maxItems: maxResults })

    const result: ResearchResult = {
      query: input.query,
      generatedAt: new Date().toISOString(),
      items,
      totalSourcesFound: searchResults.length,
      totalSourcesCollected: normalized.length,
      cached: false,
      durationMs: Date.now() - start,
    }

    await cacheSet(cacheKey, result, CACHE_TTL.REPORT)

    return result
  }
}

let _researchService: ResearchService | null = null

export function getResearchService(): ResearchService {
  if (!_researchService) {
    _researchService = new ResearchService()
  }
  return _researchService
}
