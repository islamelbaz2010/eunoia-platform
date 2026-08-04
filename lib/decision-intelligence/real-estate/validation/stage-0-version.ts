import { SUPPORTED_CONTRACT_MAJOR } from '../types/enums'
import { RE_ERROR_CODES } from '../errors/error-codes'
import type { REStageResult } from '../types/request'

// Stage 0 — Contract Version Check
// Confirms the request contractVersion matches the engine's supported MAJOR version.
// Returns a CONTRACT_VERSION_ERROR and halts the pipeline if unsupported.
export function runStage0Version(contractVersion: string): REStageResult {
  const start = Date.now()
  const [major] = contractVersion.split('.').map(Number)
  const supported = major === SUPPORTED_CONTRACT_MAJOR

  return {
    stage: 'stage-0-version',
    passed: supported,
    blocking: !supported,
    errors: supported ? [] : [{
      code: RE_ERROR_CODES.CONTRACT_VERSION_ERROR,
      message: `contractVersion '${contractVersion}' is not supported. Engine supports major version ${SUPPORTED_CONTRACT_MAJOR}.x.x.`,
    }],
    warnings: [],
    durationMs: Date.now() - start,
  }
}
