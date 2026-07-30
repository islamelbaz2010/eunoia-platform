/**
 * Decision — the first-class object in the Decision Intelligence Engine.
 *
 * A Decision represents a specific business question that moves through a
 * defined lifecycle as evidence is gathered, rules are evaluated, and
 * confidence is established. Every Decision is fully auditable: each
 * transition is timestamped and the reason is recorded.
 */

// ---------------------------------------------------------------------------
// Branded ID types — prevent mixing decision IDs with evidence IDs etc.
// ---------------------------------------------------------------------------

declare const __decisionIdBrand: unique symbol
export type DecisionId = string & { readonly [__decisionIdBrand]: true }
export function decisionId(id: string): DecisionId { return id as DecisionId }

declare const __optionIdBrand: unique symbol
export type OptionId = string & { readonly [__optionIdBrand]: true }
export function optionId(id: string): OptionId { return id as OptionId }

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

/**
 * Valid status values for a Decision.
 *
 * Allowed transitions:
 *   DRAFT → EVALUATING
 *   EVALUATING → VALIDATED | REJECTED
 *   VALIDATED → COMPLETED | ARCHIVED
 *   REJECTED → ARCHIVED
 *   DRAFT | EVALUATING | COMPLETED | REJECTED → ARCHIVED
 */
export type DecisionStatus =
  | 'DRAFT'       // created, not yet evaluated
  | 'EVALUATING'  // evidence collection and rule evaluation in progress
  | 'VALIDATED'   // all validation stages passed, awaiting completion
  | 'COMPLETED'   // final answer accepted and recorded
  | 'REJECTED'    // failed one or more required validation stages
  | 'ARCHIVED'    // removed from active decision set

export const DECISION_STATUS_ORDER: DecisionStatus[] = [
  'DRAFT', 'EVALUATING', 'VALIDATED', 'COMPLETED', 'REJECTED', 'ARCHIVED',
]

export const TERMINAL_STATUSES: Set<DecisionStatus> = new Set(['COMPLETED', 'REJECTED', 'ARCHIVED'])

// ---------------------------------------------------------------------------
// Lifecycle event (immutable audit trail)
// ---------------------------------------------------------------------------

export interface DecisionStatusEvent {
  readonly fromStatus: DecisionStatus
  readonly toStatus: DecisionStatus
  readonly triggeredBy: 'system' | 'user' | 'rule' | 'admin'
  readonly reason: string
  readonly timestamp: string // ISO-8601
}

// ---------------------------------------------------------------------------
// Option — a possible answer to the decision question
// ---------------------------------------------------------------------------

export interface DecisionOption {
  readonly id: OptionId
  readonly label: string
  readonly description: string
  /** Deterministic rule-computed score, independent of AI (0–100). */
  readonly ruleScore: number
  /** AI-generated qualitative analysis of this option. */
  readonly aiAnalysis: string
  /** True if business rules explicitly block this option. */
  readonly blockedByRules: boolean
  /** IDs of rules that block or flag this option. */
  readonly flaggingRuleIds: string[]
}

// ---------------------------------------------------------------------------
// Subject and context
// ---------------------------------------------------------------------------

export interface DecisionSubject {
  /** e.g. "Real Estate Feasibility", "Lead Qualification", "Talent Assessment" */
  readonly domain: string
  /** Human-readable name of what this decision is about. */
  readonly name: string
  /** Optional structured metadata relevant to the domain. */
  readonly metadata: Record<string, unknown>
}

export interface DecisionContext {
  /** Specific question this Decision must answer. */
  readonly question: string
  /** User-provided or system-derived parameters driving this decision. */
  readonly parameters: Record<string, unknown>
  /** Constraints that must be satisfied regardless of options. */
  readonly constraints: string[]
  /** Goals ranked by importance (first = most important). */
  readonly objectives: string[]
}

// ---------------------------------------------------------------------------
// Recommended outcome
// ---------------------------------------------------------------------------

export interface DecisionRecommendation {
  /** The recommended option, if any. Null if confidence too low to recommend. */
  readonly recommendedOptionId: OptionId | null
  /** Why this option was recommended over the others. */
  readonly rationale: string
  /** Overall confidence score at the time of recommendation (0–100). */
  readonly confidenceScore: number
  /** Whether this recommendation was overridden by a human. */
  readonly humanOverridden: boolean
  /** ID of the user who applied the override, if any. */
  readonly overrideUserId: string | null
  /** Justification for human override, required if applied. */
  readonly overrideJustification: string | null
}

// ---------------------------------------------------------------------------
// Full Decision object
// ---------------------------------------------------------------------------

export interface Decision {
  readonly id: DecisionId
  readonly status: DecisionStatus
  readonly subject: DecisionSubject
  readonly context: DecisionContext
  readonly options: DecisionOption[]
  readonly recommendation: DecisionRecommendation | null
  /**
   * IDs of the EvidenceItems used to produce this decision.
   * Resolved separately from the evidence store.
   */
  readonly evidenceIds: string[]
  /** Ordered audit trail — append-only, never mutated. */
  readonly statusHistory: DecisionStatusEvent[]
  readonly createdAt: string   // ISO-8601
  readonly updatedAt: string   // ISO-8601
  readonly completedAt: string | null
}

// ---------------------------------------------------------------------------
// Input to the Decision Engine
// ---------------------------------------------------------------------------

export interface DecisionInput {
  readonly subject: DecisionSubject
  readonly context: DecisionContext
  readonly options: Omit<DecisionOption, 'ruleScore' | 'blockedByRules' | 'flaggingRuleIds' | 'aiAnalysis'>[]
  readonly requestedBy: 'system' | 'user'
  readonly requestedByUserId?: string
}
