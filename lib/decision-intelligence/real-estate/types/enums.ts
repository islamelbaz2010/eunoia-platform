export type REPhase = 'P1' | 'P2' | 'P3'

export type REDomain = 'real_estate'

export type REDecisionType = 'feasibility' | 'market_entry'

export type RELandRegistrationStatus = 'registered' | 'in_progress' | 'unregistered'

export const SUPPORTED_CONTRACT_VERSION = '1.0.0'
export const SUPPORTED_CONTRACT_MAJOR = 1

// The 10 evidence categories defined by the RE contract (distinct from the
// general DI engine's EvidenceCategory in lib/decision-intelligence/types/evidence.types.ts)
export type REEvidenceCategory =
  | 'financial_projections'
  | 'cash_flow_timing'
  | 'cost_estimates'
  | 'sales_projections'
  | 'land_terms'
  | 'activity_mix_financial'
  | 'capital_structure'
  | 'market_data'
  | 'technical_feasibility'
  | 'regulatory_compliance'

export const RE_EVIDENCE_CATEGORIES: readonly REEvidenceCategory[] = [
  'financial_projections',
  'cash_flow_timing',
  'cost_estimates',
  'sales_projections',
  'land_terms',
  'activity_mix_financial',
  'capital_structure',
  'market_data',
  'technical_feasibility',
  'regulatory_compliance',
]

// Evidence freshness half-lives in days (from Appendix B)
export const RE_EVIDENCE_FRESHNESS_HALF_LIFE_DAYS: Record<REEvidenceCategory, number> = {
  financial_projections:    30,
  cash_flow_timing:         30,
  cost_estimates:           90,
  sales_projections:        90,
  land_terms:              180,
  activity_mix_financial:   30,
  capital_structure:        90,
  market_data:              30,  // prices 30 days; absorption 90 days — use stricter
  technical_feasibility:   180,
  regulatory_compliance:   180,
}

// Evidence required status categories
export type REEvidenceRequiredStatus = 'REQUIRED' | 'CONDITIONAL' | 'ADVISORY'

export const RE_EVIDENCE_STATUS: Record<REEvidenceCategory, REEvidenceRequiredStatus> = {
  financial_projections:   'REQUIRED',
  cash_flow_timing:        'CONDITIONAL',
  cost_estimates:          'REQUIRED',
  sales_projections:       'REQUIRED',
  land_terms:              'REQUIRED',
  activity_mix_financial:  'CONDITIONAL',
  capital_structure:       'CONDITIONAL',
  market_data:             'ADVISORY',
  technical_feasibility:   'ADVISORY',
  regulatory_compliance:   'ADVISORY',
}

// All 23 Rule IDs (21 original + RE-OPS-004 added by F-003 + RE-LGL-001 added by F-004)
export type RERuleId =
  | 'RE-FIN-001' | 'RE-FIN-002' | 'RE-FIN-003' | 'RE-FIN-004'
  | 'RE-FIN-005' | 'RE-FIN-006'
  | 'RE-COM-001' | 'RE-COM-002' | 'RE-COM-003' | 'RE-COM-004'
  | 'RE-OPS-001' | 'RE-OPS-002' | 'RE-OPS-003' | 'RE-OPS-004'
  | 'RE-STR-001' | 'RE-STR-002' | 'RE-STR-003'
  | 'RE-EXE-001' | 'RE-EXE-002'
  | 'RE-RSK-001' | 'RE-RSK-002' | 'RE-RSK-003'
  | 'RE-LGL-001'

export const RE_RULE_IDS: readonly RERuleId[] = [
  'RE-FIN-001', 'RE-FIN-002', 'RE-FIN-003', 'RE-FIN-004',
  'RE-FIN-005', 'RE-FIN-006',
  'RE-COM-001', 'RE-COM-002', 'RE-COM-003', 'RE-COM-004',
  'RE-OPS-001', 'RE-OPS-002', 'RE-OPS-003', 'RE-OPS-004',
  'RE-STR-001', 'RE-STR-002', 'RE-STR-003',
  'RE-EXE-001', 'RE-EXE-002',
  'RE-RSK-001', 'RE-RSK-002', 'RE-RSK-003',
  'RE-LGL-001',
]

