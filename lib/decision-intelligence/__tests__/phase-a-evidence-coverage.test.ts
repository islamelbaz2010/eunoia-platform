/**
 * Phase A — Sprint A2: Evidence Intelligence
 *
 * Tests for coverage analysis, duplicate detection, conflict detection,
 * and missing evidence hints. These are the analytical layer that tells
 * the confidence engine "do we have the RIGHT evidence?" — not just
 * "how good is the evidence we have?"
 */

import { describe, it, expect } from 'vitest'
import {
  analyzeEvidenceCoverage,
  detectDuplicates,
  detectConflicts,
  generateMissingEvidenceHints,
} from '../evidence/evidence-coverage'
import { evidenceId } from '../types/evidence.types'
import type { EvidenceItem, EvidenceCategory } from '../types/evidence.types'

// ---------------------------------------------------------------------------
// Test fixture builder
// ---------------------------------------------------------------------------

let _seq = 0
function makeItem(overrides: Partial<EvidenceItem> & { id?: string }): EvidenceItem {
  const id = overrides.id ?? `ev-${++_seq}`
  return {
    id: evidenceId(id),
    title: overrides.title ?? `Evidence ${id}`,
    content: overrides.content ?? 'Test content',
    source: overrides.source ?? {
      type: 'user_input',
      label: 'Test Source',
      uri: null,
      retrievedAt: new Date().toISOString(),
    },
    freshness: overrides.freshness ?? 0.9,
    confidence: overrides.confidence ?? 0.8,
    references: overrides.references ?? [],
    tags: overrides.tags ?? {},
    createdAt: new Date().toISOString(),
    category: overrides.category,
  }
}

// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------

describe('Sprint A2 — Duplicate Detection', () => {
  it('returns empty when no duplicates exist', () => {
    const items = [
      makeItem({ title: 'Revenue Projection', category: 'financial' }),
      makeItem({ title: 'Market Size', category: 'market_data' }),
    ]
    expect(detectDuplicates(items)).toHaveLength(0)
  })

  it('detects duplicate by identical title (case-insensitive)', () => {
    const items = [
      makeItem({ id: 'a', title: 'Revenue Projection' }),
      makeItem({ id: 'b', title: 'revenue projection' }),
      makeItem({ id: 'c', title: 'Market Size' }),
    ]
    const groups = detectDuplicates(items)
    expect(groups).toHaveLength(1)
    expect(groups[0]).toContain('a')
    expect(groups[0]).toContain('b')
    expect(groups[0]).not.toContain('c')
  })

  it('detects duplicate by same category + same source type + within 60 seconds', () => {
    const ts = new Date('2026-07-30T10:00:00Z').toISOString()
    const items = [
      makeItem({
        id: 'x',
        category: 'financial',
        source: { type: 'user_input', label: 'A', uri: null, retrievedAt: ts },
      }),
      makeItem({
        id: 'y',
        category: 'financial',
        source: { type: 'user_input', label: 'B', uri: null, retrievedAt: ts },
      }),
    ]
    const groups = detectDuplicates(items)
    expect(groups).toHaveLength(1)
    expect(groups[0]).toContain('x')
    expect(groups[0]).toContain('y')
  })

  it('does not flag same category/type items more than 60 seconds apart', () => {
    const items = [
      makeItem({
        id: 'x',
        category: 'financial',
        source: {
          type: 'user_input', label: 'A', uri: null,
          retrievedAt: new Date('2026-07-30T10:00:00Z').toISOString(),
        },
      }),
      makeItem({
        id: 'y',
        category: 'financial',
        source: {
          type: 'user_input', label: 'B', uri: null,
          retrievedAt: new Date('2026-07-30T10:02:00Z').toISOString(),  // 2 minutes later
        },
      }),
    ]
    expect(detectDuplicates(items)).toHaveLength(0)
  })

  it('groups three identical-title items into a single group', () => {
    const items = [
      makeItem({ id: 'a', title: 'Campaign ROI' }),
      makeItem({ id: 'b', title: 'Campaign ROI' }),
      makeItem({ id: 'c', title: 'Campaign ROI' }),
    ]
    const groups = detectDuplicates(items)
    expect(groups).toHaveLength(1)
    expect(groups[0]).toContain('a')
    expect(groups[0]).toContain('b')
    expect(groups[0]).toContain('c')
  })
})

// ---------------------------------------------------------------------------
// Conflict detection
// ---------------------------------------------------------------------------

