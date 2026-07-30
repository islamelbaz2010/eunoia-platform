# Production Checklist

**Date:** 2026-07-21  
**Owner:** Technical Lead  
**Purpose:** Complete readiness gate before the platform accepts its first paying customer. Every item must be checked and confirmed. No items may be deferred beyond MVP Gate.

---

## How to Use

1. Work through each section in order — sections have dependencies
2. Mark each item: ✅ COMPLETE | ⚠️ PARTIAL | ❌ MISSING | N/A (with reason)
3. Do not proceed to the next section until all items in the current section are complete
4. Re-run this checklist after every major sprint

**Current status as of 2026-07-21:** All items are ❌ MISSING or ⚠️ PARTIAL due to Supabase deletion.

---

## Section 1: Infrastructure

| # | Check | Status | Notes |
|---|---|---|---|
| 1.1 | Supabase project active and accessible | ❌ MISSING | Project deleted; recreate |
| 1.2 | Production URL resolves: `intelligence.eunoiazones.com` | ❌ MISSING | DNS returns NXDOMAIN |
| 1.3 | SSL/TLS certificate valid on production domain | ❌ MISSING | Blocked by DNS |
| 1.4 | Vercel project linked to correct GitHub repo | ⚠️ PARTIAL | Linked; env vars stale |
| 1.5 | Vercel `main` branch auto-deploys on push | ⚠️ PARTIAL | Configured; blocked by env vars |
| 1.6 | All 6 SQL migrations applied to Supabase | ❌ MISSING | Project deleted |
| 1.7 | Row Level Security enabled on all 6 tables | ❌ MISSING | Project deleted |
| 1.8 | Point-in-Time Recovery (PITR) enabled in Supabase | ❌ MISSING | Not confirmed previously |
| 1.9 | Supabase automatic backups retention period set | ❌ MISSING | Not confirmed |
| 1.10 | Upstash Redis instance active | ⚠️ PARTIAL | Unknown status; env vars unset |

---

## Section 2: Environment Variables (Vercel Production)

| # | Variable | Status | Sensitive? |
|---|---|---|---|
| 2.1 | `NEXT_PUBLIC_SUPABASE_URL` | ❌ MISSING | No |
| 2.2 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ❌ MISSING | No |
| 2.3 | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ❌ MISSING | No |
| 2.4 | `SUPABASE_SERVICE_ROLE_KEY` | ❌ MISSING | YES — server only |
| 2.5 | `DATABASE_URL` (for Prisma) | ❌ MISSING | YES |
| 2.6 | `OPENAI_API_KEY` | ❌ MISSING | YES |
| 2.7 | `SERPAPI_API_KEY` | ❌ MISSING | YES |
| 2.8 | `UPSTASH_REDIS_REST_URL` | ❌ MISSING | YES |
| 2.9 | `UPSTASH_REDIS_REST_TOKEN` | ❌ MISSING | YES |
| 2.10 | `CLOUDFLARE_WORKER_URL` | ❌ MISSING | No |
| 2.11 | `AI_PROXY_URL` | ❌ MISSING | No |
| 2.12 | `SEARCH_DAILY_QUOTA` | ❌ MISSING | No (default: 150) |
| 2.13 | `SEARCH_DAILY_QUOTA_PER_USER` | ❌ MISSING | No (default: 30) |
| 2.14 | `ADMIN_EMAILS` | ❌ MISSING | No |
| 2.15 | `RESEND_API_KEY` | ❌ MISSING | YES |
| 2.16 | `APOLLO_API_KEY` | N/A | Optional — enrichment works without it |

**Rule:** `SUPABASE_SERVICE_ROLE_KEY` must NEVER be in any `NEXT_PUBLIC_*` variable. Verify by checking Vercel env var list.

---

## Section 3: Authentication

