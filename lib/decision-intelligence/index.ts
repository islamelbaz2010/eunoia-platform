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
// Sprint A2: Evidence coverage analysis
export { analyzeEvidenceCoverage, detectDuplicates, detectConflicts, generateMissingEvidenceHints } from './evidence/evidence-coverage'
export type { AnalyzeCoverageOptions } from './evidence/evidence-coverage'

// Engine components (useful for partial evaluation or unit testing)
export { computeConfidenceScore } from './engine/confidence-engine'
export { evaluateRules, filterRulesForDomain, evaluateRulesWithParameters } from './engine/rules-engine'
export { runValidationPipeline } from './engine/validation-engine'
export type { ValidationEngineInput } from './engine/validation-engine'
export { generateExplainability } from './engine/explainability-engine'
export type { ExplainabilityEngineInput } from './engine/explainability-engine'
// Sprint A4: Scenario intelligence
export { runScenarioAnalysis } from './engine/scenario-engine'
export type { ScenarioEngineInput } from './engine/scenario-engine'

// Top-level orchestrator
export { runDecisionEngine } from './engine/decision-engine'
export type { DecisionEngineInput, DecisionEngineResult } from './engine/decision-engine'
