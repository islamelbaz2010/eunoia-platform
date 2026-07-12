#!/usr/bin/env node
/**
 * check-env.js — Verifies required environment variables are set before the exhibition.
 * Run: node tools/demo/check-env.js
 * Or against production: LOAD_FROM=vercel node tools/demo/check-env.js
 *
 * Does NOT test whether values are valid — only that they are present.
 */

const REQUIRED = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL',                                         impact: 'LOGIN_BROKEN' },
  { name: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',  alt: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', impact: 'LOGIN_BROKEN' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY',                                         impact: 'DEMO_FORM_BROKEN' },
  { name: 'DATABASE_URL',                                                       impact: 'WORKSPACE_INIT_BROKEN' },
  { name: 'DIRECT_URL',                                                         impact: 'PRISMA_MIGRATIONS_BROKEN' },
  { name: 'OPENAI_API_KEY',                                                     impact: 'REAL_ESTATE_TALENT_BROKEN' },
  { name: 'SERPAPI_API_KEY',                                                    impact: 'LEAD_FINDER_BROKEN' },
  { name: 'UPSTASH_REDIS_REST_URL',                                             impact: 'RATE_LIMIT_DISABLED_(fail-open)' },
  { name: 'UPSTASH_REDIS_REST_TOKEN',                                           impact: 'RATE_LIMIT_DISABLED_(fail-open)' },
  { name: 'RESEND_API_KEY',                                                     impact: 'DEMO_EMAIL_NOT_SENT' },
]

const OPTIONAL = [
  { name: 'AI_PROXY_URL',              default: 'https://halannews.com/api-proxy', impact: 'Uses default proxy URL' },
  { name: 'APOLLO_API_KEY',            default: 'none',                            impact: 'Enrichment skipped (no-op)' },
  { name: 'SEARCH_DAILY_QUOTA',        default: '150',                             impact: 'Uses default 150/day global' },
  { name: 'SEARCH_DAILY_QUOTA_PER_USER', default: '30',                            impact: 'Uses default 30/day per user' },
  { name: 'NEXT_PUBLIC_SITE_URL',      default: 'empty string',                   impact: 'Reset-password redirects may be relative' },
]

let pass = 0
let fail = 0

console.log('\n=== EUNOIA PRE-EXHIBITION ENV CHECK ===\n')

console.log('--- REQUIRED ---')
for (const v of REQUIRED) {
  const val = process.env[v.name] ?? (v.alt ? process.env[v.alt] : undefined)
  const label = v.alt ? `${v.name} (or ${v.alt})` : v.name
  if (val) {
    console.log(`  ✓  ${label}`)
    pass++
  } else {
    console.log(`  ✗  ${label}  →  IMPACT: ${v.impact}`)
    fail++
  }
}

console.log('\n--- OPTIONAL ---')
for (const v of OPTIONAL) {
  const val = process.env[v.name]
  if (val) {
    console.log(`  ✓  ${v.name}`)
  } else {
    console.log(`  -  ${v.name}  →  Default: ${v.default}  (${v.impact})`)
  }
}

console.log(`\n=== RESULT: ${pass} required set, ${fail} MISSING ===\n`)
if (fail > 0) {
  console.log('ACTION REQUIRED: Add missing variables to Vercel dashboard before deployment.\n')
  process.exit(1)
} else {
  console.log('All required environment variables are set.\n')
  process.exit(0)
}
