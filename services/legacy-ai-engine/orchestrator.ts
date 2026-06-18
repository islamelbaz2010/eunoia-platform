import crypto from 'crypto'
import type { PromptContext } from './prompts/types'
import { OpenAIProvider } from './providers/openai.provider'
import { AIProviderError } from './providers/base.provider'
import type { AIProvider, AIResponse } from './providers/base.provider'
import { buildPromptForType, type ReportType } from './prompt-builder'

export interface OrchestratorOptions {
  workspaceId: string
  userId: string
  reportId?: string
}

export interface OrchestratorResult {
  data: Record<string, unknown>
  provider: string
  model: string
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  cached: boolean
  durationMs: number
}

// Rate limit: 5 reports per hour per workspace
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_SECONDS = 3600
const CACHE_TTL_SECONDS = 86400 // 24h

function buildInputHash(type: ReportType, ctx: PromptContext): string {
  const payload = JSON.stringify({ type, ctx })
  return crypto.createHash('sha256').update(payload).digest('hex')
}

// Redis integration is optional — falls back to no-cache if not configured
async function getRedisClient(): Promise<{
  get(key: string): Promise<string | null>
  set(key: string, value: string, options?: { ex?: number }): Promise<unknown>
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<unknown>
} | null> {
  try {
    const { Redis } = await import('@upstash/redis')
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return null
    }
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  } catch {
    return null
  }
}

async function checkRateLimit(workspaceId: string): Promise<{ allowed: boolean; remaining: number }> {
  const redis = await getRedisClient()
  if (!redis) return { allowed: true, remaining: RATE_LIMIT_MAX }

  const key = `ratelimit:reports:${workspaceId}`
  const current = await redis.incr(key)

  if (current === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS)
  }

  const remaining = Math.max(0, RATE_LIMIT_MAX - current)
  return { allowed: current <= RATE_LIMIT_MAX, remaining }
}

async function getCached(hash: string): Promise<OrchestratorResult | null> {
  const redis = await getRedisClient()
  if (!redis) return null

  const cached = await redis.get(`cache:report:${hash}`)
  if (!cached) return null

  try {
    return JSON.parse(cached) as OrchestratorResult
  } catch {
    return null
  }
}

async function setCache(hash: string, result: OrchestratorResult): Promise<void> {
  const redis = await getRedisClient()
  if (!redis) return

  await redis.set(`cache:report:${hash}`, JSON.stringify(result), { ex: CACHE_TTL_SECONDS })
}

// Fallback: call Cloudflare Worker proxy when OpenAI is unavailable
async function callWorkerFallback(prompt: string): Promise<AIResponse> {
  const proxyUrl = process.env.CLOUDFLARE_WORKER_URL ?? 'https://halannews.com/api-proxy'

  const res = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 8000,
    }),
  })

  if (!res.ok) {
    throw new AIProviderError(`Worker proxy failed: ${res.status}`, 'cloudflare-worker', res.status)
  }

  const json = (await res.json()) as {
    choices: Array<{ message: { content: string } }>
    model: string
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
  }

  return {
    content: json.choices[0]?.message?.content ?? '',
    model: json.model ?? 'gpt-4o-mini',
    usage: {
      inputTokens: json.usage?.prompt_tokens ?? 0,
      outputTokens: json.usage?.completion_tokens ?? 0,
      totalTokens: json.usage?.total_tokens ?? 0,
    },
  }
}

export class ReportOrchestrator {
  private primaryProvider: AIProvider

  constructor() {
    this.primaryProvider = new OpenAIProvider()
  }

  async generate(
    type: ReportType,
    ctx: PromptContext,
    options: OrchestratorOptions
  ): Promise<OrchestratorResult> {
    const start = Date.now()

    // Rate limiting
    const { allowed, remaining } = await checkRateLimit(options.workspaceId)
    if (!allowed) {
      throw new Error(
        `Rate limit exceeded: ${RATE_LIMIT_MAX} reports per hour. Remaining: ${remaining}. Try again later.`
      )
    }

    // Cache lookup
    const hash = buildInputHash(type, ctx)
    const cached = await getCached(hash)
    if (cached) {
      return { ...cached, cached: true }
    }

    // Build prompt
    const prompt = buildPromptForType(type, ctx)

    // Call AI provider with fallback
    let response: AIResponse
    let providerName = 'openai'

    try {
      response = await this.primaryProvider.generate(prompt, {
        maxTokens: 8000,
        temperature: 0.7,
      })
    } catch (err) {
      if (err instanceof AIProviderError || err instanceof Error) {
        // Attempt Cloudflare Worker fallback
        try {
          response = await callWorkerFallback(prompt)
          providerName = 'cloudflare-worker'
        } catch {
          throw err // Re-throw original error if fallback also fails
        }
      } else {
        throw err
      }
    }

    // Parse JSON from response
    let data: Record<string, unknown>
    try {
      data = JSON.parse(response.content) as Record<string, unknown>
    } catch {
      // Attempt to extract JSON from response if it contains extra text
      const match = response.content.match(/\{[\s\S]*\}/)
      if (match) {
        data = JSON.parse(match[0]) as Record<string, unknown>
      } else {
        throw new Error('AI response did not contain valid JSON')
      }
    }

    const result: OrchestratorResult = {
      data,
      provider: providerName,
      model: response.model,
      usage: response.usage,
      cached: false,
      durationMs: Date.now() - start,
    }

    // Store in cache
    await setCache(hash, result)

    return result
  }

  async *stream(
    type: ReportType,
    ctx: PromptContext,
    options: OrchestratorOptions
  ): AsyncGenerator<string> {
    // Rate limiting
    const { allowed } = await checkRateLimit(options.workspaceId)
    if (!allowed) {
      throw new Error(`Rate limit exceeded: ${RATE_LIMIT_MAX} reports per hour. Try again later.`)
    }

    const prompt = buildPromptForType(type, ctx)

    try {
      for await (const chunk of this.primaryProvider.stream(prompt, {
        maxTokens: 8000,
        temperature: 0.7,
      })) {
        yield chunk
      }
    } catch (err) {
      if (err instanceof AIProviderError || err instanceof Error) {
        // Streaming fallback: use non-streaming worker and yield whole response
        const response = await callWorkerFallback(prompt)
        yield response.content
      } else {
        throw err
      }
    }
  }
}

// Singleton for use across the app
let _orchestrator: ReportOrchestrator | null = null

export function getOrchestrator(): ReportOrchestrator {
  if (!_orchestrator) {
    _orchestrator = new ReportOrchestrator()
  }
  return _orchestrator
}
