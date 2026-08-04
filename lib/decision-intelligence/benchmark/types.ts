/**
 * Decision Benchmark — canonical schema for accuracy validation cases.
 *
 * A BenchmarkCase is a fully-specified business scenario: it contains the
 * exact engine input (options, rules, evidence parameters) and the expected
 * output (recommendation, fired rules, blocked options, confidence range).
 *
 * The benchmark is the acceptance gate for every future Decision Engine change.
 * If overall recommendation accuracy falls below the minimum threshold, the
 * regression suite fails and the change is blocked.
 */

import type { DecisionInput } from '../types/decision.types'

// ---------------------------------------------------------------------------
// Case schema
// ---------------------------------------------------------------------------

/**
 * A single benchmark case representing a canonical business scenario.
 *
 * Cases must be:
 * - Deterministic: same input → same output every time
 * - Precisely calculated: expected values derived from engine logic, not guessed
 * - Self-contained: include all rules, evidence, and parameters needed to run
 * - Explainable: the explanation field describes the business rationale
 */
export interface BenchmarkCase {
  /** Stable unique identifier. Format: "<reportType>-<nnn>". */
  readonly id: string
  readonly name: string
  readonly description: string
  /** Industry domain — e.g. 'egypt_real_estate'. */
  readonly industry: string
  /** Report type — 'feasibility' | 'campaign_roi' | 'market_entry' | 'lead_gen' | 'full_analysis'. */
  readonly reportType: string
  readonly addedAt: string   // ISO-8601
  readonly addedBy: string
  readonly tags: readonly string[]
  /**
   * Business rationale explaining WHY these are the expected outputs.
   * Must justify every field in `expected`.
   */
  readonly explanation: string

  /** The input to the Decision Engine for this case. */
  readonly engineInput: BenchmarkEngineInput

  /** Expected output from the Decision Engine for this case. */
  readonly expected: BenchmarkExpectation
}

/**
 * A plain-typed option for benchmark cases.
 * Accepts string IDs (not branded OptionId) so case files need no imports from engine internals.
 * The runner casts to the engine's branded types when executing.
 */
export interface BenchmarkOption {
  readonly id: string
  readonly label: string
  readonly description: string
}

/**
 * A plain-typed evidence item for benchmark cases.
 * Accepts string sourceType/category so case files stay readable.
 * The runner casts to RawEvidenceInput when executing.
 */
export interface BenchmarkRawEvidence {
  readonly title: string
  readonly content: Record<string, unknown>
  readonly sourceType: string
  readonly sourceLabel: string
  readonly retrievedAt: string
  readonly confidence: number
  readonly tags: Record<string, unknown>
  readonly category?: string
}

/**
 * Structured engine input for a benchmark case.
 *
 * Uses plain-string types for IDs and source types so case files remain
 * readable without imports from the engine's branded-type modules.
 * The runner casts all fields to the correct engine types before execution.
 *
 * Evidence is supplied as raw items (not a pre-built collection) so that
 * the runner can call collectEvidence() at execution time with a fresh
 * timestamp — ensuring freshness scores are always 1.0 regardless of when
 * the benchmark runs.
 */
export interface BenchmarkEngineInput {
  /** Decision framing: subject, context, and options. */
  readonly input: {
    readonly subject: DecisionInput['subject']
    readonly context: DecisionInput['context']
    readonly options: readonly BenchmarkOption[]
    readonly requestedBy: 'system' | 'user'
    readonly requestedByUserId?: string
  }
  /**
   * Raw evidence items. The runner calls `collectEvidence()` with these
   * right before execution to guarantee fresh timestamps.
   */
  readonly rawEvidence: readonly BenchmarkRawEvidence[]
  /** Domain business rules — mirrors production buildDIRules() for the report type. */
  readonly rules: readonly Record<string, unknown>[]
}

/**
 * Expected output from the Decision Engine for a benchmark case.
 *
 * Every field is a deterministic assertion derived from the rules engine logic
 * applied to the specific parameters in this case.
 */
