/**
 * Scenario Intelligence — Sprint A4
 *
 * Answers the question every executive asks after receiving a recommendation:
 * "What would have to change for this recommendation to be different?"
 *
 * The scenario engine re-evaluates business rules under hypothetical parameter
 * changes to compute:
 *   - Decision stability: how robust is the current recommendation?
 *   - Sensitivity thresholds: which parameter change would flip the decision?
 *   - What-if scenarios: tested hypotheticals with concrete outcomes
 *
 * All analysis is deterministic — no AI inference, no hallucination risk.
 */

// ---------------------------------------------------------------------------
// Stability classification
// ---------------------------------------------------------------------------

/**
 * How stable the current recommendation is under plausible parameter changes.
 *
 * ROBUST:   Recommendation holds even with moderate adverse changes (>30% swing)
 * MODERATE: Recommendation holds for small changes but could flip with ~15–30% swing
 * FRAGILE:  Small changes (< 15%) could flip the recommendation
 */
export type DecisionStability = 'ROBUST' | 'MODERATE' | 'FRAGILE'

// ---------------------------------------------------------------------------
// Sensitivity threshold — what single parameter change would flip the decision
// ---------------------------------------------------------------------------

/**
 * Describes the exact change needed to a single parameter to cause a different
 * rule evaluation outcome (e.g., unblock a blocked option or remove a WARN).
 */
export interface SensitivityThreshold {
  /** Dot-notation fact path of the parameter (e.g. "parameters.computed_npv"). */
  readonly factPath: string
  /** Human-readable parameter name (e.g. "Project NPV"). */
  readonly parameterName: string
  /** The current value of the parameter. */
  readonly currentValue: unknown
  /** The value needed to change the rule outcome. */
  readonly thresholdValue: unknown
  /** Direction the parameter must move. */
  readonly requiredDirection: 'increase' | 'decrease'
  /** The rule whose firing would change as a result. */
  readonly ruleId: string
  readonly ruleName: string
  /** Which option this threshold applies to. */
  readonly affectedOptionId: string
  readonly affectedOptionLabel: string
  /**
   * Plain-English description of the threshold.
   * Example: "NPV must increase above 0 (currently -50,000) to unblock 'proceed'"
   */
  readonly changeDescription: string
  /** True if crossing this threshold would change the recommendation. */
  readonly wouldChangeRecommendation: boolean
}

// ---------------------------------------------------------------------------
// Scenario result — outcome of a specific what-if test
// ---------------------------------------------------------------------------

export interface ScenarioParameterChange {
  readonly factPath: string
  readonly parameterName: string
  readonly originalValue: unknown
  readonly hypotheticalValue: unknown
  readonly direction: 'increase' | 'decrease'
  readonly magnitudePct: number  // percentage change from original
}

export interface ScenarioOptionScore {
  readonly optionId: string
  readonly optionLabel: string
  readonly originalScore: number
  readonly hypotheticalScore: number
  readonly wasBlocked: boolean
  readonly wouldBeBlocked: boolean
}

export interface ScenarioResult {
  readonly scenarioId: string
  readonly name: string
  readonly description: string
  readonly parameterChange: ScenarioParameterChange
  readonly optionScores: ScenarioOptionScore[]
  readonly wouldChangeRecommendation: boolean
  readonly hypotheticalRecommendedOptionId: string | null
  readonly hypotheticalRecommendedOptionLabel: string | null
}

// ---------------------------------------------------------------------------
// Full scenario analysis
// ---------------------------------------------------------------------------

export interface ScenarioAnalysis {
  readonly decisionId: string
  readonly baseRecommendedOptionId: string | null
  readonly baseRecommendedOptionLabel: string | null
  /**
   * Stability classification based on how many scenarios flip the recommendation
   * and how large the parameter changes needed are.
   */
  readonly stability: DecisionStability
  /**
   * Stability score in [0, 100].
   * 100 = recommendation is completely stable across all tested scenarios.
   * 0   = recommendation would flip under even the smallest plausible change.
   */
  readonly stabilityScore: number
  readonly stabilityRationale: string
  /**
   * Parameter thresholds that would change rule outcomes — derived directly
   * from the fired rules without domain knowledge.
   */
  readonly sensitivityThresholds: SensitivityThreshold[]
  /** Tested what-if scenarios. */
  readonly scenarios: ScenarioResult[]
  readonly generatedAt: string  // ISO-8601
}
