export interface GenerateOptions {
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
  model?: string
}

export interface AIResponse {
  content: string
  model: string
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
}

export interface AIProvider {
  name: string
  generate(prompt: string, options?: GenerateOptions): Promise<AIResponse>
  stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string>
  estimateCost(inputTokens: number, outputTokens: number): number
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly statusCode?: number
  ) {
    super(message)
    this.name = 'AIProviderError'
  }
}
