import { describe, it, expect } from 'vitest'
import { extractMentionedDomains } from './company-expansion'
import type { NormalizedSource } from './acquisition/types'

function source(overrides: Partial<NormalizedSource>): Pick<NormalizedSource, 'domain' | 'sourceType' | 'text'> {
  return {
    domain: 'directory.com',
    sourceType: 'business_directory',
    text: 'x'.repeat(200),
    ...overrides,
  }
}

describe('extractMentionedDomains', () => {
  it('extracts a new company domain mentioned in a business directory listing', () => {
    const result = extractMentionedDomains([
      source({ text: `Top manufacturers in Cairo: Acme Corp — acmecorp.com, a leading supplier. ${'x'.repeat(250)}` }),
    ])
    expect(result).toContain('acmecorp.com')
  })

  it('strips a leading www. before returning the domain', () => {
    const result = extractMentionedDomains([
      source({ text: `Visit www.acmecorp.com for more information about this manufacturer. ${'x'.repeat(250)}` }),
    ])
    expect(result).toContain('acmecorp.com')
    expect(result).not.toContain('www.acmecorp.com')
  })

  it('lowercases the extracted domain', () => {
    const result = extractMentionedDomains([
      source({ text: `Contact ACMECORP.COM for a quote on industrial equipment today. ${'x'.repeat(250)}` }),
    ])
    expect(result).toContain('acmecorp.com')
  })

  it('excludes the mentioning source own domain (self-reference)', () => {
    const result = extractMentionedDomains([
      source({ domain: 'acmecorp.com', text: `Acme Corp, reachable at acmecorp.com, is a manufacturer. ${'x'.repeat(250)}` }),
    ])
    expect(result).not.toContain('acmecorp.com')
  })

  it('excludes a domain already present among the known sources', () => {
    const result = extractMentionedDomains([
      source({ domain: 'directory.com', text: `See also betaco.com, a known supplier in the same sector. ${'x'.repeat(250)}` }),
      source({ domain: 'betaco.com', sourceType: 'company_website', text: 'Beta Co homepage' }),
    ])
    expect(result).not.toContain('betaco.com')
  })

  it('ignores mentions on non-directory sources', () => {
    const result = extractMentionedDomains([
      source({ sourceType: 'company_website', text: `Our partner betaco.com helped us build this. ${'x'.repeat(250)}` }),
    ])
    expect(result).toEqual([])
  })

  it('skips sources with too little text to be a real listing', () => {
    const result = extractMentionedDomains([
      source({ text: 'acmecorp.com' }),
    ])
    expect(result).toEqual([])
  })

  it('excludes common file extensions misidentified as domains', () => {
    const result = extractMentionedDomains([
      source({ text: `Download our brochure report.pdf or view image.png for details. ${'x'.repeat(250)}` }),
    ])
    expect(result).not.toContain('report.pdf')
    expect(result).not.toContain('image.png')
  })

  it('excludes generic non-company platforms', () => {
    const result = extractMentionedDomains([
      source({ text: `Find us on facebook.com or email info@gmail.com for inquiries. ${'x'.repeat(250)}` }),
    ])
    expect(result).not.toContain('facebook.com')
    expect(result).not.toContain('gmail.com')
  })

  it('dedupes the same domain mentioned multiple times across sources', () => {
    const result = extractMentionedDomains([
      source({ domain: 'directory1.com', text: `Acme Corp at acmecorp.com is a top supplier. ${'x'.repeat(250)}` }),
      source({ domain: 'directory2.com', text: `Acme Corp (acmecorp.com) also appears here. ${'x'.repeat(250)}` }),
    ])
    expect(result.filter(d => d === 'acmecorp.com')).toHaveLength(1)
  })

  it('caps the number of returned candidates at the given limit', () => {
    const text = `alpha.com beta.com gamma.com delta.com epsilon.com zeta.com ${'x'.repeat(250)}`
    const result = extractMentionedDomains([source({ text })], { limit: 3 })
    expect(result).toHaveLength(3)
  })

  it('caps at the default limit when none is specified', () => {
    const text = `alpha.com beta.com gamma.com delta.com epsilon.com zeta.com eta.com ${'x'.repeat(250)}`
    const result = extractMentionedDomains([source({ text })])
    expect(result.length).toBeLessThanOrEqual(5)
  })

  it('returns an empty array when nothing qualifies', () => {
    expect(extractMentionedDomains([])).toEqual([])
  })
})
