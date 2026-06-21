import { z } from 'zod'

/**
 * Research Result Schema — the one shape every acquisition-pipeline module
 * (Lead Finder, Talent Finder, Competitor/Supplier/Market Intelligence) must
 * produce. Validated at runtime so a malformed item (missing source URL,
 * blank summary, etc.) is dropped rather than ever reaching a user as if it
 * were verified.
 */

export const SOURCE_TYPES = ['company_website', 'business_directory', 'public_listing'] as const
export type SourceType = typeof SOURCE_TYPES[number]

export const ResearchResultItemSchema = z.object({
  title: z.string().min(1),
  sourceUrl: z.string().url(),
  sourceType: z.enum(SOURCE_TYPES),
  confidenceScore: z.number().min(0).max(100),
  summary: z.string().min(1),
  /** lib/research/company-size.ts bucket key, set only when this company's own source text stated an explicit headcount, or overwritten by a verified Apollo record when one was found. */
  companySizeKey: z.string().optional(),
  /** True only when lib/research/acquisition/apollo-adapter.ts's Apollo company database independently confirmed this domain. Always absent/false when APOLLO_API_KEY isn't configured. */
  apolloVerified: z.boolean().optional(),
})
export type ResearchResultItem = z.infer<typeof ResearchResultItemSchema>

export const ResearchResultSchema = z.object({
  query: z.string(),
  generatedAt: z.string(),
  items: z.array(ResearchResultItemSchema),
  totalSourcesFound: z.number().int().min(0),
  totalSourcesCollected: z.number().int().min(0),
  totalSourcesValidated: z.number().int().min(0),
  totalSourcesDeduped: z.number().int().min(0),
  /** How many of totalSourcesCollected came from the Company Expansion step (lib/research/company-expansion.ts) rather than directly from search results. */
  totalSourcesExpanded: z.number().int().min(0),
  cached: z.boolean(),
  durationMs: z.number().int().min(0),
})
export type ResearchResult = z.infer<typeof ResearchResultSchema>

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

export interface CollectedSource {
  text: string
  finalUrl: string
  title: string
}

export interface NormalizedSource {
  domain: string
  title: string
  url: string
  sourceType: SourceType
  text: string
  sectorKey?: string
  cityKey?: string
  /** Set by lib/research/company-size.ts only when the source's own text states an explicit headcount — never guessed. */
  companySizeKey?: string
  /** Set by lib/research/company-validation.ts once a source has passed VALID classification. */
  validationScore?: number
  validationReason?: string
}

export interface RankedSource extends NormalizedSource {
  confidenceScore: number
  rankReason: string
  /** Set by lib/research/acquisition/apollo-adapter.ts only when Apollo's company database independently confirmed this domain — never set just because Apollo was queried. */
  apolloVerified?: boolean
}
