/**
 * Campaign ROI benchmark cases — Egypt real estate digital marketing performance.
 *
 * Rules under test (from route.ts buildDIRules('campaign_roi')):
 *   campaign-roi-extreme-cpl-blocks-scale      weight 2.0 FAIL if optionId='scale_budget' AND cpl_gap_pct > 50
 *   campaign-roi-cpl-above-benchmark-warns-all weight 1.5 WARN if cpl_gap_pct > 20
 *   campaign-roi-good-cpl-warns-restructure    weight 1.0 WARN if optionId='restructure' AND cpl_gap_pct <= 0
 *
 * Total rule weight = 4.5
 *
 * Options: optimize (1st), restructure (2nd), scale_budget (3rd)
 */

import { ruleId } from '../../types/rules.types'
import type { BenchmarkCase } from '../types'

const CAMPAIGN_ROI_RULES = [
  {
    id: ruleId('campaign-roi-extreme-cpl-blocks-scale'),
    name: 'CPL >50% above benchmark blocks budget scaling',
    description: 'Scaling budget when CPL >50% above benchmark amplifies inefficiency.',
    rationale: 'Egypt benchmark 2026: Developer CPL 550 EGP, Broker 400 EGP.',
    priority: 10, domains: ['market_intelligence'],
    category: 'market' as const, weight: 2.0,
    conditionGroups: [{ conditions: [
      { factPath: 'optionId', operator: 'eq' as const, value: 'scale_budget' },
      { factPath: 'parameters.computed_cpl_gap_pct', operator: 'gt' as const, value: 50 },
    ]}],
    firesWithAction: 'FAIL' as const,
    message: 'CPL >50% above Egypt 2026 benchmark — scaling will amplify wasted spend.',
    overrideable: false, enabled: true,
  },
  {
    id: ruleId('campaign-roi-cpl-above-benchmark-warns-all'),
    name: 'CPL above benchmark — efficiency warning',
    description: 'CPL >20% above benchmark indicates structural campaign inefficiency.',
    rationale: 'Egypt benchmark 2026: CPL gaps above 20% require active optimization.',
    priority: 20, domains: ['market_intelligence'],
    category: 'market' as const, weight: 1.5,
    conditionGroups: [{ conditions: [
      { factPath: 'parameters.computed_cpl_gap_pct', operator: 'gt' as const, value: 20 },
    ]}],
    firesWithAction: 'WARN' as const,
    message: 'CPL >20% above Egypt 2026 benchmark — campaign optimization is required.',
    overrideable: true, enabled: true,
  },
  {
    id: ruleId('campaign-roi-good-cpl-warns-restructure'),
    name: 'At-benchmark CPL warns against full restructure',
    description: 'When CPL is at or below benchmark, restructuring risks disrupting good performance.',
    rationale: 'A campaign at or below benchmark CPL is generating competitive results.',
    priority: 30, domains: ['market_intelligence'],
    category: 'market' as const, weight: 1.0,
    conditionGroups: [{ conditions: [
      { factPath: 'optionId', operator: 'eq' as const, value: 'restructure' },
      { factPath: 'parameters.computed_cpl_gap_pct', operator: 'lte' as const, value: 0 },
    ]}],
    firesWithAction: 'WARN' as const,
    message: 'CPL at or below Egypt benchmark — full restructure risks disrupting a performing system.',
    overrideable: true, enabled: true,
  },
] as const

const OPTIONS = [
  { id: 'optimize',     label: 'Optimize current campaigns',    description: 'Improve CPL and targeting within current budget' },
  { id: 'restructure',  label: 'Restructure campaign approach', description: 'Change channel mix and creative strategy' },
  { id: 'scale_budget', label: 'Scale marketing budget',       description: 'Increase investment in best-performing channels' },
] as const

