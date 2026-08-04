/**
 * Market Entry benchmark cases — Egypt real estate geographic expansion decisions.
 *
 * Rules under test (from route.ts buildDIRules('market_entry')):
 *   market-entry-budget-insufficient-blocks-now  weight 2.0 FAIL if optionId='enter_now' AND budget_sufficient=false
 *   market-entry-low-leads-warns-immediate       weight 1.5 WARN if optionId='enter_now' AND monthly_leads < 15
 *   market-entry-good-conditions-warns-hold      weight 1.0 WARN if optionId='hold' AND budget_sufficient=true AND market_high=true
 *   market-entry-long-breakeven-warns-immediate  weight 1.5 WARN if optionId='enter_now' AND break_even_months > 9
 *
 * Total rule weight = 6.0
 *
 * Options: enter_now (1st), enter_phased (2nd), hold (3rd)
 */

import { ruleId } from '../../types/rules.types'
import type { BenchmarkCase } from '../types'

const MARKET_ENTRY_RULES = [
  {
    id: ruleId('market-entry-budget-insufficient-blocks-now'),
    name: 'Insufficient budget blocks immediate market entry',
    description: 'Entering without sufficient test budget produces statistically unreliable results.',
    rationale: 'Minimum 30-lead test required to validate market entry assumptions.',
    priority: 10, domains: ['market_intelligence'],
    category: 'financial' as const, weight: 2.0,
    conditionGroups: [{ conditions: [
      { factPath: 'optionId', operator: 'eq' as const, value: 'enter_now' },
      { factPath: 'parameters.computed_budget_sufficient', operator: 'eq' as const, value: false },
    ]}],
    firesWithAction: 'FAIL' as const,
    message: 'Available budget below minimum test budget — immediate entry risks unreliable market signals.',
    overrideable: true, enabled: true,
  },
  {
    id: ruleId('market-entry-low-leads-warns-immediate'),
    name: 'Low expected leads warns against immediate entry',
    description: 'Fewer than 15 expected monthly leads is insufficient for actionable market intelligence.',
    rationale: 'Market entry validation requires minimum lead volume to distinguish signal from noise.',
    priority: 20, domains: ['market_intelligence'],
    category: 'operational' as const, weight: 1.5,
    conditionGroups: [{ conditions: [
      { factPath: 'optionId', operator: 'eq' as const, value: 'enter_now' },
      { factPath: 'parameters.computed_monthly_leads_at_budget', operator: 'lt' as const, value: 15 },
    ]}],
    firesWithAction: 'WARN' as const,
    message: 'Expected monthly leads below 15 — insufficient volume to validate market entry assumptions.',
    overrideable: true, enabled: true,
  },
  {
    id: ruleId('market-entry-good-conditions-warns-hold'),
    name: 'Strong conditions make holding entry costly',
    description: 'Holding when budget is sufficient and market attractiveness is high carries first-mover cost.',
    rationale: 'High-attractiveness markets attract competitors. Delaying cedes first-mover advantage.',
    priority: 30, domains: ['market_intelligence'],
    category: 'strategic' as const, weight: 1.0,
    conditionGroups: [{ conditions: [
      { factPath: 'optionId', operator: 'eq' as const, value: 'hold' },
      { factPath: 'parameters.computed_budget_sufficient', operator: 'eq' as const, value: true },
      { factPath: 'parameters.computed_market_attractiveness_high', operator: 'eq' as const, value: true },
    ]}],
    firesWithAction: 'WARN' as const,
    message: 'Budget sufficient and market attractiveness high — holding risks losing first-mover advantage.',
    overrideable: true, enabled: true,
  },
  {
    id: ruleId('market-entry-long-breakeven-warns-immediate'),
    name: 'Long break-even period warns against full immediate entry',
    description: 'Break-even >9 months suggests phased entry to manage capital risk.',
    rationale: 'Egyptian market entry benchmarks: break-even within 6–9 months is the target range.',
    priority: 40, domains: ['market_intelligence'],
    category: 'financial' as const, weight: 1.5,
    conditionGroups: [{ conditions: [
      { factPath: 'optionId', operator: 'eq' as const, value: 'enter_now' },
      { factPath: 'parameters.computed_break_even_months', operator: 'gt' as const, value: 9 },
    ]}],
    firesWithAction: 'WARN' as const,
    message: 'Break-even exceeds 9 months — consider phased entry to manage capital risk.',
    overrideable: true, enabled: true,
  },
] as const

