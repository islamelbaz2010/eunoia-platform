import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// All mocks that are referenced inside vi.mock() factories MUST be hoisted.
// ---------------------------------------------------------------------------

const { mockRunDecisionEngine, mockOpenAICreate, mockSupabase, makeChain, mockBuildExecutiveReport } = vi.hoisted(() => {
  const makeChain = () => {
    const chain: Record<string, unknown> = {}
    const methods = ['insert', 'update', 'select']
    methods.forEach(m => { chain[m] = vi.fn().mockReturnValue(chain) })
    chain['single'] = vi.fn().mockResolvedValue({ data: { id: 'row-123' }, error: null })
    chain['eq'] = vi.fn().mockResolvedValue({ data: null, error: null })
    return chain
  }

  const mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'u-test-1', email: 'test@test.com' } },
      }),
    },
    from: vi.fn().mockImplementation(() => makeChain()),
  }

  return {
    mockRunDecisionEngine: vi.fn(),
    mockOpenAICreate: vi.fn(),
    mockBuildExecutiveReport: vi.fn(),
    mockSupabase,
    makeChain,
  }
})

// Decision Intelligence Engine
vi.mock('@/lib/decision-intelligence', () => ({
  runDecisionEngine: mockRunDecisionEngine,
  optionId: (id: string) => id,
  ruleId:   (id: string) => id,
  collectEvidence: vi.fn().mockReturnValue({
    collection: {
      decisionId: 'di-test-123',
      items: [],
      stats: {
        total: 2,
        bySourceType: { internal_data: 1, user_input: 1, ai_analysis: 0, external_source: 0, document: 0, human_validation: 0 },
        averageFreshness: 1.0,
        averageConfidence: 0.825,
        contradictionCount: 0,
      },
      collectedAt: new Date().toISOString(),
    },
    errors: [],
  }),
}))

// OpenAI — the route uses `new OpenAI()`, so the mock must be a constructable class
vi.mock('openai', () => ({
  default: class {
    chat = { completions: { create: mockOpenAICreate } }
  },
}))

// Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

// Rate limit — allow through by default
vi.mock('@/lib/research/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ ok: true, resetIn: 0 }),
  rateLimitMessage: vi.fn().mockReturnValue('Rate limit exceeded'),
}))

// Plan enforcement — allow through by default
vi.mock('@/lib/research/plan-enforcement', () => ({
  checkPlanLimit: vi.fn().mockResolvedValue({ ok: true, used: 1, limit: 10, plan: 'STARTER' }),
}))

// Executive report builder
vi.mock('@/lib/executive-report', () => ({
  buildExecutiveReport: mockBuildExecutiveReport,
}))

import { POST } from './route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validBody = {
  reportType: 'market_entry',
  formData: {
    companyName: 'TestCo',
    targetCity: 'القاهرة الجديدة',
    budget: '50000',
    clientType: 'developer',
    timeline: '90 days',
  },
}

const mockTrustScore = {
  score: 72,
  band: 'HIGH',
  label: 'High Confidence',
  isRuleDetermined: true,
}

const mockDIReport = {
  metadata: {
    reportId: 'r-di-1',
    schemaVersion: '1.0.0',
    status: 'DRAFT',
    decisionId: 'di-test-123',
    decisionDomain: 'market_intelligence',
    decisionName: 'TestCo',
    decisionCreatedAt: new Date().toISOString(),
    generatedAt: new Date().toISOString(),
    supersedesReportId: null,
    generatedBy: 'decision-engine-v1',
  },
  executiveSummary: {
    headline: 'Recommended: Enter market now',
    summary: 'The market entry analysis indicates a viable opportunity.',
    recommendedOption: 'Enter market now',
    confidenceBand: 'HIGH',
    confidenceScore: 72,
    isRuleDetermined: true,
    humanOverrideApplied: false,
  },
  trustScore: mockTrustScore,
  decision: {
    id: 'dec-1', status: 'VALIDATED', options: [], recommendation: null,
    statusHistory: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), completedAt: null,
    subject: { domain: 'market_intelligence', name: 'TestCo', metadata: {} },
    context: { question: '', parameters: {}, constraints: [], objectives: [] },
    evidenceIds: [],
  },
  recommendation: null,
  options: [],
  optionScoring: [],
  confidence: {
    overall: 72, band: 'HIGH', dimensions: [],
    weakestDimension: 'evidence_volume', strongestDimension: 'evidence_quality',
    computedAt: new Date().toISOString(),
  },
  evidence: {
    decisionId: 'di-test-123', items: [],
    stats: { total: 0, bySourceType: {}, averageFreshness: 0, averageConfidence: 0, contradictionCount: 0 },
    collectedAt: new Date().toISOString(),
  },
  evidenceSummary: { totalItems: 0, bySourceType: {}, averageFreshness: 0, averageConfidence: 0, contradictionCount: 0, keyEvidenceIds: [] },
  ruleEvaluations: [],
  validation: {
    pipelineStatus: 'PASSED', stages: [], passedStages: 0, failedStages: 0,
    totalStages: 0, errors: [], warnings: [], evaluatedAt: new Date().toISOString(),
  },
  explainability: {
    decisionId: 'dec-1',
    why: { summary: '', topSupportingEvidenceIds: [], topContradictingEvidenceIds: [], ruleFactors: [], confidenceFactors: [] },
    howToImprove: [], generatedAt: new Date().toISOString(),
  },
  riskFlags: [],
}

