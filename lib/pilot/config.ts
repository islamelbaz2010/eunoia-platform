export const PILOT_CONFIG = {
  MAX_SUBMISSIONS: 20,
  ID_PREFIX: 'PILOT-',
  IDS: Array.from({ length: 20 }, (_, i) => `PILOT-${String(i + 1).padStart(2, '0')}`),

  TARGETS: {
    RECOMMENDATION_ACCURACY_MIN_PCT: 80,
    CLIENT_ACCEPTANCE_MIN_PCT:       70,
    FALSE_POSITIVE_MAX_PCT:          15,
    FALSE_NEGATIVE_MAX_PCT:          20,
    CRITICAL_DISAGREEMENTS_MAX:       0,
    DECISION_TIME_MAX_HOURS:         24,
    NARRATIVE_REVISIONS_MAX:          1.5,
    API_SUCCESS_MIN_PCT:             95,
    CONFIDENCE_MIN:                  68,
    CONFIDENCE_MAX:                  84,
  },

  INTERIM_ASSESSMENT_AT: 10,
  FINAL_ASSESSMENT_AT:   20,
} as const

export type PilotStatus = 'pending' | 'in_review' | 'delivered' | 'failed' | 'corrected'
export type PilotClientResponse = 'accept' | 'query' | 'reject'
export type PilotConsultantRec = 'proceed' | 'revise' | 'defer' | 'reject'
export type PilotSystemRec = 'proceed' | 'revise' | 'error'
export type PilotDisagreeSeverity = 'critical' | 'major' | 'minor' | 'cosmetic'
export type PilotRootCause = 'RC-01' | 'RC-02' | 'RC-03' | 'RC-04' | 'RC-05' | 'RC-06' | 'RC-07' | 'RC-08' | 'RC-09' | 'RC-10'

export const ROOT_CAUSE_LABELS: Record<PilotRootCause, string> = {
  'RC-01': 'Missing Input',
  'RC-02': 'Incorrect Parameter',
  'RC-03': 'Rule Deficiency',
  'RC-04': 'Evidence Deficiency',
  'RC-05': 'Financial Model Issue',
  'RC-06': 'Narrative Issue',
  'RC-07': 'Prompt Issue',
  'RC-08': 'User Misunderstanding',
  'RC-09': 'Operational Issue',
  'RC-10': 'Architecture Issue',
}

export interface PilotReview {
  id: string
  pilot_submission_id: string
  reviewer_name: string
  consultant_recommendation: PilotConsultantRec
  agreement: boolean
  confidence_level: 'very_high' | 'high' | 'medium' | 'low' | null
  disagree_root_cause: string | null
  disagree_severity: PilotDisagreeSeverity | null
  disagree_reason: string | null
  defer_assessment: string | null
  financing_assessment: string | null
  narrative_approved: boolean | null
  narrative_correction_count: number
  advisory_checks: Record<string, string> | null
  time_spent_minutes: number | null
  lessons_learned: string | null
  safe_without_review: boolean | null
  created_at: string
  updated_at: string
}

export interface PilotSubmission {
  id: string
  pilot_id: string
  report_id: string | null
  research_request_id: string | null
  client_identifier: string
  project_location: string | null
  system_recommendation: PilotSystemRec | null
  system_confidence: number | null
  system_trust_score: number | null
  status: PilotStatus
  client_response: PilotClientResponse | null
  client_response_notes: string | null
  intake_at: string | null
  submitted_at: string
  delivered_at: string | null
  created_at: string
  updated_at: string
  review: PilotReview | null
}

export interface PilotLearningEntry {
  id: string
  pilot_submission_id: string | null
  event_type: 'disagreement' | 'client_query' | 'client_reject' | 'narrative_correction' | 'api_failure' | 'advisory_flag'
  primary_root_cause: string
  secondary_root_cause: string | null
  severity: PilotDisagreeSeverity
  system_output: string | null
  correct_output: string | null
  prevention_note: string | null
  engineering_ticket_required: boolean
  ticket_description: string | null
  created_at: string
}

export interface PilotMetrics {
  total: number
  by_status: Record<PilotStatus, number>
  reviews_completed: number
  recommendation_accuracy_pct: number | null
  client_acceptance_pct: number | null
  false_positive_count: number
  false_negative_count: number
  false_positive_pct: number | null
  false_negative_pct: number | null
  critical_disagreements: number
  avg_confidence: number | null
  avg_trust_score: number | null
  avg_decision_time_hours: number | null
  avg_narrative_revisions: number | null
  api_success_rate_pct: number | null
  top_root_causes: Array<{ cause: string; label: string; count: number }>
  recommendation_distribution: { proceed: number; revise: number; error: number }
  next_pilot_id: string | null
}
