import { describe, it, expect } from 'vitest'
import { collectEvidence } from '../evidence/evidence-collector'
import type { RawEvidenceInput } from '../evidence/evidence-collector'

const baseItem: RawEvidenceInput = {
  title: 'Market Report Q1',
  content: 'Strong demand in sector A',
  sourceType: 'external_source',
  sourceLabel: 'Industry Database',
  confidence: 0.8,
}

describe('collectEvidence', () => {
  it('accepts valid evidence items', () => {
    const result = collectEvidence({
      decisionId: 'decision-1',
      items: [baseItem],
    })
    expect(result.errors).toHaveLength(0)
    expect(result.collection.items).toHaveLength(1)
    expect(result.collection.items[0].title).toBe('Market Report Q1')
  })

  it('assigns a UUID to each item', () => {
    const result = collectEvidence({ decisionId: 'd1', items: [baseItem] })
    expect(result.collection.items[0].id).toBeTruthy()
  })

  it('rejects items with no title', () => {
    const result = collectEvidence({
      decisionId: 'd1',
      items: [{ ...baseItem, title: '' }],
    })
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].reason).toMatch(/title/)
    expect(result.collection.items).toHaveLength(0)
  })

  it('rejects items with no content', () => {
    const result = collectEvidence({
      decisionId: 'd1',
      items: [{ ...baseItem, content: '' }],
    })
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].reason).toMatch(/content/)
  })

  it('rejects items with out-of-range confidence', () => {
    const result = collectEvidence({
      decisionId: 'd1',
      items: [{ ...baseItem, confidence: 1.5 }],
    })
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].reason).toMatch(/confidence/)
  })

  it('computes freshness as 1.0 for items retrieved right now', () => {
    const result = collectEvidence({
      decisionId: 'd1',
      items: [{ ...baseItem, retrievedAt: new Date().toISOString() }],
    })
    expect(result.collection.items[0].freshness).toBeCloseTo(1.0, 2)
  })

  it('computes freshness < 1.0 for stale items', () => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const result = collectEvidence({
      decisionId: 'd1',
      items: [{ ...baseItem, retrievedAt: oneWeekAgo }],
    })
    expect(result.collection.items[0].freshness).toBeLessThan(1.0)
    expect(result.collection.items[0].freshness).toBeGreaterThan(0)
  })

  it('computes stats correctly', () => {
    const result = collectEvidence({
      decisionId: 'd1',
      items: [
        baseItem,
        { ...baseItem, title: 'User survey', sourceType: 'user_input' },
      ],
    })
    expect(result.collection.stats.total).toBe(2)
    expect(result.collection.stats.bySourceType['external_source']).toBe(1)
    expect(result.collection.stats.bySourceType['user_input']).toBe(1)
  })

  it('handles empty items list', () => {
    const result = collectEvidence({ decisionId: 'd1', items: [] })
    expect(result.errors).toHaveLength(0)
    expect(result.collection.items).toHaveLength(0)
    expect(result.collection.stats.total).toBe(0)
  })

  it('defaults confidence to 0.7 when not provided', () => {
    const { confidence: _unused, ...withoutConfidence } = baseItem
    const result = collectEvidence({ decisionId: 'd1', items: [withoutConfidence] })
    expect(result.collection.items[0].confidence).toBe(0.7)
  })
})
