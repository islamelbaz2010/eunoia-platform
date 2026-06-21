import { describe, it, expect, vi, beforeEach } from 'vitest'

const { get, set } = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}))

vi.mock('@/lib/redis/client', () => ({
  redis: { get, set },
}))

import {
  isParkedDomainProvider,
  detectBrokenPage,
  recordSourceOutcome,
  getSourceReputation,
} from './source-quality'

describe('isParkedDomainProvider', () => {
  it('flags known domain-parking providers', () => {
    expect(isParkedDomainProvider('sedo.com')).toBe(true)
    expect(isParkedDomainProvider('www.hugedomains.com')).toBe(true)
  })

  it('does not flag a normal company domain', () => {
    expect(isParkedDomainProvider('acmecorp.com')).toBe(false)
  })
})

describe('detectBrokenPage', () => {
  const realPage = {
    title: 'Acme Corp — Industrial Solutions',
    text: 'Acme Corp has been manufacturing industrial equipment for over 30 years, serving clients across the region with a wide range of products and services tailored to their needs.',
  }

  it('treats substantial, normal page content as not broken', () => {
    expect(detectBrokenPage(realPage)).toEqual({ isBroken: false })
  })

  it.each([
    ['404 not found', { title: '404 Not Found', text: 'The page you requested could not be found on this server.' }],
    ['domain for sale', { title: 'acmecorp.com', text: 'This domain name is for sale. Buy this domain today!' }],
    ['under construction', { title: 'Welcome', text: 'This website is currently under construction. Please check back soon for updates.' }],
    ['coming soon', { title: 'Coming Soon', text: 'Our new site is coming soon, please check back later for more information.' }],
    ['account suspended', { title: 'Suspended', text: 'This account has been suspended for violating the terms of service agreement.' }],
    ['default web page', { title: 'Welcome', text: 'This is the default web page for this server. The web site administrator has not yet uploaded content.' }],
    ['apache default page', { title: 'Apache2 Ubuntu Default Page', text: "It works! This is the default welcome page used to test the correct operation of the Apache2 server." }],
    ['index of directory listing', { title: 'Index of /', text: 'Index of / Name Last modified Size Description parent directory' }],
    ['site cant be reached', { title: 'Error', text: "This site can't be reached. Check if there is a typo in the address." }],
    ['website unavailable', { title: 'Unavailable', text: 'This website is currently unavailable. Please try again later or contact support.' }],
  ])('flags %s pages as broken', (_label, page) => {
    const result = detectBrokenPage(page)
    expect(result.isBroken).toBe(true)
    expect(result.reason).toBeTruthy()
  })

  it('flags pages with too little collected text, even without a matching pattern', () => {
    const result = detectBrokenPage({ title: 'Acme', text: 'Hi.' })
    expect(result.isBroken).toBe(true)
    expect(result.reason).toMatch(/too thin/)
  })

  it('does not false-positive on a short-ish but legitimate page just over the length floor', () => {
    const page = { title: 'Acme Corp', text: 'Acme Corp is a manufacturer of industrial parts based in Cairo, Egypt.' }
    expect(detectBrokenPage(page)).toEqual({ isBroken: false })
  })
})

describe('recordSourceOutcome / getSourceReputation', () => {
  beforeEach(() => {
    get.mockReset()
    set.mockReset()
  })

  it('starts with a clean, non-suppressed reputation when no data exists', async () => {
    get.mockResolvedValue(null)

    const reputation = await getSourceReputation('newdomain.com')

    expect(reputation).toEqual({ successes: 0, failures: 0, suppressed: false })
  })

  it('accumulates successes and failures across calls', async () => {
    get.mockResolvedValueOnce({ successes: 2, failures: 1 })
    set.mockResolvedValue('OK')

    await recordSourceOutcome('acmecorp.com', 'success')

    expect(set).toHaveBeenCalledWith(
      'research:source-quality:acmecorp.com',
      { successes: 3, failures: 1 },
      expect.objectContaining({ ex: expect.any(Number) })
    )
  })

  it('does not suppress a domain with too few samples even if all failed', async () => {
    get.mockResolvedValue({ successes: 0, failures: 4 })

    const reputation = await getSourceReputation('flaky.com')

    expect(reputation.suppressed).toBe(false)
  })

  it('suppresses a domain with enough samples and a high failure rate', async () => {
    get.mockResolvedValue({ successes: 1, failures: 5 })

    const reputation = await getSourceReputation('badactor.com')

    expect(reputation.suppressed).toBe(true)
  })

  it('does not suppress a domain with enough samples but a low failure rate', async () => {
    get.mockResolvedValue({ successes: 9, failures: 1 })

    const reputation = await getSourceReputation('reliable.com')

    expect(reputation.suppressed).toBe(false)
  })

  it('fails open (never throws) when redis.set rejects', async () => {
    get.mockResolvedValue({ successes: 0, failures: 0 })
    set.mockRejectedValue(new Error('redis unavailable'))

    await expect(recordSourceOutcome('acmecorp.com', 'failure')).resolves.toBeUndefined()
  })

  it('fails open with a non-suppressed default when redis.get rejects', async () => {
    get.mockRejectedValue(new Error('redis unavailable'))

    const reputation = await getSourceReputation('acmecorp.com')

    expect(reputation).toEqual({ successes: 0, failures: 0, suppressed: false })
  })
})
