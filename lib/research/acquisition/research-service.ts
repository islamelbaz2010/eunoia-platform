import crypto from 'crypto'
import { cacheGet, cacheSet, CACHE_TTL } from '@/lib/redis/cache'
import type { AIProvider } from '@/services/legacy-ai-engine/providers/base.provider'
import { OpenAIProvider } from '@/services/legacy-ai-engine/providers/openai.provider'
import { SerpApiProvider, type SearchProvider } from './search-provider'
import { FetchSourceCollector, classifySourceType, isNoFetchDomain, type SourceCollector } from './source-collector'
import { normalizeSources, type CollectedItem } from './normalizer'
import { filterValidSources } from '../company-validation'
import { dedupeCompanies } from '../dedup'
import { isParkedDomainProvider, detectBrokenPage, recordSourceOutcome, getSourceReputation } from '../source-quality'
import { extractMentionedDomains } from '../company-expansion'
import { rankSources } from './ranker'
import { ApolloOrgEnrichAdapter, applyApolloEnrichment, type ApolloAdapter } from './apollo-adapter'
import { analyzeRankedSources } from './ai-analysis'
import { ResearchResultSchema, type RankedSource, type ResearchResult, type SearchResult, type SourceType } from './types'

export interface ResearchServiceOptions {
  searchProvider?: SearchProvider
  sourceCollector?: SourceCollector
  aiProvider?: AIProvider
  /** Defaults to ApolloOrgEnrichAdapter, which itself no-ops when APOLLO_API_KEY isn't set — enrichment is always optional. */
  apolloAdapter?: ApolloAdapter
}

export interface RunResearchInput {
  /** The fully-built search query, e.g. from a Query Builder step upstream (industry + location + ...). */
  query: string
  /** core/data/sectors.data.ts key, used only to boost ranking — never to filter or invent results. */
  sectorHint?: string
  /** core/data/cities.data.ts key, same purpose. */
  cityHint?: string
  /** lib/research/company-size.ts bucket key, same purpose — rewards a source whose own text states a matching headcount, never filters on it. */
  companySizeHint?: string
  /** Appended verbatim to the query, e.g. `site:*.eg` */
  siteRestrict?: string
  /** Caps both the number of search results requested and the number of AI-summarized items returned. */
  maxResults?: number
  /**
   * Only used for the per-tenant fair-share search quota check in quota.ts —
   * excluded from the cache-key hash below so identical queries from
   * different users still share one cached result. Never reaches the search
   * provider's actual query string, and is irrelevant on a cache hit since a
   * cache hit never calls the search provider at all.
   */
  userId?: string
}

const CACHE_PREFIX = 'research:acquisition'

function buildQueryHash(input: RunResearchInput): string {
  const { userId, ...cacheable } = input
  const payload = JSON.stringify(cacheable)
  return crypto.createHash('sha256').update(payload).digest('hex')
}

function safeDomain(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return undefined
  }
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
  private apolloAdapter: ApolloAdapter

  constructor(options: ResearchServiceOptions = {}) {
    this.searchProvider = options.searchProvider ?? new SerpApiProvider()
    this.sourceCollector = options.sourceCollector ?? new FetchSourceCollector()
    this.aiProviderOverride = options.aiProvider
    this.apolloAdapter = options.apolloAdapter ?? new ApolloOrgEnrichAdapter()
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

  /**
   * Vets a single URL (parked-domain check, reputation-suppression check,
   * fetch, broken-page detection) and records the outcome — shared by both
   * the initial search-results loop and the Company Expansion step below,
   * so a domain discovered by text-mining a directory listing is held to
   * exactly the same bar as one returned directly by the search engine.
   */
  private async collectAndVet(searchResult: SearchResult, sourceType: SourceType): Promise<CollectedItem | null> {
    const domain = safeDomain(searchResult.url)

    if (domain) {
      if (isParkedDomainProvider(domain)) return null
      if ((await getSourceReputation(domain)).suppressed) return null
    }

    if (isNoFetchDomain(searchResult.url)) {
      return { searchResult, collected: null, sourceType }
    }

    const collected = await this.sourceCollector.collect(searchResult.url)

    if (domain) {
      if (!collected) {
        await recordSourceOutcome(domain, 'failure')
        return null
      }
      if (detectBrokenPage(collected).isBroken) {
        await recordSourceOutcome(domain, 'failure')
        return null
      }
      await recordSourceOutcome(domain, 'success')
    }

    return { searchResult, collected, sourceType }
  }

  /**
   * Apollo Enrichment: only runs the sources that survived ranking and will
   * actually be shown to the user (the caller passes an already-sliced
   * list), so an Apollo subscription's request volume scales with
   * maxResults, never with how many candidates were collected upstream. A
   * no-op (zero network calls) when APOLLO_API_KEY isn't configured.
   */
  private async applyApolloEnrichmentStep(sources: RankedSource[]): Promise<RankedSource[]> {
    if (!this.apolloAdapter.isConfigured()) return sources

    return Promise.all(
      sources.map(async source => {
        const enrichment = await this.apolloAdapter.enrichDomain(source.domain)
        return enrichment ? applyApolloEnrichment(source, enrichment) : source
      })
    )
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
      userId: input.userId,
    })

    const collectedItems = (
      await Promise.all(
        searchResults.map(searchResult => this.collectAndVet(searchResult, classifySourceType(searchResult.url)))
      )
    ).filter((item): item is CollectedItem => item !== null)

    // Company Expansion: mine business-directory listings' own collected text for
    // other companies they name (e.g. "Acme Corp — acmecorp.com"), and vet those
    // domains directly — growing the candidate pool without spending extra search
    // quota. See lib/research/company-expansion.ts for the why.
    const expansionDomains = extractMentionedDomains(normalizeSources(collectedItems))
    const expansionItems = (
      await Promise.all(
        expansionDomains.map(domain => {
          const url = `https://${domain}`
          return this.collectAndVet({ url, title: '', snippet: '' }, classifySourceType(url))
        })
      )
    ).filter((item): item is CollectedItem => item !== null)

    const normalized = normalizeSources([...collectedItems, ...expansionItems])
    const validated = filterValidSources(normalized)
    const deduped = dedupeCompanies(validated)
    const ranked = rankSources(deduped, {
      sectorHint: input.sectorHint,
      cityHint: input.cityHint,
      companySizeHint: input.companySizeHint,
    })
    const enriched = await this.applyApolloEnrichmentStep(ranked.slice(0, maxResults))
    const items = await analyzeRankedSources(enriched, input.query, this.getAIProvider(), { maxItems: maxResults })

    const result: ResearchResult = {
      query: input.query,
      generatedAt: new Date().toISOString(),
      items,
      totalSourcesFound: searchResults.length,
      totalSourcesCollected: normalized.length,
      totalSourcesValidated: validated.length,
      totalSourcesDeduped: deduped.length,
      totalSourcesExpanded: expansionItems.length,
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
