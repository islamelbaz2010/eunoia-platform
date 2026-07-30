import { describe, it, expect } from 'vitest'
import { weightEvidence, weightedAverageFreshness, maxEvidenceAgeHours } from '../evidence/evidence-weighter'
import { collectEvidence } from '../evidence/evidence-collector'
import type { RawEvidenceInput } from '../evidence/evidence-collector'

function makeItems(raws: RawEvidenceInput[]) {
  return collectEvidence({ decisionId: 'd1', items: raws }).collection.items
}

const baseRaw: RawEvidenceInput = {
  title: 'T1',
  content: 'content',
  sourceType: 'internal_data',
  sourceLabel: 'DB',
  confidence: 0.9,
  retrievedAt: new Date().toISOString(),
}

describe('weightEvidence', () => {
  it('returns empty array for empty input', () => {
    expect(weightEvidence([])).toHaveLength(0)
  })

  it('weights sum to 1.0 for a single item', () => {
    const items = makeItems([baseRaw])
    const weights = weightEvidence(items)
    expect(weights).toHaveLength(1)
    expect(weights[0].weight).toBeCloseTo(1.0, 5)
  })

  it('weights sum to 1.0 for multiple items', () => {
    const items = makeItems([
      baseRaw,
      { ...baseRaw, title: 'T2', sourceType: 'ai_analysis', confidence: 0.5 },
      { ...baseRaw, title: 'T3', sourceType: 'human_validation', confidence: 1.0 },
    ])
    const weights = weightEvidence(items)
    const total = weights.reduce((sum, w) => sum + w.weight, 0)
    expect(total).toBeCloseTo(1.0, 5)
  })

  it('assigns higher weight to human_validation over ai_analysis', () => {
    const items = makeItems([
      { ...baseRaw, title: 'AI', sourceType: 'ai_analysis', confidence: 0.8 },
      { ...baseRaw, title: 'Human', sourceType: 'human_validation', confidence: 0.8 },
    ])
    const weights = weightEvidence(items)
    const aiWeight = weights[0].weight
    const humanWeight = weights[1].weight
    expect(humanWeight).toBeGreaterThan(aiWeight)
  })

  it('assigns lower weight to stale items', () => {
    const freshRaw: RawEvidenceInput = { ...baseRaw, title: 'Fresh', retrievedAt: new Date().toISOString() }
    const staleRaw: RawEvidenceInput = {
      ...baseRaw,
      title: 'Stale',
      retrievedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
    const items = makeItems([freshRaw, staleRaw])
    const weights = weightEvidence(items)
    expect(weights[0].weight).toBeGreaterThan(weights[1].weight)
  })
})

describe('weightedAverageFreshness', () => {
  it('returns 0 for empty collection', () => {
    expect(weightedAverageFreshness([], [])).toBe(0)
  })

  it('returns freshness of single item', () => {
    const items = makeItems([{ ...baseRaw, retrievedAt: new Date().toISOString() }])
    const weights = weightEvidence(items)
    const waf = weightedAverageFreshness(items, weights)
    expect(waf).toBeCloseTo(items[0].freshness, 5)
  })
})

describe('maxEvidenceAgeHours', () => {
  it('returns 0 for empty collection', () => {
    expect(maxEvidenceAgeHours([])).toBe(0)
  })

  it('returns the age of the oldest item in hours', () => {
    const now = Date.now()
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString()
    const items = makeItems([
      { ...baseRaw, retrievedAt: new Date(now).toISOString() },
      { ...baseRaw, title: 'Old', retrievedAt: twoHoursAgo },
    ])
    const max = maxEvidenceAgeHours(items, now)
    expect(max).toBeCloseTo(2, 0)
  })
})
