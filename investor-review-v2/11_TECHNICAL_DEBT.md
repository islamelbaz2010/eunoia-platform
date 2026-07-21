# 11 — TECHNICAL DEBT
*Catalogued, evidenced, prioritized.*

---

## Technical Debt Summary

| Category | Count | Severity |
|----------|-------|---------|
| Legacy dead code | 3 major areas | HIGH (build complexity, confusion) |
| Debug code in production | 1 | HIGH (immediate fix needed) |
| External dependency coupling | 1 | HIGH (architectural) |
| Missing TypeScript types | 1 | MEDIUM |
| Inline styles (no Tailwind) | 1 major file | LOW-MEDIUM |
| Junk files in root | 10+ files | LOW |
| Missing infrastructure | 3 | MEDIUM |
| Dual plan systems | 1 | MEDIUM |

---

## DEBT 1: Legacy Prisma Layer — VERIFIED

**File:** `prisma/schema.prisma`, `services/legacy-ai-engine/`, `lib/prisma/generated/`
**Severity: HIGH**

The entire Prisma database layer (4 models, all marked `/// LEGACY:`) and the legacy AI engine (35+ prompt files) exist purely as historical artifacts. No live route writes to any Prisma table.

**Cost:**
- `vercel.json` and `package.json` run `prisma generate` on every single deploy
- Any new developer sees Prisma + Supabase and gets confused about which to use
- 35+ legacy prompt files in `services/legacy-ai-engine/` add significant cognitive load
- 28 legacy ReportTypes in schema suggest far more features than actually exist

**Resolution:** Remove `services/legacy-ai-engine/` entirely. Strip Prisma from `vercel.json` build command. (Migration has to be carefully handled to preserve historical data.)

**Effort to clean up:** 1-2 days

---

## DEBT 2: Debug Console.log in Production Route — VERIFIED

**File:** `app/api/research/leads/route.ts`, lines 1-3
**Severity: HIGH (immediate)**

```javascript
console.log("=== LEADS API START ===")
console.log("SERPAPI:", !!process.env.SERPAPI_API_KEY)
console.log("OPENAI:", !!process.env.OPENAI_API_KEY)
```

Last git commit: `31638d4 debug leads api`

These logs are currently in production. They:
1. Reveal whether API keys are configured (Vercel function logs)
2. Add unnecessary log noise
3. Demonstrate the last code change was debugging, not a feature

**Resolution:** Remove 3 lines
**Effort:** 2 minutes

---

## DEBT 3: halannews.com External Proxy Dependency — VERIFIED

**File:** `app/api/demo/generate/route.ts`, line 54
**File:** `app/market-intelligence/page.tsx`
**Severity: HIGH (architectural)**

Two separate places hardcode `halannews.com`:
1. Demo AI generation proxied through `https://halannews.com/api-proxy`
2. Market Intelligence page renders `https://halannews.com/` in an iframe

**Problems:**
- Single point of failure for demo flow
- Architecturally unexplainable to investors ("your AI platform depends on a news website?")
- Tightly couples the platform to an external entity
- If halannews.com changes, breaks

**Resolution:** 
1. Call OpenAI/Claude directly from demo generate (2 hours)
2. Build real market intelligence content or remove the iframe

**Effort:** 2-4 hours to remove proxy dependency; 3-4 weeks to replace the iframe with real content

---

## DEBT 4: Missing Supabase Type Generation — VERIFIED

**File:** `types/supabase.types.ts`
**Severity: MEDIUM**

The Supabase types file doesn't include the actual live tables (`reports`, `research_requests`, `user_plans`, `demo_leads`). Routes cast `supabase as any` to access them. This creates TypeScript unsafety and makes it easy to have column name typos go undetected.

Evidence: Explicit comment in multiple route files: "`research_requests`/`reports`/`user_plans` aren't in the generated Supabase types yet"

**Resolution:** Run `supabase gen types typescript` and update the types file
**Effort:** 30 minutes

---

