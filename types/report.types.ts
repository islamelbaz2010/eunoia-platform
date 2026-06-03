import type { ReportType } from '@services/ai-engine/prompt-builder'

export type { ReportType }

export type ReportStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface ReportInput {
  companyName: string
  sectorKey: string
  cityKey: string
  branchKey: string
  size?: string
  stage?: string
  website?: string
  language?: 'ar' | 'en'
  competitors?: Array<{ name: string; url?: string }>
  projectType?: string
  projectLocation?: string
  projectSize?: string
  extra?: string
  ads?: {
    budget?: string
    metaSpend?: string
    googleSpend?: string
    tiktokSpend?: string
    roas?: string
    cpl?: string
    leads?: string
    ctr?: string
  }
  social?: {
    igFollowers?: string
    igEng?: string
    fbFollowers?: string
    ttFollowers?: string
  }
  sales?: {
    revenue?: string
    convRate?: string
    aov?: string
    cac?: string
    returning?: string
  }
}

export interface Report {
  id: string
  type: ReportType
  status: ReportStatus
  input: ReportInput
  output: Record<string, unknown> | null
  error: string | null
  userId: string
  workspaceId: string
  createdAt: string
  completedAt: string | null
  updatedAt: string
}

export interface ReportListItem {
  id: string
  type: ReportType
  status: ReportStatus
  companyName: string
  sectorKey: string
  cityKey: string
  createdAt: string
  completedAt: string | null
}
