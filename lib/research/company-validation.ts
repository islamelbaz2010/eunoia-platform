import type { NormalizedSource } from './acquisition/types'

/**
 * Company Validation Engine — a domain/URL-pattern safety net for
 * classifySourceType()'s permissive default (lib/research/acquisition/source-collector.ts):
 * any host not on its short DIRECTORY_DOMAINS/NO_FETCH_DOMAINS lists is classified
 * `company_website`, which lets Wikipedia, .gov pages, job boards, forums, and
 * directories the collector doesn't know about reach the ranker mislabeled as the
 * company itself. This module re-checks every normalized source against a much
 * wider blacklist before it can reach the ranker or the user.
 */

export interface ValidationResult {
  isValid: boolean
  validationScore: number
  validationReason: string
}

const WIKIPEDIA_DOMAINS = ['wikipedia.org', 'wikimedia.org', 'wiktionary.org', 'wikihow.com']

const JOB_BOARD_DOMAINS = [
  'indeed.com', 'glassdoor.com', 'monster.com', 'bayt.com', 'naukrigulf.com',
  'wuzzuf.net', 'forasna.com', 'akhtaboot.com', 'gulftalent.com', 'careerjet.com',
  'simplyhired.com', 'ziprecruiter.com', 'linkedin.com/jobs',
]

const AGGREGATOR_DOMAINS = [
  'yellowpages', 'kompass.com', 'europages', 'opencorporates.com', 'tradeford.com',
  'egyptyp.com', 'yelp.com', 'crunchbase.com', 'dnb.com', 'zoominfo.com', 'manta.com',
  'bbb.org', 'thomasnet.com', 'alibaba.com', 'indiamart.com', 'globalsources.com',
  'tradekey.com', 'owler.com', 'rocketreach.co', 'apollo.io', 'datanyze.com',
  'craft.co', 'pitchbook.com', 'glassdoor.io',
]

const FORUM_DOMAINS = ['reddit.com', 'quora.com', 'stackexchange.com', 'stackoverflow.com', 'news.ycombinator.com']

const SOCIAL_DOMAINS = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 't.me', 'telegram.me']

/** Matches a bare .gov / .gov.xx / .mil hostname — not e.g. "governance-consulting.com". */
const GOVERNMENT_PATTERN = /(^|\.)gov(\.[a-z]{2})?$|(^|\.)mil$/i

/** A social platform URL path that denotes a community/group, not a company's own profile. */
const SOCIAL_GROUP_PATH_PATTERN = /\/(groups?|r)\//i

function domainIncludes(domain: string, list: string[]): boolean {
  return list.some(d => domain.includes(d))
}

function invalid(reason: string): ValidationResult {
  return { isValid: false, validationScore: 5, validationReason: reason }
}

function valid(score: number, reason: string): ValidationResult {
  return { isValid: true, validationScore: score, validationReason: reason }
}

export type ValidatableSource = Pick<NormalizedSource, 'domain' | 'url' | 'sourceType'>

/** Deterministic, explainable VALID/INVALID classification for a single discovered source. */
export function validateCompanySource(source: ValidatableSource): ValidationResult {
  const domain = source.domain.toLowerCase()
  const url = source.url.toLowerCase()

  if (domainIncludes(domain, WIKIPEDIA_DOMAINS)) {
    return invalid('Encyclopedia/wiki page, not an official company source')
  }
  if (GOVERNMENT_PATTERN.test(domain)) {
    return invalid('Government domain, not a company source')
  }
  if (domainIncludes(domain, JOB_BOARD_DOMAINS)) {
    return invalid('Job board listing, not an official company source')
  }
  if (domainIncludes(domain, FORUM_DOMAINS)) {
    return invalid('Forum/Q&A site, not an official company source')
  }
  if (domainIncludes(domain, AGGREGATOR_DOMAINS)) {
    return invalid('Business directory or data aggregator, not the company itself')
  }
  if (domainIncludes(domain, SOCIAL_DOMAINS) && SOCIAL_GROUP_PATH_PATTERN.test(url)) {
    return invalid('Social media group/community page, not an official company profile')
  }

  if (source.sourceType === 'company_website') {
    return valid(90, 'Primary company website')
  }
  if (domainIncludes(domain, SOCIAL_DOMAINS)) {
    return valid(70, 'Official company social media profile')
  }
  return valid(60, 'Public listing page, unverified beyond search snippet')
}

/**
 * Filters a list of normalized sources down to VALID companies only, stamping
 * each survivor with its validationScore/validationReason so later stages
 * (ranking, confidence scoring) can use the same evidence instead of
 * re-deriving it.
 */
export function filterValidSources<T extends ValidatableSource>(
  sources: T[]
): Array<T & { validationScore: number; validationReason: string }> {
  const out: Array<T & { validationScore: number; validationReason: string }> = []
  for (const source of sources) {
    const result = validateCompanySource(source)
    if (!result.isValid) continue
    out.push({ ...source, validationScore: result.validationScore, validationReason: result.validationReason })
  }
  return out
}
