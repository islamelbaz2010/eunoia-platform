import { beforeEach, describe, expect, it, vi } from 'vitest'

import { checkPlanLimit } from './plan-enforcement'

function createSupabaseMock({
  plan,
  rows,
  usageError,
  planError,
}: {
  plan?: string | null
  rows?: Array<{ credits_used?: number }>
  usageError?: Error | null
  planError?: Error | null
} = {}) {
  const planQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(
      planError
        ? { data: null, error: planError }
        : { data: plan ? { plan } : null, error: null }
    ),
  }
  const usageQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockResolvedValue({ data: rows ?? [], error: usageError ?? null }),
  }
  const from = vi.fn((table: string) => {
    if (table === 'user_plans') return planQuery
    if (table === 'research_requests') return usageQuery
    throw new Error(`Unexpected table: ${table}`)
  })

  return { from, planQuery, usageQuery }
}

describe('checkPlanLimit', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('defaults users without a plan row to STARTER and counts monthly credits', async () => {
    const supabase = createSupabaseMock({
      rows: [{ credits_used: 3 }, { credits_used: 2 }, {}],
    })

    const result = await checkPlanLimit(supabase, 'user-1')

    expect(result).toEqual({ ok: true, used: 6, limit: 20, plan: 'STARTER' })
    expect(supabase.from).toHaveBeenCalledWith('user_plans')
    expect(supabase.from).toHaveBeenCalledWith('research_requests')
  })

  it('blocks finite plans when usage reaches the monthly limit', async () => {
    const supabase = createSupabaseMock({
      plan: 'PROFESSIONAL',
      rows: [{ credits_used: 60 }, { credits_used: 40 }],
    })

    const result = await checkPlanLimit(supabase, 'user-1')

    expect(result).toEqual({ ok: false, used: 100, limit: 100, plan: 'PROFESSIONAL' })
  })

  it('treats ENTERPRISE as unlimited without querying monthly usage', async () => {
    const supabase = createSupabaseMock({ plan: 'ENTERPRISE' })

    const result = await checkPlanLimit(supabase, 'user-1')

    expect(result).toEqual({ ok: true, used: 0, limit: -1, plan: 'ENTERPRISE' })
    expect(supabase.usageQuery.select).not.toHaveBeenCalled()
  })

  it('fails open as STARTER when Supabase usage reads fail', async () => {
    const supabase = createSupabaseMock({
      plan: 'AGENCY',
      usageError: new Error('supabase unavailable'),
    })

    const result = await checkPlanLimit(supabase, 'user-1')

    expect(result).toEqual({ ok: true, used: 0, limit: 20, plan: 'STARTER' })
  })
})
