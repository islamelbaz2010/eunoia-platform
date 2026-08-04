/**
 * Lead Generation benchmark cases — Egypt real estate lead qualification decisions.
 *
 * Rules under test (from route.ts buildDIRules('lead_gen')):
 *   lead-gen-high-cac-blocks-volume-increase   weight 2.0 FAIL if optionId='increase_volume' AND cac_gap_ratio > 2.5
 *   lead-gen-low-qual-rate-warns-volume        weight 1.5 WARN if optionId='increase_volume' AND qual_rate_pct < 8
 *   lead-gen-benchmark-qual-warns-tighten      weight 1.0 WARN if optionId='qualify_better' AND qual_rate_pct >= 20
 *
 * Total rule weight = 4.5
 *
 * Options: qualify_better (1st), increase_volume (2nd), optimize_pipeline (3rd)
 */

import { ruleId } from '../../types/rules.types'
import type { BenchmarkCase } from '../types'

const LEAD_GEN_RULES = [
  {
    id: ruleId('lead-gen-high-cac-blocks-volume-increase'),
    name: 'CAC >2.5× benchmark blocks lead volume increase',
    description: 'Increasing lead volume when CAC is more than 2.5× the benchmark multiplies losses.',
    rationale: 'Egypt benchmark 2026: Developer CAC ~12,500 EGP. At 2.5× this benchmark, unit economics are fundamentally broken.',
    priority: 10, domains: ['market_intelligence'],
    category: 'financial' as const, weight: 2.0,
    conditionGroups: [{ conditions: [
      { factPath: 'optionId', operator: 'eq' as const, value: 'increase_volume' },
      { factPath: 'parameters.computed_cac_gap_ratio', operator: 'gt' as const, value: 2.5 },
    ]}],
    firesWithAction: 'FAIL' as const,
    message: 'Customer Acquisition Cost exceeds 2.5× the Egypt benchmark — increasing lead volume will multiply losses.',
    overrideable: false, enabled: true,
  },
  {
    id: ruleId('lead-gen-low-qual-rate-warns-volume'),
    name: 'Low qualification rate warns against volume increase',
    description: 'A qualification rate below 8% means more leads will not proportionally produce more deals.',
    rationale: 'Egypt real estate benchmark: 15–25% qualification rate. Below 8% indicates a fundamental targeting problem.',
    priority: 20, domains: ['market_intelligence'],
    category: 'operational' as const, weight: 1.5,
    conditionGroups: [{ conditions: [
      { factPath: 'optionId', operator: 'eq' as const, value: 'increase_volume' },
      { factPath: 'parameters.computed_qual_rate_pct', operator: 'lt' as const, value: 8 },
    ]}],
    firesWithAction: 'WARN' as const,
    message: 'Qualification rate is below 8% — generating more leads without fixing qualification will not meaningfully increase deals.',
    overrideable: true, enabled: true,
  },
  {
    id: ruleId('lead-gen-benchmark-qual-warns-tighten'),
    name: 'Above-benchmark qualification warns against further tightening',
    description: 'When qualification rate already meets the benchmark, further tightening may reduce total deal flow.',
    rationale: 'Egypt benchmark: 20% qualification rate is the target. Above this, tightening reduces lead volume without proportional deal improvement.',
    priority: 30, domains: ['market_intelligence'],
    category: 'operational' as const, weight: 1.0,
    conditionGroups: [{ conditions: [
      { factPath: 'optionId', operator: 'eq' as const, value: 'qualify_better' },
      { factPath: 'parameters.computed_qual_rate_pct', operator: 'gte' as const, value: 20 },
    ]}],
    firesWithAction: 'WARN' as const,
    message: 'Qualification rate meets or exceeds the 20% Egypt benchmark — further tightening may reduce total deal flow.',
    overrideable: true, enabled: true,
  },
] as const

const OPTIONS = [
  { id: 'qualify_better',    label: 'Improve lead qualification', description: 'Tighten criteria to increase deal conversion rate' },
  { id: 'increase_volume',   label: 'Increase lead volume',       description: 'Generate more leads to offset current qualification rate' },
  { id: 'optimize_pipeline', label: 'Optimize sales pipeline',    description: 'Improve follow-up and nurture sequences for existing leads' },
] as const

