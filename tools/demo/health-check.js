#!/usr/bin/env node
/**
 * health-check.js — Pings production API endpoints to confirm they are reachable.
 * Run: node tools/demo/health-check.js
 * Override base URL: BASE_URL=https://ai.halannews.com node tools/demo/health-check.js
 *
 * Tests only public/unauthenticated endpoints — authenticated routes require a session token.
 */

const BASE = process.env.BASE_URL ?? 'https://ai.halannews.com'
const TIMEOUT_MS = 10_000

const ENDPOINTS = [
  {
    name: 'Login page (HTML)',
    url: `${BASE}/login`,
    method: 'GET',
    expectStatus: 200,
    description: 'Supabase auth is wired',
  },
  {
    name: 'Demo page (HTML)',
    url: `${BASE}/demo`,
    method: 'GET',
    expectStatus: 200,
    description: 'Public lead capture form',
  },
  {
    name: 'Auth callback route (GET)',
    url: `${BASE}/auth/callback`,
    method: 'GET',
    expectStatus: [302, 307, 200],
    description: 'Supabase OAuth callback route exists',
  },
  {
    name: 'Debug-env guard (must return 404)',
    url: `${BASE}/api/debug-env`,
    method: 'GET',
    expectStatus: 404,
    description: 'Sensitive env endpoint is blocked',
  },
  {
    name: 'Demo API route (POST — empty body)',
    url: `${BASE}/api/demo`,
    method: 'POST',
    body: '{}',
    expectStatus: 400,
    description: 'Route exists; 400 = validation working',
  },
  {
    name: 'Demo generate route (POST — empty body)',
    url: `${BASE}/api/demo/generate`,
    method: 'POST',
    body: '{}',
    expectStatus: [400, 429],
    description: 'Route exists; 400 = validation, 429 = rate limit',
  },
  {
    name: 'Intelligence API (POST — no auth)',
    url: `${BASE}/api/intelligence`,
    method: 'POST',
    body: '{}',
    expectStatus: [400, 401, 403, 422],
    description: 'Route exists; auth check or validation working',
  },
]

async function ping(endpoint) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const start = Date.now()
  try {
    const opts = {
      method: endpoint.method,
      signal: controller.signal,
      headers: endpoint.body ? { 'Content-Type': 'application/json' } : {},
    }
    if (endpoint.body) opts.body = endpoint.body
    const res = await fetch(endpoint.url, opts)
    const elapsed = Date.now() - start
    clearTimeout(timer)
    const expected = Array.isArray(endpoint.expectStatus) ? endpoint.expectStatus : [endpoint.expectStatus]
    const ok = expected.includes(res.status)
    return { ok, status: res.status, elapsed }
  } catch (err) {
    clearTimeout(timer)
    return { ok: false, status: 'NETWORK_ERROR', elapsed: Date.now() - start, error: err.message }
  }
}

async function main() {
  console.log(`\n=== EUNOIA HEALTH CHECK — ${BASE} ===\n`)
  let pass = 0; let fail = 0
  for (const ep of ENDPOINTS) {
    const r = await ping(ep)
    const icon = r.ok ? '✓' : '✗'
    const detail = r.error ? `${r.status} (${r.error})` : `HTTP ${r.status}`
    console.log(`  ${icon}  [${r.elapsed}ms]  ${ep.name}  →  ${detail}`)
    if (!r.ok) console.log(`       Expected: ${JSON.stringify(ep.expectStatus)}  |  ${ep.description}`)
    r.ok ? pass++ : fail++
  }
  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===\n`)
  if (fail > 0) {
    console.log('Investigate failed endpoints before the exhibition.\n')
    process.exit(1)
  } else {
    console.log('All endpoints reachable. Production is healthy.\n')
    process.exit(0)
  }
}

main()
