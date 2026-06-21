import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApolloOrgEnrichAdapter, applyApolloEnrichment } from './apollo-adapter'
import type { RankedSource } from './types'

function rankedSource(overrides: Partial<RankedSource> = {}): RankedSource {
  return {
    domain: 'acmecorp.com',
    title: 'Acme Corp',
    url: 'https://acmecorp.com/',
    sourceType: 'company_website',
    text: 'Acme Corp is a manufacturer.',
    confidenceScore: 70,
    rankReason: 'Validation score 90/100 (+27)',
    ...overrides,
  }
}

describe('ApolloOrgEnrichAdapter', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('reports not configured and never fetches when no API key is present', async () => {
    const adapter = new ApolloOrgEnrichAdapter(undefined)
    const fetchSpy = vi.fn()
    global.fetch = fetchSpy as unknown as typeof fetch

    expect(adapter.isConfigured()).toBe(false)
    const result = await adapter.enrichDomain('acmecorp.com')

    expect(result).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('reports configured when an API key is present', () => {
    const adapter = new ApolloOrgEnrichAdapter('test-key')
    expect(adapter.isConfigured()).toBe(true)
  })

  it('returns enrichment data on a successful confirmed response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ organization: { estimated_num_employees: 120, industry: 'Manufacturing' } }),
    }) as unknown as typeof fetch

    const adapter = new ApolloOrgEnrichAdapter('test-key')
    const result = await adapter.enrichDomain('acmecorp.com')

    expect(result).toEqual({ domain: 'acmecorp.com', employeeCount: 120, industry: 'Manufacturing' })
  })

  it('returns null when Apollo has no matching organization', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ organization: null }),
    }) as unknown as typeof fetch

    const adapter = new ApolloOrgEnrichAdapter('test-key')
    const result = await adapter.enrichDomain('unknown-domain.com')

    expect(result).toBeNull()
  })

  it('returns null on a non-ok HTTP response rather than throwing', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 429 }) as unknown as typeof fetch

    const adapter = new ApolloOrgEnrichAdapter('test-key')
    const result = await adapter.enrichDomain('acmecorp.com')

    expect(result).toBeNull()
  })

  it('returns null on a network failure rather than throwing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch

    const adapter = new ApolloOrgEnrichAdapter('test-key')
    const result = await adapter.enrichDomain('acmecorp.com')

    expect(result).toBeNull()
  })
})

describe('applyApolloEnrichment', () => {
  it('boosts confidence score on confirmation', () => {
    const source = rankedSource({ confidenceScore: 70 })
    const enriched = applyApolloEnrichment(source, { domain: 'acmecorp.com' })

    expect(enriched.confidenceScore).toBe(75)
    expect(enriched.apolloVerified).toBe(true)
  })

  it('never exceeds the 98 Apollo-confirmed ceiling even at a near-max starting score', () => {
    const source = rankedSource({ confidenceScore: 95 })
    const enriched = applyApolloEnrichment(source, { domain: 'acmecorp.com' })

    expect(enriched.confidenceScore).toBeLessThanOrEqual(98)
  })

  it('overwrites companySizeKey with Apollo-verified employee count when present', () => {
    const source = rankedSource({ companySizeKey: '1-10' })
    const enriched = applyApolloEnrichment(source, { domain: 'acmecorp.com', employeeCount: 300 })

    expect(enriched.companySizeKey).toBe('201-500')
  })

  it('preserves the existing companySizeKey when Apollo did not report an employee count', () => {
    const source = rankedSource({ companySizeKey: '51-200' })
    const enriched = applyApolloEnrichment(source, { domain: 'acmecorp.com' })

    expect(enriched.companySizeKey).toBe('51-200')
  })

  it('appends the confirmation to rankReason without dropping prior reasons', () => {
    const source = rankedSource({ rankReason: 'Validation score 90/100 (+27)' })
    const enriched = applyApolloEnrichment(source, { domain: 'acmecorp.com' })

    expect(enriched.rankReason).toContain('Validation score 90/100 (+27)')
    expect(enriched.rankReason).toContain('Confirmed by Apollo company database')
  })
})
