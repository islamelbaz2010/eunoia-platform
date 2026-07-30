/**
 * Validation — a multi-stage pipeline that gates a decision before it can
 * advance from EVALUATING to VALIDATED.
 *
 * Stages run in order. A FAIL result from any required stage halts the
 * pipeline and transitions the decision to REJECTED. WARN results allow
 * the pipeline to continue but are surfaced in the report.
 *
 * Stage order:
 *   1. structural  — shape, required fields, type constraints
 *   2. business    — business rules evaluation
 *   3. evidence    — minimum evidence requirements
 *   4. confidence  — confidence score thresholds
 *   5. consistency — cross-option and cross-evidence consistency checks
 */

// ---------------------------------------------------------------------------
// Stage definition
// ---------------------------------------------------------------------------

export type ValidationStageType =
  | 'structural'
  | 'business'
  | 'evidence'
  | 'confidence'
  | 'consistency'

/** Canonical execution order for validation stages. */
export const VALIDATION_STAGE_ORDER: ValidationStageType[] = [
  'structural',
  'business',
  'evidence',
  'confidence',
  'consistency',
]

// ---------------------------------------------------------------------------
// Validation check — an individual check within a stage
// ---------------------------------------------------------------------------

export type ValidationCheckStatus = 'PASS' | 'FAIL' | 'WARN' | 'SKIP'

export interface ValidationCheck {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly status: ValidationCheckStatus
  /** Human-readable message explaining the result. */
  readonly message: string
  /** Structured data supporting the result (e.g., the actual vs. expected value). */
  readonly details: Record<string, unknown>
  /** Whether a FAIL here should halt the entire pipeline. */
  readonly blocking: boolean
}

// ---------------------------------------------------------------------------
// Stage result — all checks in a stage
// ---------------------------------------------------------------------------

export interface ValidationStageResult {
  readonly stage: ValidationStageType
  readonly status: ValidationCheckStatus
  readonly checks: ValidationCheck[]
  readonly blocking: boolean
  readonly executedAt: string  // ISO-8601
  /** Wall-clock time this stage took in milliseconds. */
  readonly durationMs: number
}

// ---------------------------------------------------------------------------
// Full pipeline result
// ---------------------------------------------------------------------------

export type ValidationPipelineStatus = 'PASSED' | 'FAILED' | 'PARTIAL'

export interface ValidationResult {
  readonly decisionId: string
  readonly pipelineStatus: ValidationPipelineStatus
  readonly stages: ValidationStageResult[]
  /**
   * The stage at which the pipeline was halted, if any.
   * Null if the pipeline ran to completion.
   */
  readonly haltedAtStage: ValidationStageType | null
  readonly summary: ValidationSummary
  readonly validatedAt: string  // ISO-8601
  /** Total wall-clock time across all stages. */
  readonly totalDurationMs: number
}

export interface ValidationSummary {
  readonly totalChecks: number
  readonly passed: number
  readonly failed: number
  readonly warned: number
  readonly skipped: number
  /** True if the decision is allowed to advance to VALIDATED. */
  readonly canProceed: boolean
  /** Consolidated list of blocking failure messages for user display. */
  readonly blockingMessages: string[]
  /** Consolidated list of warning messages (non-blocking). */
  readonly warningMessages: string[]
}

// ---------------------------------------------------------------------------
// Thresholds — configurable per deployment
// ---------------------------------------------------------------------------

export interface ValidationThresholds {
  /** Minimum number of evidence items required. Default: 1. */
  readonly minimumEvidenceCount: number
  /** Minimum acceptable overall confidence score (0–100). Default: 30. */
  readonly minimumConfidenceScore: number
  /**
   * Maximum allowable contradiction ratio in evidence (0–1).
   * Above this threshold the consistency stage fails.
   * Default: 0.5.
   */
  readonly maximumContradictionRatio: number
}

export const DEFAULT_VALIDATION_THRESHOLDS: ValidationThresholds = {
  minimumEvidenceCount: 1,
  minimumConfidenceScore: 30,
  maximumContradictionRatio: 0.5,
}
