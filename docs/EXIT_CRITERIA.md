# Exit Criteria

**Date:** 2026-07-21  
**Owner:** Technical Lead  
**Purpose:** Definition of Done for every sprint. A sprint is complete only when ALL criteria in its section are met. No partial completion. No exceptions without ADR.

---

## How to Use This Document

1. Before starting a sprint: read its Exit Criteria. If any criterion cannot be met with the available work, the sprint is not ready to begin.
2. Before declaring a sprint complete: verify every criterion. Record the verification result in `.ai/CURRENT/SPRINT_MEMORY.md`.
3. If any criterion fails: the sprint is NOT complete. Document the failure, resolve the issue, and re-verify.

---

## Global Exit Criteria (All Sprints)

Every sprint, regardless of type, must satisfy all of the following before completion:

| Criterion | Verification |
|---|---|
| TypeScript compiles with zero errors | `npx tsc --noEmit` passes |
| All 194+ tests pass | `npx vitest run` — all tests pass, no test skipped without reason |
| ESLint passes | `npx eslint .` passes |
| No secrets committed | `git diff HEAD` contains no API keys, service role keys, or connection strings |
| Sprint Memory appended | Session record added to `.ai/CURRENT/SPRINT_MEMORY.md` |
| Task Queue updated | `.ai/CURRENT/TASK_QUEUE.md` reflects new next actions |
| Execution Master updated | `docs/PROJECT_EXECUTION_MASTER.md` status table updated if any module changed |

---

## Sprint 1: Infrastructure Recovery

### Exit Criteria

| # | Criterion | Verification |
|---|---|---|
| 1.1 | Supabase project exists and is active | Supabase dashboard shows project; DNS resolves |
| 1.2 | All 6 SQL migrations applied | Supabase table editor shows: reports, research_requests, user_plans, demo_leads, audit_log, usage_tracking |
| 1.3 | Row Level Security enabled on all 6 tables | `SELECT * FROM information_schema.tables WHERE table_schema = 'public'` + RLS check |
| 1.4 | Supabase type file generated | `types/supabase.types.ts` is not a stub; contains real table type definitions |
| 1.5 | `NEXT_PUBLIC_SUPABASE_URL` set in Vercel (production) | Vercel dashboard env vars; value is not empty |
| 1.6 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in Vercel | Same check |
| 1.7 | `SUPABASE_SERVICE_ROLE_KEY` set in Vercel | Same check; confirm NOT in any `NEXT_PUBLIC_*` var |
| 1.8 | `OPENAI_API_KEY` set in Vercel | Same check |
| 1.9 | `SERPAPI_API_KEY` set in Vercel | Same check |
| 1.10 | `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` set | Same check |
| 1.11 | `ADMIN_EMAILS` set in Vercel | Same check; at least one email |
| 1.12 | Vercel redeployment succeeded | Vercel dashboard shows successful deployment |
| 1.13 | `GET /api/health` returns 200 on production domain | `curl https://intelligence.eunoiazones.com/api/health` returns `{ "ok": true }` |
| 1.14 | New account creation works end-to-end | Manual test: sign up → verify email → complete onboarding → reach dashboard |
| 1.15 | `supabase as any` casts removed from research routes | `grep -r "supabase as any" app/api/` returns no results |

---

## Sprint 2: Knowledge Base Repair

### Exit Criteria

| # | Criterion | Verification |
|---|---|---|
| 2.1 | `MASTER_PROJECT_MEMORY.md` no longer says "Pre-Implementation" for Decision Intelligence | `grep "Pre-Implementation" .ai/CURRENT/MASTER_PROJECT_MEMORY.md` returns no results |
| 2.2 | `MASTER_PROJECT_MEMORY.md` states DI is "Library: COMPLETE" | `grep "COMPLETE" .ai/CURRENT/MASTER_PROJECT_MEMORY.md` returns relevant line |
| 2.3 | `CURRENT_SYSTEM_MAP.md` has SUPERSEDED header | First line of file contains "SUPERSEDED" |
| 2.4 | `CURRENT_SYSTEM_MAP.md` no longer claims no test framework | `grep "no test framework" .ai/CURRENT/CURRENT_SYSTEM_MAP.md` returns no results |
| 2.5 | `README.md` production URL is correct | `grep "intelligence.eunoiazones.com" README.md` returns a result |
| 2.6 | `PROJECT_CONTEXT.md` production URL is correct | Same check |
| 2.7 | `PROJECT_CONTEXT.md` lists `AI_PROXY_URL` in env var table | `grep "AI_PROXY_URL" .ai/CURRENT/PROJECT_CONTEXT.md` returns a result |
| 2.8 | A simulated new session reading all CURRENT docs would know DI is built | Manual review: read all CURRENT docs and confirm no critical misinformation |

