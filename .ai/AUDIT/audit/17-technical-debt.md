# 17 — Technical Debt

**Evidence basis:** All source files. Every item below is verified from code.

---

## Technical Debt Registry

### TD-01 — Legacy AI Engine (DEAD CODE) — Priority: HIGH

**Location:** `services/legacy-ai-engine/`  
**Size:** ~40 files (orchestrator + prompt-builder + 26 prompt files + 2 providers)  
**Status:** Zero active API routes import the orchestrator or any prompt files. The `OpenAIProvider` and `BaseProvider` classes are reused by the Research Core Engine — those 2 files must be kept.  
**Impact:** Maintenance burden. Anyone reading the codebase will spend time understanding 40 files that do nothing. Build times include compiling them. TypeScript must type-check them.  
**Effort to resolve:** 1 day (move providers to `lib/ai/`, delete rest, update imports).

---

### TD-02 — `supabase as any` Type Bypassing — Priority: HIGH

**Location:** `app/api/research/leads/route.ts:71`, `app/api/research/talent/route.ts:86`, `app/api/intelligence/route.ts:971`  
**Root cause:** `types/supabase.types.ts` was not regenerated after adding `research_requests`, `user_plans`, and `reports` to Supabase.  
**Impact:** TypeScript compiler cannot validate column names or values for ~70% of the active database operations.  
**Effort to resolve:** Run `supabase gen types typescript`, update `supabase.types.ts`, fix type errors. 2 days.

---

### TD-03 — Dual Schema (Prisma vs Supabase) — Priority: HIGH

**Location:** `prisma/schema.prisma` (legacy models), Supabase tables  
**Status:** Two conceptually overlapping "report" models (`prisma.Report` vs Supabase `reports`), two "user" concepts (`prisma.User` vs `auth.users`). The Prisma `Report` and `ApiUsage` models are explicitly marked LEGACY in the schema.  
**Impact:** Confusion for any new developer. Plan limits in Prisma (`Workspace.plan`) diverge from Supabase `user_plans`. Workspace membership (Prisma) not synchronized with plan enforcement (Supabase).  
**Effort to resolve:** Full database rationalization — migrate any historical Prisma Report data to Supabase, drop legacy models, reconcile plan fields. 2–3 weeks.

---

### TD-04 — Repository Root Clutter — Priority: MEDIUM

**Location:** Repository root  
**Items:** `api.php`, `auth.php`, `config.example.php`, `test.php`, `text.txt`–`text 6.txt`, `users.json`, `feasibility.html`, `index.html`, `eunoia-worker.js`, 25 markdown docs  
**Impact:** Confusing to new contributors. PHP files imply a prior PHP-based architecture. Text files and HTML files are unexplained. Investors doing tech diligence see an unorganized repo.  
**Effort to resolve:** 1 day (move docs to `/docs`, delete non-source files after verifying they contain nothing critical).

---

### TD-05 — Manual Rate Limiting (Race Condition Risk) — Priority: MEDIUM

**Location:** `lib/research/rate-limit.ts`  
**Problem:** Manual `redis.get → check → redis.incr` is not atomic. Two concurrent requests can both read `count < 5` and both be allowed.  
**Available fix:** `@upstash/ratelimit` is already installed (`package.json:20`) and provides atomic sliding-window rate limiting.  
**Impact:** Low at current scale (single user won't typically make 5 concurrent requests), but a concern under automated abuse.  
**Effort to resolve:** 2 hours — swap `lib/research/rate-limit.ts` to use `@upstash/ratelimit`.

---

### TD-06 — Inline CSS Styling Architecture — Priority: MEDIUM

**Location:** `app/dashboard/real-estate/page.tsx`, `app/dashboard/research/leads/page.tsx`, `app/dashboard/research/talent/page.tsx`, `app/dashboard/reports/reports-client.tsx`  
**Problem:** Hundreds of lines of CSS injected as `<style>` string tags per page. No caching, no deduplication, no type safety, duplicated classes across pages.  
**Effort to resolve:** 1–2 weeks to migrate to Tailwind utilities or CSS modules.

---

### TD-07 — Declared but Unused Dependencies — Priority: LOW

| Package | Issue |
|---|---|
| `resend` | Installed, never imported |
| `@upstash/ratelimit` | Installed, manual implementation used instead |

**Effort to resolve:** 1 hour — remove `resend` (add back when email is implemented), use `@upstash/ratelimit` for rate limiting.

---

### TD-08 — Duplicate `prisma generate` on Build — Priority: LOW

**Location:** `package.json:8` + `vercel.json:2`  
**Problem:** `postinstall` script runs `prisma generate`, and `vercel.json` buildCommand also runs `npx prisma generate`. The generation runs twice on every Vercel build — harmless but wastes ~15 seconds.  
**Effort to resolve:** Remove `postinstall` from `package.json`. 5 minutes.

---

### TD-09 — `eslint-config-next` Version Mismatch — Priority: LOW

**Location:** `package.json:54`  
```json
"eslint-config-next": "15.3.0"
```
Next.js is 16.2.6. eslint-config-next 15 may not have lint rules for Next.js 16 features.  
**Effort to resolve:** 30 minutes — update to `16.x`.

---

### TD-10 — next-intl Configured but Incomplete — Priority: LOW

**Location:** `next.config.ts:4`, `i18n/request.ts`  
**Problem:** `next-intl` plugin is wired up but there are no message files (no `messages/en.json`, `messages/ar.json`). The app implements bilingual display ad-hoc (state toggles, dual-language string literals) rather than through the i18n system.  
**Effort to resolve:** Either remove `next-intl` plugin and standardize on ad-hoc approach, or fully implement next-intl with message files. 2 weeks for full i18n.

---

### TD-11 — No Fetch Timeout in Source Collector — Priority: MEDIUM

**Location:** `lib/research/acquisition/source-collector.ts`  
**Problem:** HTTP GET requests to source URLs have no timeout. A slow or hung server can hold the Lead Finder request open for Node.js's default timeout (up to Vercel's function limit).  
**Effort to resolve:** Add `AbortController` with 5-second timeout. 2 hours.

---

## Technical Debt Summary

| ID | Description | Priority | Effort |
|---|---|---|---|
| TD-01 | Legacy AI engine dead code | HIGH | 1 day |
| TD-02 | `as any` Supabase type bypassing | HIGH | 2 days |
| TD-03 | Dual schema Prisma vs Supabase | HIGH | 2–3 weeks |
| TD-04 | Repository root clutter | MEDIUM | 1 day |
| TD-05 | Manual rate limiter race condition | MEDIUM | 2 hours |
| TD-06 | Inline CSS styling | MEDIUM | 1–2 weeks |
| TD-07 | Unused dependencies | LOW | 1 hour |
| TD-08 | Duplicate prisma generate | LOW | 5 min |
| TD-09 | eslint-config-next version mismatch | LOW | 30 min |
| TD-10 | next-intl incomplete | LOW | 2 weeks if pursuing |
| TD-11 | No source fetch timeout | MEDIUM | 2 hours |

**Total estimated debt reduction effort:** 6–9 weeks (if all items pursued)  
**Minimum viable cleanup (TD-01, 04, 07, 08, 09, 11):** 3 days
