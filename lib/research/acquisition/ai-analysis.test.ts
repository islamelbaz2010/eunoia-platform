import { describe, expect, it, vi } from 'vitest'

import type { AIProvider } from '@/services/legacy-ai-engine/providers/base.provider'
import { analyzeRankedSources } from './ai-analysis'
import type { RankedSource } from './types'

function provider(content: string): AIProvider {
  return {
    name: 'mock-ai',
    generate: vi.fn().mockResolvedValue({
      content,
      model: 'mock',
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    }),
    stream: vi.fn(),
    estimateCost: vi.fn().mockReturnValue(0),
  }
}

function rankedSource(overrides: Partial<RankedSource> = {}): RankedSource {
  return {
    domain: 'acme.com',
    title: 'Acme Manufacturing',
    url: 'https://acme.com',
    sourceType: 'company_website',
    text: 'Acme Manufacturing builds industrial components for Cairo developers and contractors.',
    confidenceScore: 87,
    rankReason: 'Primary company website',
    ...overrides,
  }
}

describe('analyzeRankedSources', () => {
  it('maps AI summaries back onto the closed input list by index', async () => {
    const ai = provider(JSON.stringify({
      summaries: [
        { index: 1, summary: 'Beta is a verified target company.' },
        { index: 0, summary: 'Acme is a verified target company.' },
        { index: 99, summary: 'Invented extra company.' },
      ],
    }))

    const result = await analyzeRankedSources(
      [
        rankedSource({ title: 'Acme', url: 'https://acme.com', domain: 'acme.com' }),
        rankedSource({ title: 'Beta', url: 'https://beta.com', domain: 'beta.com' }),
      ],
      'manufacturers cairo',
      ai
    )

    expect(result.map(item => item.title)).toEqual(['Acme', 'Beta'])
    expect(result.map(item => item.summary)).toEqual([
      'Acme is a verified target company.',
      'Beta is a verified target company.',
    ])
  })

  it('falls back to real source text when the provider returns malformed JSON', async () => {
    const result = await analyzeRankedSources(
      [rankedSource({ text: 'Real collected excerpt from the company website.'.repeat(8) })],
      'manufacturers cairo',
      provider('not-json')
    )

    expect(result).toHaveLength(1)
    expect(result[0].summary).toContain('Real collected excerpt')
  })

  it('honors maxItems before calling the model', async () => {
    const ai = provider(JSON.stringify({ summaries: [{ index: 0, summary: 'Only first.' }] }))

    const result = await analyzeRankedSources(
      [
        rankedSource({ title: 'One', url: 'https://one.com', domain: 'one.com' }),
        rankedSource({ title: 'Two', url: 'https://two.com', domain: 'two.com' }),
      ],
      'query',
      ai,
      { maxItems: 1 }
    )

    expect(result.map(item => item.title)).toEqual(['One'])
    expect(ai.generate).toHaveBeenCalledTimes(1)
  })
})