---

## Sprint 3: Root Middleware + Security Baseline

### Exit Criteria

| # | Criterion | Verification |
|---|---|---|
| 3.1 | `proxy.ts` no longer exists at repository root | `ls proxy.ts` returns "No such file" |
| 3.2 | `middleware.ts` exists at repository root | `ls middleware.ts` returns the file |
| 3.3 | `middleware.ts` exports a function named `middleware` | `grep "export.*function middleware\|export.*middleware" middleware.ts` returns a result |
| 3.4 | `middleware.ts` has valid `config.matcher` | `grep "config" middleware.ts` shows matcher covering `/dashboard`, `/settings`, `/reports`, `/leads`, `/talent`, `/intelligence` |
| 3.5 | Unauthenticated request to `/dashboard` redirects to `/login` | Manual test (or curl -L): returns 302 → `/login` |
| 3.6 | Authenticated session is refreshed on request | Supabase auth logs show token refresh activity |
| 3.7 | `SUPABASE_SERVICE_ROLE_KEY` is absent from client bundle | `grep -r "SUPABASE_SERVICE_ROLE_KEY" .next/static/` returns no results |

---

## Sprint 4: Decision Intelligence Integration (Real Estate)

### Exit Criteria

| # | Criterion | Verification |
|---|---|---|
| 4.1 | `supabase/migrations/007_decisions_table.sql` exists and is applied | File exists; `decisions` table visible in Supabase dashboard |
| 4.2 | `decisions` table has RLS enforced | `auth.uid() = user_id` policy verified in Supabase dashboard |
| 4.3 | Business rules file exists for Real Estate | `lib/decision-intelligence/rules/real-estate.ts` exists |
| 4.4 | At least 3 business rules defined for Real Estate | File contains at least 3 `BusinessRule` objects |
| 4.5 | Data adapter exists | Adapter file exists; converts legacy engine output to `DecisionEngineInput` type |
| 4.6 | `runDecisionEngine()` is called inside `/api/intelligence` route | `grep "runDecisionEngine" app/api/intelligence/route.ts` returns a result |
| 4.7 | `DecisionReportCard` component exists | Component file exists in `components/` |
| 4.8 | Decision output is persisted to `decisions` table | Run a Real Estate request; check Supabase dashboard for new row in `decisions` |
| 4.9 | Manual test: Real Estate request produces a Decision Report | Report shows: recommendation, confidence score with band label, evidence list, at least one rule result, explainability text |
| 4.10 | AI narration layer calls GPT-4o-mini post-scoring | Network inspection or log shows OpenAI call after score calculation |
| 4.11 | All existing tests still pass | `npx vitest run` — 194+ tests pass |
| 4.12 | New tests cover the data adapter and business rules | At least one test file for `real-estate.ts` rules; at least one for the adapter |

---

## Sprint 5: Plan Enforcement Completion

### Exit Criteria

| # | Criterion | Verification |
|---|---|---|
| 5.1 | `/api/intelligence` calls `checkPlanLimit()` | `grep "checkPlanLimit" app/api/intelligence/route.ts` returns result |
| 5.2 | `/api/intelligence` returns 402 when plan limit exceeded | Manual test: STARTER user makes 21+ requests; 21st returns 402 |
| 5.3 | UI shows upgrade CTA when 402 received from intelligence route | Manual test: run above test; UI shows upgrade prompt |
| 5.4 | Rate limiting enforced on `/api/intelligence` | Make 6 rapid requests; 6th returns 429 |
| 5.5 | `usage_tracking` insert exists in intelligence route | Check Supabase dashboard `usage_tracking` table after a Real Estate request |

---

## Sprint 6: Billing Integration

### Exit Criteria

| # | Criterion | Verification |
|---|---|---|
| 6.1 | `/pricing` page exists | `curl https://intelligence.eunoiazones.com/pricing` returns 200 |
| 6.2 | Pricing page shows all three paid plans with prices | Manual review: PROFESSIONAL, AGENCY, ENTERPRISE visible with prices |
| 6.3 | Checkout session route exists | `app/api/billing/checkout/route.ts` exists |
| 6.4 | Webhook handler exists | `app/api/billing/webhook/route.ts` exists |
| 6.5 | Webhook signature verification is implemented | Code review: Stripe signature check present in webhook handler |
| 6.6 | End-to-end test (Stripe test mode): complete checkout → user_plans updated | Manual test: checkout → check Supabase `user_plans` → confirm new plan and reset date |
| 6.7 | New plan limits apply within one request after payment | After checkout completes, run an API request and confirm new limits |
| 6.8 | Settings page shows current plan and billing management | `app/(app)/settings/` page shows plan name and "Manage Plan" option |

