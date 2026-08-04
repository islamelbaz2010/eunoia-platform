// Real Estate Decision Intelligence — Public API
// All new code lives in this namespace and does NOT modify or re-export
// anything from lib/decision-intelligence/ at the parent level.

export * from './types/index'
export * from './errors/error-codes'
export * from './schemas/index'
export * from './derived/index'
export { runREValidationPipeline } from './validation/pipeline'
export { dispatchAllRules } from './rules/rule-dispatcher'
