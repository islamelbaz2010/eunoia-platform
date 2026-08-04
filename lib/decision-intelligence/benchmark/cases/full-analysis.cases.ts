/**
 * Full Analysis benchmark cases — Egypt real estate marketing readiness decisions.
 *
 * Rules under test (from route.ts buildDIRules('full_analysis')):
 *   full-analysis-very-low-score-blocks-growth  weight 2.0 FAIL if optionId='invest_growth' AND marketing_score < 25
 *   full-analysis-low-score-warns-growth        weight 1.5 WARN if optionId='invest_growth' AND marketing_score < 45
 *   full-analysis-strong-score-warns-restructure weight 1.0 WARN if optionId='restructure_strategy' AND marketing_score >= 65
 *
 * Total rule weight = 4.5
 *
 * Options: invest_growth (1st), optimize_existing (2nd), restructure_strategy (3rd)
 */

import { ruleId } from '../../types/rules.types'
import type { BenchmarkCase } from '../types'

const FULL_ANALYSIS_RULES = [
  {
    id: ruleId('full-analysis-very-low-score-blocks-growth'),
    name: 'Very low marketing score blocks growth investment',
    description: 'Marketing infrastructure below 25/100 is too weak to absorb growth investment productively.',
    rationale: 'Growth investment without marketing fundamentals generates negative ROI and wastes capital.',
    priority: 10, domains: ['market_intelligence'],
    category: 'operational' as const, weight: 2.0,
    conditionGroups: [{ conditions: [
      { factPath: 'optionId', operator: 'eq' as const, value: 'invest_growth' },
      { factPath: 'parameters.computed_marketing_score', operator: 'lt' as const, value: 25 },
    ]}],
    firesWithAction: 'FAIL' as const,
    message: 'Marketing score below 25/100 — foundational infrastructure must be established before growth investment produces returns.',
    overrideable: true, enabled: true,
  },
  {
    id: ruleId('full-analysis-low-score-warns-growth'),
    name: 'Low marketing score warns against growth investment',
    description: 'Marketing score below 45 indicates the foundation cannot efficiently absorb growth capital.',
    rationale: 'Growth investment on a weak marketing foundation produces diminishing returns.',
    priority: 20, domains: ['market_intelligence'],
    category: 'operational' as const, weight: 1.5,
    conditionGroups: [{ conditions: [
      { factPath: 'optionId', operator: 'eq' as const, value: 'invest_growth' },
      { factPath: 'parameters.computed_marketing_score', operator: 'lt' as const, value: 45 },
    ]}],
    firesWithAction: 'WARN' as const,
    message: 'Marketing score below 45/100 — scaling investment without fixing foundational issues reduces growth ROI.',
    overrideable: true, enabled: true,
  },
  {
    id: ruleId('full-analysis-strong-score-warns-restructure'),
    name: 'Strong marketing score warns against full restructure',
    description: 'When marketing score exceeds 65, full strategy restructure risks disrupting a performing system.',
    rationale: 'A marketing system scoring 65+ is above average for Egypt real estate. Restructure introduces disruption risk.',
    priority: 30, domains: ['market_intelligence'],
    category: 'strategic' as const, weight: 1.0,
    conditionGroups: [{ conditions: [
      { factPath: 'optionId', operator: 'eq' as const, value: 'restructure_strategy' },
      { factPath: 'parameters.computed_marketing_score', operator: 'gte' as const, value: 65 },
    ]}],
    firesWithAction: 'WARN' as const,
    message: 'Marketing score exceeds 65/100 — full restructure risks disrupting a performing system. Optimize incrementally instead.',
    overrideable: true, enabled: true,
  },
] as const

const OPTIONS = [
  { id: 'invest_growth',        label: 'Invest in marketing growth',     description: 'Increase marketing spend and expand capabilities' },
  { id: 'optimize_existing',    label: 'Optimize existing marketing',    description: 'Improve ROI of current channels without increasing budget' },
  { id: 'restructure_strategy', label: 'Restructure marketing strategy', description: 'Revamp the overall marketing approach' },
] as const