---

## Sprint 7: Legal + Compliance

### Exit Criteria

| # | Criterion | Verification |
|---|---|---|
| 7.1 | `/privacy` contains reviewed, non-placeholder content | Manual review: no "[PLACEHOLDER]" text; content covers: data collection, storage, retention, user rights |
| 7.2 | `/terms` contains reviewed, non-placeholder content | Manual review: no "[PLACEHOLDER]" text; content covers: acceptable use, payment, termination |
| 7.3 | Both pages are linked from signup page | `grep -r "privacy\|terms" app/(auth)/signup/` returns results |
| 7.4 | Both pages are linked from footer | Footer component links to `/privacy` and `/terms` |

---

## MVP Gate

**All Exit Criteria for Sprints 1–7 must be FULLY met.** Then run the MVP Acceptance Criteria from `docs/MVP_DEFINITION.md` in order. All 11 acceptance steps must pass without error.

If any acceptance step fails: identify the broken sprint, re-run that sprint's Exit Criteria, fix the failure, and repeat the full MVP Acceptance Criteria run.

---

## Sprint 8: DI Integration (Lead Finder + Talent Finder)

Same pattern as Sprint 4 criteria, applied twice:
- Criteria 4.3 through 4.12 for Lead Finder (using `lib/decision-intelligence/rules/leads.ts`)
- Criteria 4.3 through 4.12 for Talent Finder (using `lib/decision-intelligence/rules/talent.ts`)
- All three modules (Real Estate, Leads, Talent) return Decision Reports

---

## Sprint 9: Observability + Monitoring

| # | Criterion | Verification |
|---|---|---|
| 9.1 | APM provider installed and capturing errors | Throw a deliberate error; confirm it appears in APM dashboard |
| 9.2 | Uptime monitor active for production URL | Monitor dashboard shows check history for `intelligence.eunoiazones.com` |
| 9.3 | Structured logging in all 3 DI API routes | Log output shows JSON-structured entries with request ID, user ID (hashed), status |
| 9.4 | Alert configured for error rate spike | Alert rule visible in APM provider; tested with deliberate error burst |

---

## Sprint 10: Legacy AI Engine Migration

| # | Criterion | Verification |
|---|---|---|
| 10.1 | All 35 legacy report types handled by DI pattern | `services/legacy-ai-engine/` directory contains no active route callers |
| 10.2 | Legacy engine is explicitly deprecated | `services/legacy-ai-engine/README.md` or `DEPRECATED` file added |
| 10.3 | No live route still calls `services/legacy-ai-engine/orchestrator.ts` | `grep -r "legacy-ai-engine" app/api/` returns no results |
| 10.4 | All existing tests still pass | `npx vitest run` — 194+ tests pass |

---

## Sprint 11: Email Notifications

| # | Criterion | Verification |
|---|---|---|
| 11.1 | `RESEND_API_KEY` is set in Vercel production | Vercel env var dashboard |
| 11.2 | Resend sender domain is verified | Resend dashboard → Domains → Verified |
| 11.3 | Welcome email sent on new signup | Manual test: create account → check email inbox |
| 11.4 | Quota warning email sent at 80% usage | Manual test: hit 80% of STARTER limit → check inbox |
| 11.5 | Plan upgrade confirmation email sent | Manual test: complete Stripe checkout → check inbox |

---

## Documentation Sprint Exit Criteria

All documentation-only sprints (Canonicalization Sprint, Executive Documentation Sprint) must meet:

| # | Criterion | Verification |
|---|---|---|
| D.1 | All promised documents are written | File exists at declared path with non-empty content |
| D.2 | No production code was modified | `git diff --stat HEAD` shows only files in `docs/`, `.ai/`, `README.md` |
| D.3 | Every factual claim is verified from repository or existing documents | Source referenced in document or verifiable by grep/read |
| D.4 | No hallucinated claims | Cross-check with actual file contents using Read tool |
| D.5 | Sprint Memory appended | Session record in `.ai/CURRENT/SPRINT_MEMORY.md` |

---

*Exit Criteria are mandatory. No sprint is complete until all criteria are met.*