const OPTIONS = [
  { id: 'enter_now',    label: 'Enter market now',           description: 'Begin operations in target market immediately' },
  { id: 'enter_phased', label: 'Enter with phased approach', description: 'Start with test budget before full commitment' },
  { id: 'hold',         label: 'Hold market entry',          description: 'Postpone until conditions improve' },
] as const

function baseEvidence(params: Record<string, unknown>) {
  const now = new Date().toISOString()
  return [
    {
      title: 'Market entry parameters',
      content: params,
      sourceType: 'user_input' as const,
      sourceLabel: 'Benchmark case input',
      retrievedAt: now,
      confidence: 0.83,
      tags: { domain: 'market_entry' },
      category: 'user_provided' as const,
    },
    {
      title: 'Egypt Real Estate Market Entry Benchmarks 2026',
      content: { min_test_leads: 30, target_breakeven_months: 9, developer_cpl: 550 },
      sourceType: 'internal_data' as const,
      sourceLabel: 'Eunoia Benchmark Database 2026',
      retrievedAt: now,
      confidence: 0.90,
      tags: { domain: 'market_entry' },
      category: 'benchmark' as const,
    },
    {
      title: 'Market entry budget and lead forecast',
      content: params,
      sourceType: 'internal_data' as const,
      sourceLabel: 'Eunoia Market Entry Calculator',
      retrievedAt: now,
      confidence: 0.87,
      tags: { domain: 'market_entry', method: 'deterministic' },
      category: 'market_data' as const,
    },
  ]
}

