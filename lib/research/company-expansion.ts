import type { NormalizedSource } from './acquisition/types'

/**
 * Company Expansion Engine — improves recall without spending extra SerpAPI
 * quota. A business-directory listing page (e.g. "Top 20 manufacturers in
 * Cairo") usually names several companies in its visible text, but the
 * search engine only returned the directory's own URL — every other company
 * it mentions was invisible to the rest of the pipeline. htmlToText()
 * (source-collector.ts) strips all markup including `<a href>` attributes,
 * so what survives into `text` is only what a visitor would actually SEE on
 * the page — which directories commonly render as "Company Name —
 * acmecorp.com" or "Website: acmecorp.com". This module mines those visible
 * domain mentions and turns them into new candidate domains for
 * ResearchService to fetch directly, growing the pool before
 * validate/dedupe/rank run again over the combined set.
 *
 * Scoped to `business_directory` sources only (not every company_website) —
 * a directory's whole purpose is listing companies in the target category,
 * while an arbitrary mention on a company's own site (a partner, a vendor, a
 * competitor named in a blog post) is not evidence of a *relevant* company
 * and would just inject noise.
 */

const MIN_SOURCE_TEXT_LENGTH = 200
const DEFAULT_EXPANSION_LIMIT = 5

/** Matches visible domain-like text, e.g. "acmecorp.com" or "www.acme-corp.co.uk". */
const DOMAIN_MENTION_PATTERN = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}\b/gi

/** Common file extensions that match the domain shape (`name.ext`) but are never a company's own domain. */
const FILE_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp',
  'zip', 'rar', 'mp4', 'mp3', 'avi', 'mov', 'html', 'htm', 'php', 'aspx', 'css', 'js', 'json', 'xml', 'txt',
])

/** Generic platforms/utilities that show up constantly in footers and copy but are never the lead itself. */
const NON_COMPANY_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'google.com', 'googleapis.com', 'googleusercontent.com',
  'youtube.com', 'youtu.be', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 't.me',
  'telegram.me', 'wikipedia.org', 'wordpress.com', 'wixsite.com', 'godaddy.com', 'schema.org', 'w3.org',
  'sentry.io', 'cloudflare.com', 'gravatar.com', 'apple.com', 'microsoft.com', 'amazon.com',
])

function normalizeDomain(raw: string): string {
  return raw.toLowerCase().replace(/^www\./, '')
}

function isPlausibleCompanyDomain(domain: string): boolean {
  const lastSegment = domain.split('.').pop() ?? ''
  if (FILE_EXTENSIONS.has(lastSegment)) return false
  if (NON_COMPANY_DOMAINS.has(domain)) return false
  return true
}

export interface ExpansionOptions {
  /** Caps total new candidate domains returned across the whole input set, bounding extra fetches per run. */
  limit?: number
}

/**
 * Extracts up to `limit` new candidate domains mentioned inside
 * `business_directory` sources' collected text, excluding domains already
 * present in the input set (already found, no need to re-fetch) and
 * excluding the mentioning source's own domain (self-references aren't a
 * different company). Pure and deterministic — same principle as the rest
 * of the Research Core Engine: every candidate is traceable to real text
 * that was actually collected, nothing is invented.
 */
export function extractMentionedDomains(
  sources: Pick<NormalizedSource, 'domain' | 'sourceType' | 'text'>[],
  options: ExpansionOptions = {}
): string[] {
  const limit = options.limit ?? DEFAULT_EXPANSION_LIMIT
  const knownDomains = new Set(sources.map(s => normalizeDomain(s.domain)))
  const found: string[] = []
  const seen = new Set<string>()

  for (const source of sources) {
    if (source.sourceType !== 'business_directory') continue
    if (source.text.length < MIN_SOURCE_TEXT_LENGTH) continue

    const matches = source.text.match(DOMAIN_MENTION_PATTERN) ?? []
    for (const match of matches) {
      const domain = normalizeDomain(match)
      if (domain === normalizeDomain(source.domain)) continue
      if (knownDomains.has(domain)) continue
      if (seen.has(domain)) continue
      if (!isPlausibleCompanyDomain(domain)) continue

      seen.add(domain)
      found.push(domain)
      if (found.length >= limit) return found
    }
  }

  return found
}