| # | Check | Status |
|---|---|---|
| 3.1 | Login page loads and accepts credentials | ❌ MISSING (Supabase down) |
| 3.2 | Signup creates account and sends verification email | ❌ MISSING |
| 3.3 | Email verification link works | ❌ MISSING |
| 3.4 | Password reset flow works | ❌ MISSING |
| 3.5 | Onboarding creates Prisma User + Workspace | ❌ MISSING |
| 3.6 | After onboarding, user reaches dashboard | ❌ MISSING |
| 3.7 | `app/auth/callback/route.ts` handles Supabase redirect correctly | ⚠️ PARTIAL (code exists, untested) |
| 3.8 | Root `middleware.ts` exists and redirects unauthenticated users | ❌ MISSING (proxy.ts is dead code) |
| 3.9 | Session refresh occurs on every request via middleware | ❌ MISSING |
| 3.10 | Logout clears session and redirects to login | ❌ MISSING |

---

## Section 4: Core Functionality

| # | Check | Status |
|---|---|---|
| 4.1 | Real Estate Intelligence returns a result | ❌ MISSING (Supabase + OpenAI down) |
| 4.2 | Real Estate returns a Decision Report (DI integrated) | ❌ MISSING (not implemented) |
| 4.3 | Lead Finder returns search results | ❌ MISSING |
| 4.4 | Talent Finder returns search results | ❌ MISSING |
| 4.5 | Report History shows past reports | ❌ MISSING |
| 4.6 | Report export (CSV) works | ❌ MISSING |
| 4.7 | Dashboard shows usage statistics | ❌ MISSING |
| 4.8 | Dashboard shows quota remaining with correct tier limits | ❌ MISSING |

---

## Section 5: Plan Enforcement + Rate Limiting

| # | Check | Status |
|---|---|---|
| 5.1 | STARTER plan limited to 20 reports/month | ❌ MISSING (Supabase down) |
| 5.2 | PROFESSIONAL plan limited to 100 reports/month | ❌ MISSING |
| 5.3 | AGENCY plan limited to 300 reports/month | ❌ MISSING |
| 5.4 | ENTERPRISE plan has no limit | ❌ MISSING |
| 5.5 | Exceeding plan limit returns 402 with upgrade CTA | ❌ MISSING |
| 5.6 | Rate limiting: 5 requests/hour per user | ❌ MISSING (Redis unset) |
| 5.7 | Rate limiting returns 429 when exceeded | ❌ MISSING |
| 5.8 | SerpAPI global quota (150/day) enforced | ❌ MISSING |
| 5.9 | SerpAPI per-user quota (30/day) enforced | ❌ MISSING |
| 5.10 | `/api/intelligence` enforces plan limit (currently missing) | ❌ MISSING |

---

## Section 6: Billing

| # | Check | Status |
|---|---|---|
| 6.1 | Pricing page exists at `/pricing` | ❌ MISSING |
| 6.2 | Stripe (or chosen provider) account active | ❌ MISSING |
| 6.3 | Checkout session API route implemented | ❌ MISSING |
| 6.4 | Webhook handler implemented with signature verification | ❌ MISSING |
| 6.5 | Successful payment writes to `user_plans` table | ❌ MISSING |
| 6.6 | Plan limits update within one API request after payment | ❌ MISSING |
| 6.7 | Settings page shows current plan + billing management | ❌ MISSING |
| 6.8 | End-to-end checkout test completed (test mode) | ❌ MISSING |

---

## Section 7: Security

| # | Check | Status |
|---|---|---|
| 7.1 | `SUPABASE_SERVICE_ROLE_KEY` absent from client bundle | ⚠️ CANNOT VERIFY (build not checked) |
| 7.2 | `GET /api/debug-env` returns 404 (never exposes env vars) | ✅ CONFIRMED (code verified) |
| 7.3 | Admin routes require admin identity check | ✅ CONFIRMED (code verified) |
| 7.4 | All Supabase tables have RLS enabled | ❌ MISSING (project deleted) |
| 7.5 | Root middleware redirects unauthenticated users | ❌ MISSING |
| 7.6 | No API keys in `git log` or `.next/static/` | ⚠️ UNVERIFIED |
| 7.7 | Rate limiting active on all research endpoints | ❌ MISSING (Redis unset) |
| 7.8 | No raw error messages exposed to users | ✅ CONFIRMED (error boundary in place) |
| 7.9 | Account deletion cascades: removes auth.users → all app data | ✅ CONFIRMED (code verified) |

