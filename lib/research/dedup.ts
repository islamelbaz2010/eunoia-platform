import type { NormalizedSource } from './acquisition/types'

/**
 * Cross-domain Deduplication Engine. normalizeSources() only dedupes by exact
 * domain, so the same real company showing up as its own website AND as a
 * LinkedIn/Facebook/Instagram page (each a different domain) reaches the
 * ranker as 2-3 separate "companies." This groups sources that look like the
 * same company — by normalized name and, for social platforms, by the
 * profile's URL slug — and keeps one representative per group.
 *
 * Known limitation: domain roots with no separator (e.g. "acmecorp.com")
 * aren't word-segmented, so they won't fuzzy-match a hyphenated/camelCase
 * variant ("acme-corp.com", instagram.com/AcmeCorp) on domain root alone —
 * matching falls back to the title/slug signal in that case, which still
 * covers the common website+social-profile duplicate.
 */

const LEGAL_SUFFIXES = new Set([
  'inc', 'incorporated', 'llc', 'ltd', 'limited', 'co', 'company', 'corp', 'corporation',
  'group', 'holding', 'holdings', 'gmbh', 'sae', 'sa', 'plc', 'llp', 'pvt', 'wll', 'fzco', 'fze',
  'enterprises', 'industries', 'international', 'trading', 'est', 'establishment',
])

/** Trailing site chrome search-result titles commonly carry, e.g. "Acme Corp | Facebook". */
const PLATFORM_SUFFIX_PATTERN = /\s*[|\-–—:]\s*(facebook|instagram|linkedin|twitter|x|home|official website|official site|welcome)\s*$/i

const SOCIAL_DOMAINS = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com']

const SAME_COMPANY_THRESHOLD = 0.82

function stripPlatformChrome(title: string): string {
  let result = title.trim()
  let prev: string
  do {
    prev = result
    result = result.replace(PLATFORM_SUFFIX_PATTERN, '').trim()
  } while (result !== prev)
  return result
}

/** Splits camelCase/concatenated handles (Instagram/Twitter strip separators) into words before normalizing. */
function splitCamelCase(text: string): string {
  return text.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
}

/** Lowercase, strip punctuation, drop legal-entity suffixes, sort tokens — order- and suffix-independent. */
export function normalizeCompanyName(raw: string): string {
  const cleaned = splitCamelCase(stripPlatformChrome(raw))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const tokens = cleaned.split(' ').filter(Boolean)
  const withoutSuffixes = tokens.filter(t => !LEGAL_SUFFIXES.has(t))
  const finalTokens = withoutSuffixes.length > 0 ? withoutSuffixes : tokens
  return [...finalTokens].sort().join(' ')
}

/**
 * Normalizes a domain's first label into a comparable key. Hyphenated roots
 * ("acme-corp") go through the normal token-based suffix strip. Fused roots
 * with no separator ("acmecorp") can't be word-segmented without a
 * dictionary, so as a fallback we strip a trailing legal-suffix substring
 * directly (covers the very common "<brand><legalsuffix>" domain pattern).
 */
function domainRootKey(domain: string): string {
  const root = domain.split('.')[0] ?? domain
  let key = normalizeCompanyName(root.replace(/[-_]/g, ' '))

  if (!key.includes(' ')) {
    for (const suffix of LEGAL_SUFFIXES) {
      if (key.length > suffix.length + 2 && key.endsWith(suffix)) {
        key = key.slice(0, -suffix.length)
        break
      }
    }
  }

  return key
}

const NON_IDENTIFYING_SLUGS = new Set(['profile.php', 'pages', 'p', 'groups', 'sharer.php', 'share'])

/** Extracts the profile-identifying slug from a social URL (handles LinkedIn's /company/ and /in/ prefixes). */
function socialProfileSlug(url: string): string | undefined {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return undefined
  }
  const host = parsed.hostname.replace(/^www\./, '')
  if (!SOCIAL_DOMAINS.some(d => host.includes(d))) return undefined

  const segments = parsed.pathname.split('/').filter(Boolean)
  let slug: string | undefined

  if (host.includes('linkedin.com')) {
    const prefixIdx = segments.findIndex(s => s === 'company' || s === 'in' || s === 'school')
    slug = prefixIdx !== -1 ? segments[prefixIdx + 1] : segments[0]
  } else {
    slug = segments[0]
  }

  if (!slug || /^\d+$/.test(slug) || NON_IDENTIFYING_SLUGS.has(slug.toLowerCase())) return undefined
  return normalizeCompanyName(slug.replace(/[-_.]/g, ' '))
}

/** Edit distance, used as a typo-tolerant fallback once exact-key matching fails. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  let prevRow = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const currRow = [i]
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      currRow.push(Math.min(prevRow[j] + 1, currRow[j - 1] + 1, prevRow[j - 1] + cost))
    }
    prevRow = currRow
  }
  return prevRow[n]
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0
  if (a === b) return 1
  const maxLen = Math.max(a.length, b.length)
  return 1 - levenshtein(a, b) / maxLen
}

/**
 * Identifying keys for a source: the domain root (non-social) or profile
 * slug (social) is the primary, high-precision signal; the normalized title
 * is kept only when it has >=2 tokens so a generic single-word `<title>`
 * ("Home", "Welcome") never becomes a false-positive match key.
 */
function candidateKeys(source: NormalizedSource): string[] {
  const keys = new Set<string>()
  const isSocial = SOCIAL_DOMAINS.some(d => source.domain.includes(d))

  if (isSocial) {
    const slug = socialProfileSlug(source.url)
    if (slug) keys.add(slug)
  } else {
    const root = domainRootKey(source.domain)
    if (root.length >= 3) keys.add(root)
  }

  const titleKey = normalizeCompanyName(source.title)
  if (titleKey.length >= 6 && titleKey.includes(' ')) {
    keys.add(titleKey)
  }

  return [...keys].filter(Boolean)
}

function isSameCompany(a: NormalizedSource, b: NormalizedSource): boolean {
  const aKeys = candidateKeys(a)
  const bKeys = candidateKeys(b)
  for (const ak of aKeys) {
    for (const bk of bKeys) {
      if (similarity(ak, bk) >= SAME_COMPANY_THRESHOLD) return true
    }
  }
  return false
}

const SOURCE_TYPE_RANK: Record<NormalizedSource['sourceType'], number> = {
  company_website: 3,
  business_directory: 2,
  public_listing: 1,
}

/** Picks the single best representative of a duplicate group: highest validationScore, then the most authoritative sourceType. */
function pickBest(group: NormalizedSource[]): NormalizedSource {
  return group.slice().sort((a, b) => {
    const scoreDiff = (b.validationScore ?? 0) - (a.validationScore ?? 0)
    if (scoreDiff !== 0) return scoreDiff
    return SOURCE_TYPE_RANK[b.sourceType] - SOURCE_TYPE_RANK[a.sourceType]
  })[0]
}

/**
 * Groups sources that look like the same company and returns one
 * representative per group. Domain-exact duplicates are already removed by
 * normalizeSources(); this catches the cross-domain case (own website +
 * LinkedIn + Facebook, etc.) that exact-domain dedup cannot.
 */
export function dedupeCompanies(sources: NormalizedSource[]): NormalizedSource[] {
  const groups: NormalizedSource[][] = []

  for (const source of sources) {
    const group = groups.find(g => g.some(existing => isSameCompany(existing, source)))
    if (group) {
      group.push(source)
    } else {
      groups.push([source])
    }
  }

  return groups.map(pickBest)
}
