import OpenAI from 'openai'
import type { AIProvider, AIResponse, GenerateOptions } from './base.provider'
import { AIProviderError } from './base.provider'

const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_MAX_TOKENS = 8000
const DEFAULT_TEMPERATURE = 0.7

// Cost per 1K tokens in USD (gpt-4o-mini)
const COST_INPUT_PER_1K = 0.00015
const COST_OUTPUT_PER_1K = 0.0006

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai'
  private client: OpenAI

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey ?? process.env.OPENAI_API_KEY,
    })
  }

  async generate(prompt: string, options: GenerateOptions = {}): Promise<AIResponse> {
    const model = options.model ?? DEFAULT_MODEL
    const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS
    const temperature = options.temperature ?? DEFAULT_TEMPERATURE

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt })
    }
    messages.push({ role: 'user', content: prompt })

    try {
      const completion = await this.client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages,
        response_format: { type: 'json_object' },
      })

      const choice = completion.choices[0]
      if (!choice?.message?.content) {
        throw new AIProviderError('Empty response from OpenAI', this.name)
      }

      return {
        content: choice.message.content,
        model: completion.model,
        usage: {
          inputTokens: completion.usage?.prompt_tokens ?? 0,
          outputTokens: completion.usage?.completion_tokens ?? 0,
          totalTokens: completion.usage?.total_tokens ?? 0,
        },
      }
    } catch (err) {
      if (err instanceof AIProviderError) throw err
      if (err instanceof OpenAI.APIError) {
        throw new AIProviderError(err.message, this.name, err.status)
      }
      throw new AIProviderError(String(err), this.name)
    }
  }

  async *stream(prompt: string, options: GenerateOptions = {}): AsyncGenerator<string> {
    const model = options.model ?? DEFAULT_MODEL
    const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS
    const temperature = options.temperature ?? DEFAULT_TEMPERATURE

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt })
    }
    messages.push({ role: 'user', content: prompt })

    try {
      const stream = await this.client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages,
        stream: true,
      })

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content
        if (delta) yield delta
      }
    } catch (err) {
      if (err instanceof OpenAI.APIError) {
        throw new AIProviderError(err.message, this.name, err.status)
      }
      throw new AIProviderError(String(err), this.name)
    }
  }

  estimateCost(inputTokens: number, outputTokens: number): number {
    return (
      (inputTokens / 1000) * COST_INPUT_PER_1K +
      (outputTokens / 1000) * COST_OUTPUT_PER_1K
    )
  }
}