## DEBT 5: Real Estate Dashboard — Inline CSS (No Tailwind) — VERIFIED

**File:** `app/dashboard/real-estate/page.tsx` (1,111 lines)
**Severity: LOW-MEDIUM**

The entire 1,111-line file uses inline CSS and `<style>` tags instead of Tailwind CSS. The rest of the codebase uses Tailwind. This creates inconsistency, makes the file hard to maintain, and means the page won't automatically pick up design system changes.

**Resolution:** Refactor to Tailwind (larger effort, not urgent)
**Effort:** 2-3 days

---

## DEBT 6: PHP/HTML Junk Files in Root — VERIFIED

**Files:** `api.php`, `auth.php`, `config.example.php`, `test.php`, `index.html`, `feasibility.html`, `text.txt`, `text 2.txt` through `text 6.txt`, `eunoia-worker.js`
**Severity: LOW (embarrassing for investors)**

These are leftover artifacts from a previous PHP/HTML version of the platform. They exist in the repo root alongside Next.js project files.

**Resolution:** Delete all (5 minutes)
**Effort:** 5 minutes — however, verify none are actively used first

---

## DEBT 7: Dual Plan Systems — VERIFIED

**Files:** `prisma/schema.prisma` (Workspace.plan), `types/plan.types.ts` (STARTER/PROFESSIONAL/AGENCY/ENTERPRISE)
**Severity: MEDIUM**

Two separate plan systems exist:
- Prisma: STARTER, PROFESSIONAL, ENTERPRISE (3 tiers)  
- Supabase/Active: STARTER, PROFESSIONAL, AGENCY, ENTERPRISE (4 tiers)

These are never reconciled. Any code reading from Prisma's plan field gets different data than the live plan enforcement. Documentation in code acknowledges this explicitly.

**Resolution:** Remove Prisma plan entirely, standardize on Supabase `user_plans`
**Effort:** 1 day (after Prisma cleanup)

---

## DEBT 8: Market Intelligence Route — Confusing Name — VERIFIED

**File:** `app/market-intelligence/page.tsx`
**Severity: MEDIUM (investor confusion)**

The route name "Market Intelligence" suggests a data intelligence feature. The actual implementation redirects logged-in users to an iframe of `https://halannews.com/`. This is deeply confusing:
- Users see a news homepage where they expect market data
- Investors see "Market Intelligence" in the nav and click it expecting a feature

**Resolution:** Either build real market intelligence or rename/hide this route
**Effort:** 5 minutes to hide; 3-4 weeks to build real content

---

## DEBT 9: API Error Handling — Inconsistent — PARTIALLY VERIFIED

**Severity: LOW-MEDIUM**

Some API routes return structured error responses; others return generic 500s. No consistent error format exists across routes. This makes frontend error handling harder.

**Resolution:** Standardize on a typed error response format
**Effort:** 1-2 days

---

## DEBT 10: No Monitoring / Alerting — VERIFIED BY ABSENCE

**Severity: MEDIUM**

No error tracking (Sentry/Datadog), no uptime monitoring, no AI cost tracking, no alert on rate limit abuse. The only observability is Vercel function logs.

**Resolution:** Add Sentry (2 hours), add uptime monitoring (1 hour)
**Effort:** Half a day

---

## Prioritized Fix List for Demo Readiness

| Priority | Debt | Effort | Impact |
|----------|------|--------|--------|
| 1 | Remove debug console.logs | 2 min | Immediate professionalism |
| 2 | Remove halannews.com proxy in demo | 2 hrs | Remove critical dependency |
| 3 | Hide/rename market-intelligence route | 5 min | Remove investor confusion |
| 4 | Delete junk PHP/HTML files from root | 5 min | Professional codebase appearance |
| 5 | Generate Supabase types | 30 min | TypeScript safety |
| 6 | Remove legacy AI engine folder | 1 day | Reduce confusion |
| 7 | Prisma cleanup from build | 1 day | Faster builds |