function baseEvidence(params: Record<string, unknown>) {
  const now = new Date().toISOString()
  return [
    {
      title: 'Campaign performance parameters',
      content: params,
      sourceType: 'user_input' as const,
      sourceLabel: 'Benchmark case input',
      retrievedAt: now,
      confidence: 0.85,
      tags: { domain: 'campaign_roi' },
      category: 'user_provided' as const,
    },
    {
      title: 'Egypt Real Estate CPL Benchmarks 2026',
      content: { cpl_developer: 550, cpl_broker: 400, cpl_tiktok: 250 },
      sourceType: 'internal_data' as const,
      sourceLabel: 'Eunoia Benchmark Database 2026',
      retrievedAt: now,
      confidence: 0.90,
      tags: { domain: 'campaign_roi' },
      category: 'benchmark' as const,
    },
    {
      title: 'Campaign CPL benchmark analysis',
      content: params,
      sourceType: 'internal_data' as const,
      sourceLabel: 'Eunoia Campaign ROI Calculator',
      retrievedAt: now,
      confidence: 0.88,
      tags: { domain: 'campaign_roi', method: 'deterministic' },
      category: 'market_data' as const,
    },
  ]
}

export const CAMPAIGN_ROI_CASES: BenchmarkCase[] = [
  {
    id: 'campaign-roi-001',
    name: 'Extreme CPL (65% above benchmark) — scale_budget blocked, optimize recommended from eligible options',
    description: 'CPL is 65% above the Egypt 2026 benchmark. scale_budget is blocked by a FAIL rule. The pipeline continues (PARTIAL) because optimize and restructure remain eligible. optimize is recommended as the first eligible option.',
    industry: 'egypt_real_estate',
    reportType: 'campaign_roi',
    addedAt: '2026-07-30T00:00:00Z',
    addedBy: 'Eunoia Engineering',
    tags: ['high-cpl', 'blocked-scale', 'cpl-warning'],
    explanation: [
      'cpl_gap_pct = 65 (>50): extreme-cpl-blocks-scale FIRES (FAIL, weight 2.0) for scale_budget.',
      'cpl_gap_pct = 65 (>20): cpl-above-benchmark-warns-all FIRES (WARN, weight 1.5) for ALL options.',
      'cpl_gap_pct = 65 (not <=0): good-cpl-warns-restructure does NOT fire for restructure.',
      'scale_budget BLOCKED. optimize score = restructure score = (4.5 - 0.75)/4.5*100 = 83.',
      'Eligible: [optimize, restructure]. Pipeline continues (PARTIAL) → optimize recommended (first at max eligible score).',
    ].join(' '),
    engineInput: {
      input: {
        subject: { domain: 'market_intelligence', name: 'Campaign ROI — Extreme CPL', metadata: {} },
        context: {
          question: 'What should we do with our current marketing campaigns?',
          parameters: { computed_cpl_gap_pct: 65, computed_wasted_budget_monthly: 15000 },
          constraints: [],
          objectives: ['Improve campaign efficiency', 'Reduce CPL'],
        },
        options: OPTIONS,
        requestedBy: 'system',
      },
      rawEvidence: baseEvidence({ computed_cpl_gap_pct: 65, computed_wasted_budget_monthly: 15000 }),
      rules: CAMPAIGN_ROI_RULES,
    },
    expected: {
      recommendedOptionId: 'optimize',
      confidence: { min: 40, max: 85 },
      firedRuleIds: ['campaign-roi-extreme-cpl-blocks-scale', 'campaign-roi-cpl-above-benchmark-warns-all'],
      blockedOptionIds: ['scale_budget'],
      trustScoreRange: { min: 40, max: 85 },
    },
  },

  {
    id: 'campaign-roi-002',
    name: 'CPL 10% below benchmark — restructure warned, optimize recommended',
    description: 'Campaign is outperforming the Egypt CPL benchmark by 10%. Full restructure is warned (risks disrupting good performance). Optimize scores 100 as the best option.',
    industry: 'egypt_real_estate',
    reportType: 'campaign_roi',
    addedAt: '2026-07-30T00:00:00Z',
    addedBy: 'Eunoia Engineering',
    tags: ['below-benchmark-cpl', 'restructure-warned', 'good-performance'],
    explanation: [
      'cpl_gap_pct = -10 (not >50): extreme-cpl-blocks-scale does NOT fire.',
      'cpl_gap_pct = -10 (not >20): cpl-above-benchmark-warns-all does NOT fire.',
      'cpl_gap_pct = -10 (<=0): good-cpl-warns-restructure FIRES (WARN, weight 1.0) for restructure.',
      'No blocking. optimize = scale_budget = 100. restructure = (4.5 - 0.5)/4.5*100 = 89.',
      'Best eligible: optimize (100) tied with scale_budget (100) → reduce keeps optimize (first).',
    ].join(' '),
    engineInput: {
      input: {
        subject: { domain: 'market_intelligence', name: 'Campaign ROI — Below Benchmark CPL', metadata: {} },
        context: {
          question: 'What should we do with our current marketing campaigns?',
          parameters: { computed_cpl_gap_pct: -10, computed_wasted_budget_monthly: 0 },
          constraints: [],
          objectives: ['Grow lead volume', 'Maintain CPL efficiency'],
        },
        options: OPTIONS,
        requestedBy: 'system',
      },
      rawEvidence: baseEvidence({ computed_cpl_gap_pct: -10, computed_wasted_budget_monthly: 0 }),
      rules: CAMPAIGN_ROI_RULES,
    },
    expected: {
      recommendedOptionId: 'optimize',
      confidence: { min: 50, max: 95 },
      firedRuleIds: ['campaign-roi-good-cpl-warns-restructure'],
      blockedOptionIds: [],
      trustScoreRange: { min: 50, max: 95 },
    },
  },

  {
    id: 'campaign-roi-003',
    name: 'Moderate CPL (35% above benchmark) — warns all, no blocking',
    description: 'CPL is 35% above the Egypt 2026 benchmark — above the 20% warning threshold but below the 50% blocking threshold. All options are warned but not blocked. Optimize recommended as first eligible.',
    industry: 'egypt_real_estate',
    reportType: 'campaign_roi',
    addedAt: '2026-07-30T00:00:00Z',
    addedBy: 'Eunoia Engineering',
    tags: ['moderate-cpl', 'warning-only', 'no-blocking'],
    explanation: [
      'cpl_gap_pct = 35 (not >50): extreme-cpl-blocks-scale does NOT fire for scale_budget.',
      'cpl_gap_pct = 35 (>20): cpl-above-benchmark-warns-all FIRES (WARN, weight 1.5) for ALL options.',
      'cpl_gap_pct = 35 (not <=0): good-cpl-warns-restructure does NOT fire.',
      'No blocking. All options score (4.5 - 0.75)/4.5*100 = 83.',
      'Eligible: all. reduce keeps first → optimize.',
    ].join(' '),
    engineInput: {
      input: {
        subject: { domain: 'market_intelligence', name: 'Campaign ROI — Moderate CPL', metadata: {} },
        context: {
          question: 'What should we do with our current marketing campaigns?',
          parameters: { computed_cpl_gap_pct: 35, computed_wasted_budget_monthly: 8000 },
          constraints: [],
          objectives: ['Improve campaign efficiency'],
        },
        options: OPTIONS,
        requestedBy: 'system',
      },
      rawEvidence: baseEvidence({ computed_cpl_gap_pct: 35, computed_wasted_budget_monthly: 8000 }),
      rules: CAMPAIGN_ROI_RULES,
    },
    expected: {
      recommendedOptionId: 'optimize',
      confidence: { min: 45, max: 90 },
      firedRuleIds: ['campaign-roi-cpl-above-benchmark-warns-all'],
      blockedOptionIds: [],
      trustScoreRange: { min: 45, max: 90 },
    },
  },
]