export const MARKET_ENTRY_CASES: BenchmarkCase[] = [
  {
    id: 'market-entry-001',
    name: 'Insufficient budget blocks enter_now — enter_phased recommended from eligible options',
    description: 'Budget is insufficient, blocking enter_now with a FAIL rule. enter_phased and hold score 100. The pipeline continues (PARTIAL) because eligible options remain, and enter_phased is recommended as the first eligible option.',
    industry: 'egypt_real_estate',
    reportType: 'market_entry',
    addedAt: '2026-07-30T00:00:00Z',
    addedBy: 'Eunoia Engineering',
    tags: ['insufficient-budget', 'blocked-enter-now', 'low-leads'],
    explanation: [
      'budget_sufficient = false: budget-insufficient-blocks-now FIRES (FAIL, weight 2.0) for enter_now.',
      'monthly_leads = 8 (<15): low-leads-warns-immediate FIRES (WARN, weight 1.5) for enter_now.',
      'budget_sufficient = false: good-conditions-warns-hold does NOT fire (condition requires true).',
      'break_even = 6 (not >9): long-breakeven does NOT fire.',
      'enter_now blocked. enter_phased = hold = 100. Eligible options exist → pipeline continues (PARTIAL) → enter_phased recommended (first at max score).',
    ].join(' '),
    engineInput: {
      input: {
        subject: { domain: 'market_intelligence', name: 'Market Entry — Insufficient Budget', metadata: {} },
        context: {
          question: 'Should we enter the New Cairo real estate market?',
          parameters: {
            computed_budget_sufficient: false,
            computed_monthly_leads_at_budget: 8,
            computed_market_attractiveness_high: false,
            computed_break_even_months: 6,
          },
          constraints: [],
          objectives: ['Validate market opportunity', 'Manage capital risk'],
        },
        options: OPTIONS,
        requestedBy: 'system',
      },
      rawEvidence: baseEvidence({ computed_budget_sufficient: false, computed_monthly_leads_at_budget: 8, computed_market_attractiveness_high: false, computed_break_even_months: 6 }),
      rules: MARKET_ENTRY_RULES,
    },
    expected: {
      recommendedOptionId: 'enter_phased',
      confidence: { min: 40, max: 85 },
      firedRuleIds: ['market-entry-budget-insufficient-blocks-now', 'market-entry-low-leads-warns-immediate'],
      blockedOptionIds: ['enter_now'],
      trustScoreRange: { min: 40, max: 85 },
    },
  },

  {
    id: 'market-entry-002',
    name: 'Good conditions — enter_now recommended, hold warned for opportunity cost',
    description: 'Budget is sufficient, lead volume is strong (30/month), market attractiveness is high, and break-even is 5 months. enter_now scores 100. Holding is warned for ceding first-mover advantage.',
    industry: 'egypt_real_estate',
    reportType: 'market_entry',
    addedAt: '2026-07-30T00:00:00Z',
    addedBy: 'Eunoia Engineering',
    tags: ['sufficient-budget', 'high-attractiveness', 'hold-warned', 'enter-now-recommended'],
    explanation: [
      'budget_sufficient = true: budget-insufficient does NOT fire.',
      'monthly_leads = 30 (not <15): low-leads does NOT fire.',
      'budget_sufficient=true AND market_high=true: good-conditions-warns-hold FIRES (WARN, weight 1.0) for hold.',
      'break_even = 5 (not >9): long-breakeven does NOT fire.',
      'enter_now = enter_phased = 100. hold = (6.0 - 0.5)/6.0*100 = 92.',
      'Best: enter_now (100). reduce keeps enter_now (first, tied with enter_phased at 100).',
    ].join(' '),
    engineInput: {
      input: {
        subject: { domain: 'market_intelligence', name: 'Market Entry — Good Conditions', metadata: {} },
        context: {
          question: 'Should we enter the Sheikh Zayed real estate market?',
          parameters: {
            computed_budget_sufficient: true,
            computed_monthly_leads_at_budget: 30,
            computed_market_attractiveness_high: true,
            computed_break_even_months: 5,
          },
          constraints: [],
          objectives: ['Capture first-mover advantage', 'Enter high-attractiveness market'],
        },
        options: OPTIONS,
        requestedBy: 'system',
      },
      rawEvidence: baseEvidence({ computed_budget_sufficient: true, computed_monthly_leads_at_budget: 30, computed_market_attractiveness_high: true, computed_break_even_months: 5 }),
      rules: MARKET_ENTRY_RULES,
    },
    expected: {
      recommendedOptionId: 'enter_now',
      confidence: { min: 50, max: 95 },
      firedRuleIds: ['market-entry-good-conditions-warns-hold'],
      blockedOptionIds: [],
      trustScoreRange: { min: 50, max: 95 },
    },
  },

  {
    id: 'market-entry-003',
    name: 'Long break-even (14 months) — enter_now warned, phased entry recommended',
    description: 'Budget is sufficient and leads are adequate, but break-even period is 14 months (above 9-month benchmark). enter_now is warned for high capital risk. enter_phased and hold score 100.',
    industry: 'egypt_real_estate',
    reportType: 'market_entry',
    addedAt: '2026-07-30T00:00:00Z',
    addedBy: 'Eunoia Engineering',
    tags: ['long-breakeven', 'enter-now-warned', 'phased-recommended'],
    explanation: [
      'budget_sufficient = true: budget-insufficient does NOT fire.',
      'monthly_leads = 25 (not <15): low-leads does NOT fire.',
      'market_attractiveness_high = false: good-conditions-warns-hold does NOT fire.',
      'break_even = 14 (>9): long-breakeven-warns-immediate FIRES (WARN, weight 1.5) for enter_now.',
      'enter_now score = (6.0 - 0.75)/6.0*100 = 88. enter_phased = hold = 100.',
      'Best: enter_phased (100) tied with hold (100) → reduce keeps enter_phased (first).',
    ].join(' '),
    engineInput: {
      input: {
        subject: { domain: 'market_intelligence', name: 'Market Entry — Long Break-Even', metadata: {} },
        context: {
          question: 'Should we enter the North Coast real estate market?',
          parameters: {
            computed_budget_sufficient: true,
            computed_monthly_leads_at_budget: 25,
            computed_market_attractiveness_high: false,
            computed_break_even_months: 14,
          },
          constraints: [],
          objectives: ['Validate North Coast market', 'Manage capital risk'],
        },
        options: OPTIONS,
        requestedBy: 'system',
      },
      rawEvidence: baseEvidence({ computed_budget_sufficient: true, computed_monthly_leads_at_budget: 25, computed_market_attractiveness_high: false, computed_break_even_months: 14 }),
      rules: MARKET_ENTRY_RULES,
    },
    expected: {
      recommendedOptionId: 'enter_phased',
      confidence: { min: 50, max: 95 },
      firedRuleIds: ['market-entry-long-breakeven-warns-immediate'],
      blockedOptionIds: [],
      trustScoreRange: { min: 50, max: 95 },
    },
  },
]
