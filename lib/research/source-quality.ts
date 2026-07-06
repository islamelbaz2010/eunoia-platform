import { redis } from '@/lib/redis/client'
import type { CollectedSource } from './acquisition/types'

/**
 * Source Quality Engine. Two independent signals:
 *
 * 1. Per-fetch broken/placeholder-page detection (detectBrokenPage) — catches
 *    "soft 404s": pages that return HTTP 200 (so FetchSourceCollector's
 *    `res.ok` check passes) but are actually parked domains, "coming soon"
 *    placeholders, suspended accounts, or default web-server pages. None of
 *    these are HTTP errors, so nothing upstream currently filters them.
 *
 * 2. Cross-request reputation tracking (recordSourceOutcome/getSourceReputation)
 *    — a Redis-backed counter per domain, fail-open like the rest of the
 *    codebase's Redis usage. A domain that keeps producing broken pages or
 *    failed fetches across many different users' searches gets auto-suppressed
 *    platform-wide, without needing a human to add it to a static blacklist.
 */

const PARKED_DOMAIN_PROVIDERS = [
  'sedo.com', 'dan.com', 'hugedomains.com', 'parkingcrew.net', 'bodis.com',
  'undeveloped.com', 'afternic.com', 'parklogic.com', 'above.com', 'voodoo.com',
]

export function isParkedDomainProvider(domain: string): boolean {
  return PARKED_DOMAIN_PROVIDERS.some(d => domain.includes(d))
}

const BROKEN_PAGE_PATTERNS: RegExp[] = [
  /\b404\b[^a-z]{0,20}(not found|error)/i,
  /page (could )?not (be )?found/i,
  /this domain (is|may be) (for sale|parked)/i,
  /domain (name )?for sale/i,
  /buy this domain/i,
  /under construction/i,
  /coming soon/i,
  /account (has been |is )?suspended/i,
  /default web (site|page)/i,
  /apache2? (ubuntu )?default page/i,
  /index of \//i,
  /this site can.?t be reached/i,
  /website (is currently )?(unavailable|disabled)/i,
]

export interface BrokenPageCheck {
  isBroken: boolean
  reason?: string
}

/** Pattern-matches collected page text/title for soft-404/parked/placeholder signals an HTTP status code alone can't catch. */
export function detectBrokenPage(collected: Pick<CollectedSource, 'text' | 'title'>): BrokenPageCheck {
  const haystack = `${collected.title} ${collected.text}`
  for (const pattern of BROKEN_PAGE_PATTERNS) {
    if (pattern.test(haystack)) {
      return { isBroken: true, reason: 'Page content matches a known broken/placeholder pattern' }
    }
  }
  if (collected.text.trim().length < 40) {
    return { isBroken: true, reason: 'Collected page text is too thin to be a real company page' }
  }
  return { isBroken: false }
}

const REPUTATION_PREFIX = 'research:source-quality'
const MIN_SAMPLES_BEFORE_SUPPRESSION = 5
const FAILURE_RATE_SUPPRESSION_THRESHOLD = 0.6
const REPUTATION_TTL_SECONDS = 60 * 60 * 24 * 30

interface ReputationCounters {
  successes: number
  failures: number
}

function reputationKey(domain: string): string {
  return `${REPUTATION_PREFIX}:${domain}`
}

/** Best-effort, fail-open — reputation tracking must never block or fail the research pipeline. */
export async function recordSourceOutcome(domain: string, outcome: 'success' | 'failure'): Promise<void> {
  try {
    const key = reputationKey(domain)
    const current = (await redis.get<ReputationCounters>(key)) ?? { successes: 0, failures: 0 }
    const updated: ReputationCounters = {
      successes: current.successes + (outcome === 'success' ? 1 : 0),
      failures: current.failures + (outcome === 'failure' ? 1 : 0),
    }
    await redis.set(key, updated, { ex: REPUTATION_TTL_SECONDS })
  } catch {
    // Non-fatal — same fail-open pattern as lib/research/rate-limit.ts.
  }
}

export interface SourceReputation {
  successes: number
  failures: number
  suppressed: boolean
}

/** A domain is suppressed once it has enough samples and a high enough failure rate — never on a single bad fetch. */
export async function getSourceReputation(domain: string): Promise<SourceReputation> {
  try {
    const counters = (await redis.get<ReputationCounters>(reputationKey(domain))) ?? { successes: 0, failures: 0 }
    const total = counters.successes + counters.failures
    const failureRate = total > 0 ? counters.failures / total : 0
    const suppressed = total >= MIN_SAMPLES_BEFORE_SUPPRESSION && failureRate >= FAILURE_RATE_SUPPRESSION_THRESHOLD
    return { ...counters, suppressed }
  } catch {
    return { successes: 0, failures: 0, suppressed: false }
  }
}
