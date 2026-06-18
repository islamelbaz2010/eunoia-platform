export type UserPlan = 'STARTER' | 'PROFESSIONAL' | 'AGENCY' | 'ENTERPRISE'

/**
 * Per-user plan enforcement (research_requests/reports are user_id-scoped in
 * the live Supabase data model — see FINAL_PLATFORM_AUDIT.md). Deliberately
 * separate from types/workspace.types.ts's Workspace-level Plan/PLAN_LIMITS,
 * which is a Prisma-backed concept never wired into the live research
 * routes. Reconciling the two (workspace seats vs. per-user usage) is a
 * Priority 3 decision in MASTER_EXECUTION_PLAN.md, not resolved here.
 */
export const PLAN_LIMITS: Record<UserPlan, { reportsPerMonth: number }> = {
  STARTER: { reportsPerMonth: 20 },
  PROFESSIONAL: { reportsPerMonth: 100 },
  AGENCY: { reportsPerMonth: 300 },
  ENTERPRISE: { reportsPerMonth: -1 }, // unlimited (fair-use, not a hard guarantee — see MASTER_EXECUTION_PLAN.md)
}

export const PLAN_LABELS: Record<UserPlan, string> = {
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  AGENCY: 'Agency',
  ENTERPRISE: 'Enterprise',
}