const AI_NARRATION = '{"report_type":"market_entry","executive_summary":"Cairo New market shows strong opportunity"}'

beforeEach(() => {
  vi.clearAllMocks()

  // Re-apply defaults after clearAllMocks resets them
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: 'u-test-1', email: 'test@test.com' } },
  })
  mockSupabase.from.mockImplementation(() => makeChain())
  mockOpenAICreate.mockResolvedValue({
    choices: [{ message: { content: AI_NARRATION } }],
  })
  mockBuildExecutiveReport.mockReturnValue({ schemaVersion: '2.0.0', reportType: 'market_entry', sections: {} })
})

// ---------------------------------------------------------------------------
// DI integration tests
// ---------------------------------------------------------------------------

describe('POST /api/intelligence — Decision Intelligence integration', () => {
  it('includes decisionReport and trustScore in response when DI Engine succeeds', async () => {
    mockRunDecisionEngine.mockReturnValue({ report: mockDIReport })

    const req = { json: vi.fn().mockResolvedValue(validBody) } as unknown as Request
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    // AI narration report is preserved
    expect(body.report).toBeDefined()
    expect(body.report.report_type).toBe('market_entry')
    // DI fields are added alongside narration
    expect(body.decisionReport).toBeDefined()
    expect(body.decisionReport.metadata.schemaVersion).toBe('1.0.0')
    expect(body.trustScore).toEqual(mockTrustScore)
  })

  it('returns AI narration without decisionReport when DI Engine throws (fail-safe)', async () => {
    mockRunDecisionEngine.mockImplementation(() => {
      throw new Error('DI engine internal failure')
    })

    const req = { json: vi.fn().mockResolvedValue(validBody) } as unknown as Request
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    // Narration still returned despite DI failure
    expect(body.report).toBeDefined()
    // DI fields are absent — fail-safe preserved the narration flow
    expect(body.decisionReport).toBeUndefined()
    expect(body.trustScore).toBeUndefined()
  })

  it('trustScore at top level equals decisionReport.trustScore', async () => {
    mockRunDecisionEngine.mockReturnValue({ report: mockDIReport })

    const req = { json: vi.fn().mockResolvedValue(validBody) } as unknown as Request
    const res = await POST(req)
    const body = await res.json()

    expect(body.trustScore).toBeDefined()
    expect(body.trustScore.score).toBe(72)
    expect(body.trustScore.band).toBe('HIGH')
    expect(body.trustScore).toEqual(body.decisionReport.trustScore)
  })
})

// ---------------------------------------------------------------------------
// Executive Business Report integration tests (AC-21)
// ---------------------------------------------------------------------------

describe('POST /api/intelligence — Executive Business Report (AC-21)', () => {
  it('AC-21a: executiveReport is present in response when DI Engine and builder both succeed', async () => {
    mockRunDecisionEngine.mockReturnValue({ report: mockDIReport })
    mockBuildExecutiveReport.mockReturnValue({
      schemaVersion: '2.0.0',
      reportType: 'market_entry',
      sections: { executiveSummary: { headline: 'Test headline' } },
    })

    const req = { json: vi.fn().mockResolvedValue(validBody) } as unknown as Request
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.executiveReport).toBeDefined()
    expect(body.executiveReport.schemaVersion).toBe('2.0.0')
    expect(body.executiveReport.reportType).toBe('market_entry')
  })

  it('AC-21b: executiveReport is absent when decisionReport is null (DI failed)', async () => {
    mockRunDecisionEngine.mockImplementation(() => { throw new Error('DI failure') })

    const req = { json: vi.fn().mockResolvedValue(validBody) } as unknown as Request
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    // Narration still returned
    expect(body.report).toBeDefined()
    // executiveReport absent — DI failed so builder was never called
    expect(body.executiveReport).toBeUndefined()
    expect(mockBuildExecutiveReport).not.toHaveBeenCalled()
  })

  it('AC-21c: response is 200 with narration report even when builder throws', async () => {
    mockRunDecisionEngine.mockReturnValue({ report: mockDIReport })
    mockBuildExecutiveReport.mockImplementation(() => { throw new Error('Builder internal error') })

    const req = { json: vi.fn().mockResolvedValue(validBody) } as unknown as Request
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    // Narration and DI report still returned
    expect(body.report).toBeDefined()
    expect(body.decisionReport).toBeDefined()
    // executiveReport absent — builder threw
    expect(body.executiveReport).toBeUndefined()
  })
})
