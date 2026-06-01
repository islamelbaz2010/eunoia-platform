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

export const PLAN_LIMITS: Record<Plan, { reportsPerMonth: number; members: number }> = {
  STARTER: { reportsPerMonth: 20, members: 2 },
  PROFESSIONAL: { reportsPerMonth: 100, members: 10 },
  ENTERPRISE: { reportsPerMonth: -1, members: -1 }, // unlimited
}

export const PLAN_LABELS: Record<Plan, string> = {
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  AGENCY: 'Agency',
  SALES: 'Sales',
  VIEWER: 'Viewer',
}
