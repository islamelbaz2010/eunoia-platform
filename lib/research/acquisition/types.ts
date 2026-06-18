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
})
export type ResearchResultItem = z.infer<typeof ResearchResultItemSchema>

export const ResearchResultSchema = z.object({
  query: z.string(),
  generatedAt: z.string(),
  items: z.array(ResearchResultItemSchema),
  totalSourcesFound: z.number().int().min(0),
  totalSourcesCollected: z.number().int().min(0),
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
}

export interface RankedSource extends NormalizedSource {
  confidenceScore: number
  rankReason: string
}
