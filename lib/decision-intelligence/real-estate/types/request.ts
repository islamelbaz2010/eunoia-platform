import type { REPhase, REDomain, REDecisionType, RERuleId, RERuleSeverity, REValidationStage } from './enums'
import type { RECallerParameters, REFullParameters } from './parameters'
import type { REEvidence } from './evidence'
import type { REErrorCode } from '../errors/error-codes'

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

export interface REFeasibilityRequest {
  contractVersion: string       // must be '1.0.0'
  domain: REDomain              // 'real_estate'
  decisionType: REDecisionType  // 'feasibility' | 'market_entry'
  phase: REPhase                // 'P1' | 'P2' | 'P3'
  requestId: string             // UUID
  timestamp: string             // ISO-8601
  context: {
    parameters: RECallerParameters
    evidence: REEvidence[]
  }
}

// ---------------------------------------------------------------------------
// Validation error and warning items
// ---------------------------------------------------------------------------

export interface REValidationError {
  parameter?: string
  evidenceCategory?: string
  ruleId?: RERuleId
  code: REErrorCode
  message: string
}

export interface REValidationWarning {
  parameter?: string
  evidenceCategory?: string
  ruleId?: RERuleId
  code: REErrorCode
  message: string
}

// ---------------------------------------------------------------------------
// Stage result (output of each validation stage 0–7)
// ---------------------------------------------------------------------------

export interface REStageResult {
  stage: REValidationStage
  passed: boolean
  blocking: boolean            // true when this stage halts the pipeline
  errors: REValidationError[]
  warnings: REValidationWarning[]
  durationMs: number
}

// ---------------------------------------------------------------------------
// Rule result (output of Stage 7 per rule)
// ---------------------------------------------------------------------------

export interface RERuleResult {
  ruleId: RERuleId
  fired: boolean               // true when rule condition triggered
  blocking: boolean            // true only for RE-FIN-001/002/003/004
  severity: RERuleSeverity
  message: string
  phase: REPhase               // minimum phase at which this rule evaluates
  skipped: boolean             // true when phase gate prevents evaluation
}

// ---------------------------------------------------------------------------
// Pipeline result
// ---------------------------------------------------------------------------

export type REPipelineStatus = 'PASSED' | 'FAILED' | 'PARTIAL'

export interface REPipelineResult {
  status: REPipelineStatus
  stagesCompleted: REStageResult[]
  haltedAtStage: REValidationStage | null
  errors: REValidationError[]
  warnings: REValidationWarning[]
  enrichedParameters: REFullParameters | null  // populated after Stage 6
  ruleResults: RERuleResult[]                  // populated by Stage 7
  validatedAt: string
  totalDurationMs: number
}

// ---------------------------------------------------------------------------
// Error response (wire format returned to caller on validation failure)
// ---------------------------------------------------------------------------

export interface REErrorResponse {
  status: 'error'
  stage: string
  errors: Array<{
    parameter?: string
    code: REErrorCode
    message: string
  }>
  warnings: Array<{
    parameter?: string
    code: REErrorCode
    message: string
  }>
}
