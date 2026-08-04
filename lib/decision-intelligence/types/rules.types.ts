/**
 * Business Rules — deterministic, independent from AI.
 *
 * Rules are the system's source of truth for hard constraints and domain
 * policy. They run before AI analysis and their verdicts are never
 * overridden by AI output. A rule can block an option entirely, require a
 * human override, issue a warning, or simply pass.
 *
 * Rules are purely functional: given a set of facts, they return a verdict.
 * They carry no side-effects and do not write to any store.
 */

// ---------------------------------------------------------------------------
// Branded ID
// ---------------------------------------------------------------------------

declare const __ruleIdBrand: unique symbol
export type RuleId = string & { readonly [__ruleIdBrand]: true }
export function ruleId(id: string): RuleId { return id as RuleId }

// ---------------------------------------------------------------------------
// Rule category — the domain area a rule governs
// ---------------------------------------------------------------------------

/**
 * Semantic category for a business rule.
 *
 * Used for grouping rules in reports, filtering by domain area, and
 * computing category-level compliance summaries.
 *
 * - `financial`:    NPV, ROI, profit, cost thresholds
 * - `market`:       CPL benchmarks, market attractiveness, lead volume
 * - `operational`:  budget sufficiency, capacity, timeline constraints
 * - `compliance`:   regulatory, policy, and legal requirements
 * - `risk`:         safety limits, exposure thresholds, volatility guards
 * - `strategic`:    high-level strategic alignment and opportunity cost
 */
export type RuleCategory =
  | 'financial'
  | 'market'
  | 'operational'
  | 'compliance'
  | 'risk'
  | 'strategic'

// ---------------------------------------------------------------------------
// Rule action — what the rule engine does when a condition matches
// ---------------------------------------------------------------------------

/**
 * `PASS`:             condition not triggered; rule is satisfied
 * `FAIL`:             critical violation; blocks the evaluated option
 * `WARN`:             advisory concern; decision can proceed but note is recorded
 * `REQUIRE_OVERRIDE`: human must explicitly justify proceeding; not an automatic block
 */
export type RuleAction = 'PASS' | 'FAIL' | 'WARN' | 'REQUIRE_OVERRIDE'

// ---------------------------------------------------------------------------
// Condition — a single evaluable predicate
// ---------------------------------------------------------------------------

export type ConditionOperator =
  | 'eq'           // equal
  | 'neq'          // not equal
  | 'gt'           // greater than
  | 'gte'          // greater than or equal
  | 'lt'           // less than
  | 'lte'          // less than or equal
  | 'in'           // value in a set
  | 'not_in'       // value not in a set
  | 'exists'       // field is present and non-null
  | 'not_exists'   // field is absent or null
  | 'matches'      // string matches a regex pattern (pattern stored in `value`)

export interface RuleCondition {
  /**
   * Dot-notation path into the facts object evaluated by the rule.
   * Example: "parameters.budget" or "subject.metadata.propertyType"
   */
  readonly factPath: string
  readonly operator: ConditionOperator
  /** The value to compare against. Not required for `exists`/`not_exists`. */
  readonly value?: unknown
}

export interface RuleConditionGroup {
  /** All conditions in the group must be true. Nested groups use OR between themselves. */
  readonly conditions: RuleCondition[]
}

// ---------------------------------------------------------------------------
// Business rule
// ---------------------------------------------------------------------------

export interface BusinessRule {
  readonly id: RuleId
  readonly name: string
  readonly description: string
  /**
   * Human-readable explanation of the business or legal rationale.
   * Appears in reports and override justification prompts.
   */
  readonly rationale: string
  /**
   * Priority — lower number = evaluated first.
   * Rules with action FAIL are always executed before lower-priority rules.
   */
  readonly priority: number
  /**
   * The domain or module this rule applies to.
   * Rules are filtered to applicable domains before evaluation.
   */
  readonly domains: string[]
  /**
   * Condition groups evaluated as OR: the rule fires if ANY group matches.
   * Within a group, ALL conditions must be true (AND).
   */
  readonly conditionGroups: RuleConditionGroup[]
  /** Action to take when the rule fires. */
  readonly firesWithAction: RuleAction
  /**
   * Human-readable message to include in the rule result.
   * Should explain what failed and what the user can do about it.
   */
  readonly message: string
  /** Whether this rule can be overridden by a human with justification. */
  readonly overrideable: boolean
  readonly enabled: boolean
  /**
   * Semantic category for grouping and filtering rules in reports.
   * Defaults to 'operational' when not specified.
   */
  readonly category?: RuleCategory
  /**
   * Relative importance weight for score calculation.
   * Default: 1.0. Range: 0.5 (minor advisory) → 3.0 (hard safety limit).
   *
   * A rule with weight=2.0 contributes twice as much to the option's rule
   * score as a rule with weight=1.0. Critical domain constraints should use
   * higher weights to ensure they dominate the recommendation.
   */
  readonly weight?: number
}