describe('Sprint A2 — Conflict Detection', () => {
  it('returns empty when no conflicts exist', () => {
    const items = [
      makeItem({ id: 'a', category: 'financial', content: 100 }),
      makeItem({ id: 'b', category: 'market_data', content: 200 }),
    ]
    expect(detectConflicts(items)).toHaveLength(0)
  })

  it('detects explicit conflict via negative reference weight', () => {
    const items = [
      makeItem({
        id: 'a',
        references: [{
          evidenceId: evidenceId('b'),
          relationWeight: -0.8,
          description: 'Directly contradicts',
        }],
      }),
      makeItem({ id: 'b', references: [] }),
    ]
    const conflicts = detectConflicts(items)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].severity).toBe('HIGH')
    expect([conflicts[0].evidenceIdA, conflicts[0].evidenceIdB]).toContain('a')
    expect([conflicts[0].evidenceIdA, conflicts[0].evidenceIdB]).toContain('b')
  })

  it('assigns MEDIUM severity for relation weight between -0.3 and -0.7', () => {
    const items = [
      makeItem({
        id: 'a',
        references: [{
          evidenceId: evidenceId('b'),
          relationWeight: -0.5,
          description: 'Partially contradicts',
        }],
      }),
      makeItem({ id: 'b', references: [] }),
    ]
    const conflicts = detectConflicts(items)
    expect(conflicts[0].severity).toBe('MEDIUM')
  })

  it('detects implicit conflict: same category, numeric values diverge >50%', () => {
    const items = [
      makeItem({ id: 'a', category: 'financial', content: 100 }),
      makeItem({ id: 'b', category: 'financial', content: 1 }),  // 99% difference → HIGH
    ]
    const conflicts = detectConflicts(items)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].severity).toBe('HIGH')  // relativeDiff = 0.99 > 0.9 → HIGH
  })

  it('does NOT flag same category items with <50% numeric difference as conflicts', () => {
    const items = [
      makeItem({ id: 'a', category: 'financial', content: 100 }),
      makeItem({ id: 'b', category: 'financial', content: 75 }),  // 25% difference
    ]
    expect(detectConflicts(items)).toHaveLength(0)
  })

  it('does not flag items in different categories as implicit conflicts', () => {
    const items = [
      makeItem({ id: 'a', category: 'financial', content: 100 }),
      makeItem({ id: 'b', category: 'market_data', content: 1 }),  // 99% difference but different categories
    ]
    expect(detectConflicts(items)).toHaveLength(0)
  })

  it('does not double-count the same conflict pair', () => {
    // Both items reference each other negatively — should appear only once
    const items = [
      makeItem({
        id: 'a',
        references: [{ evidenceId: evidenceId('b'), relationWeight: -0.9, description: 'Contradicts' }],
      }),
      makeItem({
        id: 'b',
        references: [{ evidenceId: evidenceId('a'), relationWeight: -0.9, description: 'Contradicts' }],
      }),
    ]
    const conflicts = detectConflicts(items)
    expect(conflicts).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Missing evidence hints
// ---------------------------------------------------------------------------

describe('Sprint A2 — Missing Evidence Hints', () => {
  it('returns one hint per missing category', () => {
    const hints = generateMissingEvidenceHints(['financial', 'market_data'])
    expect(hints).toHaveLength(2)
    expect(hints.map(h => h.category)).toContain('financial')
    expect(hints.map(h => h.category)).toContain('market_data')
  })

  it('financial hint is HIGH impact', () => {
    const hints = generateMissingEvidenceHints(['financial'])
    expect(hints[0].impact).toBe('HIGH')
  })

  it('competitive hint is LOW impact', () => {
    const hints = generateMissingEvidenceHints(['competitive'])
    expect(hints[0].impact).toBe('LOW')
  })

  it('returns empty array for no missing categories', () => {
    expect(generateMissingEvidenceHints([])).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Full coverage analysis
// ---------------------------------------------------------------------------

describe('Sprint A2 — Full Coverage Analysis', () => {
  it('coverage score is 100 when all required and preferred categories are present', () => {
    const items: EvidenceItem[] = [
      makeItem({ category: 'financial' }),
      makeItem({ category: 'user_provided' }),
      makeItem({ category: 'benchmark' }),
      makeItem({ category: 'market_data' }),
    ]
    const report = analyzeEvidenceCoverage(items, { reportType: 'feasibility' })
    expect(report.coverageScore).toBe(100)
  })

  it('coverage score is 0 when no required or preferred categories are present', () => {
    const items = [
      makeItem({ category: 'risk_data' }),   // not required/preferred for feasibility
      makeItem({ category: 'competitive' }),
    ]
    const report = analyzeEvidenceCoverage(items, { reportType: 'feasibility' })
    // required: financial, user_provided (70% weight), preferred: benchmark, market_data (30%)
    expect(report.coverageScore).toBe(0)
  })

  it('required categories account for 70% of coverage score', () => {
    // feasibility required: financial, user_provided
    // Give only required, no preferred
    const items = [
      makeItem({ category: 'financial' }),
      makeItem({ category: 'user_provided' }),
    ]
    const report = analyzeEvidenceCoverage(items, { reportType: 'feasibility' })
    // required 100% covered = 70pts; preferred 0% covered = 0pts → 70
    expect(report.coverageScore).toBe(70)
  })

  it('sufficientForDecision is true when all required categories present and no HIGH conflicts', () => {
    const items = [
      makeItem({ category: 'financial', content: 100 }),
      makeItem({ category: 'user_provided', content: 'context data' }),
    ]
    const report = analyzeEvidenceCoverage(items, { reportType: 'feasibility' })
    expect(report.sufficientForDecision).toBe(true)
  })

  it('sufficientForDecision is false when a required category is missing', () => {
    const items = [
      makeItem({ category: 'financial' }),  // user_provided is missing
    ]
    const report = analyzeEvidenceCoverage(items, { reportType: 'feasibility' })
    expect(report.sufficientForDecision).toBe(false)
  })

  it('sufficientForDecision is false when a HIGH severity conflict exists', () => {
    const items = [
      makeItem({
        id: 'a', category: 'financial',
        references: [{ evidenceId: evidenceId('b'), relationWeight: -0.9, description: 'Contradicts' }],
      }),
      makeItem({ id: 'b', category: 'user_provided', references: [] }),
    ]
    const report = analyzeEvidenceCoverage(items, { reportType: 'feasibility' })
    // HIGH conflict → not sufficient
    expect(report.sufficientForDecision).toBe(false)
  })

  it('sufficientForDecision is false when items array is empty', () => {
    const report = analyzeEvidenceCoverage([], { reportType: 'feasibility' })
    expect(report.sufficientForDecision).toBe(false)
  })

  it('categoriesCovered lists only categories present in the collection', () => {
    const items = [
      makeItem({ category: 'financial' }),
      makeItem({ category: 'market_data' }),
      makeItem({ }),  // no category
    ]
    const report = analyzeEvidenceCoverage(items)
    expect(report.categoriesCovered).toContain('financial')
    expect(report.categoriesCovered).toContain('market_data')
    expect(report.categoriesCovered).not.toContain(undefined)
  })

  it('categoriesMissing includes required and preferred categories not in the collection', () => {
    const items = [makeItem({ category: 'user_provided' })]
    const report = analyzeEvidenceCoverage(items, { reportType: 'feasibility' })
    expect(report.categoriesMissing).toContain('financial')       // required
    expect(report.categoriesMissing).toContain('benchmark')       // preferred
    expect(report.categoriesMissing).toContain('market_data')     // preferred
    expect(report.categoriesMissing).not.toContain('user_provided') // covered
  })

  it('respects custom requiredCategories override', () => {
    const items = [makeItem({ category: 'risk_data' })]
    const report = analyzeEvidenceCoverage(items, {
      requiredCategories: ['risk_data'],
      preferredCategories: [],
    })
    expect(report.sufficientForDecision).toBe(true)
    // required 100% covered = 70pts; preferred empty → full 30pts by formula → total 100
    expect(report.coverageScore).toBe(100)
  })

  it('duplicateGroups and conflictPairs are populated in the combined report', () => {
    const ts = new Date().toISOString()
    const items = [
      makeItem({
        id: 'dup1',
        title: 'Market Size',
        category: 'market_data',
        content: 100,
        source: { type: 'user_input', label: 'A', uri: null, retrievedAt: ts },
      }),
      makeItem({
        id: 'dup2',
        title: 'Market Size',  // duplicate title
        category: 'financial',
        content: 5,  // large numeric conflict with next item
        source: { type: 'external_source', label: 'B', uri: null, retrievedAt: ts },
      }),
      makeItem({
        id: 'conf1',
        category: 'financial',
        content: 1000,  // >50% conflict with dup2 (5 vs 1000)
        source: { type: 'user_input', label: 'C', uri: null, retrievedAt: ts },
      }),
    ]
    const report = analyzeEvidenceCoverage(items)
    expect(report.duplicateGroups.length).toBeGreaterThan(0)
    expect(report.conflictPairs.length).toBeGreaterThan(0)
  })

  it('generates missing hints for each absent required and preferred category', () => {
    const items = [makeItem({ category: 'financial' })]
    const report = analyzeEvidenceCoverage(items, { reportType: 'feasibility' })
    // user_provided required missing + benchmark + market_data preferred missing
    expect(report.missingEvidenceHints.length).toBeGreaterThanOrEqual(3)
    expect(report.missingEvidenceHints.map(h => h.category)).toContain('user_provided')
    expect(report.missingEvidenceHints.map(h => h.category)).toContain('benchmark')
  })
})
