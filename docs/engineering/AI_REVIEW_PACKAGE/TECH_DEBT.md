# TECH DEBT
**Audit Date:** 2026-07-30  
**Source:** Direct code inspection — verified from repository state, not documentation

---

## CRITICAL — Security Risks

### TD-SEC-01: Hardcoded API Key in `test.php`

| Field | Detail |
|---|---|
| File | `test.php` (repo root) |
| Issue | Contains hardcoded Anthropic API key: `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` |
| Severity | **CRITICAL** |
| Action | Revoke the key immediately. Remove `test.php` from the repository and purge from git history. |

---

### TD-SEC-02: No Active Root Middleware

| Field | Detail |
|---|---|
| Files | `proxy.ts` (root), `lib/supabase/middleware.ts` |
| Issue | `proxy.ts` exports function `proxy` — Next.js requires the file to be named `middleware.ts` and the export to be named `middleware`. The current file is never executed. The platform has NO global auth middleware. |
| Severity | **HIGH** — new routes added without per-route auth checks will be unauthenticated |
| Action | Rename `proxy.ts` → `middleware.ts`; rename export `proxy` → `middleware`. Wire to `lib/supabase/middleware.ts`'s `updateSession()`. |

---

### TD-SEC-03: Legacy PHP Files with Auth Logic

| Field | Detail |
|---|---|
| Files | `api.php`, `auth.php`, `config.example.php`, `test.php` |
| Issue | Legacy PHP auth system committed to the repo alongside a Next.js/TypeScript application. `auth.php` references `users.json` for password-hash auth. `api.php` includes session-based auth middleware. None are executed, but they create confusion and potential confusion about what auth system is canonical. |
| Severity | **MEDIUM** |
| Action | Remove all PHP files from the repository. Purge from git history. |

---

## HIGH — Architecture Debt

### TD-ARCH-01: Dual Plan Model (Prisma vs Supabase)

| Field | Detail |
|---|---|
| Files | `prisma/schema.prisma` (`Workspace.plan`), `types/plan.types.ts`, `supabase/plan-enforcement.sql` |
| Issue | Two independent plan models. Prisma `Plan` enum has 3 values (STARTER, PROFESSIONAL, ENTERPRISE). Supabase `user_plans.plan` has 4 values (adds AGENCY). They are not synced. Enforcement uses Supabase. Prisma is unused for enforcement. |
| Severity | **HIGH** |
| Action | Awaiting billing provider decision (ADR-PENDING-003). Then unify into one model. |

---

### TD-ARCH-02: Decision Intelligence Engine Not Integrated

| Field | Detail |
|---|---|
| Files | `lib/decision-intelligence/` (15 files, 61 tests) |
| Issue | A complete, well-tested DI library exists but is not called by any API route or UI component. The Real Estate route (`/api/intelligence/route.ts`) continues to use the pre-DI pattern (raw AI call without evidence collection, validation pipeline, or explainability). |
| Severity | **HIGH** |
| Action | Sprint 4 (DI Real Estate Integration) after Supabase restoration |

---

### TD-ARCH-03: No Supabase TypeScript Types for Live Tables

| Field | Detail |
|---|---|
| Files | `types/supabase.types.ts` |
| Issue | Supabase TypeScript types file exists but predates `research_requests`, `user_plans`, and `audit_log` tables. All research routes cast Supabase client as `any` to avoid type errors. |
| Severity | **MEDIUM** |
| Action | Regenerate after Supabase project is restored: `supabase gen types typescript --project-id <id> > types/supabase.types.ts` |

---

### TD-ARCH-04: Parallel AI SDK and OpenAI SDK

| Field | Detail |
|---|---|
| Issue | `ai` (Vercel AI SDK v4, `^4.3.16`) is installed but not used. All routes use `openai` SDK directly. The AI SDK provides structured output, streaming, and provider abstraction not being leveraged. |
| Severity | **LOW** |
| Action | Either adopt AI SDK patterns or remove it from dependencies |

---

### TD-ARCH-05: next-intl Installed but Unused

| Field | Detail |
|---|---|
| Issue | `next-intl` is installed and `withNextIntl` wraps the Next.js config. No `/[locale]/` route segments exist. Bilingual content in the Real Estate module is handled manually (hardcoded Arabic/English strings in the route). |
| Severity | **LOW** |
| Action | Either implement locale routing or remove next-intl |

