/**
 * Feasibility benchmark cases — Egypt real estate project financial analysis.
 *
 * Rules under test (from route.ts buildDIRules('feasibility')):
 *   feasibility-financing-gap-blocks-proceed      weight 2.0 FAIL  if optionId='proceed' AND financing_gap_exceeded=true
 *   feasibility-npv-negative-blocks-proceed       weight 2.0 FAIL  if optionId='proceed' AND npv <= 0
 *   feasibility-net-profit-negative-blocks-proceed weight 2.0 FAIL if optionId='proceed' AND net_profit <= 0
 *   feasibility-roi-below-egypt-minimum           weight 1.5 WARN  if roi_annual < 0.08 (all options)
 *   feasibility-low-roi-advises-revision          weight 1.0 WARN  if optionId='proceed' AND roi_annual < 0.08
 *   feasibility-strong-roi-warns-defer            weight 1.0 WARN  if optionId='defer' AND roi_annual >= 0.15
 *   feasibility-strong-roi-warns-revise           weight 1.0 WARN  if optionId='revise' AND roi_annual >= 0.15
 *
 * Total rule weight = 10.5
 *
 * Score formula: max(0, round(((totalWeight - penaltyWeight) / totalWeight) * 100))
 *   WARN penalty = weight * 0.5; FAIL penalty = weight (full)
 *
 * Options: proceed (1st), revise (2nd), defer (3rd)
 */

import { ruleId } from '../../types/rules.types'
import type { BenchmarkCase } from '../types'