function baseEvidence(params: Record<string, unknown>) {
  const now = new Date().toISOString()
  return [
    {
      title: 'Full analysis marketing parameters',
      content: params,
      sourceType: 'user_input' as const,
      sourceLabel: 'Benchmark case input',
      retrievedAt: now,
      confidence: 0.82,
      tags: { domain: 'full_analysis' },
      category: 'user_provided' as const,
    },
    {
      title: 'Egypt Real Estate Marketing Readiness Benchmarks 2026',
      content: { marketing_score_min: 25, marketing_score_foundation: 45, marketing_score_strong: 65, marketing_score_target: 80 },
      sourceType: 'internal_data' as const,
      sourceLabel: 'Eunoia Benchmark Database 2026',
      retrievedAt: now,
      confidence: 0.90,
      tags: { domain: 'full_analysis' },
      category: 'benchmark' as const,
    },
    {
      title: 'Marketing readiness assessment',
      content: params,
      sourceType: 'internal_data' as const,
      sourceLabel: 'Eunoia Full Analysis Engine',
      retrievedAt: now,
      confidence: 0.85,
      tags: { domain: 'full_analysis', method: 'deterministic' },
      category: 'operational' as const,
    },
  ]
}

export const FULL_ANALYSIS_CASES: BenchmarkCase[] = [
  {
    id: 'full-analysis-001',
    name: 'Very low marketing score (18) — invest_growth blocked, optimize_existing recommended from eligible options',
    description: 'Marketing score is 18/100 — below the 25-point threshold. invest_growth is blocked by a FAIL rule. optimize_existing and restructure_strategy are eligible (score 100). The pipeline continues (PARTIAL) because eligible options remain, and optimize_existing is recommended as the first eligible option.',
    industry: 'egypt_real_estate',
    reportType: 'full_analysis',
    addedAt: '2026-07-30T00:00:00Z',
    addedBy: 'Eunoia Engineering',
    tags: ['very-low-score', 'blocked-invest-growth', 'optimize-recommended'],
    explanation: [
      'marketing_score = 18 (<25): very-low-score-blocks-growth FIRES (FAIL, weight 2.0) for invest_growth.',
      'marketing_score = 18 (<45): low-score-warns-growth FIRES (WARN, weight 1.5) for invest_growth.',
      'marketing_score = 18 (<65): strong-score-warns-restructure does NOT fire.',
      'invest_growth BLOCKED. optimize_existing = restructure_strategy = 100.',
      'Eligible options exist → pipeline continues (PARTIAL) → optimize_existing recommended (first at max eligible score).',
    ].join(' '),
    engineInput: {
      input: {
        subject: { domain: 'market_intelligence', name: 'Full Analysis — Very Low Score', metadata: {} },
        context: {
          question: 'What is the optimal marketing strategy for this real estate business?',
          parameters: {
            computed_marketing_score: 18,
          },
          constraints: [],
          objectives: ['Build marketing foundation', 'Maximize ROI on marketing investment'],
        },
        options: OPTIONS,
        requestedBy: 'system',
      },
      rawEvidence: baseEvidence({ computed_marketing_score: 18 }),
      rules: FULL_ANALYSIS_RULES,
    },
    expected: {
      recommendedOptionId: 'optimize_existing',
      confidence: { min: 40, max: 85 },
      firedRuleIds: ['full-analysis-very-low-score-blocks-growth', 'full-analysis-low-score-warns-growth'],
      blockedOptionIds: ['invest_growth'],
      trustScoreRange: { min: 40, max: 85 },
    },
  },

  {
    id: 'full-analysis-002',
    name: 'Strong marketing score (75) — invest_growth recommended, restructure_strategy warned',
    description: 'Marketing score is 75/100 — well above the strong threshold. restructure_strategy is warned for disruption risk. invest_growth and optimize_existing both score 100; invest_growth is recommended as the first option in the array.',
    industry: 'egypt_real_estate',
    reportType: 'full_analysis',
    addedAt: '2026-07-30T00:00:00Z',
    addedBy: 'Eunoia Engineering',
    tags: ['strong-score', 'restructure-warned', 'growth-recommended'],
    explanation: [
      'marketing_score = 75 (not <25): very-low-blocks does NOT fire.',
      'marketing_score = 75 (not <45): low-score-warns-growth does NOT fire.',
      'marketing_score = 75 (>=65): strong-score-warns-restructure FIRES (WARN, weight 1.0) for restructure_strategy.',
      'restructure_strategy score = (4.5 - 0.5)/4.5*100 = 89. invest_growth = optimize_existing = 100.',
      'Best score 100: invest_growth (first) and optimize_existing (second) → invest_growth wins.',
    ].join(' '),
    engineInput: {
      input: {
        subject: { domain: 'market_intelligence', name: 'Full Analysis — Strong Score', metadata: {} },
        context: {
          question: 'What is the optimal marketing strategy for this real estate business?',
          parameters: {
            computed_marketing_score: 75,
          },
          constraints: [],
          objectives: ['Scale successful marketing', 'Capture market share'],
        },
        options: OPTIONS,
        requestedBy: 'system',
      },
      rawEvidence: baseEvidence({ computed_marketing_score: 75 }),
      rules: FULL_ANALYSIS_RULES,
    },
    expected: {
      recommendedOptionId: 'invest_growth',
      confidence: { min: 50, max: 95 },
      firedRuleIds: ['full-analysis-strong-score-warns-restructure'],
      blockedOptionIds: [],
      trustScoreRange: { min: 50, max: 95 },
    },
  },

  {
    id: 'full-analysis-003',
    name: 'Low-medium marketing score (38) — invest_growth warned, optimize_existing recommended',
    description: 'Marketing score is 38/100 — above the blocking threshold (25) but below the warning threshold (45). invest_growth is warned for poor foundation. optimize_existing and restructure_strategy score 100; optimize_existing is recommended as the first with highest score.',
    industry: 'egypt_real_estate',
    reportType: 'full_analysis',
    addedAt: '2026-07-30T00:00:00Z',
    addedBy: 'Eunoia Engineering',
    tags: ['medium-low-score', 'growth-warned', 'optimize-recommended'],
    explanation: [
      'marketing_score = 38 (not <25): very-low-blocks does NOT fire.',
      'marketing_score = 38 (<45): low-score-warns-growth FIRES (WARN, weight 1.5) for invest_growth.',
      'marketing_score = 38 (<65): strong-score-warns-restructure does NOT fire.',
      'invest_growth score = (4.5 - 0.75)/4.5*100 = 83. optimize_existing = restructure_strategy = 100.',
      'Best score 100: optimize_existing (2nd in array) beats invest_growth (83). Between optimize_existing and restructure_strategy (both 100), optimize_existing wins (earlier in array).',
    ].join(' '),
    engineInput: {
      input: {
        subject: { domain: 'market_intelligence', name: 'Full Analysis — Medium-Low Score', metadata: {} },
        context: {
          question: 'What is the optimal marketing strategy for this real estate business?',
          parameters: {
            computed_marketing_score: 38,
          },
          constraints: [],
          objectives: ['Improve marketing foundation', 'Maximize return on spend'],
        },
        options: OPTIONS,
        requestedBy: 'system',
      },
      rawEvidence: baseEvidence({ computed_marketing_score: 38 }),
      rules: FULL_ANALYSIS_RULES,
    },
    expected: {
      recommendedOptionId: 'optimize_existing',
      confidence: { min: 50, max: 95 },
      firedRuleIds: ['full-analysis-low-score-warns-growth'],
      blockedOptionIds: [],
      trustScoreRange: { min: 50, max: 95 },
    },
  },
]