export const RE_CRITICAL_RULE_IDS: readonly RERuleId[] = [
  'RE-FIN-001', 'RE-FIN-002', 'RE-FIN-003', 'RE-FIN-004',
]

export type RERuleSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export const RE_RULE_SEVERITY: Record<RERuleId, RERuleSeverity> = {
  'RE-FIN-001': 'CRITICAL',
  'RE-FIN-002': 'CRITICAL',
  'RE-FIN-003': 'CRITICAL',
  'RE-FIN-004': 'CRITICAL',
  'RE-FIN-005': 'HIGH',
  'RE-FIN-006': 'LOW',
  'RE-COM-001': 'HIGH',
  'RE-COM-002': 'HIGH',
  'RE-COM-003': 'MEDIUM',
  'RE-COM-004': 'MEDIUM',
  'RE-OPS-001': 'MEDIUM',
  'RE-OPS-002': 'LOW',
  'RE-OPS-003': 'MEDIUM',
  'RE-OPS-004': 'MEDIUM',
  'RE-STR-001': 'HIGH',
  'RE-STR-002': 'MEDIUM',
  'RE-STR-003': 'MEDIUM',
  'RE-EXE-001': 'HIGH',
  'RE-EXE-002': 'MEDIUM',
  'RE-RSK-001': 'HIGH',
  'RE-RSK-002': 'HIGH',
  'RE-RSK-003': 'MEDIUM',
  'RE-LGL-001': 'HIGH',
}

export const RE_RULE_BLOCKING: Record<RERuleId, boolean> = {
  'RE-FIN-001': true,
  'RE-FIN-002': true,
  'RE-FIN-003': true,
  'RE-FIN-004': true,
  'RE-FIN-005': false,
  'RE-FIN-006': false,
  'RE-COM-001': false,
  'RE-COM-002': false,
  'RE-COM-003': false,
  'RE-COM-004': false,
  'RE-OPS-001': false,
  'RE-OPS-002': false,
  'RE-OPS-003': false,
  'RE-OPS-004': false,
  'RE-STR-001': false,
  'RE-STR-002': false,
  'RE-STR-003': false,
  'RE-EXE-001': false,
  'RE-EXE-002': false,
  'RE-RSK-001': false,
  'RE-RSK-002': false,
  'RE-RSK-003': false,
  'RE-LGL-001': false,
}

// Minimum phase required for each rule to evaluate
export const RE_RULE_MIN_PHASE: Record<RERuleId, REPhase> = {
  'RE-FIN-001': 'P1',
  'RE-FIN-002': 'P1',
  'RE-FIN-003': 'P1',
  'RE-FIN-004': 'P1',
  'RE-FIN-005': 'P1',
  'RE-FIN-006': 'P1',
  'RE-COM-001': 'P1',
  'RE-COM-002': 'P1',
  'RE-COM-003': 'P1',
  'RE-COM-004': 'P2',
  'RE-OPS-001': 'P1',
  'RE-OPS-002': 'P1',
  'RE-OPS-003': 'P1',
  'RE-OPS-004': 'P1',
  'RE-STR-001': 'P1',
  'RE-STR-002': 'P1',
  'RE-STR-003': 'P1',
  'RE-EXE-001': 'P1',
  'RE-EXE-002': 'P1',
  'RE-RSK-001': 'P2',
  'RE-RSK-002': 'P2',
  'RE-RSK-003': 'P1',
  'RE-LGL-001': 'P1',
}

export const RE_VALIDATION_STAGES = [
  'stage-0-version',
  'stage-1-schema',
  'stage-2-range',
  'stage-3-conditional',
  'stage-4-consistency',
  'stage-5-evidence',
  'stage-6-derivation',
  'stage-7-rules',
] as const

export type REValidationStage = (typeof RE_VALIDATION_STAGES)[number]