const FEASIBILITY_RULES = [
  {
    id: ruleId('feasibility-financing-gap-blocks-proceed'),
    name: 'Peak financing gap exceeds available capital — blocks proceed',
    description: 'A project whose peak construction cash shortfall exceeds available development capital cannot be self-funded to completion.',
    rationale: 'Egypt RE development 2026: peak financing gap > available equity means the project stalls at peak drawdown without uncommitted external financing.',
    priority: 5, domains: ['market_intelligence'],
    category: 'financial' as const, weight: 2.0,
    conditionGroups: [{ conditions: [
      { factPath: 'optionId', operator: 'eq' as const, value: 'proceed' },
      { factPath: 'parameters.computed_financing_gap_exceeded', operator: 'eq' as const, value: true },
    ]}],
    firesWithAction: 'FAIL' as const,
    message: 'Peak construction financing gap exceeds estimated available capital — the project cannot be self-funded through peak drawdown. Secure committed financing or reduce capital requirements before proceeding.',
    overrideable: true, enabled: true,
  },
  {
    id: ruleId('feasibility-npv-negative-blocks-proceed'),
    name: 'Negative NPV blocks proceed',
    description: 'NPV ≤ 0 at the 20% hurdle rate blocks proceeding.',
    rationale: 'Egypt RE: NPV must be positive at minimum 20% discount rate.',
    priority: 10, domains: ['market_intelligence'],
    category: 'financial' as const, weight: 2.0,
    conditionGroups: [{ conditions: [
      { factPath: 'optionId', operator: 'eq' as const, value: 'proceed' },
      { factPath: 'parameters.computed_npv', operator: 'lte' as const, value: 0 },
    ]}],
    firesWithAction: 'FAIL' as const,
    message: 'Project NPV is negative — investment does not cover capital costs at the 20% hurdle rate.',
    overrideable: true, enabled: true,
  },
  {
    id: ruleId('feasibility-net-profit-negative-blocks-proceed'),
    name: 'Negative net profit blocks proceed',
    description: 'Negative after-tax net profit blocks proceeding.',
    rationale: 'A project that loses money after tax cannot be approved.',
    priority: 20, domains: ['market_intelligence'],
    category: 'financial' as const, weight: 2.0,
    conditionGroups: [{ conditions: [
      { factPath: 'optionId', operator: 'eq' as const, value: 'proceed' },
      { factPath: 'parameters.computed_net_profit', operator: 'lte' as const, value: 0 },
    ]}],
    firesWithAction: 'FAIL' as const,
    message: 'Project generates negative net profit after tax.',
    overrideable: true, enabled: true,
  },
  {
    id: ruleId('feasibility-roi-below-egypt-minimum'),
    name: 'ROI below Egypt market minimum benchmark',
    description: 'Annual ROI < 8% falls below the Egypt RE minimum.',
    rationale: 'Egypt RE benchmark 2026: minimum acceptable annual ROI is 8%.',
    priority: 30, domains: ['market_intelligence'],
    category: 'financial' as const, weight: 1.5,
    conditionGroups: [{ conditions: [
      { factPath: 'parameters.computed_roi_annual', operator: 'lt' as const, value: 0.08 },
    ]}],
    firesWithAction: 'WARN' as const,
    message: 'Annual ROI is below the Egypt market minimum benchmark of 8%.',
    overrideable: true, enabled: true,
  },
  {
    id: ruleId('feasibility-low-roi-advises-revision'),
    name: 'Sub-benchmark ROI advises revision over direct proceed',
    description: 'When annual ROI < 8% but NPV and profit are positive, proceeding without revision is inadvisable.',
    rationale: 'Egypt RE benchmark 2026: a project returning below the 8% minimum warrants structural revision before committing capital.',
    priority: 35, domains: ['market_intelligence'],
    category: 'financial' as const, weight: 1.0,
    conditionGroups: [{ conditions: [
      { factPath: 'optionId', operator: 'eq' as const, value: 'proceed' },
      { factPath: 'parameters.computed_roi_annual', operator: 'lt' as const, value: 0.08 },
    ]}],
    firesWithAction: 'WARN' as const,
    message: 'Annual ROI is below the Egypt market minimum of 8% — proceeding without structural revision is inadvisable.',
    overrideable: true, enabled: true,
  },
  {
    id: ruleId('feasibility-strong-roi-warns-defer'),
    name: 'Strong ROI makes deferral costly',
    description: 'When annual ROI exceeds 15%, deferring carries opportunity cost.',
    rationale: 'A 15%+ annual ROI is above-market. Every month of deferral sacrifices profit.',
    priority: 40, domains: ['market_intelligence'],
    category: 'strategic' as const, weight: 1.0,
    conditionGroups: [{ conditions: [
      { factPath: 'optionId', operator: 'eq' as const, value: 'defer' },
      { factPath: 'parameters.computed_roi_annual', operator: 'gte' as const, value: 0.15 },
    ]}],
    firesWithAction: 'WARN' as const,
    message: 'Project ROI exceeds 15% annually — deferring carries measurable opportunity cost.',
    overrideable: true, enabled: true,
  },
  {
    id: ruleId('feasibility-strong-roi-warns-revise'),
    name: 'Strong ROI makes major revision unnecessary',
    description: 'When annual ROI exceeds 15%, major revision risks disrupting performance.',
    rationale: 'A project with 15%+ annual ROI and positive NPV does not require structural revision.',
    priority: 50, domains: ['market_intelligence'],
    category: 'strategic' as const, weight: 1.0,
    conditionGroups: [{ conditions: [
      { factPath: 'optionId', operator: 'eq' as const, value: 'revise' },
      { factPath: 'parameters.computed_roi_annual', operator: 'gte' as const, value: 0.15 },
    ]}],
    firesWithAction: 'WARN' as const,
    message: 'Project ROI exceeds 15% annually — major revision is not required.',
    overrideable: true, enabled: true,
  },
] as const

const OPTIONS = [
  { id: 'proceed', label: 'Proceed with project',      description: 'Move forward immediately' },
  { id: 'revise',  label: 'Revise project parameters', description: 'Adjust pricing or cost structure' },
  { id: 'defer',   label: 'Defer decision',            description: 'Postpone pending market research' },
] as const

