export type UserPlan = 'STARTER' | 'PROFESSIONAL' | 'AGENCY' | 'ENTERPRISE'

/**
 * Per-user plan enforcement — the authoritative model for all research quota
 * and billing decisions. Research routes (leads, talent, intelligence) and
 * plan-enforcement.ts all reference these limits exclusively.
 *
 * The workspace-seat model in types/workspace.types.ts (Prisma-backed) is a
 * parallel concept that is not yet wired to live enforcement. When a billing
 * provider is chosen, these two models should be unified — see the architecture
 * note in workspace.types.ts.
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
