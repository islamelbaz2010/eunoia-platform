import { describe, it, expect } from 'vitest'
import { normalizeCompanyName, dedupeCompanies } from './dedup'
import type { NormalizedSource } from './acquisition/types'

function source(overrides: Partial<NormalizedSource>): NormalizedSource {
  return {
    domain: 'example.com',
    title: 'Example',
    url: 'https://example.com/',
    sourceType: 'company_website',
    text: 'Some text',
    ...overrides,
  }
}

describe('normalizeCompanyName', () => {
  it('strips legal suffixes regardless of casing/order', () => {
    expect(normalizeCompanyName('Acme Corp')).toBe('acme')
    expect(normalizeCompanyName('ACME CORPORATION')).toBe('acme')
    expect(normalizeCompanyName('Corp Acme')).toBe('acme')
  })

  it('strips trailing platform chrome', () => {
    expect(normalizeCompanyName('Acme Corp | Facebook')).toBe('acme')
    expect(normalizeCompanyName('Acme Corp - LinkedIn')).toBe('acme')
  })

  it('splits camelCase handles into words', () => {
    expect(normalizeCompanyName('AcmeCorpEgypt')).toBe('acme egypt')
    expect(normalizeCompanyName('Acme Corp Egypt')).toBe('acme egypt')
  })
})

describe('dedupeCompanies', () => {
  it('merges a company website with its Facebook page', () => {
    const sources: NormalizedSource[] = [
      source({
        domain: 'acmecorp.com',
        url: 'https://acmecorp.com/',
        title: 'Acme Corp - Industrial Solutions in Cairo',
        sourceType: 'company_website',
        validationScore: 90,
      }),
      source({
        domain: 'facebook.com',
        url: 'https://facebook.com/AcmeCorp',
        title: 'Acme Corp | Facebook',
        sourceType: 'public_listing',
        validationScore: 70,
      }),
    ]

    const result = dedupeCompanies(sources)

    expect(result).toHaveLength(1)
    expect(result[0].domain).toBe('acmecorp.com')
  })

  it('merges a company website with its LinkedIn company page', () => {
    const sources: NormalizedSource[] = [
      source({
        domain: 'acme-corp.com',
        url: 'https://acme-corp.com/',
        title: 'Acme Corp',
        sourceType: 'company_website',
        validationScore: 90,
      }),
      source({
        domain: 'linkedin.com',
        url: 'https://linkedin.com/company/acme-corp',
        title: 'Acme Corp - LinkedIn',
        sourceType: 'public_listing',
        validationScore: 70,
      }),
    ]

    const result = dedupeCompanies(sources)
    expect(result).toHaveLength(1)
  })

  it('keeps distinct companies separate', () => {
    const sources: NormalizedSource[] = [
      source({ domain: 'acmecorp.com', url: 'https://acmecorp.com/', title: 'Acme Corp', validationScore: 90 }),
      source({ domain: 'beta-industries.com', url: 'https://beta-industries.com/', title: 'Beta Industries', validationScore: 85 }),
    ]

    const result = dedupeCompanies(sources)
    expect(result).toHaveLength(2)
  })

  it('picks the highest-validationScore representative from a duplicate group', () => {
    const sources: NormalizedSource[] = [
      source({
        domain: 'facebook.com',
        url: 'https://facebook.com/AcmeCorp',
        title: 'Acme Corp | Facebook',
        sourceType: 'public_listing',
        validationScore: 70,
      }),
      source({
        domain: 'acmecorp.com',
        url: 'https://acmecorp.com/',
        title: 'Acme Corp - Official Site',
        sourceType: 'company_website',
        validationScore: 90,
      }),
    ]

    const result = dedupeCompanies(sources)
    expect(result).toHaveLength(1)
    expect(result[0].domain).toBe('acmecorp.com')
  })

  it('does not merge two different companies with generic single-word titles', () => {
    const sources: NormalizedSource[] = [
      source({ domain: 'site-one.com', url: 'https://site-one.com/', title: 'Home', validationScore: 60 }),
      source({ domain: 'site-two.com', url: 'https://site-two.com/', title: 'Home', validationScore: 60 }),
    ]

    const result = dedupeCompanies(sources)
    expect(result).toHaveLength(2)
  })
})