function baseEvidence(params: Record<string, unknown>) {
  const now = new Date().toISOString()
  return [
    {
      title: 'Client project parameters',
      content: params,
      sourceType: 'user_input' as const,
      sourceLabel: 'Benchmark case input',
      retrievedAt: now,
      confidence: 0.85,
      tags: { domain: 'feasibility' },
      category: 'user_provided' as const,
    },
    {
      title: 'Egypt Real Estate Benchmarks 2026',
      content: { roi_min: 0.08, roi_target: 0.15, hurdle_rate: 0.20, market_growth: '18%' },
      sourceType: 'internal_data' as const,
      sourceLabel: 'Eunoia Benchmark Database 2026',
      retrievedAt: now,
      confidence: 0.92,
      tags: { domain: 'feasibility' },
      category: 'benchmark' as const,
    },
    {
      title: 'Deterministic cashflow analysis',
      content: params,
      sourceType: 'internal_data' as const,
      sourceLabel: 'Eunoia Cashflow Engine v1',
      retrievedAt: now,
      confidence: 0.93,
      tags: { domain: 'feasibility', method: 'deterministic' },
      category: 'financial' as const,
    },
  ]
}

export const FEASIBILITY_CASES: BenchmarkCase[] = [
  {
    id: 'feasibility-001',
    name: 'Strong viable project — proceed recommended',
    description: 'Project with positive NPV (10M EGP), 18% annual ROI, and strong profit. Proceed scores 100; defer/revise warned for disrupting strong performance.',
    industry: 'egypt_real_estate',
    reportType: 'feasibility',
    addedAt: '2026-07-30T00:00:00Z',
    addedBy: 'Eunoia Engineering',
    tags: ['positive-npv', 'high-roi', 'no-blocking'],
    explanation: [
      'NPV = 10M (>0): npv-negative rule does NOT fire for proceed.',
      'net_profit = 5M (>0): net-profit-negative rule does NOT fire for proceed.',
      'ROI = 18% (>=8%): roi-below-minimum does NOT fire.',
      'ROI = 18% (>=15%): strong-roi-warns-defer FIRES for defer (WARN, weight 1.0).',
      'ROI = 18% (>=15%): strong-roi-warns-revise FIRES for revise (WARN, weight 1.0).',
      'proceed score = 100 (no rules fire). defer = revise = 95 (1 WARN, weight 1.0, total 10.5: (10.0/10.5)×100 = 95).',
      'Recommendation: proceed (highest score, not blocked).',
    ].join(' '),
    engineInput: {
      input: {
        subject: { domain: 'market_intelligence', name: 'Feasibility — Strong Project', metadata: {} },
        context: {
          question: 'Should we proceed with this real estate development project?',
          parameters: { computed_npv: 10_000_000, computed_roi_annual: 0.18, computed_net_profit: 5_000_000, computed_is_viable: true },
          constraints: [],
          objectives: ['Maximize ROI', 'Minimize capital risk'],
        },
        options: OPTIONS,
        requestedBy: 'system',
      },
      rawEvidence: baseEvidence({ computed_npv: 10_000_000, computed_roi_annual: 0.18, computed_net_profit: 5_000_000 }),
      rules: FEASIBILITY_RULES,
    },
    expected: {
      recommendedOptionId: 'proceed',
      confidence: { min: 55, max: 95 },
      firedRuleIds: ['feasibility-strong-roi-warns-defer', 'feasibility-strong-roi-warns-revise'],
      blockedOptionIds: [],
      trustScoreRange: { min: 55, max: 95 },
    },
  },

  {
    id: 'feasibility-002',
    name: 'Negative NPV and net profit — proceed blocked, revise recommended from eligible options',
    description: 'Project with NPV -2M, ROI 5%, net profit -500k. Two FAIL rules block proceed. The pipeline continues (PARTIAL) because revise and defer remain eligible. revise is recommended as the first eligible option.',
    industry: 'egypt_real_estate',
    reportType: 'feasibility',
    addedAt: '2026-07-30T00:00:00Z',
    addedBy: 'Eunoia Engineering',
    tags: ['negative-npv', 'negative-profit', 'blocked-proceed', 'roi-warning'],
    explanation: [
      'NPV = -2M (<=0): npv-negative-blocks-proceed FIRES (FAIL, weight 2.0) for proceed.',
      'net_profit = -500k (<=0): net-profit-negative-blocks-proceed FIRES (FAIL, weight 2.0) for proceed.',
      'ROI = 5% (<8%): roi-below-minimum FIRES (WARN, weight 1.5) for all options.',
      'proceed blocked by 2 FAIL rules.',
      'revise score = round((10.5 - 0.75)/10.5 × 100) = 93. defer score = 93.',
      'Eligible: [revise, defer]. Pipeline continues (PARTIAL) → revise recommended (first at max eligible score).',
    ].join(' '),
    engineInput: {
      input: {
        subject: { domain: 'market_intelligence', name: 'Feasibility — Negative NPV', metadata: {} },
        context: {
          question: 'Should we proceed with this real estate development project?',
          parameters: { computed_npv: -2_000_000, computed_roi_annual: 0.05, computed_net_profit: -500_000, computed_is_viable: false },
          constraints: [],
          objectives: ['Evaluate feasibility', 'Protect capital'],
        },
        options: OPTIONS,
        requestedBy: 'system',
      },
      rawEvidence: baseEvidence({ computed_npv: -2_000_000, computed_roi_annual: 0.05, computed_net_profit: -500_000 }),
      rules: FEASIBILITY_RULES,
    },
    expected: {
      recommendedOptionId: 'revise',
      confidence: { min: 40, max: 85 },
      firedRuleIds: [
        'feasibility-npv-negative-blocks-proceed',
        'feasibility-net-profit-negative-blocks-proceed',
        'feasibility-roi-below-egypt-minimum',
        'feasibility-low-roi-advises-revision',
      ],
      blockedOptionIds: ['proceed'],
      trustScoreRange: { min: 40, max: 85 },
    },
  },

  {
    id: 'feasibility-003',
    name: 'Low ROI warning — revise recommended (sub-benchmark ROI penalizes proceed)',
    description: 'Project with positive NPV (500k) but ROI 6.5% (below 8% benchmark). Global WARN fires for all options. Proceed is additionally penalized by the sub-benchmark-ROI-advises-revision rule. revise scores highest.',
    industry: 'egypt_real_estate',
    reportType: 'feasibility',
    addedAt: '2026-07-30T00:00:00Z',
    addedBy: 'Eunoia Engineering',
    tags: ['positive-npv', 'low-roi-warning', 'no-blocking', 'revise-recommended'],
    explanation: [
      'NPV = 500k (>0): npv-negative does NOT fire.',
      'net_profit = 200k (>0): net-profit-negative does NOT fire.',
      'ROI = 6.5% (<8%): roi-below-minimum FIRES (WARN, weight 1.5) for ALL options.',
      'ROI = 6.5% (<8%) AND optionId=proceed: low-roi-advises-revision FIRES (WARN, weight 1.0) for proceed only.',
      'ROI = 6.5% (<15%): strong-roi-warns-defer/revise do NOT fire.',
      'Total weight = 10.5.',
      'proceed penalty = 1.5×0.5 + 1.0×0.5 = 1.25 → score = round((10.5-1.25)/10.5×100) = 88.',
      'revise penalty = 1.5×0.5 = 0.75 → score = round((10.5-0.75)/10.5×100) = 93.',
      'defer penalty = 0.75 → score = 93.',
      'None blocked. reduce picks revise (93 > 88, then 93 is not > 93 so revise holds).',
      'Business-correct: when ROI is below benchmark, structural revision is required before committing capital.',
    ].join(' '),
    engineInput: {
      input: {
        subject: { domain: 'market_intelligence', name: 'Feasibility — Low ROI Warning', metadata: {} },
        context: {
          question: 'Should we proceed with this real estate development project?',
          parameters: { computed_npv: 500_000, computed_roi_annual: 0.065, computed_net_profit: 200_000, computed_is_viable: false },
          constraints: [],
          objectives: ['Evaluate feasibility'],
        },
        options: OPTIONS,
        requestedBy: 'system',
      },
      rawEvidence: baseEvidence({ computed_npv: 500_000, computed_roi_annual: 0.065, computed_net_profit: 200_000 }),
      rules: FEASIBILITY_RULES,
    },
    expected: {
      recommendedOptionId: 'revise',
      confidence: { min: 50, max: 90 },
      firedRuleIds: ['feasibility-roi-below-egypt-minimum', 'feasibility-low-roi-advises-revision'],
      blockedOptionIds: [],
      trustScoreRange: { min: 50, max: 90 },
    },
  },

  {
    id: 'feasibility-004',
    name: 'Marginal but valid project — clean proceed with no rules firing',
    description: 'Project with positive NPV (1M), ROI 9% (just above 8% minimum). No rules fire. All options score 100. Proceed recommended as first eligible option.',
    industry: 'egypt_real_estate',
    reportType: 'feasibility',
    addedAt: '2026-07-30T00:00:00Z',
    addedBy: 'Eunoia Engineering',
    tags: ['positive-npv', 'marginal-roi', 'no-rules-fire', 'clean-pass'],
    explanation: [
      'NPV = 1M (>0): npv-negative does NOT fire.',
      'net_profit = 300k (>0): net-profit-negative does NOT fire.',
      'ROI = 9% (>=8%): roi-below-minimum does NOT fire.',
      'ROI = 9% (<15%): strong-roi-warns-defer/revise do NOT fire.',
      'Zero rules fire. All options score 100. None blocked.',
      'Proves engine correctly recommends proceed when financials are valid, even if not outstanding.',
    ].join(' '),
    engineInput: {
      input: {
        subject: { domain: 'market_intelligence', name: 'Feasibility — Marginal Valid Project', metadata: {} },
        context: {
          question: 'Should we proceed with this real estate development project?',
          parameters: { computed_npv: 1_000_000, computed_roi_annual: 0.09, computed_net_profit: 300_000, computed_is_viable: true },
          constraints: [],
          objectives: ['Evaluate feasibility'],
        },
        options: OPTIONS,
        requestedBy: 'system',
      },
      rawEvidence: baseEvidence({ computed_npv: 1_000_000, computed_roi_annual: 0.09, computed_net_profit: 300_000 }),
      rules: FEASIBILITY_RULES,
    },
    expected: {
      recommendedOptionId: 'proceed',
      confidence: { min: 50, max: 95 },
      firedRuleIds: [],
      blockedOptionIds: [],
      trustScoreRange: { min: 50, max: 95 },
    },
  },

  {
    id: 'feasibility-005',
    name: 'ROI exactly at 8% boundary — proceed expected, ROI warning must NOT fire',
    description: 'Project with ROI = 8.0% exactly (the threshold). The roi-below-minimum rule uses strict less-than (< 0.08), so 8.0% must NOT trigger it. All 6 rules pass. All options score 100. Proceed recommended as first eligible.',
    industry: 'egypt_real_estate',
    reportType: 'feasibility',
    addedAt: '2026-08-04T00:00:00Z',
    addedBy: 'Eunoia Engineering',
    tags: ['positive-npv', 'roi-at-boundary', 'no-rules-fire', 'boundary-validation'],
    explanation: [
      'NPV = 2M (>0): npv-negative does NOT fire.',
      'net_profit = 800k (>0): net-profit-negative does NOT fire.',
      'ROI = 8.0% — condition is < 0.08 (strict), so 0.08 does NOT fire roi-below-minimum.',
      'ROI = 8.0% — condition is proceed AND < 0.08 (strict), so low-roi-advises-revision does NOT fire.',
      'ROI = 8.0% (<15%): strong-roi-warns-defer/revise do NOT fire.',
      'Zero rules fire. Total weight 10.5. All options score 100. None blocked.',
      'Validates the strict less-than boundary: 8.0% is acceptable, 7.99% is not.',
      'Recommendation: proceed (first eligible at 100, tied with revise/defer).',
    ].join(' '),
    engineInput: {
      input: {
        subject: { domain: 'market_intelligence', name: 'Feasibility — ROI Boundary at 8%', metadata: {} },
        context: {
          question: 'Should we proceed with this real estate development project?',
          parameters: { computed_npv: 2_000_000, computed_roi_annual: 0.08, computed_net_profit: 800_000, computed_is_viable: true },
          constraints: [],
          objectives: ['Evaluate feasibility'],
        },
        options: OPTIONS,
        requestedBy: 'system',
      },
      rawEvidence: baseEvidence({ computed_npv: 2_000_000, computed_roi_annual: 0.08, computed_net_profit: 800_000 }),
      rules: FEASIBILITY_RULES,
    },
    expected: {
      recommendedOptionId: 'proceed',
      confidence: { min: 55, max: 95 },
      firedRuleIds: [],
      blockedOptionIds: [],
      trustScoreRange: { min: 55, max: 95 },
    },
  },

  {
    id: 'feasibility-006',
    name: 'Positive financials but peak financing gap exceeds capital — proceed blocked, revise recommended',
    description: 'Project with positive NPV, 12% ROI, and positive net profit, but peak construction drawdown exceeds estimated available equity (computed_financing_gap_exceeded=true). Financial metrics are strong, but the project cannot be self-funded through peak drawdown without uncommitted external financing. Proceed must be blocked.',
    industry: 'egypt_real_estate',
    reportType: 'feasibility',
    addedAt: '2026-08-04T00:00:00Z',
    addedBy: 'Eunoia Engineering',
    tags: ['positive-npv', 'good-roi', 'financing-gap', 'blocked-proceed', 'capital-constraint'],
    explanation: [
      'NPV = 5M (>0): npv-negative does NOT fire.',
      'net_profit = 2M (>0): net-profit-negative does NOT fire.',
      'ROI = 12% (>=8%): roi-below-minimum does NOT fire.',
      'ROI = 12% (<15%): strong-roi-warns-defer/revise do NOT fire.',
      'computed_financing_gap_exceeded = true AND optionId=proceed: financing-gap-blocks-proceed FIRES (FAIL, weight 2.0).',
      'proceed score = round((10.5-2.0)/10.5×100) = 81. BLOCKED.',
      'revise: 0 rules fire → score = 100.',
      'defer: 0 rules fire → score = 100.',
      'Eligible: [revise, defer]. reduce picks revise (first at 100).',
      'Business-correct: strong financials do not overcome a capital structure failure. Revise must restructure the equity or financing plan.',
    ].join(' '),
    engineInput: {
      input: {
        subject: { domain: 'market_intelligence', name: 'Feasibility — Financing Gap Blocks Proceed', metadata: {} },
        context: {
          question: 'Should we proceed with this real estate development project?',
          parameters: {
            computed_npv: 5_000_000,
            computed_roi_annual: 0.12,
            computed_net_profit: 2_000_000,
            computed_is_viable: true,
            computed_financing_gap_exceeded: true,
          },
          constraints: [],
          objectives: ['Evaluate feasibility', 'Assess capital structure'],
        },
        options: OPTIONS,
        requestedBy: 'system',
      },
      rawEvidence: baseEvidence({
        computed_npv: 5_000_000,
        computed_roi_annual: 0.12,
        computed_net_profit: 2_000_000,
        computed_financing_gap_exceeded: true,
      }),
      rules: FEASIBILITY_RULES,
    },
    expected: {
      recommendedOptionId: 'revise',
      confidence: { min: 50, max: 90 },
      firedRuleIds: ['feasibility-financing-gap-blocks-proceed'],
      blockedOptionIds: ['proceed'],
      trustScoreRange: { min: 50, max: 90 },
    },
  },
]
