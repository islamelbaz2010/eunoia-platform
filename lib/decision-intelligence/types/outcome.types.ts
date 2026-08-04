/**
 * DecisionOutcome — records what actually happened after a decision was made.
 *
 * Designed to enable future calibration of the confidence engine and rule weights.
 * No ML is applied yet; this type creates the infrastructure for outcome tracking.
 *
 * Lifecycle: PENDING → RECORDED → VERIFIED
 */

import type { DecisionId } from './decision.types'

export type OutcomeStatus = 'PENDING' | 'RECORDED' | 'VERIFIED'

export interface DecisionOutcome {
  /** References the Decision that produced this outcome. */
  readonly decisionId: DecisionId
  /** Whether the operator followed the engine's recommendation. */
  readonly recommendationFollowed: boolean
  /** Human-readable label for the metric being tracked (e.g. "Annual ROI", "CPL EGP"). */
  readonly primaryMetricLabel: string
  /** The value the engine predicted at decision time (null if no prediction was made). */
  readonly primaryMetricPredicted: number | null
  /** The value actually observed after the decision was executed (null until recorded). */
  readonly primaryMetricActual: number | null
  /** ISO-8601 timestamp when the actual outcome was observed. */
  readonly outcomeRecordedAt: string
  /** Free-text context or explanation from the operator. */
  readonly notes: string
  readonly status: OutcomeStatus
  /** ISO-8601 creation timestamp. */
  readonly createdAt: string
  /** ISO-8601 last-updated timestamp. */
  readonly updatedAt: string
}
