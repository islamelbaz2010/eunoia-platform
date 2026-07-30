// Workspace (Prisma-backed) types — used by /api/workspace and lib/prisma/init-user.ts.
//
// Architecture note: there are two separate plan models in this codebase:
//   1. Workspace Plan (this file) — Prisma/PostgreSQL, tracks multi-user workspace seats.
//      The live workspace route (/api/workspace) and use-workspace hook use these types.
//   2. UserPlan (types/plan.types.ts) — Supabase, tracks per-user research-request quotas.
//      All enforcement (plan-enforcement.ts, research routes) uses plan.types.ts.
//
// The two models exist because the Prisma schema was designed for a workspace-seat
// model that was never fully wired to the live Supabase enforcement layer. Reconciling
// them into one canonical model is a future task that requires a billing provider
// decision — until then, plan.types.ts is the authoritative enforcement model.

export type Plan = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
export type Role = 'ADMIN' | 'AGENCY' | 'SALES' | 'VIEWER'

export interface Workspace {
  id: string
  name: string
  plan: Plan
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface WorkspaceMember {
  id: string
  email: string
  name: string | null
  role: Role
  workspaceId: string
  createdAt: string
}

export interface WorkspaceWithMembers extends Workspace {
  users: WorkspaceMember[]
  _count: {
    reports: number
  }
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  AGENCY: 'Agency',
  SALES: 'Sales',
  VIEWER: 'Viewer',
}
