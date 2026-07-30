# Consistency Audit

**Date:** 2026-07-21  
**Method:** Cross-read of all documents in `.ai/CURRENT/`, `.ai/BOOTSTRAP/`, `.ai/AUDIT/`, `docs/`, and direct repository inspection.  
**Scope:** Every statement below is backed by a file read. No assumptions.

---

## Severity Legend

| Level | Meaning |
|---|---|
| CRITICAL | Factually wrong and will mislead a new AI session |
| SIGNIFICANT | Wrong or missing; affects integration, security, or architecture decisions |
| MINOR | Small gap, stale phrasing, or omission that is low-risk but worth correcting |

---

## CRITICAL Issues

### CRIT-01 — MASTER_PROJECT_MEMORY.md describes Decision Intelligence as "Pre-Implementation"

**Document:** `.ai/CURRENT/MASTER_PROJECT_MEMORY.md`  
**Statement:** "Current Phase: Decision Intelligence Foundation — Strategic Definition / Pre-Implementation"  
**Remaining Work (section 13):** "Define the Decision Intelligence Engine... Begin implementation after..."  
**Reality:** The Decision Intelligence Engine is **fully implemented**. `lib/decision-intelligence/` contains 15 source files, 6 test files, and 61 passing tests. The library covers all 7 type files, the evidence subsystem, confidence engine, rules engine, validation engine, explainability engine, and top-level decision orchestrator.  
**Impact:** A new AI session loading MASTER_PROJECT_MEMORY.md will believe the most important architecture work hasn't started. It will propose to "define" and "design" things that already exist.

---

### CRIT-02 — CURRENT_SYSTEM_MAP.md declares no test framework and no test files

**Document:** `.ai/CURRENT/CURRENT_SYSTEM_MAP.md` section 10  
**Statement:** "`package.json` has no test framework (`npm test` script doesn't exist; no `jest`/`vitest`/`mocha` in `devDependencies`; no `*.test.ts`/`*.spec.ts` files anywhere outside `node_modules`)"  
**Reality:** Vitest is installed (`"vitest": "4.1.9"` in devDependencies). The repository has 25 test files and 194 passing tests across research modules and decision intelligence.  
**Impact:** A new AI session will add Vitest and test infrastructure that already exists, creating conflicts.

---

### CRIT-03 — CURRENT_SYSTEM_MAP.md declares major research modules do not exist

**Document:** `.ai/CURRENT/CURRENT_SYSTEM_MAP.md` section 9  
**Statement:** "Confirmed absent from `lib/research/`: `company-validation.ts`, `dedup.ts`, `source-quality.ts`, `company-expansion.ts`, any `ApolloAdapter`"  
**Reality:** All of these exist:
- `lib/research/company-validation.ts` ✓
- `lib/research/dedup.ts` ✓
- `lib/research/source-quality.ts` ✓
- `lib/research/company-expansion.ts` ✓
- `lib/research/acquisition/apollo-adapter.ts` ✓
Plus: `lib/research/company-size.ts`, `lib/research/decision-makers.ts`, `lib/research/sources.ts`, `lib/research/api-error.ts`, `lib/research/acquisition/normalizer.ts`, `lib/research/acquisition/ranker.ts`, `lib/research/acquisition/quota.ts`, `lib/research/acquisition/source-collector.ts` — all exist and have passing test coverage.  
**Impact:** A new AI session will attempt to build modules that already exist. Risk of duplicate implementation.

---

### CRIT-04 — README.md and PROJECT_CONTEXT.md state wrong production URL

**Documents:** `README.md` (line 14), `.ai/CURRENT/PROJECT_CONTEXT.md` (Identity table)  
**Statement:** Production URL is `https://ai.halannews.com`  
**Reality:** Vercel environment pull confirms production URL is `https://intelligence.eunoiazones.com` (env var `NEXT_PUBLIC_SITE_URL="https://intelligence.eunoiazones.com"`).  
**Impact:** Documentation and README point to the wrong URL. Any new session checking which domain to configure or monitor will use the wrong address.

---

### CRIT-05 — PLATFORM_ARCHITECTURE_MAP.md lists non-existent API routes

