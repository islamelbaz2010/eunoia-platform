import { PLAN_LABELS, type UserPlan } from '@/types/plan.types'

export interface ApiErrorPayload {
  error?: string
  used?: number
  limit?: number
  plan?: UserPlan
}

export interface PlanLimitNotice {
  message: string
  used: number
  limit: number
  plan: UserPlan
  planLabel: string
}

export function parsePlanLimitNotice(payload: ApiErrorPayload): PlanLimitNotice | null {
  if (
    typeof payload.used !== 'number' ||
    typeof payload.limit !== 'number' ||
    !payload.plan ||
    !(payload.plan in PLAN_LABELS)
  ) {
    return null
  }

  return {
    message: payload.error ?? 'Monthly plan limit reached. Upgrade your plan to continue.',
    used: payload.used,
    limit: payload.limit,
    plan: payload.plan,
    planLabel: PLAN_LABELS[payload.plan],
  }
}
