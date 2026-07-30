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