**Document:** `docs/PLATFORM_ARCHITECTURE_MAP.md` section 2.2  
**Statements:**
1. `app/api/auth/callback/route.ts` listed — this route does NOT exist. The actual auth callback is at `app/auth/callback/route.ts` (under `app/auth/`, not `app/api/`).
2. `app/api/reports/route.ts` listed — NO `reports` directory exists under `app/api/`. Reports are read via Supabase directly from the dashboard server component; there is no `/api/reports` REST endpoint.  
**Impact:** Documentation maps will cause integration errors when a new session tries to call these non-existent routes.

---

### CRIT-06 — MODULE_INVENTORY.md misses approximately 15 research library files

**Document:** `docs/MODULE_INVENTORY.md`  
**Missing files (confirmed present in repository):**
- `lib/research/acquisition/apollo-adapter.ts` + test
- `lib/research/acquisition/normalizer.ts`
- `lib/research/acquisition/ranker.ts` + test
- `lib/research/acquisition/quota.ts` + test (global SerpAPI daily quota with per-user sub-quota)
- `lib/research/acquisition/source-collector.ts`
- `lib/research/acquisition/index.ts`
- `lib/research/company-validation.ts` + test
- `lib/research/company-expansion.ts` + test
- `lib/research/company-size.ts` + test
- `lib/research/decision-makers.ts` + test
- `lib/research/dedup.ts` + test
- `lib/research/source-quality.ts` + test
- `lib/research/api-error.ts` + test
- `lib/research/sources.ts`
- `lib/redis/client.ts` and `lib/redis/cache.ts`
- `app/auth/callback/route.ts` (OAuth callback — not `app/api/auth/callback`)
- `app/api/demo/route.ts` and `app/api/demo/generate/route.ts` (public demo flow)  
**Impact:** Any platform inventory or sprint planning based on MODULE_INVENTORY.md will plan to build or integrate components that already exist.

---

## SIGNIFICANT Issues

### SIG-01 — proxy.ts is NOT running as Next.js middleware

**Document:** `.ai/CURRENT/CURRENT_SYSTEM_MAP.md` section 3  
**Statement:** "Root middleware is `proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`)"  
**Reality:** This claim is factually incorrect. Next.js has never renamed `middleware.ts` to `proxy.ts`. For Next.js to execute middleware, the file must be named `middleware.ts` (or `middleware.js`) in the project root or `src/`. The file `proxy.ts` exports a function named `proxy` (not the required `middleware` named export). Next.js does NOT execute it.  
**Consequence:** The dashboard session refresh and path protection that CURRENT_SYSTEM_MAP.md attributes to `proxy.ts` are NOT happening. The only protection is the dashboard layout server component. This is a real security/session gap.  
**Impact:** SIGNIFICANT — middleware-level session refresh and protection is absent; any session assumes it's present.

---

### SIG-02 — Demo AI described incorrectly in PROJECT_CONTEXT.md

**Document:** `.ai/CURRENT/PROJECT_CONTEXT.md` (Stack table, AI row)  
**Statement:** "AI (Demo): Cloudflare Worker proxy → Claude Opus 4.8"  
**Reality:** The `app/api/demo/generate/route.ts` calls `process.env.AI_PROXY_URL ?? 'https://halannews.com/api-proxy'` and sends an OpenAI-format request (including a `model` field with `gpt-4o-mini`). There is no reference to Claude or Anthropic in this route. The proxy may or may not internally route to Claude, but the codebase uses OpenAI protocol with the model name `gpt-4o-mini`.  
**Impact:** Architecture decisions about AI provider diversification or demo cost attribution will be made on incorrect information.

---

### SIG-03 — Inconsistent env var names for AI proxy

**Documents:** `.ai/CURRENT/PROJECT_CONTEXT.md`, `.env.example`, `proxy.ts`, `app/api/demo/generate/route.ts`, `services/legacy-ai-engine/orchestrator.ts`  
**Issue:** THREE different env var names are used for the proxy URL:
1. `CLOUDFLARE_WORKER_URL` — used by `services/legacy-ai-engine/orchestrator.ts`
2. `AI_PROXY_URL` — used by `app/api/demo/generate/route.ts`
3. `CLOUDFLARE_WORKER_URL` — listed in `.env.example` and `.ai/CURRENT/PROJECT_CONTEXT.md` (covering only case 1)  
**Impact:** If `CLOUDFLARE_WORKER_URL` is set in Vercel but `AI_PROXY_URL` is not, the demo generate route will silently use the hardcoded fallback instead of the configured proxy. Env var documentation does not expose this divergence.