// ---------------------------------------------------------------------------
// Condition trace — records the actual fact values evaluated per condition
// ---------------------------------------------------------------------------

/**
 * Records the outcome of a single condition evaluation.
 *
 * Provides full transparency into why a rule fired or did not fire by
 * capturing the actual fact value alongside the expected value and operator.
 * This is the atomic unit of rule explainability.
 */
export interface ConditionEvaluationTrace {
  /** Dot-notation path that was evaluated (e.g. "parameters.computed_npv"). */
  readonly factPath: string
  readonly operator: ConditionOperator
  /** The value the rule was testing against. */
  readonly expectedValue: unknown
  /** The value actually found at `factPath` in the facts object. */
  readonly actualValue: unknown
  /** Whether this individual condition evaluated to true. */
  readonly matched: boolean
}

// ---------------------------------------------------------------------------
// Rule evaluation result — output of a single rule's evaluation
// ---------------------------------------------------------------------------

export interface RuleResult {
  readonly ruleId: RuleId
  readonly ruleName: string
  /** True if the rule's conditions matched (i.e., the rule fired). */
  readonly fired: boolean
  readonly action: RuleAction
  readonly message: string
  /** The specific condition group that triggered the rule, if fired. */
  readonly matchedGroupIndex: number | null
  readonly evaluatedAt: string  // ISO-8601
  /**
   * Trace of every condition evaluated (from the matched group if fired,
   * or the first group if the rule did not fire).
   *
   * Exposes the actual values that caused the rule to fire or not fire,
   * enabling "why did this rule trigger?" explanations.
   */
  readonly conditionTrace: ConditionEvaluationTrace[]
  /**
   * Dynamic explanation built from actual fact values.
   *
   * Unlike `message` (which is a static string from the rule definition),
   * this interpolates the actual values found in the facts object.
   * Example: "computed_npv = -50,000 (≤ 0 ✓), optionId = 'proceed' (= 'proceed' ✓)"
   */
  readonly explanation: string
  /**
   * Marginal impact of this specific rule on the option's rule score (0–100 scale).
   *
   * A FAIL rule with weight 1.0 in a set of 5 rules with total weight 5.0
   * produces a scoreImpact of -20. A WARN rule produces -10.
   * Non-firing rules and PASS actions produce 0.
   */
  readonly scoreImpact: number
}

// ---------------------------------------------------------------------------
// Rule evaluation run — aggregate of all rule results for one decision
// ---------------------------------------------------------------------------

export interface RuleEvaluationResult {
  readonly decisionId: string
  readonly optionId: string
  readonly results: RuleResult[]
  readonly summary: RuleEvaluationSummary
  readonly evaluatedAt: string  // ISO-8601
}

export interface RuleEvaluationSummary {
  readonly totalRules: number
  readonly firedRules: number
  readonly passedRules: number
  readonly failedRules: number
  readonly warnRules: number
  readonly requireOverrideRules: number
  /** True if any FAIL rule fired — this option is blocked. */
  readonly isBlocked: boolean
  /** IDs of the rules that caused blocking (action === 'FAIL'). */
  readonly blockingRuleIds: RuleId[]
  /** IDs of the rules that require a human override. */
  readonly overrideRequiredRuleIds: RuleId[]
  /**
   * Weight-adjusted rule compliance score in [0, 100].
   *
   * Uses each rule's `weight` field (default 1.0) to compute a weighted
   * score. A critical FAIL rule (weight=2.0) penalizes the score twice as
   * much as a standard rule. This is the score used by the decision engine
   * to rank options; it replaces the unweighted count-based formula.
   */
  readonly weightedRuleScore: number
  /** Total weight across all rules evaluated for this option. */
  readonly totalWeight: number
  /** Aggregate category breakdown — which rule categories fired. */
  readonly firedCategories: RuleCategory[]
}

// ---------------------------------------------------------------------------
// Override record — written when a human proceeds past a REQUIRE_OVERRIDE rule
// ---------------------------------------------------------------------------

export interface RuleOverride {
  readonly ruleId: RuleId
  readonly overriddenBy: string  // user ID
  readonly justification: string
  readonly appliedAt: string  // ISO-8601
}

// ---------------------------------------------------------------------------
// Facts object passed into rule evaluation
// ---------------------------------------------------------------------------

export interface RuleFacts {
  readonly decisionId: string
  readonly optionId: string
  readonly subject: Record<string, unknown>
  readonly context: Record<string, unknown>
  readonly parameters: Record<string, unknown>
  [key: string]: unknown
}
