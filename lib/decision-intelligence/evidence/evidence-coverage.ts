/**
 * Evidence Coverage Analysis — Sprint A2
 *
 * Answers the question: "Do we have the RIGHT evidence to make this decision?"
 *
 * Unlike the weighter (which asks "how much do we trust each item?"), the
 * coverage analyser asks "are the required CATEGORIES of evidence present?"
 *
 * This is critical for decision quality: a collection of 10 high-quality items
 * all from the same category (e.g., all user_input) does not provide the
 * diversity needed for a reliable decision.
 *
 * Functions provided:
 *   analyzeEvidenceCoverage  — full coverage report for a collection
 *   detectDuplicates         — groups of items covering the same information
 *   detectConflicts          — pairs of items with contradicting content
 *   generateMissingHints     — human-readable hints for what should be added
 */

import type { EvidenceItem, EvidenceCategory, ConflictPair, MissingEvidenceHint, EvidenceCoverageReport } from '../types/evidence.types'

// ---------------------------------------------------------------------------
// Expected categories per decision domain / report type
// ---------------------------------------------------------------------------

/**
 * Minimum evidence categories required for a reliable decision per report type.
 * Missing a HIGH-impact category degrades confidence significantly.
 */
const REQUIRED_CATEGORIES_BY_REPORT_TYPE: Record<string, {
  required: EvidenceCategory[]
  preferred: EvidenceCategory[]
}> = {
  feasibility: {
    required:  ['financial', 'user_provided'],
    preferred: ['benchmark', 'market_data'],
  },
  campaign_roi: {
    required:  ['market_data', 'user_provided'],
    preferred: ['benchmark', 'operational'],
  },
  market_entry: {
    required:  ['market_data', 'user_provided'],
    preferred: ['benchmark', 'operational', 'competitive'],
  },
  lead_gen: {
    required:  ['operational', 'user_provided'],
    preferred: ['benchmark', 'market_data'],
  },
  full_analysis: {
    required:  ['market_data', 'user_provided'],
    preferred: ['financial', 'benchmark', 'operational'],
  },
}

const FALLBACK_REQUIRED: EvidenceCategory[] = ['user_provided']
const FALLBACK_PREFERRED: EvidenceCategory[] = ['market_data', 'benchmark']

function getExpectedCategories(reportType?: string) {
  if (!reportType) return { required: FALLBACK_REQUIRED, preferred: FALLBACK_PREFERRED }
  return REQUIRED_CATEGORIES_BY_REPORT_TYPE[reportType] ?? { required: FALLBACK_REQUIRED, preferred: FALLBACK_PREFERRED }
}

// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------

/**
 * Identify groups of evidence items that likely cover the same information.
 *
 * Two items are considered potential duplicates if:
 * 1. They have the same title (case-insensitive, trimmed), OR
 * 2. They share the same category AND source type AND were collected within 60 seconds
 *
 * Returns arrays of evidence IDs grouped by suspected duplication.
 * Single items (no duplicates found) are not included.
 */
export function detectDuplicates(items: EvidenceItem[]): string[][] {
  const groups: Map<string, string[]> = new Map()

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]

      const sameTitle = a.title.trim().toLowerCase() === b.title.trim().toLowerCase()

      const sameCategory = a.category !== undefined && b.category !== undefined && a.category === b.category
      const sameSourceType = a.source.type === b.source.type
      const timeDeltaMs = Math.abs(
        new Date(a.source.retrievedAt).getTime() -
        new Date(b.source.retrievedAt).getTime()
      )
      const withinSixtySeconds = timeDeltaMs < 60_000
      const sameContextDuplicate = sameCategory && sameSourceType && withinSixtySeconds

      if (sameTitle || sameContextDuplicate) {
        const key = [a.id as string, b.id as string].sort().join('|')
        if (!groups.has(key)) groups.set(key, [a.id as string, b.id as string])
      }
    }
  }

  // Merge overlapping groups
  const merged: string[][] = []
  for (const pair of groups.values()) {
    const existing = merged.find(g => g.some(id => pair.includes(id)))
    if (existing) {
      for (const id of pair) { if (!existing.includes(id)) existing.push(id) }
    } else {
      merged.push([...pair])
    }
  }
  return merged
}