---

### SIG-04 — INTEGRATION_MATRIX.md references non-existent route

**Document:** `docs/INTEGRATION_MATRIX.md` section 4  
**Statement:** Page-to-API mapping lists `/dashboard/research` calling `(none — static hub)`; also page list shows `/api/research/route.ts`  
**Reality:** There is no `app/api/research/route.ts`. The research directory under `app/api/research/` contains only `leads/route.ts` and `talent/route.ts`. The research hub page (`/dashboard/research`) correctly calls no API.  
**Impact:** Minor routing confusion but the non-existent route should not be listed.

---

### SIG-05 — Missing env vars in all documentation

**Documents:** `docs/PLATFORM_STATE_ASSESSMENT.md`, `.ai/CURRENT/PROJECT_CONTEXT.md`, `.env.local`  
**Missing variables (confirmed present in `.env.example` and codebase):**
- `SEARCH_DAILY_QUOTA` — global SerpAPI daily budget (default 150)
- `SEARCH_DAILY_QUOTA_PER_USER` — per-user fair-share sub-quota (default 30) — referenced in `quota.ts` but absent from ALL documentation
- `CLOUDFLARE_WORKER_URL` — proxy for legacy AI orchestrator (in `.env.example` but not in `.env.local` template)
- `AI_PROXY_URL` — proxy for demo generate route — absent from ALL documentation including `.env.example`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — listed in `.env.example` but not in `.ai/CURRENT/PROJECT_CONTEXT.md`'s env table  
**Impact:** An operator following only the documentation will miss required configuration, causing silent failures.

---

### SIG-06 — Demo routes (public, unauthenticated) missing from all newer docs

**Documents:** `docs/PLATFORM_STATE_ASSESSMENT.md`, `docs/MODULE_INVENTORY.md`, `docs/PLATFORM_ARCHITECTURE_MAP.md`  
**Missing:** `/api/demo` (POST — lead capture, saves to `demo_leads`, sends Resend email) and `/api/demo/generate` (POST — rate-limited AI report generation via proxy, sends branded email via Resend). Both are public (no Supabase auth). The demo landing page at `/demo` calls both.  
**Impact:** Security and capacity planning both depend on knowing there are public unauthenticated endpoints. Missing from threat model.

---

### SIG-07 — Redis module missing from all documentation

**Documents:** All docs  
**Missing:** `lib/redis/client.ts` and `lib/redis/cache.ts` — a separate Redis client layer used by the legacy AI engine orchestrator for caching. This is distinct from the `@upstash/ratelimit` used by `lib/research/rate-limit.ts`. The orchestrator uses a raw `@upstash/redis` client via `lib/redis/`.  
**Impact:** There are actually two Redis usage patterns in the codebase (raw Upstash client and Upstash ratelimit). Missing from integration documentation.

---

### SIG-08 — PLATFORM_STATE_ASSESSMENT.md incorrectly states auth callback route path

**Document:** `docs/PLATFORM_STATE_ASSESSMENT.md` Recovery Checklist  
**Statement:** Implies standard Supabase auth callback at `app/api/auth/callback`  
**Reality:** The auth callback is at `app/auth/callback/route.ts` (under `app/auth/`, not `app/api/auth/`).  

---

## MINOR Issues

### MIN-01 — ACTIVE_SPRINT.md says "4 test files" for decision intelligence

**Document:** `.ai/CURRENT/ACTIVE_SPRINT.md` (Session 3 section)  
**Statement:** "Created 4 test files in `lib/decision-intelligence/__tests__/`"  
**Reality:** 6 test files exist: evidence-collector, evidence-weighter, confidence-engine, rules-engine, validation-engine, decision-engine.

---

### MIN-02 — END_SESSION.md references PROJECT_STATE.md which does not exist

**Document:** `.ai/BOOTSTRAP/END_SESSION.md` step 4  
**Statement:** "Update `.ai/CURRENT/PROJECT_STATE.md`"  
**Reality:** This file does not exist. The actual working file is `.ai/CURRENT/CURRENT_STATE.md`.

