import { RE_ERROR_CODES } from '../errors/error-codes'
import type { REPhase } from '../types/enums'
import type { REFullParameters } from '../types/parameters'
import type { REEvidence } from '../types/evidence'
import type { RERuleResult, REStageResult, REValidationError, REValidationWarning } from '../types/request'
import { dispatchAllRules } from '../rules/rule-dispatcher'

// Stage 7 — Rule Evaluation
// The validated and enriched context is passed to the rule dispatcher.
// Rules evaluate in priority order (Priority 1 → 4).
// Blocking rules (RE-FIN-001/002/003/004) cause a FAIL when fired.
// Advisory rules produce warnings.
export function runStage7Rules(
  enrichedParams: REFullParameters,
  evidence: REEvidence[],
  phase: REPhase,
): { result: REStageResult; ruleResults: RERuleResult[] } {
  const start = Date.now()
  const errors: REValidationError[] = []
  const warnings: REValidationWarning[] = []

  const ruleResults = dispatchAllRules(enrichedParams, evidence, phase)

  for (const rule of ruleResults) {
    if (rule.skipped) continue
    if (rule.fired && rule.blocking) {
      errors.push({
        ruleId: rule.ruleId,
        code: RE_ERROR_CODES.RULE_CRITICAL_BLOCK,
        message: rule.message,
      })
    } else if (rule.fired && !rule.blocking) {
      warnings.push({
        ruleId: rule.ruleId,
        code: RE_ERROR_CODES.RULE_ADVISORY_WARN,
        message: rule.message,
      })
    }
  }

  const hasBlockingFailures = errors.length > 0
  return {
    result: {
      stage: 'stage-7-rules',
      passed: !hasBlockingFailures,
      blocking: hasBlockingFailures,
      errors,
      warnings,
      durationMs: Date.now() - start,
    },
    ruleResults,
  }
}
