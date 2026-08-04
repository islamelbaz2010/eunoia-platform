import { ZodError } from 'zod'
import { REParametersSchema } from '../schemas/parameters.schema'
import { RE_REQUIRED_P1_PARAM_NAMES } from '../types/parameters'
import { RE_ERROR_CODES } from '../errors/error-codes'
import type { REPhase } from '../types/enums'
import type { RECallerParameters } from '../types/parameters'
import type { REStageResult, REValidationError } from '../types/request'

// Stage 1 — Schema Validation
// 1. Confirms all REQUIRED parameters are present (phase-gated)
// 2. Confirms all parameter names match the Canonical Parameter Registry
// 3. Confirms all values match declared types via Zod
// Returns SCHEMA_VALIDATION_ERROR with the list of failed parameters on any failure.
export function runStage1Schema(
  rawParameters: Record<string, unknown>,
  phase: REPhase,
): { result: REStageResult; parsed: RECallerParameters | null } {
  const start = Date.now()
  const errors: REValidationError[] = []

  // 1. Check REQUIRED P1 parameters are present regardless of phase
  for (const name of RE_REQUIRED_P1_PARAM_NAMES) {
    if (rawParameters[name] === undefined || rawParameters[name] === null) {
      errors.push({
        parameter: name,
        code: RE_ERROR_CODES.PARAMETER_MISSING_REQUIRED,
        message: `Required parameter '${name}' is missing.`,
      })
    }
  }

  // 2 & 3. Type validation via Zod (validates types + ranges that are expressible as Zod constraints)
  const zodResult = REParametersSchema.safeParse(rawParameters)
  if (!zodResult.success) {
    const zodErrors = (zodResult.error as ZodError).errors
    for (const issue of zodErrors) {
      const paramName = issue.path.join('.')
      // Avoid duplicating already-reported missing required params
      const alreadyReported = errors.some(e => e.parameter === paramName)
      if (!alreadyReported) {
        errors.push({
          parameter: paramName || undefined,
          code: RE_ERROR_CODES.PARAMETER_TYPE_MISMATCH,
          message: `${paramName ? `'${paramName}': ` : ''}${issue.message}`,
        })
      }
    }
  }

  const passed = errors.length === 0
  return {
    result: {
      stage: 'stage-1-schema',
      passed,
      blocking: !passed,
      errors,
      warnings: [],
      durationMs: Date.now() - start,
    },
    parsed: zodResult.success ? (zodResult.data as RECallerParameters) : null,
  }
}
