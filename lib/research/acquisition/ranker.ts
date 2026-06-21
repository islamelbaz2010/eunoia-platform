import type { NormalizedSource, RankedSource } from './types'

export interface RankingOptions {
  sectorHint?: string
  cityHint?: string
  /** lib/research/company-size.ts bucket key, e.g. "51-200". Rewards an explicit headcount match; a source with no headcount mentioned at all is neutral, never penalized. */
  companySizeHint?: string
}

/**
 * Confidence Engine — deterministic, input-only scoring — same principle as
 * lib/research/sources.ts's computeConfidence(): the score is derived from
 * what was actually found, not from the AI's own output, so the AI cannot
 * inflate its own credibility.
 *
 * Every source reaching this stage already passed company-validation.ts's
 * VALID check (lib/research/acquisition/research-service.ts filters out
 * directories/wikipedia/job-boards/forums/government/social-groups before
 * ranking), so this stage's job isn't to re-penalize bad sources — it's to
 * weight the *evidence quality* of sources that already cleared that bar.
 * Each weight sums to a max of 95 (never 100 — this is evidence-based
 * research, not a verified record, the same ceiling the rest of the
 * codebase uses).
 */
const WEIGHTS = {
  /** Scaled from company-validation.ts's validationScore (0-100) — the strongest single signal. */
  validation: 30,
  /** Authoritativeness of the source type itself: own domain > official social profile > third-party directory. */
  sourceType: 25,
  sectorMatch: 15,
  cityMatch: 15,
  /** Low weight on purpose — most pages never state a headcount at all, so this only ever fires for a minority of sources. */
  companySizeMatch: 5,
  contentDepth: 5,
} as const

const SOURCE_TYPE_POINTS: Record<NormalizedSource['sourceType'], { points: number; label: string }> = {
  company_website: { points: WEIGHTS.sourceType, label: 'Primary company website (own domain)' },
  public_listing: { points: Math.round(WEIGHTS.sourceType * 0.6), label: 'Official social media profile (snippet only, not scraped)' },
  business_directory: { points: Math.round(WEIGHTS.sourceType * 0.4), label: 'Third-party business directory listing' },
}

export function rankSources(sources: NormalizedSource[], options: RankingOptions = {}): RankedSource[] {
  return sources
    .map(source => {
      let score = 0
      const reasons: string[] = []

      const validationScore = source.validationScore ?? 60
      const validationPoints = Math.round((validationScore / 100) * WEIGHTS.validation)
      score += validationPoints
      reasons.push(`Validation score ${validationScore}/100 (+${validationPoints})`)

      const sourceTypeInfo = SOURCE_TYPE_POINTS[source.sourceType]
      score += sourceTypeInfo.points
      reasons.push(`${sourceTypeInfo.label} (+${sourceTypeInfo.points})`)

      if (options.sectorHint && source.sectorKey === options.sectorHint) {
        score += WEIGHTS.sectorMatch
        reasons.push(`Industry matches search criteria (+${WEIGHTS.sectorMatch})`)
      }

      if (options.cityHint && source.cityKey === options.cityHint) {
        score += WEIGHTS.cityMatch
        reasons.push(`Location matches search criteria (+${WEIGHTS.cityMatch})`)
      }

      if (options.companySizeHint && source.companySizeKey === options.companySizeHint) {
        score += WEIGHTS.companySizeMatch
        reasons.push(`Stated headcount matches requested company size (+${WEIGHTS.companySizeMatch})`)
      }

      if (source.text.length > 300) {
        score += WEIGHTS.contentDepth
        reasons.push(`Substantial page content collected (+${WEIGHTS.contentDepth})`)
      }

      score = Math.max(0, Math.min(95, score))

      return { ...source, confidenceScore: score, rankReason: reasons.join('; ') }
    })
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
}