---

## Section 8: Email

| # | Check | Status |
|---|---|---|
| 8.1 | `RESEND_API_KEY` set and valid | ❌ MISSING (currently empty string) |
| 8.2 | Resend sender domain verified | ❌ MISSING |
| 8.3 | Demo lead capture email sends on form submission | ❌ MISSING |
| 8.4 | Welcome email sends on new user signup | N/A (not built — post-MVP) |
| 8.5 | Quota warning email at 80% usage | N/A (not built — post-MVP) |

---

## Section 9: Legal and Privacy

| # | Check | Status |
|---|---|---|
| 9.1 | Privacy Policy at `/privacy` — non-placeholder, reviewed content | ❌ MISSING (placeholder) |
| 9.2 | Terms of Service at `/terms` — non-placeholder, reviewed content | ❌ MISSING (placeholder) |
| 9.3 | Privacy Policy linked from signup and login pages | ❌ MISSING |
| 9.4 | Terms of Service linked from signup and login pages | ❌ MISSING |
| 9.5 | Account deletion removes all user data (GDPR Article 17) | ✅ CONFIRMED (code verified) |
| 9.6 | Data export available to user (GDPR Article 20) | ✅ CONFIRMED (export route exists) |

---

## Section 10: Monitoring and Observability

| # | Check | Status |
|---|---|---|
| 10.1 | `GET /api/health` returns 200 | ❌ MISSING (platform down) |
| 10.2 | APM provider configured and capturing errors | ❌ MISSING (not built — post-MVP) |
| 10.3 | Uptime monitor active for production URL | ❌ MISSING |
| 10.4 | Alert configured for error rate spike | ❌ MISSING |
| 10.5 | Vercel function logs accessible and readable | ⚠️ PARTIAL (logs exist but not structured) |

**Note:** Items 10.2–10.4 are post-MVP (Sprint 9). However, 10.1 must be green before MVP Gate.

---

## Section 11: Performance and Scale Readiness

| # | Check | Status |
|---|---|---|
| 11.1 | `next build` succeeds with no warnings | ✅ CONFIRMED (build passes) |
| 11.2 | TypeScript compiles with zero errors (`tsc --noEmit`) | ✅ CONFIRMED |
| 11.3 | All tests pass (`npx vitest run`) | ✅ CONFIRMED (194 tests) |
| 11.4 | No obvious N+1 query patterns in API routes | ⚠️ UNVERIFIED |
| 11.5 | Load test: platform handles 10 concurrent research requests | ❌ NOT DONE (post-MVP) |
| 11.6 | Vercel cold start time acceptable (<3s for API routes) | ⚠️ UNVERIFIED |

---

## Section 12: Disaster Recovery

| # | Check | Status |
|---|---|---|
| 12.1 | Supabase PITR enabled | ❌ MISSING |
| 12.2 | Manual backup procedure documented | ❌ MISSING |
| 12.3 | Rollback procedure documented (Vercel previous deployment) | ⚠️ PARTIAL (Vercel has rollback UI) |
| 12.4 | Incident response procedure: if Supabase deleted again | ❌ MISSING (no documented procedure) |
| 12.5 | All env vars stored in a secure location outside Vercel | ❌ UNVERIFIED |

**Note for Section 12.4:** The current crisis (Supabase deleted, DNS NXDOMAIN, all user data lost) must drive creation of a documented incident response procedure before MVP.

---

## MVP Gate Summary

**Items required for MVP Gate (may not be deferred):**

Sections 1–9 must be COMPLETE before MVP Gate.  
Sections 10–12: items 10.1, 11.1–11.3 must be COMPLETE. Remaining items are post-MVP.

**Current MVP Gate Status:** BLOCKED — Sections 1–9 are mostly ❌ MISSING.

---

*This checklist must be re-verified in full before each production deployment milestone.*
