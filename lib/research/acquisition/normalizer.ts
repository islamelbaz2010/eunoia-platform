import { SECTORS } from '@core/data/sectors.data'
import { ALL_CITIES } from '@core/data/cities.data'
import { extractCompanySizeKey } from '../company-size'
import type { CollectedSource, NormalizedSource, SearchResult, SourceType } from './types'

export interface CollectedItem {
  searchResult: SearchResult
  collected: CollectedSource | null
  sourceType: SourceType
}

/**
 * Dedupes by domain (one entry per company/site, regardless of how many
 * pages on it matched) and maps any sector/city mention in the page text
 * onto the existing core/data taxonomy keys — the same taxonomy Lead Finder
 * and Talent Finder forms already use, so a discovered company slots
 * straight into the rest of the UI without a separate vocabulary.
 */
export function normalizeSources(items: CollectedItem[]): NormalizedSource[] {
  const seenDomains = new Set<string>()
  const normalized: NormalizedSource[] = []

  for (const item of items) {
    const url = item.collected?.finalUrl ?? item.searchResult.url
    let domain: string
    try {
      domain = new URL(url).hostname.replace(/^www\./, '')
    } catch {
      continue
    }
    if (seenDomains.has(domain)) continue

    const title = (item.collected?.title || item.searchResult.title).trim()
    const text = (item.collected?.text || item.searchResult.snippet).trim()
    if (!title || !text) continue

    seenDomains.add(domain)
    normalized.push({
      domain,
      title,
      url,
      sourceType: item.sourceType,
      text,
      sectorKey: matchSectorKey(`${title} ${text}`),
      cityKey: matchCityKey(`${title} ${text}`),
      companySizeKey: extractCompanySizeKey(text),
    })
  }

  return normalized
}

function matchSectorKey(text: string): string | undefined {
  const lower = text.toLowerCase()
  for (const [key, data] of Object.entries(SECTORS)) {
    if (key === 'other') continue
    if (lower.includes(data.en.toLowerCase())) return key
  }
  return undefined
}

function matchCityKey(text: string): string | undefined {
  const lower = text.toLowerCase()
  for (const city of ALL_CITIES) {
    if (lower.includes(city.en.toLowerCase())) return city.key
  }
  return undefined
}
