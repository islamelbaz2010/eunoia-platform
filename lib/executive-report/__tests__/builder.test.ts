import { describe, it, expect } from 'vitest'
import { buildExecutiveReport } from '../builder'
import { runDecisionEngine, collectEvidence, optionId } from '@/lib/decision-intelligence'
import type { UniversalDecisionReport } from '@/lib/decision-intelligence'
import type { DecisionInput } from '@/lib/decision-intelligence/types/decision.types'

// ---------------------------------------------------------------------------
// Fixtures — build a real UniversalDecisionReport via the engine
// ---------------------------------------------------------------------------

const testInput: DecisionInput = {
  subject: {
    domain: 'Market Intelligence',
    name: 'Real Estate Market Entry',
    metadata: { reportType: 'market_entry' },
  },
  context: {
    question: 'Should we enter the Egypt residential real estate market?',
    parameters: { budget: 100_000, sector: 'real_estate' },
    constraints: ['Must achieve positive ROI within 24 months'],
    objectives: ['Market penetration', 'Revenue growth'],
  },
  options: [
    { id: optionId('enter_now'),   label: 'Enter market now',   description: 'Launch immediately' },
    { id: optionId('enter_phased'), label: 'Enter phased',       description: 'Phased market entry over 90 days' },
    { id: optionId('hold'),         label: 'Hold market entry',  description: 'Defer entry by 6 months' },
  ],
  requestedBy: 'user',
}

const testEvidence = collectEvidence({
  decisionId: 'test-decision-001',
  items: [
    {
      title: 'Client-submitted analysis parameters',
      content: 'Market entry data and financials submitted by client.',
      sourceType: 'user_input',
      sourceLabel: 'User Input',
      confidence: 0.80,
      retrievedAt: new Date().toISOString(),
    },
    {
      title: 'Egypt Real Estate Market Benchmarks 2026',
      content: 'Internal benchmarks and CPL data for Egypt real estate sector.',
      sourceType: 'internal_data',
      sourceLabel: 'Internal DB',
      confidence: 0.85,
      retrievedAt: new Date().toISOString(),
    },
  ],
}).collection

function buildTestReport(): UniversalDecisionReport {
  return runDecisionEngine({ input: testInput, evidence: testEvidence, rules: [] }).report
}

// ---------------------------------------------------------------------------
// Narration fixtures
// ---------------------------------------------------------------------------

const EMPTY_NARRATION: Record<string, unknown> = {}

const FULL_NARRATION: Record<string, unknown> = {
  executive_summary: 'Market conditions in Egypt are favorable for real estate market entry.',
  swot: {
    strengths:     ['Strong demand growth', 'First-mover advantage'],
    weaknesses:    ['High upfront capital requirement'],
    opportunities: ['Growing middle class', 'Government incentives'],
    threats:       ['Currency volatility', 'Regulatory uncertainty'],
  },
  market_overview: { cpl_range: 'EGP 450–600', demand_trend: 'upward' },
  risk_scorecard:  { overall: 'MEDIUM' },
  entry_strategy_90days: {
    week1_2: {
      title: 'Phase 1 — Setup',
      actions: ['Register entity', 'Set up tracking'],
      kpi: '100 leads/month',
      budget: 'EGP 10,000',
    },
    month2: {
      title: 'Phase 2 — Launch',
      actions: ['Launch campaigns', 'Optimize CPL'],
      kpi: 'CPL < EGP 500',
      budget: 'EGP 25,000',
    },
    month3: {
      title: 'Phase 3 — Scale',
      actions: ['Scale to new cities'],
      kpi: '200 leads/month',
      budget: 'EGP 50,000',
    },
  },
  cpl_intelligence: {
    meta_cpl_expected: 'EGP 495',
    budget_required_100leads: 'EGP 49,500',
    payback_timeline: '6 months',
    recommended_test_budget: 'EGP 15,000',
  },
}

