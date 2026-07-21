# 04 — Roadmap

**Evidence basis:** Feature gaps identified from source code + business requirements inferred from plan structure and product positioning.

---

## Priority Classification

- **P0 — Blocker:** Must fix before charging any customer.
- **P1 — Critical:** Must ship in first month of paid operation.
- **P2 — High:** Ships in quarter 1.
- **P3 — Desired:** Quarter 2–3.

---

## P0 — Pre-Revenue Blockers (Week 1–2)

### P0-1: Fix environment variable name mismatch
**Problem:** `lib/supabase/server.ts` and `lib/supabase/middleware.ts` reference `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Both `.env.example` and `.env.local.example` define `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If production Vercel env doesn't have the publishable key name, every server Supabase call silently uses `undefined` as the API key.  
**Effort:** 30 minutes — update env examples to match code or rename the variable in code.

### P0-2: Remove `/api/debug-env` route
**Problem:** Public API route exists at this path. Even a 1-line empty file registers a Next.js route.  
**Effort:** Delete `app/api/debug-env/route.ts`. 5 minutes.

### P0-3: Remove production console.log statements
**Problem:** `app/api/research/leads/route.ts` lines 1–3 emit `SERPAPI` and `OPENAI` key presence to Vercel log stream.  
**Effort:** Delete 3 lines. 5 minutes.

### P0-4: Clean up root directory
**Problem:** `api.php`, `auth.php`, `config.example.php`, `test.php`, `text.txt`–`text 6.txt`, `users.json`, `feasibility.html`, `index.html`, `eunoia-worker.js`, and 20+ markdown docs at root are noise and could expose architectural decisions or credentials to anyone with repo access.  
**Effort:** 1 hour — move docs to `/docs`, delete non-source files.

---

## P1 — Critical for First Paying Customer (Week 2–6)

### P1-1: Billing Integration
**Problem:** Zero revenue path exists. Plans are assigned manually via Supabase service role.  
**Scope:** Stripe/Paddle checkout, subscription webhooks, auto-plan-assignment on `customer.subscription.updated`, billing portal.  
**Effort:** 3–4 weeks.

### P1-2: Plan Upgrade UI
**Problem:** Users who hit a plan limit see an error message with no call-to-action.  
**Scope:** Upgrade modal, pricing page, redirect to billing portal.  
**Effort:** 1 week (after billing backend exists).

### P1-3: Onboarding Flow
**Problem:** New users land on `/dashboard` with zero guidance. `app/dashboard/onboarding/page.tsx` exists but has no content.  
**Scope:** Step-by-step first-report walkthrough, plan selection, workspace naming.  
**Effort:** 1 week.

### P1-4: Welcome Email + Plan Limit Alert
**Problem:** Resend is a declared dependency but zero emails are sent.  
**Scope:** Welcome email on signup, monthly limit warning at 80%, limit-reached email.  
**Effort:** 1 week.

### P1-5: Update Supabase TypeScript Types
**Problem:** `types/supabase.types.ts` does not cover `research_requests`, `user_plans`, or `reports` — causing all active research routes to cast `supabase as any` for those tables.  
**Scope:** Run `supabase gen types typescript` and remove all `as any` casts.  
**Effort:** 2 days.

---

## P2 — High Priority (Month 1–3)

### P2-1: Lead Finder — Real Contact Enrichment
**Problem:** Lead Finder returns company names and LinkedIn search URLs but no direct contacts.  
**Scope:** Apollo.io org-level data surfacing (headcount, industry, LinkedIn URL); per-person enrichment if budget allows.  
**Effort:** 2–3 weeks.

### P2-2: Settings Page
**Problem:** Empty placeholder.  
**Scope:** Profile edit, password change, current plan display, usage meter, team management.  
**Effort:** 2 weeks.

### P2-3: Talent Finder — Real Data Source
**Problem:** Salary and demand data are GPT-generated estimates with no grounding.  
**Scope:** Integrate a real job posting API (Wuzzuf Egypt API, or LinkedIn Partner API) to ground salary estimates.  
**Effort:** 3–4 weeks.

### P2-4: Server-Side PDF Generation
**Problem:** Current PDF export is browser print — headers/footers not controlled, no logo, page breaks unreliable.  
**Scope:** Puppeteer or `@react-pdf/renderer` serverless function.  
**Effort:** 1–2 weeks.

### P2-5: Analytics Dashboard
**Problem:** Empty placeholder.  
**Scope:** User-facing: reports generated this month, average confidence, most-used module. Admin-facing: total users, DAU/MAU, revenue.  
**Effort:** 2–3 weeks.

### P2-6: Staging Environment
**Problem:** No staging — every commit goes directly to production.  
**Scope:** Vercel preview deployments (auto-configured) + dedicated staging Supabase project.  
**Effort:** 1 day setup.

### P2-7: CI Pipeline
**Problem:** No automated checks before deploy.  
**Scope:** GitHub Actions: `tsc --noEmit`, `vitest run`, `eslint`, build check on PR.  
**Effort:** 2 days.

---

## P3 — Desired (Quarter 2–3)

### P3-1: Workspace / Team Management
**Problem:** Prisma has a `Workspace` model with `users[]` relationship but zero UI for inviting or managing team members.  
**Effort:** 3–4 weeks.

### P3-2: Report Sharing / Collaboration
**Problem:** Reports are user-private; no sharing link or export-to-client feature.  
**Effort:** 2 weeks.

### P3-3: Market Intelligence Dashboard
**Problem:** `/dashboard/analytics` and `/app/market-intelligence` are placeholder pages.  
**Effort:** 4–6 weeks (data sourcing is the hard part).

### P3-4: Annual Benchmark Update Workflow
**Problem:** Egypt real estate benchmarks are hard-coded for 2026 (e.g. `app/api/intelligence/route.ts:8–46`). They will be stale in 2027.  
**Effort:** 1 week to externalize to database; then annual update workflow.

### P3-5: Arabic Localization Completion
**Problem:** `next-intl` is configured (`next.config.ts:4`) and `i18n/request.ts` exists, but the actual translation message files and locale routing are incomplete.  
**Effort:** 2–3 weeks.

### P3-6: Retire Legacy Code
**Scope:** Remove `services/legacy-ai-engine/` (40+ files, never called by any active route), remove Prisma `Report` and `ApiUsage` models once historical data is migrated.  
**Effort:** 1–2 weeks.

---

## Summary Timeline

| Phase | Weeks | Deliverable |
|---|---|---|
| Pre-revenue fixes | 1–2 | P0 items; env var, debug route, logs, cleanup |
| Billing MVP | 3–6 | Stripe/Paddle + plan upgrade UI + email |
| Product polish | 7–10 | Onboarding, settings, Supabase types |
| Data quality | 11–16 | Real talent data, contact enrichment, PDF |
| Scale | 17–24 | CI, staging, analytics, team management |
