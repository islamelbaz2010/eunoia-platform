import { describe, expect, it } from 'vitest'

import { parsePlanLimitNotice } from './api-error'

describe('parsePlanLimitNotice', () => {
  it('returns a customer-facing plan-limit notice from quota payloads', () => {
    expect(parsePlanLimitNotice({
      error: 'Monthly plan limit reached.',
      used: 20,
      limit: 20,
      plan: 'STARTER',
    })).toEqual({
      message: 'Monthly plan limit reached.',
      used: 20,
      limit: 20,
      plan: 'STARTER',
      planLabel: 'Starter',
    })
  })

  it('ignores generic API errors without usage fields', () => {
    expect(parsePlanLimitNotice({ error: 'Something failed' })).toBeNull()
  })

  it('ignores payloads with unknown plan values', () => {
    expect(parsePlanLimitNotice({
      used: 20,
      limit: 20,
      plan: 'UNKNOWN' as 'STARTER',
    })).toBeNull()
  })
})
