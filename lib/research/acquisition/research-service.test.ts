import { beforeEach, describe, expect, it, vi } from 'vitest'

const { cacheGet, cacheSet, redisGet, redisSet } = vi.hoisted(() => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  redisGet: vi.fn(),
  redisSet: vi.fn(),
}))

vi.mock('@/lib/redis/cache', () => ({
  CACHE_TTL: { REPORT: 86400 },
  cacheGet,
  cacheSet,
}))

vi.mock('@/lib/redis/client', () => ({
  redis: { get: redisGet, set: redisSet },
}))

import type { AIProvider } from '@/services/legacy-ai-engine/providers/base.provider'
import { ResearchService } from './research-service'
import type { SearchProvider } from './search-provider'
import type { SourceCollector } from './source-collector'

function aiProvider(): AIProvider {
  return {
    name: 'mock-ai',
    generate: vi.fn().mockResolvedValue({
      content: JSON.stringify({ summaries: [{ index: 0, summary: 'Acme is a relevant company.' }] }),
      model: 'mock',
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    }),
    stream: vi.fn(),
    estimateCost: vi.fn().mockReturnValue(0),
  }
}

describe('ResearchService', () => {
  beforeEach(() => {
    cacheGet.mockReset()
    cacheSet.mockReset()
    redisGet.mockReset()
    redisSet.mockReset()
    cacheGet.mockResolvedValue(null)
    redisGet.mockResolvedValue(null)
    redisSet.mockResolvedValue('OK')
  })

  it('returns a validated cached result without calling providers', async () => {
    cacheGet.mockResolvedValue({
      query: 'manufacturers cairo',
      generatedAt: new Date().toISOString(),
      items: [],
      totalSourcesFound: 0,
      totalSourcesCollected: 0,
      totalSourcesValidated: 0,
      totalSourcesDeduped: 0,
      totalSourcesExpanded: 0,
      cached: false,
      durationMs: 1,
    })
    const searchProvider: SearchProvider = { name: 'search', search: vi.fn() }
    const sourceCollector: SourceCollector = { collect: vi.fn() }

    const result = await new ResearchService({
      searchProvider,
      sourceCollector,
      aiProvider: aiProvider(),
    }).run({ query: 'manufacturers cairo', userId: 'user-a' })

    expect(result.cached).toBe(true)
    expect(searchProvider.search).not.toHaveBeenCalled()
    expect(sourceCollector.collect).not.toHaveBeenCalled()
  })

  it('orchestrates search, collection, validation, ranking, AI analysis, and cache write', async () => {
    const searchProvider: SearchProvider = {
      name: 'search',
      search: vi.fn().mockResolvedValue([
        { title: 'Acme Manufacturing', url: 'https://acme.com', snippet: 'Acme official website' },
        { title: 'Wikipedia', url: 'https://wikipedia.org/wiki/Acme', snippet: 'Not a company source' },
      ]),
    }
    const sourceCollector: SourceCollector = {
      collect: vi.fn(async (url: string) => ({
        finalUrl: url,
        title: url.includes('acme') ? 'Acme Manufacturing' : 'Wikipedia',
        text: url.includes('acme')
          ? 'Acme Manufacturing is a real estate manufacturing company based in Cairo with 51-200 employees and client services across Egypt.'
          : 'Wikipedia encyclopedia entry about Acme and its history in Cairo.',
      })),
    }

    const result = await new ResearchService({
      searchProvider,
      sourceCollector,
      aiProvider: aiProvider(),
      apolloAdapter: { isConfigured: () => false, enrichDomain: vi.fn() },
    }).run({
      query: 'manufacturers cairo',
      sectorHint: 'real_estate',
      cityHint: 'cairo',
      companySizeHint: '51-200',
      maxResults: 5,
      userId: 'user-a',
    })

    expect(searchProvider.search).toHaveBeenCalledWith('manufacturers cairo', {
      num: 5,
      siteRestrict: undefined,
      userId: 'user-a',
    })
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      title: 'Acme Manufacturing',
      sourceUrl: 'https://acme.com',
      summary: 'Acme is a relevant company.',
    })
    expect(result.totalSourcesFound).toBe(2)
    expect(result.totalSourcesValidated).toBe(1)
    expect(result.totalSourcesDeduped).toBe(1)
    expect(cacheSet).toHaveBeenCalledTimes(1)
  })
})
