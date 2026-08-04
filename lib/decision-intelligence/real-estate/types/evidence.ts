import type { REEvidenceCategory } from './enums'

// RE-specific evidence types. These are DISTINCT from the general DI engine's
// EvidenceCategory / EvidenceItem types in lib/decision-intelligence/types/evidence.types.ts.
// They live in the RE namespace and do not replace or extend the general types.

export interface REEvidenceItem {
  key: string
  value: string | number | boolean
  notes?: string
}

export interface REEvidence {
  category: REEvidenceCategory
  authority: number            // 0.0 to 1.0 — source reliability weight
  source: string               // source type identifier
  timestamp: string            // ISO-8601
  items?: REEvidenceItem[]     // supporting key-value metadata
}

// Parsed evidence collection with fast lookup by category
export interface REEvidenceCollection {
  items: REEvidence[]
  byCategory: Partial<Record<REEvidenceCategory, REEvidence>>
}

export function buildEvidenceCollection(items: REEvidence[]): REEvidenceCollection {
  const byCategory: Partial<Record<REEvidenceCategory, REEvidence>> = {}
  for (const item of items) {
    byCategory[item.category] = item
  }
  return { items, byCategory }
}

// Evidence freshness in days since the evidence timestamp
export function evidenceAgeDays(evidence: REEvidence): number {
  const ms = Date.now() - new Date(evidence.timestamp).getTime()
  return ms / (1000 * 60 * 60 * 24)
}
