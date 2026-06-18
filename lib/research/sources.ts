import type { CountryKey } from '@core/data/cities.data'

/**
 * AI-generated research has no live search/scraping access, so it cannot be
 * trusted to produce real LinkedIn profile URLs or job-board links — it would
 * either invent plausible-looking fakes or hallucinate stale ones. Every link
 * shown to the user is therefore constructed here from the AI's text output
 * (company/person/job-title names), pointing at the provider's own search
 * results page rather than a specific (and possibly fabricated) profile.
 */

export function linkedInCompanySearchUrl(query: string): string {
  return `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(query)}`
}

export function linkedInPeopleSearchUrl(query: string): string {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`
}

export interface CandidateSource {
  platform: string
  url: string
  notes: string
}

const EGYPT_JOB_BOARDS = [
  { platform: 'Wuzzuf', build: (q: string) => `https://wuzzuf.net/search/jobs/?q=${encodeURIComponent(q)}` },
  { platform: 'Forasna', build: (q: string) => `https://www.forasna.com/jobs/search?keyword=${encodeURIComponent(q)}` },
]

const GULF_JOB_BOARDS = [
  { platform: 'Bayt', build: (q: string) => `https://www.bayt.com/en/jobs/?q=${encodeURIComponent(q)}` },
  { platform: 'Indeed', build: (q: string) => `https://www.indeed.com/jobs?q=${encodeURIComponent(q)}` },
]

const COUNTRY_BOARD_SETS: Record<CountryKey, typeof EGYPT_JOB_BOARDS> = {
  egypt: EGYPT_JOB_BOARDS,
  uae: GULF_JOB_BOARDS,
  saudi: GULF_JOB_BOARDS,
  kuwait: GULF_JOB_BOARDS,
  qatar: GULF_JOB_BOARDS,
  bahrain: GULF_JOB_BOARDS,
  oman: GULF_JOB_BOARDS,
  jordan: GULF_JOB_BOARDS,
  morocco: GULF_JOB_BOARDS,
  iraq: GULF_JOB_BOARDS,
}

export function buildCandidateSources(country: CountryKey, jobTitle: string, location: string): CandidateSource[] {
  const query = `${jobTitle} ${location}`.trim()
  const boards = COUNTRY_BOARD_SETS[country] ?? GULF_JOB_BOARDS
  const sources: CandidateSource[] = boards.map(b => ({
    platform: b.platform,
    url: b.build(query),
    notes: `Search ${b.platform} for "${jobTitle}" near ${location}`,
  }))
  sources.push({
    platform: 'LinkedIn',
    url: linkedInPeopleSearchUrl(query),
    notes: `Search LinkedIn profiles matching "${jobTitle}" near ${location}`,
  })
  return sources
}

export const COUNTRY_CURRENCY: Record<CountryKey, string> = {
  egypt: 'EGP',
  uae: 'AED',
  saudi: 'SAR',
  kuwait: 'KWD',
  qatar: 'QAR',
  bahrain: 'BHD',
  oman: 'OMR',
  jordan: 'JOD',
  morocco: 'MAD',
  iraq: 'IQD',
}

export interface ConfidenceScore {
  pct: number
  label: 'Medium' | 'Low'
  reason: string
}

/**
 * Deterministic, input-only confidence score — never derived from the AI's
 * own output, so the AI cannot inflate its own credibility. Capped at 95% to
 * stay honest about this being AI-generated research, not verified data.
 */
export function computeConfidence(filledFields: number, totalFields: number, resultCount: number): ConfidenceScore {
  let pct = 35 + Math.round((filledFields / totalFields) * 40)
  if (resultCount >= 5) pct += 10
  else if (resultCount >= 1) pct += 5
  pct = Math.min(95, pct)
  return {
    pct,
    label: pct >= 70 ? 'Medium' : 'Low',
    reason: 'AI-generated research based on the inputs provided — verify all companies and contacts before outreach.',
  }
}
