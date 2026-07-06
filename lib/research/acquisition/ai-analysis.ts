import type { AIProvider } from '@/services/legacy-ai-engine/providers/base.provider'
import { OpenAIProvider } from '@/services/legacy-ai-engine/providers/openai.provider'
import type { RankedSource } from './types'
import { ResearchResultItemSchema, type ResearchResultItem } from './types'

export interface AIAnalysisOptions {
  maxItems?: number
}

interface SummaryEntry {
  index: number
  summary: string
}

/**
 * AI Analysis stage. Receives a CLOSED list of already-discovered, already-scored
 * sources and may only summarize each one — it has no way to add, remove, or
 * rename an item, because the returned list is built by mapping the model's
 * per-index summaries back onto the fixed input array, not by trusting
 * whatever array the model decides to return. If the model fails or returns
 * malformed JSON, every item falls back to its real collected excerpt
 * instead of being dropped or replaced with invented text.
 */
export async function analyzeRankedSources(
  rankedSources: RankedSource[],
  query: string,
  provider: AIProvider = new OpenAIProvider(),
  options: AIAnalysisOptions = {}
): Promise<ResearchResultItem[]> {
  const limited = rankedSources.slice(0, options.maxItems ?? 10)
  if (limited.length === 0) return []

  const closedList = limited.map((s, index) => ({
    index,
    title: s.title,
    sourceType: s.sourceType,
    excerpt: s.text.slice(0, 800),
  }))

  const prompt = `You are a research analyst. Below is a CLOSED list of real, already-discovered sources for the query "${query}". For EACH item, write a factual 1-2 sentence summary based ONLY on its excerpt. Do not add, remove, reorder, or invent any item — there are exactly ${limited.length} items, indexed 0 to ${limited.length - 1}.

Sources:
${JSON.stringify(closedList, null, 2)}

Respond with ONLY valid JSON in this exact shape:
{ "summaries": [{ "index": 0, "summary": "..." }] }`

  let summaries: SummaryEntry[] = []
  try {
    const response = await provider.generate(prompt, {
      maxTokens: 2000,
      temperature: 0.2,
      systemPrompt: 'Respond with ONLY valid JSON. Never invent a source outside the provided closed list.',
    })
    const parsed = JSON.parse(response.content) as { summaries?: SummaryEntry[] }
    summaries = Array.isArray(parsed.summaries) ? parsed.summaries : []
  } catch {
    summaries = []
  }

  const summaryByIndex = new Map(summaries.map(s => [s.index, s.summary]))

  return limited
    .map((source, index) => {
      const aiSummary = summaryByIndex.get(index)?.trim()
      const item = {
        title: source.title,
        sourceUrl: source.url,
        sourceType: source.sourceType,
        confidenceScore: source.confidenceScore,
        summary: aiSummary || source.text.slice(0, 240),
        companySizeKey: source.companySizeKey,
        apolloVerified: source.apolloVerified,
      }
      const result = ResearchResultItemSchema.safeParse(item)
      return result.success ? result.data : null
    })
    .filter((item): item is ResearchResultItem => item !== null)
}