// ---------------------------------------------------------------------------
// Conflict detection
// ---------------------------------------------------------------------------

/**
 * Detect pairs of evidence items that appear to contradict each other.
 *
 * Detection strategy:
 * 1. Explicit: items with negative `references.relationWeight` to each other
 * 2. Implicit: two items in the same category with numeric content that
 *    disagrees by more than a threshold (>50% relative difference)
 *
 * Implicit detection only applies to items where the primary content is a
 * single number or an object with a single numeric key — to avoid false positives
 * on complex structured objects.
 */
export function detectConflicts(items: EvidenceItem[]): ConflictPair[] {
  const conflicts: ConflictPair[] = []
  const seen = new Set<string>()

  for (let i = 0; i < items.length; i++) {
    const a = items[i]

    // Explicit conflicts via negative reference weights
    for (const ref of a.references) {
      if (ref.relationWeight < 0) {
        const key = [a.id as string, ref.evidenceId as string].sort().join('|')
        if (!seen.has(key)) {
          seen.add(key)
          conflicts.push({
            evidenceIdA: a.id as string,
            evidenceIdB: ref.evidenceId as string,
            conflictDescription: ref.description || `Items "${a.title}" and another item were flagged as contradicting.`,
            severity: ref.relationWeight < -0.7 ? 'HIGH' : ref.relationWeight < -0.3 ? 'MEDIUM' : 'LOW',
          })
        }
      }
    }

    // Implicit conflicts — same category, numeric content that disagrees significantly
    if (!a.category) continue
    for (let j = i + 1; j < items.length; j++) {
      const b = items[j]
      if (!b.category || b.category !== a.category) continue

      const aNum = extractPrimaryNumber(a.content)
      const bNum = extractPrimaryNumber(b.content)
      if (aNum === null || bNum === null) continue
      if (aNum === 0 && bNum === 0) continue

      const larger = Math.max(Math.abs(aNum), Math.abs(bNum))
      const diff = Math.abs(aNum - bNum)
      const relativeDiff = larger > 0 ? diff / larger : 0

      if (relativeDiff > 0.5) {  // >50% disagreement
        const key = [a.id as string, b.id as string].sort().join('|')
        if (!seen.has(key)) {
          seen.add(key)
          conflicts.push({
            evidenceIdA: a.id as string,
            evidenceIdB: b.id as string,
            conflictDescription: `Both items are in the "${a.category}" category but their primary numeric values disagree by ${(relativeDiff * 100).toFixed(0)}% (${formatNum(aNum)} vs ${formatNum(bNum)}).`,
            severity: relativeDiff > 0.9 ? 'HIGH' : relativeDiff > 0.7 ? 'MEDIUM' : 'LOW',
          })
        }
      }
    }
  }

  return conflicts
}

function extractPrimaryNumber(content: string | number | Record<string, unknown>): number | null {
  if (typeof content === 'number') return content
  if (typeof content === 'string') {
    const n = Number(content)
    return isNaN(n) ? null : n
  }
  if (typeof content === 'object' && content !== null) {
    const numericValues = Object.values(content).filter(v => typeof v === 'number') as number[]
    return numericValues.length === 1 ? numericValues[0] : null
  }
  return null
}

