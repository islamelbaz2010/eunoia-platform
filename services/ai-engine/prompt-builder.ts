import type { PromptContext } from './prompts/types'
import { buildPrompt as buildCompetitor } from './prompts/competitor.prompt'
import { buildPrompt as buildCampaign } from './prompts/campaign.prompt'
import { buildPrompt as buildPricing } from './prompts/pricing.prompt'
import { buildPrompt as buildFullAnalysis } from './prompts/full-analysis.prompt'
import { buildPrompt as buildClvRetention } from './prompts/clv-retention.prompt'
import { buildPrompt as buildTrendResearch } from './prompts/trend-research.prompt'
import { buildPrompt as buildMediaMix } from './prompts/media-mix.prompt'
import { buildPrompt as buildOpportunityScoring } from './prompts/opportunity-scoring.prompt'
import { buildPrompt as buildRealEstateLaunch } from './prompts/real-estate-launch.prompt'
import { buildPrompt as buildRealEstateLeads } from './prompts/real-estate-leads.prompt'
import { buildPrompt as buildRealEstateFeasibility } from './prompts/real-estate-feasibility.prompt'

export type ReportType =
  | 'COMPETITOR'
  | 'CAMPAIGN'
  | 'PRICING'
  | 'FULL_ANALYSIS'
  | 'CLV_RETENTION'
  | 'TREND_RESEARCH'
  | 'MEDIA_MIX'
  | 'OPPORTUNITY_SCORING'
  | 'REAL_ESTATE_LAUNCH'
  | 'REAL_ESTATE_LEADS'
  | 'REAL_ESTATE_FEASIBILITY'

const PROMPT_BUILDERS: Record<ReportType, (ctx: PromptContext) => string> = {
  COMPETITOR: buildCompetitor,
  CAMPAIGN: buildCampaign,
  PRICING: buildPricing,
  FULL_ANALYSIS: buildFullAnalysis,
  CLV_RETENTION: buildClvRetention,
  TREND_RESEARCH: buildTrendResearch,
  MEDIA_MIX: buildMediaMix,
  OPPORTUNITY_SCORING: buildOpportunityScoring,
  REAL_ESTATE_LAUNCH: buildRealEstateLaunch,
  REAL_ESTATE_LEADS: buildRealEstateLeads,
  REAL_ESTATE_FEASIBILITY: buildRealEstateFeasibility,
}

export function buildPromptForType(type: ReportType, ctx: PromptContext): string {
  const builder = PROMPT_BUILDERS[type]
  if (!builder) {
    throw new Error(`Unknown report type: ${type}`)
  }
  return builder(ctx)
}

export function isValidReportType(value: string): value is ReportType {
  return value in PROMPT_BUILDERS
}

export const REPORT_TYPE_LABELS: Record<ReportType, { en: string; ar: string }> = {
  COMPETITOR: { en: 'Competitor Intelligence', ar: 'تحليل المنافسين' },
  CAMPAIGN: { en: 'Campaign ROI Audit', ar: 'تدقيق أداء الحملات' },
  PRICING: { en: 'Pricing Strategy Audit', ar: 'تدقيق استراتيجية التسعير' },
  FULL_ANALYSIS: { en: 'Full Marketing Analysis', ar: 'التحليل التسويقي الشامل' },
  CLV_RETENTION: { en: 'CLV & Retention Analysis', ar: 'تحليل قيمة العميل والاحتفاظ' },
  TREND_RESEARCH: { en: 'Trend Research', ar: 'بحث الاتجاهات' },
  MEDIA_MIX: { en: 'Media Mix Optimization', ar: 'تحسين مزيج الوسائط' },
  OPPORTUNITY_SCORING: { en: 'Opportunity Scoring', ar: 'تقييم الفرصة' },
  REAL_ESTATE_LAUNCH: { en: 'Project Launch Strategy', ar: 'استراتيجية إطلاق المشروع' },
  REAL_ESTATE_LEADS: { en: 'Lead Gen Intelligence', ar: 'تحليل توليد العملاء المحتملين' },
  REAL_ESTATE_FEASIBILITY: { en: 'Investment Feasibility', ar: 'دراسة الجدوى الاستثمارية' },
}
