/**
 * Decision Intelligence Engine — public API
 *
 * Import from this file rather than from sub-paths.
 */

// Types
export * from './types/index'

// Evidence subsystem
export { collectEvidence } from './evidence/evidence-collector'
export type { RawEvidenceInput, CollectEvidenceOptions, CollectEvidenceResult } from './evidence/evidence-collector'
export { weightEvidence, weightedAverageFreshness, maxEvidenceAgeHours } from './evidence/evidence-weighter'

// Engine components (useful for partial evaluation or unit testing)
export { computeConfidenceScore } from './engine/confidence-engine'
export { evaluateRules, filterRulesForDomain } from './engine/rules-engine'
export { runValidationPipeline } from './engine/validation-engine'
export type { ValidationEngineInput } from './engine/validation-engine'
export { generateExplainability } from './engine/explainability-engine'
export type { ExplainabilityEngineInput } from './engine/explainability-engine'

// Top-level orchestrator
export { runDecisionEngine } from './engine/decision-engine'
export type { DecisionEngineInput, DecisionEngineResult } from './engine/decision-engine'