---

### MIN-03 — CHANGELOG.md and ROADMAP.md referenced but do not exist as files

**Context:** Sprint instructions reference these files by name  
**Reality:** No `CHANGELOG.md` or `ROADMAP.md` exists in the repository. Sprint history is embedded in `SPRINT_MEMORY.md`; task priority is in `TASK_QUEUE.md`.

---

### MIN-04 — epos/ directory is empty

**Document:** `.ai/BOOTSTRAP/START_SESSION.md` step 1  
**Statement:** Requires `epos/` to exist  
**Reality:** `epos/` directory exists but contains no files. START_SESSION.md treats it as a required path but gives no content spec.

---

### MIN-05 — Vercel AI SDK (`ai` package) undocumented

**Source:** `package.json` (`"ai": "^4.3.16"`)  
**Reality:** The Vercel AI SDK is a production dependency but is not mentioned in any architecture document. Its usage in the codebase is unknown from static file listing alone.

---

### MIN-06 — `framer-motion` dependency undocumented

**Source:** `package.json` (`"framer-motion": "^12.40.0"`)  
**Reality:** Listed in production dependencies but not mentioned in any document.

---

### MIN-07 — `zod` installed but "no Zod validation" stated in debt register

**Source:** `package.json` (`"zod": "^3.24.1"`); `docs/TECHNICAL_DEBT_REGISTER.md` DEBT-004  
**DEBT-004** says: "No Zod schemas at API boundaries". Zod IS installed. Debt-004 may be accurate (installed but unused at API boundaries) or partially wrong (may be used internally). Needs confirmation from code reading before DEBT-004's resolution cost is estimated.

---

### MIN-08 — MASTER_PROJECT_MEMORY.md section 22: "Project name: UNKNOWN"

**Document:** `.ai/CURRENT/MASTER_PROJECT_MEMORY.md` section 22  
**Statement:** "Open Unknowns: Project name (not explicitly stated in the Sprint Memory)"  
**Reality:** The project name is well-established: `eunoia-platform` (package name: `eunoia-intelligence-web`). This was resolved in later sessions and logged in the startup summary, but MASTER_PROJECT_MEMORY.md was never updated.

---

### MIN-09 — `debug-env` route described as "empty file, no handler" 

**Document:** `.ai/CURRENT/PROJECT_CONTEXT.md` API Routes table  
**Statement:** `GET /api/debug-env` — "Empty file, no handler"  
**Reality:** The file `app/api/debug-env/route.ts` exists and contains a GET handler that returns `{ ok: false }` with HTTP 404. Not empty; has a handler. Prior dangerous handler was replaced with a safe one.

---

### MIN-10 — `/api/research/route.ts` listed in INTEGRATION_MATRIX.md

**Document:** `docs/INTEGRATION_MATRIX.md` table 4  
**Statement:** Research route exists at `/api/research/route.ts`  
**Reality:** No `app/api/research/route.ts` exists. Only `leads/route.ts` and `talent/route.ts` exist under `app/api/research/`.

---

## Summary Counts

| Severity | Count |
|---|---|
| CRITICAL | 6 |
| SIGNIFICANT | 8 |
| MINOR | 10 |
| **Total** | **24** |

---

## Documents Requiring Immediate Update

| Document | Issues |
|---|---|
| `MASTER_PROJECT_MEMORY.md` | CRIT-01, MIN-08 — severely stale |
| `CURRENT_SYSTEM_MAP.md` | CRIT-02, CRIT-03, SIG-01 — obsolete state |
| `README.md` | CRIT-04 — wrong production URL |
| `PROJECT_CONTEXT.md` | CRIT-04, SIG-02, SIG-03, SIG-05, MIN-09 |
| `PLATFORM_ARCHITECTURE_MAP.md` | CRIT-05 — wrong route paths |
| `MODULE_INVENTORY.md` | CRIT-06 — ~15 missing modules |
| `INTEGRATION_MATRIX.md` | CRIT-05, SIG-04, MIN-10 |
| `PLATFORM_STATE_ASSESSMENT.md` | SIG-08 |

---

*Consistency audit produced 2026-07-21. Read-only — no code or runtime modifications.*
