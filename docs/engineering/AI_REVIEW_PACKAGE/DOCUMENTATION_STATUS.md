# DOCUMENTATION STATUS
**Audit Date:** 2026-07-30  
**Source:** Cross-reference between `docs/` files, `.ai/CURRENT/` files, and actual repository code

---

## Correct Documentation (matches code)

| Document | Location | Verified Claim |
|---|---|---|
| Decision Intelligence Architecture | `docs/DECISION_INTELLIGENCE_ARCHITECTURE.md` | Engine structure, 5-stage DVE pipeline, evidence subsystem, confidence dimensions — all match `lib/decision-intelligence/` code exactly |
| Decision Intelligence Readiness | `docs/DECISION_INTELLIGENCE_READINESS.md` | "Library complete, not integrated" — confirmed by code inspection |
| Plan enforcement SQL | `supabase/plan-enforcement.sql` | 4 plans (STARTER/PROFESSIONAL/AGENCY/ENTERPRISE) match `types/plan.types.ts` |
| Research tables SQL | `supabase/research-tables.sql` | `research_requests` module constraint matches routes; constraint expansion is in same file |
| Prisma schema comments | `prisma/schema.prisma` | Report and ApiUsage correctly marked LEGACY in schema comments |
| DECISIONS.md | `.ai/CURRENT/DECISIONS.md` | DEC-001 through DEC-007 all reflect actual code decisions |
| ACTIVE_SPRINT.md session 3 | `.ai/CURRENT/ACTIVE_SPRINT.md` | All DI library files listed match the filesystem exactly |
| Plan limits | `types/plan.types.ts` | STARTER=20, PROFESSIONAL=100, AGENCY=300, ENTERPRISE=unlimited — matches `supabase/plan-enforcement.sql` |
| Admin API routes | `docs/` + CURRENT files | `/api/admin/check`, `/api/admin/users`, `/api/admin/users/[id]/plan` all exist as documented |
| Test count 194 tests | `CURRENT_STATE.md` | Last verified 2026-07-21; cannot re-verify without running tests (Supabase deleted) |

---

## Outdated Documentation (does NOT match code)

### 1. Production URL — STALE in README and PROJECT_CONTEXT

| Document | What it says | What is correct |
|---|---|---|
| `README.md` | `https://ai.halannews.com` | `https://intelligence.eunoiazones.com` |
| `.ai/CURRENT/PROJECT_CONTEXT.md` | `https://ai.halannews.com` | `https://intelligence.eunoiazones.com` |

**Risk:** Any external party or new AI session reading these files gets wrong production URL.

---

### 2. MASTER_PROJECT_MEMORY.md sections 1–15 — STALE

| Stale claim | Reality |
|---|---|
| Project name: "UNKNOWN" | Project name: `eunoia-platform` |
| Phase: "Decision Intelligence Foundation — Pre-Implementation" | Phase: "Documentation and Architecture Complete. Awaiting Infrastructure Recovery." |
| "Remaining Work: Define the Decision Intelligence Engine" | DI Engine is FULLY IMPLEMENTED (15 files, 61 tests) |

**Note:** A corrective delta was appended at the bottom of the file on 2026-07-21 that overrides these sections. The file is internally inconsistent — it contradicts itself. The delta is accurate; the older sections are wrong.

---

### 3. PROJECT_CONTEXT.md env vars — INCOMPLETE

Missing env vars not listed in `PROJECT_CONTEXT.md`:
- `AI_PROXY_URL` — second proxy var used in some routes
- `SEARCH_DAILY_QUOTA_PER_USER` — per-user sub-quota (distinct from `SEARCH_DAILY_QUOTA`)
- `ADMIN_EMAILS` — required for admin console

Also listed incorrectly:
- `SUPABASE_SERVICE_ROLE_KEY` listed as "Optional" — it is **Required** for admin console, account deletion, and demo leads.

---

### 4. CURRENT_SYSTEM_MAP.md — SUPERSEDED (entirely stale)

Per the 2026-07-21 delta, `CURRENT_SYSTEM_MAP.md` contains multiple false claims:
- "No test framework exists" → Vitest 4.1.9 exists; 194 tests pass
- "company-validation, dedup, source-quality, company-expansion, ApolloAdapter don't exist" → All exist in `lib/research/`
- "`proxy.ts` is root middleware" → `proxy.ts` exports function named `proxy`, so Next.js does NOT execute it as middleware

The file should have a SUPERSEDED header pointing to `docs/MODULE_INVENTORY.md`.

---

### 5. `proxy.ts` — Documented as middleware, is not middleware

| What docs say | What code shows |
|---|---|
| "Root middleware: proxy.ts at repository root" (multiple docs) | `proxy.ts` exports function named `proxy`. Next.js only treats `middleware.ts` (or `middleware.js`) as middleware. This file is NOT intercepting any request. |

**Risk:** The platform has NO active root middleware. Auth relies entirely on per-route checks.

---

### 6. Supabase "6 migrations" — No migrations directory exists

| What docs say | What code shows |
|---|---|
| TASK_QUEUE.md: "Apply 6 SQL migrations (supabase/migrations/001_*.sql through 006_*.sql)" | `supabase/` directory has no `migrations/` subdirectory. There are 6 SQL files flat in `supabase/` but they are not named `001_*.sql` through `006_*.sql` |

**Reconciliation:** The 6 SQL scripts in `supabase/` correspond to the "6 migrations" but are named by function, not by number. No numbered migration directory exists.

---

### 7. AI Demo Provider — documentation conflict

| Document | What it says |
|---|---|
| `PROJECT_CONTEXT.md` | "AI (Demo): Cloudflare Worker proxy → Claude Opus 4.8" |
| `.env.example` | `CLOUDFLARE_WORKER_URL=https://halannews.com/api-proxy` |
| Actual worker (`eunoia-worker.js`) | Routes to OpenAI, not Anthropic/Claude |

**Risk:** Document says Claude, worker appears to use OpenAI. Needs verification at Cloudflare.

---

### 8. `eslint-config-next` version mismatch

| `package.json` | Next.js version | eslint-config-next version |
|---|---|---|
| Current | ^16.2.6 | 15.3.0 (no caret) |

This is a minor version mismatch. Lint works (confirmed passing) but the config should be aligned.

---

## Missing Documentation

| What is missing | Priority |
|---|---|
| No `middleware.ts` at root — no documentation explains how auth is enforced without it | HIGH |
| Business rules definitions for Real Estate, Leads, Talent domains | HIGH (Sprint 4 prerequisite) |
| `decisions` Supabase table SQL | HIGH (Sprint 4) |
| `TrustScore` type definition | MEDIUM (Sprint 4) |
| Supabase TypeScript types regeneration | MEDIUM |
| Runbook for restoring deleted Supabase project | HIGH (Sprint 1) |
| `.env.local.example` vs `.env.example` — two example files exist, one may be stale | LOW |

---

## Duplicated Documentation

| Item | Duplication |
|---|---|
| `docs/DEPENDENCY_GRAPH.md` vs `docs/PROJECT_DEPENDENCY_DAG.md` | Both document module dependency graphs. DAG is more complete. DEPENDENCY_GRAPH.md is historical context. Acknowledged in SPRINT_MEMORY.md. |
| Multiple investor review packages | `investor-package/`, `Investor Package/`, `investor-review/`, `investor-review-v2/` — 4 folders with overlapping investor pitch content |
| Plan limits defined in both `types/plan.types.ts` (Supabase) and `prisma/schema.prisma` `Plan` enum | Two definitions; Prisma enum is a subset (missing AGENCY) and not used for enforcement |
