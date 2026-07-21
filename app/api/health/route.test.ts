import { describe, expect, it } from 'vitest'

import { GET } from './route'

describe('GET /api/health', () => {
  it('returns a public liveness payload without environment details', async () => {
    const response = GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(payload).toMatchObject({
      ok: true,
      service: 'eunoia-platform',
    })
    expect(payload.timestamp).toEqual(expect.any(String))
    expect(payload).not.toHaveProperty('env')
    expect(payload).not.toHaveProperty('hasOpenAI')
    expect(payload).not.toHaveProperty('hasSupabase')
  })
})
