import { describe, it, expect } from 'vitest'
import { validateCompanySource, filterValidSources } from './company-validation'
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

describe('validateCompanySource', () => {
  it('accepts a real company website', () => {
    const result = validateCompanySource(source({ domain: 'acmecorp.com', url: 'https://acmecorp.com/' }))
    expect(result.isValid).toBe(true)
    expect(result.validationScore).toBeGreaterThanOrEqual(80)
  })

  it('rejects Wikipedia', () => {
    const result = validateCompanySource(
      source({ domain: 'en.wikipedia.org', url: 'https://en.wikipedia.org/wiki/Acme', sourceType: 'company_website' })
    )
    expect(result.isValid).toBe(false)
    expect(result.validationReason).toMatch(/wiki/i)
  })

  it('rejects government domains', () => {
    const result = validateCompanySource(
      source({ domain: 'investment.gov.eg', url: 'https://investment.gov.eg/', sourceType: 'company_website' })
    )
    expect(result.isValid).toBe(false)
    expect(result.validationReason).toMatch(/government/i)
  })

  it('rejects job boards', () => {
    const result = validateCompanySource(
      source({ domain: 'wuzzuf.net', url: 'https://wuzzuf.net/jobs/acme', sourceType: 'company_website' })
    )
    expect(result.isValid).toBe(false)
    expect(result.validationReason).toMatch(/job board/i)
  })

  it('rejects forums', () => {
    const result = validateCompanySource(
      source({ domain: 'reddit.com', url: 'https://reddit.com/r/cairo/comments/xyz', sourceType: 'company_website' })
    )
    expect(result.isValid).toBe(false)
    expect(result.validationReason).toMatch(/forum/i)
  })

  it('rejects directories and aggregators', () => {
    const result = validateCompanySource(
      source({ domain: 'crunchbase.com', url: 'https://crunchbase.com/organization/acme', sourceType: 'business_directory' })
    )
    expect(result.isValid).toBe(false)
    expect(result.validationReason).toMatch(/directory|aggregator/i)
  })

  it('rejects social media groups but accepts official social profiles', () => {
    const group = validateCompanySource(
      source({ domain: 'facebook.com', url: 'https://facebook.com/groups/cairo-business/', sourceType: 'public_listing' })
    )
    expect(group.isValid).toBe(false)

    const profile = validateCompanySource(
      source({ domain: 'facebook.com', url: 'https://facebook.com/AcmeCorp', sourceType: 'public_listing' })
    )
    expect(profile.isValid).toBe(true)
  })
})

describe('filterValidSources', () => {
  it('drops invalid sources and stamps validation fields on survivors', () => {
    const sources: NormalizedSource[] = [
      source({ domain: 'acmecorp.com', url: 'https://acmecorp.com/' }),
      source({ domain: 'en.wikipedia.org', url: 'https://en.wikipedia.org/wiki/Acme' }),
    ]

    const result = filterValidSources(sources)

    expect(result).toHaveLength(1)
    expect(result[0].domain).toBe('acmecorp.com')
    expect(result[0].validationScore).toBeGreaterThan(0)
    expect(result[0].validationReason).toBeTruthy()
  })
})
