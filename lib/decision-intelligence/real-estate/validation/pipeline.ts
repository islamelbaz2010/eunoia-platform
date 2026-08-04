import type { REFeasibilityRequest, REPipelineResult, REValidationError, REValidationWarning } from '../types/request'
import { runStage0Version }    from './stage-0-version'
import { runStage1Schema }     from './stage-1-schema'
import { runStage2Range }      from './stage-2-range'
import { runStage3Conditional } from './stage-3-conditional'
import { runStage4Consistency } from './stage-4-consistency'
import { runStage5Evidence }   from './stage-5-evidence'
import { runStage6Derivation } from './stage-6-derivation'
import { runStage7Rules }      from './stage-7-rules'

// Executes the 8-stage RE validation pipeline in exact order (Stages 0–7).
// Each stage must pass before the next executes.
// A blocking stage failure halts the pipeline; subsequent stages are skipped.
// Non-blocking warnings accumulate across all stages.
export function runREValidationPipeline(
  request: REFeasibilityRequest,
): REPipelineResult {
  const totalStart = Date.now()
  const allErrors:   REValidationError[]   = []
  const allWarnings: REValidationWarning[] = []
  const stagesCompleted = []
  let haltedAtStage: REPipelineResult['haltedAtStage'] = null

  // ── Stage 0 — Contract Version ──────────────────────────────────────────
  const s0 = runStage0Version(request.contractVersion)
  stagesCompleted.push(s0)
  allErrors.push(...s0.errors)
  allWarnings.push(...s0.warnings)
  if (s0.blocking && !s0.passed) {
    haltedAtStage = 'stage-0-version'
    return buildResult('FAILED', stagesCompleted, haltedAtStage, allErrors, allWarnings, null, [], totalStart)
  }

  // ── Stage 1 — Schema Validation ─────────────────────────────────────────
  const { result: s1, parsed } = runStage1Schema(
    request.context.parameters as unknown as Record<string, unknown>,
    request.phase,
  )
  stagesCompleted.push(s1)
  allErrors.push(...s1.errors)
  allWarnings.push(...s1.warnings)
  if (s1.blocking && !s1.passed) {
    haltedAtStage = 'stage-1-schema'
    return buildResult('FAILED', stagesCompleted, haltedAtStage, allErrors, allWarnings, null, [], totalStart)
  }
  // parsed is guaranteed non-null here (s1 passed)
  const callerParams = parsed!

  // ── Stage 2 — Range Validation ──────────────────────────────────────────
  const s2 = runStage2Range(callerParams)
  stagesCompleted.push(s2)
  allErrors.push(...s2.errors)
  allWarnings.push(...s2.warnings)
  // Stage 2 is non-blocking overall; range errors from Zod were caught in Stage 1
  // If Stage 2 produced errors, they are advisory (we still proceed)

  // ── Stage 3 — Conditional Check ─────────────────────────────────────────
  const s3 = runStage3Conditional(callerParams, request.context.evidence, request.phase)
  stagesCompleted.push(s3)
  allErrors.push(...s3.errors)
  allWarnings.push(...s3.warnings)
  if (s3.blocking && !s3.passed) {
    haltedAtStage = 'stage-3-conditional'
    return buildResult('FAILED', stagesCompleted, haltedAtStage, allErrors, allWarnings, null, [], totalStart)
  }

  // ── Stage 4 — Arithmetic Consistency ───────────────────────────────────
  const s4 = runStage4Consistency(callerParams)
  stagesCompleted.push(s4)
  allErrors.push(...s4.errors)
  allWarnings.push(...s4.warnings)
  // Stage 4 is non-blocking; consistency warnings degrade confidence

  // ── Stage 5 — Evidence Completeness ────────────────────────────────────
  const s5 = runStage5Evidence(callerParams, request.context.evidence)
  stagesCompleted.push(s5)
  allErrors.push(...s5.errors)
  allWarnings.push(...s5.warnings)
  if (s5.blocking && !s5.passed) {
    haltedAtStage = 'stage-5-evidence'
    return buildResult('FAILED', stagesCompleted, haltedAtStage, allErrors, allWarnings, null, [], totalStart)
  }

  // ── Stage 6 — Platform Derivation ──────────────────────────────────────
  const { result: s6, enriched } = runStage6Derivation(callerParams, request.phase)
  stagesCompleted.push(s6)
  allErrors.push(...s6.errors)
  allWarnings.push(...s6.warnings)

  // ── Stage 7 — Rule Evaluation ───────────────────────────────────────────
  const { result: s7, ruleResults } = runStage7Rules(
    enriched,
    request.context.evidence,
    request.phase,
  )
  stagesCompleted.push(s7)
  allErrors.push(...s7.errors)
  allWarnings.push(...s7.warnings)

  const hasFatalErrors = allErrors.some(e =>
    e.code === 'RULE_CRITICAL_BLOCK' ||
    e.code === 'EVIDENCE_MISSING_CRITICAL' ||
    e.code === 'EVIDENCE_MISSING_REQUIRED' ||
    e.code === 'PARAMETER_MISSING_REQUIRED' ||
    e.code === 'CONDITIONAL_PARAMETER_MISSING' ||
    e.code === 'CONTRACT_VERSION_ERROR' ||
    e.code === 'SCHEMA_VALIDATION_ERROR',
  )

  const status: REPipelineResult['status'] =
    hasFatalErrors  ? 'FAILED'
    : allWarnings.length > 0 ? 'PARTIAL'
    : 'PASSED'

  return buildResult(status, stagesCompleted, null, allErrors, allWarnings, enriched, ruleResults, totalStart)
}

function buildResult(
  status: REPipelineResult['status'],
  stagesCompleted: REPipelineResult['stagesCompleted'],
  haltedAtStage: REPipelineResult['haltedAtStage'],
  errors: REValidationError[],
  warnings: REValidationWarning[],
  enrichedParameters: REPipelineResult['enrichedParameters'],
  ruleResults: REPipelineResult['ruleResults'],
  totalStart: number,
): REPipelineResult {
  return {
    status,
    stagesCompleted,
    haltedAtStage,
    errors,
    warnings,
    enrichedParameters,
    ruleResults,
    validatedAt: new Date().toISOString(),
    totalDurationMs: Date.now() - totalStart,
  }
}
