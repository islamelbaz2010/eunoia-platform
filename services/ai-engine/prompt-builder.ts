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
import { buildPrompt as buildPreliminary } from './prompts/preliminary.prompt'
import { buildPrompt as buildDetailed } from './prompts/detailed.prompt'
import { buildPrompt as buildContentSeo } from './prompts/content-seo.prompt'
import { buildPrompt as buildBrandAwareness } from './prompts/brand-awareness.prompt'
import { buildPrompt as buildExecutiveSummary } from './prompts/executive-summary.prompt'
import { buildPrompt as buildSentiment } from './prompts/sentiment.prompt'
import { buildPrompt as buildCrisis } from './prompts/crisis.prompt'
import { buildPrompt as buildSocialAudit } from './prompts/social-audit.prompt'
import { buildPrompt as buildLeadQuality } from './prompts/lead-quality.prompt'
import { buildPrompt as buildMarketEntry } from './prompts/market-entry.prompt'
import { buildPrompt as buildEcommerceGrowth } from './prompts/ecommerce-growth.prompt'
import { buildPrompt as buildSeasonal } from './prompts/seasonal.prompt'
import { buildPrompt as buildCustomerJourney } from './prompts/customer-journey.prompt'
import { buildPrompt as buildAnnualBudget } from './prompts/annual-budget.prompt'
import { buildPrompt as buildRebranding } from './prompts/rebranding.prompt'
import { buildPrompt as buildB2bStrategy } from './prompts/b2b-strategy.prompt'
import { buildPrompt as buildProductLaunch } from './prompts/product-launch.prompt'
import { buildPrompt as buildDigitalReadiness } from './prompts/digital-readiness.prompt'
import { buildPrompt as buildInfluencer } from './prompts/influencer.prompt'

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
  | 'PRELIMINARY'
  | 'DETAILED'
  | 'CONTENT_SEO'
  | 'BRAND_AWARENESS'
  | 'EXECUTIVE_SUMMARY'
  | 'SENTIMENT'
  | 'CRISIS'
  | 'SOCIAL_AUDIT'
  | 'LEAD_QUALITY'
  | 'MARKET_ENTRY'
  | 'ECOMMERCE_GROWTH'
  | 'SEASONAL'
  | 'CUSTOMER_JOURNEY'
  | 'ANNUAL_BUDGET'
  | 'REBRANDING'
  | 'B2B_STRATEGY'
  | 'PRODUCT_LAUNCH'
  | 'DIGITAL_READINESS'
  | 'INFLUENCER'

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
  PRELIMINARY: buildPreliminary,
  DETAILED: buildDetailed,
  CONTENT_SEO: buildContentSeo,
  BRAND_AWARENESS: buildBrandAwareness,
  EXECUTIVE_SUMMARY: buildExecutiveSummary,
  SENTIMENT: buildSentiment,
  CRISIS: buildCrisis,
  SOCIAL_AUDIT: buildSocialAudit,
  LEAD_QUALITY: buildLeadQuality,
  MARKET_ENTRY: buildMarketEntry,
  ECOMMERCE_GROWTH: buildEcommerceGrowth,
  SEASONAL: buildSeasonal,
  CUSTOMER_JOURNEY: buildCustomerJourney,
  ANNUAL_BUDGET: buildAnnualBudget,
  REBRANDING: buildRebranding,
  B2B_STRATEGY: buildB2bStrategy,
  PRODUCT_LAUNCH: buildProductLaunch,
  DIGITAL_READINESS: buildDigitalReadiness,
  INFLUENCER: buildInfluencer,
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
  PRELIMINARY: { en: 'Preliminary Report', ar: 'تقرير مبدئي' },
  DETAILED: { en: 'Detailed Report', ar: 'تقرير تفصيلي' },
  CONTENT_SEO: { en: 'Content & SEO Gap', ar: 'فجوات المحتوى والـ SEO' },
  BRAND_AWARENESS: { en: 'Brand Awareness', ar: 'الوعي بالعلامة التجارية' },
  EXECUTIVE_SUMMARY: { en: 'Executive Summary', ar: 'ملخص تنفيذي' },
  SENTIMENT: { en: 'Sentiment Analysis', ar: 'تحليل المشاعر' },
  CRISIS: { en: 'Crisis Management', ar: 'إدارة الأزمات' },
  SOCIAL_AUDIT: { en: 'Social Media Audit', ar: 'تدقيق السوشيال ميديا' },
  LEAD_QUALITY: { en: 'Lead Quality Analysis', ar: 'تحليل جودة العملاء المحتملين' },
  MARKET_ENTRY: { en: 'Market Entry Report', ar: 'تقرير دخول السوق' },
  ECOMMERCE_GROWTH: { en: 'E-commerce Growth Report', ar: 'نمو التجارة الإلكترونية' },
  SEASONAL: { en: 'Seasonal Campaign Planner', ar: 'تخطيط الحملات الموسمية' },
  CUSTOMER_JOURNEY: { en: 'Customer Journey Map', ar: 'خريطة رحلة العميل' },
  ANNUAL_BUDGET: { en: 'Annual Marketing Budget', ar: 'الميزانية التسويقية السنوية' },
  REBRANDING: { en: 'Rebranding Feasibility', ar: 'جدوى إعادة البراندينج' },
  B2B_STRATEGY: { en: 'B2B Marketing Strategy', ar: 'استراتيجية تسويق B2B' },
  PRODUCT_LAUNCH: { en: 'Product Launch Plan', ar: 'خطة إطلاق المنتج' },
  DIGITAL_READINESS: { en: 'Digital Readiness Score', ar: 'تقييم الجاهزية الرقمية' },
  INFLUENCER: { en: 'Influencer Strategy Report', ar: 'استراتيجية المؤثرين' },
}