---

## MEDIUM — Code Debt

### TD-CODE-01: `/api/intelligence/route.ts` is ~1000 Lines

| Field | Detail |
|---|---|
| File | `app/api/intelligence/route.ts` |
| Issue | Single file contains: Egypt benchmarks (hardcoded constants), cashflow engine, 5 report type generators, prompt builders, plan enforcement check, Supabase writes, CSV export helpers. No separation of concerns. |
| Severity | **MEDIUM** |
| Action | Decompose into modules after DI integration (Sprint 4 will restructure this route) |

---

### TD-CODE-02: `as any` Casts in Research Routes

| Field | Detail |
|---|---|
| Files | `lib/research/plan-enforcement.ts`, research API routes |
| Issue | Supabase client is cast `as any` throughout research routes because `types/supabase.types.ts` doesn't cover live tables |
| Severity | **MEDIUM** |
| Action | Regenerate Supabase types after project restoration |

---

### TD-CODE-03: Debug Log in Leads Route

| Field | Detail |
|---|---|
| File | `app/api/research/leads/route.ts` |
| Issue | `console.log` that prints env key presence to production logs (per `PROJECT_CONTEXT.md` known issues) |
| Severity | **MEDIUM** |
| Action | Remove debug log |

---

### TD-CODE-04: `passwordHash` Field in Prisma User Model

| Field | Detail |
|---|---|
| Issue | `User.passwordHash` field exists in Prisma schema but auth is handled entirely by Supabase Auth (no password hashing in application code). Field is never written or read. |
| Severity | **LOW** |
| Action | Remove field in a future Prisma migration |

---

## LOW — Infrastructure Debt

### TD-INFRA-01: No Versioned Migration System

| Field | Detail |
|---|---|
| Issue | Supabase SQL scripts are flat files in `supabase/` — not numbered migrations. No Supabase CLI migration workflow. No migration history table. Running scripts twice can cause `IF NOT EXISTS` safety but no idempotency guarantee. |
| Severity | **MEDIUM** |
| Action | Adopt Supabase CLI migrations (`supabase migration new`) for all future schema changes |

---

### TD-INFRA-02: No APM / Error Monitoring

| Field | Detail |
|---|---|
| Issue | No Sentry, Datadog, or equivalent. Production errors surface only in Vercel function logs. |
| Severity | **MEDIUM** |
| Action | ADR-PENDING-004 (provider decision required) |

---

### TD-INFRA-03: Billing Not Implemented

| Field | Detail |
|---|---|
| Issue | Plan assignment is manual (admin SQL query or admin console). No payment flow. No Stripe checkout. No billing webhook. |
| Severity | **HIGH for commercial readiness** |
| Action | Sprint 6 (awaits ADR-PENDING-003 provider decision) |

---

## Dead Code / Dead Folders

| Item | Location | Action |
|---|---|---|
| Legacy AI Engine (30+ prompts) | `services/legacy-ai-engine/` | Remove from repo; already excluded from tsconfig |
| PHP files | `api.php`, `auth.php`, `config.example.php`, `test.php` | Remove + purge git history (contains API key) |
| Legacy HTML | `index.html`, `feasibility.html` | Remove |
| Empty `database/` folder | `database/` | Remove |
| Empty `epos/` folder | `epos/` | Remove or document purpose |
| Scratch text files | `text.txt` through `text 6.txt` | Remove |
| Vim swap file | `.Documentation:.swp` | Remove + add `*.swp` to `.gitignore` |
| Binary files | `Eunoia_Platform_Analysis_Final.xlsx`, `IMG_0070-73.jpeg` | Remove from repo |
| Investor package folders (4 copies) | `investor-package/`, `Investor Package/`, `investor-review/`, `investor-review-v2/` | Move outside repo or consolidate |
| Prisma `Report` + `ApiUsage` models (LEGACY) | `prisma/schema.prisma` | Keep for now (historical data); document explicitly |
| `/api/debug-env/route.ts` | `app/api/debug-env/route.ts` | Empty stub — remove or implement |
| `users.json` reference in `auth.php` | `auth.php` | No `users.json` in repo (good) — remove `auth.php` |
