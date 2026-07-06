/**
 * Decision Maker Engine — app/api/research/leads/route.ts used to take the
 * user's typed target titles (e.g. "CEO, Marketing Director") and echo them
 * back verbatim for every single discovered company, regardless of that
 * company's size — a 5-person startup and a 500-person enterprise both got
 * the exact same "decision_makers" list. There is no way to know a specific
 * company's real org chart without a live directory lookup, so this never
 * invents a fact about a particular company. Instead it applies well-known,
 * real-world business-title equivalence (a CEO and a Founder are commonly
 * the same role; a Marketing Director and a VP Marketing are commonly the
 * same role) to widen each LinkedIn search, and uses a company's own
 * evidence-stated headcount bucket (lib/research/company-size.ts) — when
 * available — only to reorder which equivalent is suggested first, never to
 * add a title that isn't already a genuine synonym of what the user asked
 * for. An unrecognized title is always passed through unchanged.
 */

const SMALL_COMPANY_BUCKETS = ['1-10', '11-50']

interface RoleCluster {
  /** Equivalent titles for the same role, matched case-insensitively. The first entry is the most formal/common form. */
  equivalents: string[]
  /** Preferred equivalent to lead with at small companies, where it's more likely to exist than a formal C-suite title — a relevance preference, never a claim about a specific company. */
  smallCompanyPreferred?: string
}

const ROLE_CLUSTERS: RoleCluster[] = [
  {
    equivalents: ['CEO', 'Chief Executive Officer', 'Founder', 'Co-Founder', 'Managing Director', 'President', 'Owner', 'General Manager'],
    smallCompanyPreferred: 'Founder',
  },
  {
    equivalents: ['COO', 'Chief Operating Officer', 'Operations Director', 'VP Operations', 'Head of Operations'],
  },
  {
    equivalents: ['CFO', 'Chief Financial Officer', 'Finance Director', 'VP Finance', 'Head of Finance'],
  },
  {
    equivalents: ['CTO', 'Chief Technology Officer', 'VP Engineering', 'Head of Engineering', 'Engineering Director', 'IT Director', 'IT Manager'],
  },
  {
    equivalents: ['CMO', 'Chief Marketing Officer', 'Marketing Director', 'VP Marketing', 'Head of Marketing', 'Marketing Manager'],
  },
  {
    equivalents: ['Sales Director', 'VP Sales', 'Head of Sales', 'Sales Manager', 'Business Development Director'],
  },
  {
    equivalents: ['HR Director', 'VP HR', 'Head of HR', 'Head of People', 'Human Resources Manager', 'People Director'],
  },
  {
    equivalents: ['Procurement Manager', 'Purchasing Manager', 'Procurement Director', 'Head of Procurement'],
  },
]

function findCluster(title: string): RoleCluster | undefined {
  const norm = title.toLowerCase().trim()
  return ROLE_CLUSTERS.find(c => c.equivalents.some(e => e.toLowerCase() === norm))
}

export interface DecisionMakerRecommendation {
  title: string
  reason: string
}

const MAX_RECOMMENDATIONS_PER_TITLE = 2

/**
 * Expands one user-typed target title into up to two concrete titles to
 * search for at a given company: the user's exact title first (their stated
 * intent is never dropped or overridden), plus — only when the title matches
 * a known role cluster — one genuine equivalent, biased toward the company's
 * own size bucket when known.
 */
export function recommendDecisionMakerTitles(
  userTitle: string,
  companySizeBucket?: string
): DecisionMakerRecommendation[] {
  const trimmed = userTitle.trim()
  const recommendations: DecisionMakerRecommendation[] = [
    { title: trimmed, reason: 'Searching for the exact title you specified.' },
  ]

  const cluster = findCluster(trimmed)
  if (!cluster) return recommendations

  const seen = new Set([trimmed.toLowerCase()])
  const isSmallCompany = !!companySizeBucket && SMALL_COMPANY_BUCKETS.includes(companySizeBucket)
  const candidates = isSmallCompany && cluster.smallCompanyPreferred
    ? [cluster.smallCompanyPreferred, ...cluster.equivalents]
    : cluster.equivalents

  for (const candidate of candidates) {
    if (recommendations.length >= MAX_RECOMMENDATIONS_PER_TITLE) break
    const key = candidate.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    const reason = isSmallCompany && candidate === cluster.smallCompanyPreferred
      ? `Companies this size more often use "${candidate}" than "${trimmed}" — added as a likely equivalent.`
      : 'Common equivalent title for the same role — widens the LinkedIn search beyond the exact wording.'
    recommendations.push({ title: candidate, reason })
  }

  return recommendations
}
