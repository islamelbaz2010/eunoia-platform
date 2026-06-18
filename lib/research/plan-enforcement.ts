import { PLAN_LIMITS, type UserPlan } from '@/types/plan.types'

export interface PlanCheckResult {
  ok: boolean
  used: number
  limit: number
  plan: UserPlan
}

function startOfMonthISO(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
}

/**
 * Reads the user's assigned plan from user_plans (defaults to STARTER if no
 * row exists yet — no plan-assignment flow is wired up beyond this
 * infrastructure) and sums this calendar month's research_requests.credits_used
 * to enforce PLAN_LIMITS.reportsPerMonth. Fails open on any Supabase error,
 * matching the rest of the research module's quota/rate-limit conventions
 * (lib/research/acquisition/quota.ts, lib/research/rate-limit.ts) — an infra
 * hiccup degrades to "allow," not "block every paying customer."
 *
 * `supabase` is the same request-scoped, RLS-respecting client the calling
 * route already has (cast `as any` like the rest of the research routes,
 * since types/supabase.types.ts doesn't yet cover research_requests/user_plans).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkPlanLimit(supabase: any, userId: string): Promise<PlanCheckResult> {
  try {
    const { data: planRow } = await supabase
      .from('user_plans')
      .select('plan')
      .eq('user_id', userId)
      .maybeSingle()

    const plan: UserPlan = (planRow?.plan as UserPlan | undefined) ?? 'STARTER'
    const limit = PLAN_LIMITS[plan]?.reportsPerMonth ?? PLAN_LIMITS.STARTER.reportsPerMonth

    if (limit === -1) return { ok: true, used: 0, limit, plan }

    const { data: rows, error } = await supabase
      .from('research_requests')
      .select('credits_used')
      .eq('user_id', userId)
      .gte('created_at', startOfMonthISO())

    if (error) throw error

    const used = (rows ?? []).reduce(
      (sum: number, row: { credits_used?: number }) => sum + (row.credits_used ?? 1),
      0
    )

    return { ok: used < limit, used, limit, plan }
  } catch {
    return { ok: true, used: 0, limit: PLAN_LIMITS.STARTER.reportsPerMonth, plan: 'STARTER' }
  }
}
