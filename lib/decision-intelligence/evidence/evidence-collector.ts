/**
 * Evidence Collector — builds and validates an EvidenceCollection for a decision.
 *
 * The collector accepts raw evidence items, validates each one, computes freshness
 * scores, detects contradictions, and returns a complete EvidenceCollection with
 * aggregated statistics. It is pure: no I/O, no side effects.
 */

import { randomUUID } from 'crypto'
import type {
  EvidenceItem,
  EvidenceId,
  EvidenceCollection,
  EvidenceCollectionStats,
  EvidenceSourceType,
  EvidenceReference,
} from '../types/evidence.types'
import { evidenceId } from '../types/evidence.types'

// ---------------------------------------------------------------------------
// Freshness half-lives — how quickly each source type becomes stale
// ---------------------------------------------------------------------------

/**
 * Half-life in hours for each source type. Used to decay freshness scores.
 * After one half-life the freshness drops to 0.5; after two, to 0.25.
 *
 * human_validation has the longest half-life because expert assessments
 * represent deliberate, time-stable judgements. External data (scraped) decays
 * fastest because market conditions change rapidly.
 */
const FRESHNESS_HALF_LIFE_HOURS: Record<EvidenceSourceType, number> = {
  human_validation: 720,   // 30 days
  internal_data:    168,   // 7 days
  user_input:       168,   // 7 days
  document:         720,   // 30 days
  external_source:  24,    // 1 day
  ai_analysis:      48,    // 2 days
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RawEvidenceInput {
  readonly title: string
  readonly content: string | number | Record<string, unknown>
  readonly sourceType: EvidenceSourceType
  readonly sourceLabel: string
  readonly sourceUri?: string
  /** ISO-8601 timestamp when this evidence was retrieved. Defaults to now. */
  readonly retrievedAt?: string
  /**
   * Domain-specific confidence in this evidence item (0–1).
   * Callers supply this based on their knowledge of the source's reliability.
   * Defaults to the source type's authority weight if omitted.
   */
  readonly confidence?: number
  readonly references?: Omit<EvidenceReference, never>[]
  readonly tags?: Record<string, string>
}

export interface CollectEvidenceOptions {
  readonly decisionId: string
  readonly items: RawEvidenceInput[]
}

export interface CollectEvidenceResult {
  readonly collection: EvidenceCollection
  readonly errors: EvidenceCollectionError[]
}

export interface EvidenceCollectionError {
  readonly index: number
  readonly title: string
  readonly reason: string
}

// ---------------------------------------------------------------------------
// Freshness computation
// ---------------------------------------------------------------------------

function computeFreshness(sourceType: EvidenceSourceType, retrievedAt: string): number {
  const halfLifeHours = FRESHNESS_HALF_LIFE_HOURS[sourceType]
  const retrievedMs = new Date(retrievedAt).getTime()
  const nowMs = Date.now()
  const ageHours = Math.max(0, (nowMs - retrievedMs) / (1000 * 60 * 60))
  // Exponential decay: freshness = 2^(-ageHours / halfLife)
  // Clamped to [0, 1]
  return Math.max(0, Math.min(1, Math.pow(2, -(ageHours / halfLifeHours))))
}

// ---------------------------------------------------------------------------
// Contradiction detection
// ---------------------------------------------------------------------------

function detectContradictions(items: EvidenceItem[]): Set<EvidenceId> {
  const contradicted = new Set<EvidenceId>()
  for (const item of items) {
    for (const ref of item.references) {
      if (ref.relationWeight < 0) {
        contradicted.add(item.id)
        // Also mark the referenced item as involved in a contradiction
        const target = items.find(i => i.id === ref.evidenceId)
        if (target) contradicted.add(target.id)
      }
    }
  }
  return contradicted
}

// ---------------------------------------------------------------------------
// Stats computation
// ---------------------------------------------------------------------------

function computeStats(
  items: EvidenceItem[],
  contradictionCount: number,
): EvidenceCollectionStats {
  const bySourceType: Record<EvidenceSourceType, number> = {
    internal_data: 0,
    user_input: 0,
    ai_analysis: 0,
    external_source: 0,
    document: 0,
    human_validation: 0,
  }

  let totalFreshness = 0
  let totalConfidence = 0

  for (const item of items) {
    bySourceType[item.source.type] = (bySourceType[item.source.type] ?? 0) + 1
    totalFreshness += item.freshness
    totalConfidence += item.confidence
  }

  const count = items.length
  return {
    total: count,
    bySourceType,
    averageFreshness: count > 0 ? totalFreshness / count : 0,
    averageConfidence: count > 0 ? totalConfidence / count : 0,
    contradictionCount,
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Collect and validate evidence items for a decision.
 *
 * Invalid items are excluded and reported in the `errors` array.
 * A collection with zero valid items is still returned; callers are
 * responsible for deciding whether that is acceptable.
 */
export function collectEvidence(options: CollectEvidenceOptions): CollectEvidenceResult {
  const { decisionId, items: rawItems } = options
  const errors: EvidenceCollectionError[] = []
  const validItems: EvidenceItem[] = []

  for (let i = 0; i < rawItems.length; i++) {
    const raw = rawItems[i]

    if (!raw.title?.trim()) {
      errors.push({ index: i, title: raw.title ?? '', reason: 'title is required' })
      continue
    }

    if (raw.content === undefined || raw.content === null || raw.content === '') {
      errors.push({ index: i, title: raw.title, reason: 'content is required' })
      continue
    }

    if (raw.confidence !== undefined && (raw.confidence < 0 || raw.confidence > 1)) {
      errors.push({ index: i, title: raw.title, reason: 'confidence must be in [0, 1]' })
      continue
    }

    const retrievedAt = raw.retrievedAt ?? new Date().toISOString()
    const freshness = computeFreshness(raw.sourceType, retrievedAt)

    const item: EvidenceItem = {
      id: evidenceId(randomUUID()),
      title: raw.title.trim(),
      content: raw.content,
      source: {
        type: raw.sourceType,
        label: raw.sourceLabel,
        uri: raw.sourceUri ?? null,
        retrievedAt,
      },
      freshness,
      confidence: raw.confidence ?? 0.7,
      references: raw.references ?? [],
      tags: raw.tags ?? {},
      createdAt: new Date().toISOString(),
    }

    validItems.push(item)
  }

  const contradicted = detectContradictions(validItems)

  const collection: EvidenceCollection = {
    decisionId,
    items: validItems,
    stats: computeStats(validItems, contradicted.size),
    collectedAt: new Date().toISOString(),
  }

  return { collection, errors }
}
