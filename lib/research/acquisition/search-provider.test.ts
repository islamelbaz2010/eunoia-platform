import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { checkSearchQuota } = vi.hoisted(() => ({
  checkSearchQuota: vi.fn(),
}))

vi.mock('./quota', () => ({
  checkSearchQuota,
}))

import { SearchProviderError, SerpApiProvider } from './search-provider'

describe('SerpApiProvider', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    checkSearchQuota.mockReset()
    checkSearchQuota.mockResolvedValue({ ok: true, used: 0, limit: 30 })
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('requires an API key', async () => {
    await expect(new SerpApiProvider('').search('banks cairo')).rejects.toMatchObject({
      name: 'SearchProviderError',
      provider: 'serpapi',
    })
  })

  it('checks per-user quota before making a SerpAPI request', async () => {
    checkSearchQuota.mockResolvedValue({ ok: false, used: 30, limit: 30 })
    const fetchSpy = vi.fn()
    global.fetch = fetchSpy as unknown as typeof fetch

    await expect(new SerpApiProvider('key').search('banks cairo', { userId: 'user-1' })).rejects.toMatchObject({
      statusCode: 429,
    })

    expect(checkSearchQuota).toHaveBeenCalledWith('user-1')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('maps organic results and filters incomplete rows', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        organic_results: [
          { title: 'Acme', link: 'https://acme.com', snippet: 'Official site' },
          { title: 'Missing link', snippet: 'No URL' },
          { link: 'https://no-title.com', snippet: 'No title' },
        ],
      }),
    }) as unknown as typeof fetch

    const result = await new SerpApiProvider('key').search('banks cairo', {
      num: 3,
      siteRestrict: 'site:*.eg',
      userId: 'user-1',
    })

    expect(result).toEqual([{ title: 'Acme', url: 'https://acme.com', snippet: 'Official site' }])
    const requestedUrl = new URL(String((global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]))
    expect(requestedUrl.searchParams.get('q')).toBe('banks cairo site:*.eg')
    expect(requestedUrl.searchParams.get('num')).toBe('3')
  })

  it('converts SerpAPI error payloads into provider errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: 'Invalid API key' }),
    }) as unknown as typeof fetch

    await expect(new SerpApiProvider('key').search('banks cairo')).rejects.toBeInstanceOf(SearchProviderError)
    await expect(new SerpApiProvider('key').search('banks cairo')).rejects.toMatchObject({
      provider: 'serpapi',
      statusCode: 502,
    })
  })
})
