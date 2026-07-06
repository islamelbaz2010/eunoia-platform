import { bucketEmployeeCount } from '../company-size'
import type { RankedSource } from './types'

/**
 * Apollo Enrichment — optional, never mandatory. Apollo.io's organization
 * database can independently confirm a discovered domain and its real
 * employee count, which is strictly better evidence than a regex match
 * against scraped page text (lib/research/company-size.ts's
 * extractCompanySizeKey) — but the overwhelming majority of installs won't
 * have an Apollo subscription, so every part of the Research Core Engine
 * must produce identical results with or without it. Mirrors the
 * SearchProvider/AIProvider interface shape (lib/research/acquisition/
 * search-provider.ts, services/legacy-ai-engine/providers/base.provider.ts)
 * so it's a drop-in, not a special case, and never throws out of
 * enrichDomain() — a missing key, a rate limit, or a network failure all
 * resolve to `null`, the same as "Apollo had nothing to add."
 */

export class ApolloAdapterError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly statusCode?: number
  ) {
    super(message)
    this.name = 'ApolloAdapterError'
  }
}

export interface ApolloEnrichment {
  domain: string
  employeeCount?: number
  industry?: string
}

export interface ApolloAdapter {
  name: string
  /** Whether the adapter has credentials configured at all — lets callers skip the enrichment pass entirely rather than awaiting N calls that will all resolve to null. */
  isConfigured(): boolean
  /** Resolves to null on a missing key, no match, or any request failure — enrichment failing is never allowed to fail the research run itself. */
  enrichDomain(domain: string): Promise<ApolloEnrichment | null>
}

interface ApolloOrganizationEnrichResponse {
  organization?: {
    estimated_num_employees?: number
    industry?: string
  } | null
}

const APOLLO_ENRICH_URL = 'https://api.apollo.io/v1/organizations/enrich'
const APOLLO_TIMEOUT_MS = 5000

/** Real adapter for Apollo's Organization Enrichment endpoint. Construct with no args in production — it reads APOLLO_API_KEY itself. */
export class ApolloOrgEnrichAdapter implements ApolloAdapter {
  readonly name = 'apollo'
  private apiKey?: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.APOLLO_API_KEY
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  async enrichDomain(domain: string): Promise<ApolloEnrichment | null> {
    if (!this.apiKey) return null

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), APOLLO_TIMEOUT_MS)

    try {
      const params = new URLSearchParams({ domain })
      const res = await fetch(`${APOLLO_ENRICH_URL}?${params.toString()}`, {
        signal: controller.signal,
        headers: { 'X-Api-Key': this.apiKey, Accept: 'application/json' },
      })

      if (!res.ok) return null

      const json = (await res.json()) as ApolloOrganizationEnrichResponse
      const org = json.organization
      if (!org) return null

      return {
        domain,
        employeeCount: org.estimated_num_employees,
        industry: org.industry,
      }
    } catch {
      return null
    } finally {
      clearTimeout(timeout)
    }
  }
}

const APOLLO_CONFIRMATION_BOOST = 5
/**
 * The rest of the Confidence Engine (lib/research/acquisition/ranker.ts)
 * caps every score at 95 because it's evidence-based research, not a
 * verified record. An Apollo confirmation is a verified third-party record,
 * so a confirmed source is allowed a small additional ceiling — still never
 * 100, since this app never claims certainty about a specific company.
 */
const APOLLO_CONFIRMED_CEILING = 98

/** Pure merge of an Apollo confirmation into an already-ranked source. Never called when enrichment returned null — a source that Apollo didn't confirm is returned completely unchanged by the caller. */
export function applyApolloEnrichment(source: RankedSource, enrichment: ApolloEnrichment): RankedSource {
  const companySizeKey = enrichment.employeeCount ? bucketEmployeeCount(enrichment.employeeCount) : source.companySizeKey

  return {
    ...source,
    companySizeKey,
    apolloVerified: true,
    confidenceScore: Math.min(source.confidenceScore + APOLLO_CONFIRMATION_BOOST, APOLLO_CONFIRMED_CEILING),
    rankReason: `${source.rankReason}; Confirmed by Apollo company database (+${APOLLO_CONFIRMATION_BOOST})`,
  }
}