export interface BenchmarkExpectation {
  /**
   * The option ID that should be recommended.
   * Null means no recommendation is expected (confidence too low or all blocked).
   */
  readonly recommendedOptionId: string | null

  /**
   * Acceptable confidence score range [min, max].
   * Wide enough to tolerate minor variation in coverage scores,
   * tight enough to catch significant regressions.
   */
  readonly confidence: { readonly min: number; readonly max: number }

  /**
   * Rule IDs expected to fire across any option in this case.
   * The runner checks that every expected rule fired and flags unexpected firings.
   */
  readonly firedRuleIds: readonly string[]

  /**
   * Option IDs expected to be blocked by FAIL rules.
   */
  readonly blockedOptionIds: readonly string[]

  /**
   * Acceptable trust score range [min, max].
   * Trust score is identical to confidence.overall.
   */
  readonly trustScoreRange: { readonly min: number; readonly max: number }
}

// ---------------------------------------------------------------------------
// Runner outputs
// ---------------------------------------------------------------------------

/** Pass/fail result for a single benchmark case execution. */
export interface BenchmarkCaseResult {
  readonly caseId: string
  readonly caseName: string
  readonly reportType: string
  /** True only when every check passes. */
  readonly passed: boolean

  /** Individual check results — all must be true for the case to pass. */
  readonly checks: {
    readonly recommendationCorrect: boolean
    readonly firedRulesCorrect: boolean
    readonly blockedOptionsCorrect: boolean
    readonly confidenceInRange: boolean
    readonly trustScoreInRange: boolean
  }

  /** What the engine actually produced for this case. */
  readonly actual: {
    readonly recommendedOptionId: string | null
    readonly confidence: number
    readonly confidenceBand: string
    readonly firedRuleIds: readonly string[]
    readonly blockedOptionIds: readonly string[]
    readonly trustScore: number
  }

  /** Expected values (copied from the case for easy diffing in reports). */
  readonly snapshot: {
    readonly expectedRecommendation: string | null
    readonly expectedFiredRules: readonly string[]
    readonly expectedBlockedOptions: readonly string[]
    readonly expectedConfidenceRange: { readonly min: number; readonly max: number }
  }

  /** Human-readable descriptions of every assertion that failed. */
  readonly failures: readonly string[]

  readonly durationMs: number
}

/** Aggregated report across all benchmark cases. */
export interface BenchmarkReport {
  readonly ranAt: string
  readonly engineVersion: string

  readonly totalCases: number
  readonly passed: number
  readonly failed: number

  /**
   * Per-dimension accuracy percentages in [0, 100].
   * Each value is: (cases where this check passed / totalCases) * 100.
   */
  readonly accuracy: {
    /** Percentage of cases where every check passed. Primary KPI. */
    readonly overall: number
    /** Percentage of cases with the correct recommendation. */
    readonly recommendation: number
    /** Percentage of cases where expected rules fired and unexpected rules did not. */
    readonly rules: number
    /** Percentage of cases with correct blocked options. */
    readonly blockedOptions: number
    /** Percentage of cases with confidence in the expected range. */
    readonly confidence: number
    /** Percentage of cases with trust score in the expected range. */
    readonly trustScore: number
  }

  /**
   * Cases where a recommendation was made but should not have been,
   * OR where the wrong option was recommended.
   */
  readonly falsePositives: readonly BenchmarkCaseResult[]

  /**
   * Cases where no recommendation was made but one was expected.
   */
  readonly falseNegatives: readonly BenchmarkCaseResult[]

  /** Cases where the set of fired rules did not match expectations. */
  readonly ruleMismatches: readonly BenchmarkCaseResult[]

  /** Cases where the confidence score fell outside the expected range. */
  readonly confidenceDeviations: readonly BenchmarkCaseResult[]

  /** Cases where the trust score fell outside the expected range. */
  readonly trustScoreDeviations: readonly BenchmarkCaseResult[]

  /**
   * Machine-generated hints for what to investigate when accuracy degrades.
   * Generated from patterns in the failing cases.
   */
  readonly suggestedInvestigationAreas: readonly string[]

  /** Full per-case result list. */
  readonly results: readonly BenchmarkCaseResult[]
}
