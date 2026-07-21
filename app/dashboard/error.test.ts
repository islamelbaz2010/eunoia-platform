import { describe, expect, it } from 'vitest'

import { dashboardErrorReference } from './error'

describe('dashboardErrorReference', () => {
  it('returns a support-safe digest reference when Next provides one', () => {
    const error = Object.assign(new Error('database password leaked in stack'), {
      digest: 'NEXT_DIGEST_123',
    })

    expect(dashboardErrorReference(error)).toBe('Reference: NEXT_DIGEST_123')
  })

  it('does not expose raw error messages when no digest exists', () => {
    const error = new Error('sensitive internal detail')

    expect(dashboardErrorReference(error)).toBeNull()
  })
})
