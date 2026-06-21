import { describe, it, expect } from 'vitest'
import { companySizeQueryModifier, extractCompanySizeKey } from './company-size'

describe('companySizeQueryModifier', () => {
  it('returns a search-query modifier for each known bucket', () => {
    expect(companySizeQueryModifier('1-10')).toBe('small business')
    expect(companySizeQueryModifier('11-50')).toBe('small to medium business')
    expect(companySizeQueryModifier('51-200')).toBe('mid-size company')
    expect(companySizeQueryModifier('201-500')).toBe('large company')
    expect(companySizeQueryModifier('500+')).toBe('enterprise')
  })

  it('returns undefined for an unrecognized bucket', () => {
    expect(companySizeQueryModifier('not-a-bucket')).toBeUndefined()
  })
})

describe('extractCompanySizeKey', () => {
  it('extracts and buckets a simple employee-count mention', () => {
    expect(extractCompanySizeKey('We are a team of 25 employees serving the region.')).toBe('11-50')
  })

  it('extracts a "team of N" mention without the word employees', () => {
    expect(extractCompanySizeKey('Our team of 8 specialists handles every project personally.')).toBe('1-10')
  })

  it('handles comma-formatted large numbers', () => {
    expect(extractCompanySizeKey('A multinational with over 1,200 employees worldwide.')).toBe('500+')
  })

  it('recognizes staff/workers/personnel phrasing', () => {
    expect(extractCompanySizeKey('The factory employs 150 staff across two shifts.')).toBe('51-200')
    expect(extractCompanySizeKey('Over 300 workers are based at this site.')).toBe('201-500')
    expect(extractCompanySizeKey('Our personnel count exceeds 75 personnel.')).toBe('51-200')
  })

  it.each([
    [10, '1-10'],
    [11, '11-50'],
    [50, '11-50'],
    [51, '51-200'],
    [200, '51-200'],
    [201, '201-500'],
    [500, '201-500'],
    [501, '500+'],
  ])('buckets %i employees as %s', (count, expected) => {
    expect(extractCompanySizeKey(`A company with ${count} employees in total.`)).toBe(expected)
  })

  it('returns undefined when no headcount is mentioned at all', () => {
    expect(extractCompanySizeKey('Acme Corp is a manufacturer of industrial parts based in Cairo.')).toBeUndefined()
  })

  it('returns undefined for a zero or nonsensical count', () => {
    expect(extractCompanySizeKey('We currently have 0 employees listed here.')).toBeUndefined()
  })
})
