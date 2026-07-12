#!/usr/bin/env node
/**
 * verify-routes.js — Checks that every app page route returns 200 (or a known redirect).
 * Run: node tools/demo/verify-routes.js
 * Override: BASE_URL=https://ai.halannews.com node tools/demo/verify-routes.js
 *
 * Authenticated routes (dashboard) will redirect to /login — that is correct behavior
 * and is flagged as REDIRECT (not a failure).
 */

const BASE = process.env.BASE_URL ?? 'https://ai.halannews.com'
const TIMEOUT_MS = 10_000

const ROUTES = [
  { path: '/',                             label: 'Root',                        expectRedirect: true  },
  { path: '/login',                        label: 'Login',                        expect200: true       },
  { path: '/signup',                       label: 'Sign Up',                      expect200: true       },
  { path: '/demo',                         label: 'Public Demo Form',             expect200: true       },
  { path: '/dashboard',                    label: 'Dashboard (protected)',        expectRedirect: true  },
  { path: '/dashboard/reports',           label: 'Reports (protected)',           expectRedirect: true  },
  { path: '/dashboard/real-estate',       label: 'Real Estate (protected)',       expectRedirect: true  },
  { path: '/dashboard/research',          label: 'Research Hub (protected)',      expectRedirect: true  },
  { path: '/dashboard/research/talent',   label: 'Talent Finder (protected)',    expectRedirect: true  },
  { path: '/dashboard/research/leads',    label: 'Lead Finder (protected)',      expectRedirect: true  },
  { path: '/dashboard/analytics',         label: 'Analytics (protected)',         expectRedirect: true  },
  { path: '/dashboard/settings',          label: 'Settings (protected)',          expectRedirect: true  },
  { path: '/dashboard/onboarding',        label: 'Onboarding (protected)',        expectRedirect: true  },
  { path: '/market-intelligence',         label: 'Market Intelligence (public?)', expect200: true, expectRedirect: true },
]

async function check(route) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const start = Date.now()
  try {
    const res = await fetch(`${BASE}${route.path}`, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
    })
    clearTimeout(timer)
    const elapsed = Date.now() - start
    const is200 = res.status === 200
    const isRedirect = res.status >= 300 && res.status < 400

    let ok = false
    let note = `HTTP ${res.status}`
    if (route.expect200 && is200) { ok = true; note = 'OK (200)' }
    else if (route.expectRedirect && isRedirect) { ok = true; note = `REDIRECT (${res.status} → ${res.headers.get('location') ?? '?'})` }
    else if (route.expect200 && route.expectRedirect && (is200 || isRedirect)) { ok = true }
    else { note = `UNEXPECTED HTTP ${res.status}` }

    return { ok, note, elapsed }
  } catch (err) {
    clearTimeout(timer)
    return { ok: false, note: `NETWORK_ERROR: ${err.message}`, elapsed: Date.now() - start }
  }
}

async function main() {
  console.log(`\n=== EUNOIA ROUTE VERIFICATION — ${BASE} ===\n`)
  let pass = 0; let fail = 0
  for (const route of ROUTES) {
    const r = await check(route)
    const icon = r.ok ? '✓' : '✗'
    console.log(`  ${icon}  [${r.elapsed}ms]  ${route.path.padEnd(38)}  ${route.label}  →  ${r.note}`)
    r.ok ? pass++ : fail++
  }
  console.log(`\n=== RESULT: ${pass} routes OK, ${fail} failed ===\n`)
  if (fail > 0) {
    console.log('Failed routes indicate missing pages or misconfigured middleware.\n')
    process.exit(1)
  } else {
    console.log('All routes are reachable with expected status codes.\n')
    process.exit(0)
  }
}

main()
