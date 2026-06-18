import type { NormalizedSource, RankedSource } from './types'

export interface RankingOptions {
  sectorHint?: string
  cityHint?: string
}

/**
 * Deterministic, input-only scoring — same principle as
 * lib/research/sources.ts's computeConfidence(): the score is derived from
 * what was actually found (source type, taxonomy match, content depth), not
 * from the AI's own output, so the AI cannot inflate its own credibility.
 */
export function rankSources(sources: NormalizedSource[], options: RankingOptions = {}): RankedSource[] {
  return sources
    .map(source => {
      let score = 40
      const reasons: string[] = ['Found via Google Custom Search']

      if (source.sourceType === 'company_website') {
        score += 20
        reasons.push('Primary company website')
      } else if (source.sourceType === 'business_directory') {
        score += 10
        reasons.push('Listed in a public business directory')
      } else {
        score += 5
        reasons.push('Public listing page (search snippet only, not scraped)')
      }

      if (options.sectorHint && source.sectorKey === options.sectorHint) {
        score += 15
        reasons.push('Sector matches search criteria')
      }

      if (options.cityHint && source.cityKey === options.cityHint) {
        score += 15
        reasons.push('Location matches search criteria')
      }

      if (source.text.length > 300) {
        score += 5
        reasons.push('Substantial page content collected')
      }

      score = Math.max(0, Math.min(95, score))

      return { ...source, confidenceScore: score, rankReason: reasons.join('; ') }
    })
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
}
