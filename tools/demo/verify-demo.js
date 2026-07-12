#!/usr/bin/env node
/**
 * verify-demo.js — End-to-end smoke test of the demo flow.
 * Tests connectivity for every external dependency used during the exhibition.
 * Run: node tools/demo/verify-demo.js
 *
 * Requires environment variables set — run after sourcing .env.local:
 *   source .env.local && node tools/demo/verify-demo.js
 *   OR set them inline:
 *   OPENAI_API_KEY=sk-... SERPAPI_API_KEY=... node tools/demo/verify-demo.js
 */

const TIMEOUT_MS = 15_000

function env(name, fallback) {
  return process.env[name] ?? fallback
}

async function withTimeout(promise, label) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const result = await promise
    clearTimeout(timer)
    return result
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

const checks = []

function check(label, fn) {
  checks.push({ label, fn })
}

// --- Check 1: OpenAI API key reachability ---
check('OpenAI API key (models list)', async () => {
  const key = env('OPENAI_API_KEY', '')
  if (!key) return { ok: false, note: 'OPENAI_API_KEY not set' }
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (res.status === 200) return { ok: true, note: 'API key is valid, models endpoint reachable' }
  if (res.status === 401) return { ok: false, note: 'API key is invalid or revoked' }
  if (res.status === 429) return { ok: false, note: 'Rate limited — quota may be exhausted' }
  return { ok: false, note: `Unexpected status ${res.status}` }
})

// --- Check 2: SerpAPI key reachability ---
check('SerpAPI key (account info)', async () => {
  const key = env('SERPAPI_API_KEY', '')
  if (!key) return { ok: false, note: 'SERPAPI_API_KEY not set' }
  const res = await fetch(`https://serpapi.com/account?api_key=${key}`)
  if (res.status === 200) {
    const data = await res.json()
    const remaining = data?.total_searches_left ?? data?.searches_per_month_used
    return { ok: true, note: `Valid. Searches left: ${data?.total_searches_left ?? 'unknown'}` }
  }
  if (res.status === 401) return { ok: false, note: 'API key is invalid' }
  return { ok: false, note: `Unexpected status ${res.status}` }
})

// --- Check 3: Supabase project reachability ---
check('Supabase project (REST API)', async () => {
  const url = env('NEXT_PUBLIC_SUPABASE_URL', '')
  const key = env('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', env('NEXT_PUBLIC_SUPABASE_ANON_KEY', ''))
  if (!url) return { ok: false, note: 'NEXT_PUBLIC_SUPABASE_URL not set' }
  if (!key) return { ok: false, note: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/ANON_KEY not set' }
  const res = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (res.status === 200 || res.status === 204) return { ok: true, note: 'Supabase project is reachable' }
  return { ok: false, note: `Unexpected status ${res.status} — project may be paused` }
})

// --- Check 4: Upstash Redis reachability ---
check('Upstash Redis (PING)', async () => {
  const url = env('UPSTASH_REDIS_REST_URL', '')
  const token = env('UPSTASH_REDIS_REST_TOKEN', '')
  if (!url || !token) return { ok: false, note: 'UPSTASH_REDIS_REST_URL or TOKEN not set — rate limiting disabled (fail-open, not a blocker)' }
  const res = await fetch(`${url}/ping`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 200) {
    const data = await res.json()
    if (data?.result === 'PONG') return { ok: true, note: 'Redis is healthy' }
    return { ok: true, note: `Reachable, response: ${JSON.stringify(data)}` }
  }
  return { ok: false, note: `Unexpected status ${res.status} — rate limiting will fail-open` }
})

// --- Check 5: Resend API key ---
check('Resend API (domains list)', async () => {
  const key = env('RESEND_API_KEY', '')
  if (!key) return { ok: false, note: 'RESEND_API_KEY not set — demo form emails will not be sent' }
  const res = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (res.status === 200) {
    const data = await res.json()
    const domains = (data?.data ?? []).map(d => d.name).join(', ')
    return { ok: true, note: `API key valid. Domains: ${domains || 'none'}` }
  }
  if (res.status === 401) return { ok: false, note: 'API key is invalid' }
  return { ok: false, note: `Unexpected status ${res.status}` }
})

// --- Check 6: AI Proxy (halannews.com) reachability ---
check('AI Proxy (halannews.com ping)', async () => {
  const proxyUrl = env('AI_PROXY_URL', 'https://halannews.com/api-proxy')
  try {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-opus-4-8', max_tokens: 1, messages: [{ role: 'user', content: 'ping' }] }),
    })
    if (res.status === 200) return { ok: true, note: `Proxy at ${proxyUrl} is reachable` }
    if (res.status === 401 || res.status === 403) return { ok: false, note: `Proxy returned ${res.status} — authentication may be required` }
    return { ok: true, note: `Proxy reachable, HTTP ${res.status} (partial response ok for ping)` }
  } catch (err) {
    return { ok: false, note: `Proxy unreachable: ${err.message} — /demo page will fail; main product unaffected` }
  }
})

async function main() {
  console.log('\n=== EUNOIA DEMO CONNECTIVITY VERIFICATION ===\n')
  let pass = 0; let fail = 0
  for (const { label, fn } of checks) {
    let r
    try {
      r = await withTimeout(fn(), label)
    } catch (err) {
      r = { ok: false, note: `Exception: ${err.message}` }
    }
    const icon = r.ok ? '✓' : '✗'
    console.log(`  ${icon}  ${label}`)
    console.log(`       ${r.note}\n`)
    r.ok ? pass++ : fail++
  }
  console.log(`=== RESULT: ${pass} passed, ${fail} need attention ===\n`)
  if (fail > 0) {
    console.log('Review failing checks before the exhibition. Some failures (Redis, AI Proxy) are non-blocking.\n')
  } else {
    console.log('All external dependencies are reachable. Demo environment is healthy.\n')
  }
}

main()
