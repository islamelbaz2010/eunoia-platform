import type { SectorData } from '../../../core/data/sectors.data'
import type { CityData } from '../../../core/data/cities.data'
import type { BranchData } from '../../../core/data/branches.data'

export interface AdsData {
  budget?: string
  cpl?: string
  roas?: string
  ctr?: string
  metaSpend?: string
  googleSpend?: string
  tiktokSpend?: string
  leads?: string
  prevCampaigns?: string
}

export interface SocialData {
  igFollowers?: string
  igEng?: string
  fbFollowers?: string
  ttFollowers?: string
  reach?: string
  impressions?: string
  fbLink?: string
  igLink?: string
  ttLink?: string
  postLinks?: string
  postingRate?: string
}

export interface SalesData {
  revenue?: string
  convRate?: string
  aov?: string
  returning?: string
  sessions?: string
  cac?: string
}

export interface CompetitorEntry {
  name: string
  link?: string
}

export type BusinessSize = 'small' | 'medium' | 'large' | 'enterprise'
export type BusinessStage = 'startup' | 'growth' | 'established' | 'scaling'
export type Language = 'ar' | 'en'

export interface PromptContext {
  companyName: string
  sector: SectorData
  sectorKey: string
  city: CityData
  branch: BranchData
  size: BusinessSize
  stage: BusinessStage
  extra?: string
  ads?: AdsData
  social?: SocialData
  sales?: SalesData
  competitors?: CompetitorEntry[]
  websiteUrl?: string
  language: Language
}

export const SIZE_LABELS: Record<BusinessSize, string> = {
  small: 'صغيرة',
  medium: 'متوسطة',
  large: 'كبيرة',
  enterprise: 'Enterprise',
}

export const STAGE_LABELS: Record<BusinessStage, string> = {
  startup: 'ناشئة / جديدة',
  growth: 'نمو',
  established: 'راسخة',
  scaling: 'توسع',
}