function formatNum(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

// ---------------------------------------------------------------------------
// Missing evidence hints
// ---------------------------------------------------------------------------

const MISSING_HINTS: Record<EvidenceCategory, MissingEvidenceHint> = {
  financial: {
    category: 'financial',
    description: 'Financial analysis evidence (NPV, ROI, cost projections) is missing. Decisions without financial data rely on qualitative judgment.',
    impact: 'HIGH',
  },
  market_data: {
    category: 'market_data',
    description: 'Market data evidence (CPL benchmarks, lead volumes, market size) is missing. Market positioning decisions require this data.',
    impact: 'HIGH',
  },
  user_provided: {
    category: 'user_provided',
    description: 'User-supplied context is minimal. More specific input about the business context improves recommendation accuracy.',
    impact: 'MEDIUM',
  },
  benchmark: {
    category: 'benchmark',
    description: 'Industry benchmark data is absent. Without benchmarks, performance cannot be compared to market standards.',
    impact: 'MEDIUM',
  },
  operational: {
    category: 'operational',
    description: 'Operational metrics (capacity, timelines, efficiency) are missing. Execution feasibility cannot be fully assessed.',
    impact: 'MEDIUM',
  },
  risk_data: {
    category: 'risk_data',
    description: 'Risk factor data is not present. The analysis may understate exposure to market or operational risks.',
    impact: 'LOW',
  },
  competitive: {
    category: 'competitive',
    description: 'No competitive intelligence. Market entry and positioning decisions are stronger with competitor context.',
    impact: 'LOW',
  },
}

export function generateMissingEvidenceHints(
  missingCategories: EvidenceCategory[],
): MissingEvidenceHint[] {
  return missingCategories.map(cat => MISSING_HINTS[cat]).filter(Boolean)
}

// ---------------------------------------------------------------------------
// Coverage score computation
// ---------------------------------------------------------------------------

function computeCoverageScore(
  covered: Set<EvidenceCategory>,
  required: EvidenceCategory[],
  preferred: EvidenceCategory[],
): number {
  if (required.length === 0 && preferred.length === 0) return 50  // no guidance

  const requiredCovered = required.filter(c => covered.has(c)).length
  const preferredCovered = preferred.filter(c => covered.has(c)).length

  // Required categories account for 70% of the score; preferred for 30%
  const requiredScore = required.length > 0 ? (requiredCovered / required.length) * 70 : 70
  const preferredScore = preferred.length > 0 ? (preferredCovered / preferred.length) * 30 : 30

  return Math.round(requiredScore + preferredScore)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface AnalyzeCoverageOptions {
  /** The report type — used to determine expected evidence categories. */
  readonly reportType?: string
  /** Override the expected required categories (skips reportType lookup). */
  readonly requiredCategories?: EvidenceCategory[]
  /** Override the preferred categories. */
  readonly preferredCategories?: EvidenceCategory[]
}

/**
 * Analyze the evidence collection for coverage, duplicates, and conflicts.
 *
 * Returns an `EvidenceCoverageReport` that the confidence engine uses to
 * adjust the `evidence_quality` dimension and set `sufficientForDecision`.
 */
export function analyzeEvidenceCoverage(
  items: EvidenceItem[],
  options: AnalyzeCoverageOptions = {},
): EvidenceCoverageReport {
  const { reportType, requiredCategories, preferredCategories } = options
  const expected = getExpectedCategories(reportType)

  const required  = requiredCategories  ?? expected.required
  const preferred = preferredCategories ?? expected.preferred

  // Which categories are present
  const covered = new Set<EvidenceCategory>(
    items.map(i => i.category).filter((c): c is EvidenceCategory => c !== undefined)
  )

  const categoriesCovered = Array.from(covered)
  const categoriesMissing = [...required, ...preferred].filter(c => !covered.has(c))

  const coverageScore = computeCoverageScore(covered, required, preferred)

  const duplicateGroups = detectDuplicates(items)
  const conflictPairs   = detectConflicts(items)

  const missingRequired  = required.filter(c => !covered.has(c))
  const missingPreferred = preferred.filter(c => !covered.has(c))
  const missingEvidenceHints = generateMissingEvidenceHints([...missingRequired, ...missingPreferred])

  // Sufficient = all required categories covered AND no critical conflicts
  const allRequiredCovered = required.every(c => covered.has(c))
  const hasCriticalConflict = conflictPairs.some(p => p.severity === 'HIGH')
  const sufficientForDecision = allRequiredCovered && !hasCriticalConflict && items.length > 0

  return {
    categoriesCovered,
    categoriesMissing,
    coverageScore,
    duplicateGroups,
    conflictPairs,
    missingEvidenceHints,
    sufficientForDecision,
  }
}