const FEASIBILITY_NARRATION: Record<string, unknown> = {
  executive_summary: 'The real estate project is financially viable.',
  financials: {
    net_profit: 'EGP 1,200,000',
    roi_pct: '24%',
    npv_assessment: 'Positive — NPV exceeds 15% hurdle rate',
  },
  scenarios: {
    pessimistic: { assumption: 'Vacancy rate 15%', roi_annual_pct: '14%' },
    base:        { assumption: 'Vacancy rate 8%',  roi_annual_pct: '24%' },
    optimistic:  { assumption: 'Vacancy rate 4%',  roi_annual_pct: '36%' },
  },
  immediate_actions: [
    { action: 'Secure financing',    timeline: '2 weeks',  impact: 'EGP 1.2M unlocked', rank: 1 },
    { action: 'Engage legal counsel', timeline: '1 week',  impact: 'Risk reduced',       rank: 2 },
  ],
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildExecutiveReport', () => {
  it('returns all 12 sections for a valid report', () => {
    const diReport = buildTestReport()
    const exec = buildExecutiveReport('market_entry', diReport, FULL_NARRATION)

    expect(exec.schemaVersion).toBe('2.0.0')
    expect(exec.reportType).toBe('market_entry')

    const s = exec.sections
    expect(s.executiveSummary).toBeDefined()
    expect(s.finalRecommendation).toBeDefined()
    expect(s.trustScore).toBeDefined()
    expect(s.decisionConfidence).toBeDefined()
    expect(s.evidence).toBeDefined()
    expect(s.businessAnalysis).toBeDefined()
    expect(s.riskAnalysis).toBeDefined()
    expect(s.alternativeOptions).toBeDefined()
    expect(s.recommendedActions).toBeDefined()
    expect(s.expectedBusinessImpact).toBeDefined()
    expect(s.implementationRoadmap).toBeDefined()
    expect(s.appendix).toBeDefined()
  })

  it('does not throw with empty narration (AC-16)', () => {
    const diReport = buildTestReport()
    expect(() => buildExecutiveReport('market_entry', diReport, EMPTY_NARRATION)).not.toThrow()
  })

  it('produces valid empty defaults with empty narration', () => {
    const diReport = buildTestReport()
    const exec = buildExecutiveReport('market_entry', diReport, EMPTY_NARRATION)

    expect(exec.sections.businessAnalysis.summary).toBe('')
    expect(exec.sections.businessAnalysis.swot).toBeNull()
    expect(exec.sections.recommendedActions).toEqual([])
    expect(exec.sections.implementationRoadmap.phases).toEqual([])
    expect(exec.sections.riskAnalysis.flags).toEqual([])
  })

  it('section 3 trust score matches section 4 confidence overall (AC-19)', () => {
    const diReport = buildTestReport()
    const exec = buildExecutiveReport('market_entry', diReport, FULL_NARRATION)

    expect(exec.sections.trustScore.score).toBe(exec.sections.decisionConfidence.overall)
    expect(exec.sections.trustScore.score).toBe(diReport.confidence.overall)
  })

  it('trust score interpretation is non-empty for any band (AC-04)', () => {
    const diReport = buildTestReport()
    const exec = buildExecutiveReport('market_entry', diReport, FULL_NARRATION)

    expect(exec.sections.trustScore.interpretation.length).toBeGreaterThan(0)
  })

  it('evidence items are capped at 10 (AC-06)', () => {
    const diReport = buildTestReport()
    const exec = buildExecutiveReport('market_entry', diReport, FULL_NARRATION)

    expect(exec.sections.evidence.items.length).toBeLessThanOrEqual(10)
    expect(exec.sections.evidence.totalItems).toBe(diReport.evidenceSummary.totalItems)
  })

  it('alternative options length matches DI Engine options (AC-09)', () => {
    const diReport = buildTestReport()
    const exec = buildExecutiveReport('market_entry', diReport, FULL_NARRATION)

    expect(exec.sections.alternativeOptions.length).toBe(diReport.options.length)
    expect(exec.sections.alternativeOptions.length).toBe(3)
  })

  it('risk derivation — no flags → LOW risk (AC-08)', () => {
    const diReport = buildTestReport()
    // Engine with no rules generates zero or few risk flags
    const exec = buildExecutiveReport('market_entry', diReport, EMPTY_NARRATION)

    const allLow = diReport.riskFlags.every(f => f.severity === 'LOW')
    if (diReport.riskFlags.length === 0 || allLow) {
      expect(exec.sections.riskAnalysis.overallRisk).toBe('LOW')
    }
  })

  it('appendix IDs match the source DI report (AC-13)', () => {
    const diReport = buildTestReport()
    const exec = buildExecutiveReport('market_entry', diReport, FULL_NARRATION)

    expect(exec.sections.appendix.reportId).toBe(diReport.metadata.reportId)
    expect(exec.sections.appendix.decisionId).toBe(diReport.metadata.decisionId)
    expect(exec.sections.appendix.generatedBy).toBe('decision-engine-v1')
  })

  it('section 1 headline matches DI Engine executive summary (AC-02)', () => {
    const diReport = buildTestReport()
    const exec = buildExecutiveReport('market_entry', diReport, FULL_NARRATION)

    expect(exec.sections.executiveSummary.headline).toBe(diReport.executiveSummary.headline)
    expect(exec.sections.executiveSummary.decisionStatus).toBe(diReport.decision.status)
  })

  it('section 6 SWOT populated from full narration (AC-07)', () => {
    const diReport = buildTestReport()
    const exec = buildExecutiveReport('market_entry', diReport, FULL_NARRATION)

    expect(exec.sections.businessAnalysis.swot).not.toBeNull()
    expect(exec.sections.businessAnalysis.swot!.strengths).toHaveLength(2)
    expect(exec.sections.businessAnalysis.marketOverview).not.toBeNull()
  })

  it('section 9 actions extracted from entry_strategy_90days for market_entry (AC-10)', () => {
    const diReport = buildTestReport()
    const exec = buildExecutiveReport('market_entry', diReport, FULL_NARRATION)

    expect(exec.sections.recommendedActions.length).toBeGreaterThan(0)
    expect(exec.sections.recommendedActions.length).toBeLessThanOrEqual(6)
    exec.sections.recommendedActions.forEach(action => {
      expect(action.priority).toBeGreaterThan(0)
    })
  })

  it('section 11 roadmap has 3 phases for market_entry (AC-12)', () => {
    const diReport = buildTestReport()
    const exec = buildExecutiveReport('market_entry', diReport, FULL_NARRATION)

    expect(exec.sections.implementationRoadmap.phases).toHaveLength(3)
    expect(exec.sections.implementationRoadmap.phases[0].title).toBe('Phase 1 — Setup')
    expect(exec.sections.implementationRoadmap.phases[0].budget).toBe('EGP 10,000')
  })

  it('section 10 business impact for feasibility pulls from financials (AC-11)', () => {
    const feasibilityInput: DecisionInput = {
      ...testInput,
      subject: { ...testInput.subject, metadata: { reportType: 'feasibility' } },
    }
    const feasibilityEvidence = collectEvidence({
      decisionId: 'feasibility-001',
      items: [{
        title: 'Feasibility data',
        content: 'Property financials',
        sourceType: 'user_input',
        sourceLabel: 'User',
        confidence: 0.8,
        retrievedAt: new Date().toISOString(),
      }],
    }).collection
    const diReport = runDecisionEngine({ input: feasibilityInput, evidence: feasibilityEvidence, rules: [] }).report
    const exec = buildExecutiveReport('feasibility', diReport, FEASIBILITY_NARRATION)

    expect(exec.sections.expectedBusinessImpact.financialHighlights).not.toBeNull()
    expect(exec.sections.expectedBusinessImpact.metrics.length).toBeGreaterThan(0)
    expect(exec.sections.implementationRoadmap.phases).toHaveLength(3)
  })

  it('section 9 for feasibility extracted from immediate_actions (AC-10)', () => {
    const feasibilityInput: DecisionInput = {
      ...testInput,
      subject: { ...testInput.subject, metadata: { reportType: 'feasibility' } },
    }
    const feasibilityEvidence = collectEvidence({
      decisionId: 'feasibility-002',
      items: [{
        title: 'Analysis data',
        content: 'Data',
        sourceType: 'user_input',
        sourceLabel: 'User',
        confidence: 0.8,
        retrievedAt: new Date().toISOString(),
      }],
    }).collection
    const diReport = runDecisionEngine({ input: feasibilityInput, evidence: feasibilityEvidence, rules: [] }).report
    const exec = buildExecutiveReport('feasibility', diReport, FEASIBILITY_NARRATION)

    expect(exec.sections.recommendedActions).toHaveLength(2)
    expect(exec.sections.recommendedActions[0].action).toBe('Secure financing')
    expect(exec.sections.recommendedActions[0].priority).toBe(1)
  })

  it('confidence dimension names use spaces not underscores (AC-05)', () => {
    const diReport = buildTestReport()
    const exec = buildExecutiveReport('market_entry', diReport, FULL_NARRATION)

    exec.sections.decisionConfidence.dimensions.forEach(d => {
      expect(d.name).not.toContain('_')
    })
    expect(exec.sections.decisionConfidence.weakestDimension).not.toContain('_')
    expect(exec.sections.decisionConfidence.strongestDimension).not.toContain('_')
  })

  it('report type is preserved in the output (AC-18)', () => {
    const diReport = buildTestReport()
    for (const reportType of ['feasibility', 'campaign_roi', 'market_entry', 'lead_gen', 'full_analysis']) {
      const exec = buildExecutiveReport(reportType, diReport, EMPTY_NARRATION)
      expect(exec.reportType).toBe(reportType)
    }
  })
})
