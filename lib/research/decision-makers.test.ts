import { describe, it, expect } from 'vitest'
import { recommendDecisionMakerTitles } from './decision-makers'

describe('recommendDecisionMakerTitles', () => {
  it('passes through an unrecognized title unchanged', () => {
    const recs = recommendDecisionMakerTitles('Regional Sales Lead')
    expect(recs).toEqual([{ title: 'Regional Sales Lead', reason: 'Searching for the exact title you specified.' }])
  })

  it('always lists the exact user-typed title first', () => {
    const recs = recommendDecisionMakerTitles('CEO')
    expect(recs[0].title).toBe('CEO')
  })

  it('adds a genuine equivalent title when the input matches a known role cluster', () => {
    const recs = recommendDecisionMakerTitles('Marketing Director')
    expect(recs.length).toBeGreaterThan(1)
    expect(recs.some(r => r.title === 'CMO' || r.title === 'VP Marketing' || r.title === 'Head of Marketing')).toBe(true)
  })

  it('matches a role cluster case-insensitively', () => {
    const recs = recommendDecisionMakerTitles('ceo')
    expect(recs.length).toBeGreaterThan(1)
  })

  it('prefers "Founder" as the equivalent for a small company searching CEO', () => {
    const recs = recommendDecisionMakerTitles('CEO', '1-10')
    expect(recs.some(r => r.title === 'Founder')).toBe(true)
  })

  it('does not prefer "Founder" for a large company searching CEO', () => {
    const recs = recommendDecisionMakerTitles('CEO', '500+')
    expect(recs.some(r => r.title === 'Founder')).toBe(false)
  })

  it('never duplicates a title that is both the literal input and the small-company preference', () => {
    const recs = recommendDecisionMakerTitles('Founder', '1-10')
    const titles = recs.map(r => r.title.toLowerCase())
    expect(titles.filter(t => t === 'founder')).toHaveLength(1)
  })

  it('caps recommendations at two per input title', () => {
    const recs = recommendDecisionMakerTitles('CEO', '1-10')
    expect(recs.length).toBeLessThanOrEqual(2)
  })

  it('treats an unrecognized company size bucket as no size signal', () => {
    const recs = recommendDecisionMakerTitles('CEO', 'not-a-bucket')
    expect(recs.some(r => r.title === 'Founder')).toBe(false)
  })
})