function baseEvidence(params: Record<string, unknown>) {
  const now = new Date().toISOString()
  return [
    {
      title: 'Lead generation parameters',
      content: params,
      sourceType: 'user_input' as const,
      sourceLabel: 'Benchmark case input',
      retrievedAt: now,
      confidence: 0.82,
      tags: { domain: 'lead_gen' },
      category: 'user_provided' as const,
    },
    {
      title: 'Egypt Real Estate Lead Gen Benchmarks 2026',
      content: { qual_rate_target: 20, qual_rate_min: 8, developer_cac_egp: 12500, broker_cac_egp: 5000 },
      sourceType: 'internal_data' as const,
      sourceLabel: 'Eunoia Benchmark Database 2026',
      retrievedAt: now,
      confidence: 0.90,
      tags: { domain: 'lead_gen' },
      category: 'benchmark' as const,
    },
    {
      title: 'Lead qualification analysis',
      content: params,
      sourceType: 'internal_data' as const,
      sourceLabel: 'Eunoia Lead Scoring Engine',
      retrievedAt: now,
      confidence: 0.85,
      tags: { domain: 'lead_gen', method: 'deterministic' },
      category: 'operational' as const,
    },
  ]
}

export const LEAD_GEN_CASES: BenchmarkCase[] = [
  {
    id: 'lead-gen-001',
    name: 'High CAC (3.2×) and very low qual rate — increase_volume blocked, qualify_better recommended from eligible options',
    description: 'CAC is 3.2× the Egypt benchmark. increase_volume is blocked by a FAIL rule. qualify_better and optimize_pipeline are eligible (score 100). The pipeline continues (PARTIAL) because eligible options remain, and qualify_better is recommended as the first eligible option.',
    industry: 'egypt_real_estate',
    reportType: 'lead_gen',
    addedAt: '2026-07-30T00:00:00Z',
    addedBy: 'Eunoia Engineering',
    tags: ['high-cac', 'low-qual-rate', 'blocked-volume-increase'],
    explanation: [
      'cac_gap_ratio = 3.2 (>2.5): high-cac-blocks-volume-increase FIRES (FAIL, weight 2.0) for increase_volume.',
      'qual_rate_pct = 5 (<8): low-qual-rate-warns-volume FIRES (WARN, weight 1.5) for increase_volume.',
      'qual_rate_pct = 5 (<20): benchmark-qual-warns-tighten does NOT fire (condition requires >=20).',
      'increase_volume BLOCKED. qualify_better = optimize_pipeline = 100.',
      'Eligible options exist → pipeline continues (PARTIAL) → qualify_better recommended (first at max eligible score).',
    ].join(' '),
    engineInput: {
      input: {
        subject: { domain: 'market_intelligence', name: 'Lead Gen — High CAC', metadata: {} },
        context: {
          question: 'How should we approach lead generation to improve deal flow?',
          parameters: {
            computed_cac_gap_ratio: 3.2,
            computed_qual_rate_pct: 5,
          },
          constraints: [],
          objectives: ['Improve deal conversion', 'Reduce customer acquisition cost'],
        },
        options: OPTIONS,
        requestedBy: 'system',
      },
      rawEvidence: baseEvidence({ computed_cac_gap_ratio: 3.2, computed_qual_rate_pct: 5 }),
      rules: LEAD_GEN_RULES,
    },
    expected: {
      recommendedOptionId: 'qualify_better',
      confidence: { min: 40, max: 85 },
      firedRuleIds: ['lead-gen-high-cac-blocks-volume-increase', 'lead-gen-low-qual-rate-warns-volume'],
      blockedOptionIds: ['increase_volume'],
      trustScoreRange: { min: 40, max: 85 },
    },
  },

  {
    id: 'lead-gen-002',
    name: 'Above-benchmark qual rate (25%) — qualify_better warned, increase_volume recommended',
    description: 'Qualification rate is 25% (above the 20% benchmark) and CAC is healthy (1.0×). Further tightening qualification is warned. increase_volume is the best unconstrained option and has higher score than qualify_better.',
    industry: 'egypt_real_estate',
    reportType: 'lead_gen',
    addedAt: '2026-07-30T00:00:00Z',
    addedBy: 'Eunoia Engineering',
    tags: ['high-qual-rate', 'qualify-warned', 'volume-recommended'],
    explanation: [
      'cac_gap_ratio = 1.0 (not >2.5): high-cac-blocks does NOT fire.',
      'qual_rate_pct = 25 (not <8): low-qual-rate-warns does NOT fire.',
      'qual_rate_pct = 25 (>=20): benchmark-qual-warns-tighten FIRES (WARN, weight 1.0) for qualify_better.',
      'qualify_better score = (4.5 - 0.5)/4.5*100 = 89. increase_volume = optimize_pipeline = 100.',
      'Best: increase_volume (100) and optimize_pipeline (100). First at max score by options array order: increase_volume.',
    ].join(' '),
    engineInput: {
      input: {
        subject: { domain: 'market_intelligence', name: 'Lead Gen — Above-Benchmark Qual', metadata: {} },
        context: {
          question: 'How should we approach lead generation to improve deal flow?',
          parameters: {
            computed_cac_gap_ratio: 1.0,
            computed_qual_rate_pct: 25,
          },
          constraints: [],
          objectives: ['Scale deal volume', 'Maintain qualification quality'],
        },
        options: OPTIONS,
        requestedBy: 'system',
      },
      rawEvidence: baseEvidence({ computed_cac_gap_ratio: 1.0, computed_qual_rate_pct: 25 }),
      rules: LEAD_GEN_RULES,
    },
    expected: {
      recommendedOptionId: 'increase_volume',
      confidence: { min: 50, max: 95 },
      firedRuleIds: ['lead-gen-benchmark-qual-warns-tighten'],
      blockedOptionIds: [],
      trustScoreRange: { min: 50, max: 95 },
    },
  },

  {
    id: 'lead-gen-003',
    name: 'Very low qual rate (5%), normal CAC — increase_volume warned, qualify_better recommended',
    description: 'Qualification rate is only 5% but CAC is healthy (1.0×, no blocking). Increasing volume is warned for structural targeting problems. qualify_better scores 100 as the first eligible option with the highest score.',
    industry: 'egypt_real_estate',
    reportType: 'lead_gen',
    addedAt: '2026-07-30T00:00:00Z',
    addedBy: 'Eunoia Engineering',
    tags: ['low-qual-rate', 'volume-warned', 'qualify-recommended'],
    explanation: [
      'cac_gap_ratio = 1.0 (not >2.5): high-cac-blocks does NOT fire.',
      'qual_rate_pct = 5 (<8): low-qual-rate-warns-volume FIRES (WARN, weight 1.5) for increase_volume.',
      'qual_rate_pct = 5 (<20): benchmark-qual-warns-tighten does NOT fire.',
      'increase_volume score = (4.5 - 0.75)/4.5*100 = 83. qualify_better = optimize_pipeline = 100.',
      'Best: qualify_better (100) and optimize_pipeline (100) — qualify_better is first in options array.',
    ].join(' '),
    engineInput: {
      input: {
        subject: { domain: 'market_intelligence', name: 'Lead Gen — Low Qual Rate', metadata: {} },
        context: {
          question: 'How should we approach lead generation to improve deal flow?',
          parameters: {
            computed_cac_gap_ratio: 1.0,
            computed_qual_rate_pct: 5,
          },
          constraints: [],
          objectives: ['Improve conversion rate', 'Increase qualified deal flow'],
        },
        options: OPTIONS,
        requestedBy: 'system',
      },
      rawEvidence: baseEvidence({ computed_cac_gap_ratio: 1.0, computed_qual_rate_pct: 5 }),
      rules: LEAD_GEN_RULES,
    },
    expected: {
      recommendedOptionId: 'qualify_better',
      confidence: { min: 50, max: 95 },
      firedRuleIds: ['lead-gen-low-qual-rate-warns-volume'],
      blockedOptionIds: [],
      trustScoreRange: { min: 50, max: 95 },
    },
  },
]
