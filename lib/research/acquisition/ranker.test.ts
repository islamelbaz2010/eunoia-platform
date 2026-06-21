import { describe, it, expect } from 'vitest'
import { rankSources } from './ranker'
import type { NormalizedSource } from './types'

function source(overrides: Partial<NormalizedSource>): NormalizedSource {
  return {
    domain: 'acmecorp.com',
    title: 'Acme Corp',
    url: 'https://acmecorp.com/',
    sourceType: 'company_website',
    text: 'short',
    validationScore: 90,
    ...overrides,
  }
}

describe('rankSources', () => {
  it('scores a company website higher than a business directory with identical matches', () => {
    const [website, directory] = rankSources([
      source({ domain: 'acmecorp.com', sourceType: 'company_website', validationScore: 90 }),
      source({ domain: 'crunchbase.com', sourceType: 'business_directory', validationScore: 60 }),
    ])

    expect(website.confidenceScore).toBeGreaterThan(directory.confidenceScore)
  })

  it('scores an official social profile between a website and a directory', () => {
    const [website] = rankSources([source({ sourceType: 'company_website', validationScore: 90 })])
    const [profile] = rankSources([source({ sourceType: 'public_listing', validationScore: 70 })])
    const [directory] = rankSources([source({ sourceType: 'business_directory', validationScore: 60 })])

    expect(website.confidenceScore).toBeGreaterThan(profile.confidenceScore)
    expect(profile.confidenceScore).toBeGreaterThan(directory.confidenceScore)
  })

  it('rewards sector and city matches', () => {
    const [withMatches] = rankSources(
      [source({ sectorKey: 'tech', cityKey: 'cairo' })],
      { sectorHint: 'tech', cityHint: 'cairo' }
    )
    const [withoutMatches] = rankSources([source({ sectorKey: 'tech', cityKey: 'cairo' })], {})

    expect(withMatches.confidenceScore).toBeGreaterThan(withoutMatches.confidenceScore)
  })

  it('rewards a matching company size signal', () => {
    const [withMatch] = rankSources(
      [source({ companySizeKey: '51-200' })],
      { companySizeHint: '51-200' }
    )
    const [withoutHint] = rankSources([source({ companySizeKey: '51-200' })], {})

    expect(withMatch.confidenceScore).toBeGreaterThan(withoutHint.confidenceScore)
  })

  it('does not penalize a source with no stated headcount', () => {
    const [noHeadcount] = rankSources([source({ companySizeKey: undefined })], { companySizeHint: '51-200' })
    const [mismatch] = rankSources([source({ companySizeKey: '1-10' })], { companySizeHint: '51-200' })

    expect(noHeadcount.confidenceScore).toBe(mismatch.confidenceScore)
  })

  it('rewards substantial collected content', () => {
    const [deep] = rankSources([source({ text: 'x'.repeat(500) })])
    const [shallow] = rankSources([source({ text: 'short' })])

    expect(deep.confidenceScore).toBeGreaterThan(shallow.confidenceScore)
  })

  it('never exceeds the 95 ceiling even with every factor maxed', () => {
    const [best] = rankSources(
      [source({ sourceType: 'company_website', validationScore: 90, sectorKey: 'tech', cityKey: 'cairo', companySizeKey: '51-200', text: 'x'.repeat(1000) })],
      { sectorHint: 'tech', cityHint: 'cairo', companySizeHint: '51-200' }
    )
    expect(best.confidenceScore).toBeLessThanOrEqual(95)
  })

  it('produces an explainable rankReason listing each contributing factor', () => {
    const [ranked] = rankSources(
      [source({ sourceType: 'company_website', validationScore: 90, sectorKey: 'tech' })],
      { sectorHint: 'tech' }
    )
    expect(ranked.rankReason).toMatch(/Validation score 90\/100/)
    expect(ranked.rankReason).toMatch(/Primary company website/)
    expect(ranked.rankReason).toMatch(/Industry matches search criteria/)
  })

  it('sorts results by descending confidence score', () => {
    const ranked = rankSources([
      source({ domain: 'low.com', sourceType: 'business_directory', validationScore: 60 }),
      source({ domain: 'high.com', sourceType: 'company_website', validationScore: 90 }),
    ])
    expect(ranked[0].domain).toBe('high.com')
    expect(ranked[1].domain).toBe('low.com')
  })
})
