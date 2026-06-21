/**
 * Company Size Engine — `companySize` was captured on the Lead Finder form
 * and stored in every report's search_criteria, but never touched a single
 * line of search, filtering, or ranking logic: a "51-200 employees" search
 * and a "500+ employees" search for the same industry/city produced
 * identical results. There is no reliable per-company employee-count data
 * source yet (that needs Apollo-style enrichment, a later phase) — but the
 * Research Core Engine already treats sector/city matches as ranking
 * *signals*, not hard filters (lib/research/acquisition/ranker.ts), and the
 * same pattern fits here: bias the search query toward the requested size
 * bracket's terminology, and reward sources whose own collected text states
 * a matching headcount — without ever excluding a result just because no
 * headcount was mentioned, which is true of the overwhelming majority of
 * company pages.
 */

export const COMPANY_SIZE_BUCKETS = ['1-10', '11-50', '51-200', '201-500', '500+'] as const
export type CompanySizeBucket = typeof COMPANY_SIZE_BUCKETS[number]

const QUERY_MODIFIERS: Record<CompanySizeBucket, string> = {
  '1-10': 'small business',
  '11-50': 'small to medium business',
  '51-200': 'mid-size company',
  '201-500': 'large company',
  '500+': 'enterprise',
}

/** Biases the search query toward the requested size bracket's terminology — a relevance signal, not a verified filter. */
export function companySizeQueryModifier(bucket: string): string | undefined {
  return QUERY_MODIFIERS[bucket as CompanySizeBucket]
}

/** Exported for lib/research/acquisition/apollo-adapter.ts, which buckets a verified third-party employee count the same way a scraped headcount mention is bucketed. */
export function bucketEmployeeCount(count: number): CompanySizeBucket {
  if (count <= 10) return '1-10'
  if (count <= 50) return '11-50'
  if (count <= 200) return '51-200'
  if (count <= 500) return '201-500'
  return '500+'
}

const EMPLOYEE_COUNT_PATTERN = /\b([\d,]{1,7})\+?\s*(?:employees|staff|team members|workers|personnel)\b/i
const TEAM_OF_PATTERN = /\bteam of\s*([\d,]{1,7})\+?\b/i

/** Extracts an explicit headcount mention from collected page text and buckets it — undefined when no number is stated, never guessed. */
export function extractCompanySizeKey(text: string): CompanySizeBucket | undefined {
  const match = EMPLOYEE_COUNT_PATTERN.exec(text) ?? TEAM_OF_PATTERN.exec(text)
  if (!match) return undefined
  const count = Number(match[1].replace(/,/g, ''))
  if (!Number.isFinite(count) || count <= 0) return undefined
  return bucketEmployeeCount(count)
}
