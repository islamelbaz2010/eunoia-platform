# Execution Rulebook

**Date:** 2026-07-21  
**Owner:** Technical Lead  
**Status:** MANDATORY — all sprints, all AI sessions, all contributors

---

## Authority

This rulebook governs all work in this repository. Rules apply equally to human contributors and AI sessions. If a rule is violated, the work produced is invalid and must be reverted before proceeding.

No rule may be suspended without explicit written approval from the founder recorded in `docs/ADR_REGISTER.md`.

---

## Part I — The Chain of Dependency

### RULE-01: Never Implement Before Infrastructure

Do not write implementation code for any module that depends on Supabase until Step 1 of `docs/CRITICAL_PATH.md` is verified complete.

**Why:** Implementation against a deleted database is write-only work. Tests cannot run. Routes return 500s. Auth cannot be verified. The code cannot be confirmed correct.

**Exception:** Pure-function library code with no Supabase dependency may be implemented (e.g., Decision Intelligence Engine, research pipeline library functions). Test them with Vitest.

---

### RULE-02: Never Skip the Critical Path

Do not begin any step in `docs/CRITICAL_PATH.md` before its declared prerequisites are verified complete.

**Why:** The dependency chain is causal, not advisory. Billing cannot be integrated before plan enforcement is correct. Plan enforcement cannot be verified before Supabase is operational. Decision Intelligence cannot be integrated before routes are secured.

**How to verify a prerequisite is complete:** Run the Exit Criteria defined in `docs/EXIT_CRITERIA.md` for that step. Pass all checks before moving to the next step.

---

### RULE-03: Never Bypass the Dependency Graph

Do not integrate module X into route Y if the dependency analysis in `docs/PROJECT_DEPENDENCY_DAG.md` shows an unresolved dependency between them.

**Why:** An integration built on an unresolved dependency will fail in production even if it compiles successfully. The dependency graph is the ground truth for build order.

---

## Part II — Code Discipline

### RULE-04: No Production Code Changes in Documentation Sprints

When a sprint is declared as "documentation only" (as in the Canonicalization Sprint and Final Executive Documentation Sprint), no production code may be modified.

**Scope of "production code":** API routes, library modules, UI components, database migrations, configuration files (`next.config.ts`, `middleware.ts`, `vercel.json`, `package.json`, `prisma/schema.prisma`, `.env*`), and any TypeScript source file.

**What is permitted in documentation sprints:** Files inside `docs/`, `.ai/`, `README.md`, and other pure documentation locations.

**Why:** Documentation sprints assess current state without changing it. Changing code during assessment would invalidate the assessment.

---

### RULE-05: Never Modify Completed Modules Without Explicit Scope

The following modules have been marked complete and commercially ready. Do not modify them unless the sprint explicitly includes them in scope:

- **Billing** (not started — do not add placeholder code)
- **Authentication flows** (`app/(auth)/`) — complete; no changes without security sprint scope
- **Admin Console** (`app/(admin)/`) — complete; no changes without admin sprint scope
- **Account deletion and export** (`app/api/account/`) — complete; tested
- **Report History** — complete
- **Research Pipeline library** (`lib/research/`) — complete; tested

**Why:** This is the primary anti-regress rule. Every sprint should target specific modules. Collateral edits to adjacent modules are a source of regressions.

---

### RULE-06: All Supabase Writes Use the Correct Client

Rules:
- Server-only routes that require elevated access (admin operations, account deletion) MUST use the Supabase service role client (`createClient` with `SUPABASE_SERVICE_ROLE_KEY`)
- All other server routes MUST use the authenticated user client (derived from the session)
- The service role key MUST never appear in any client-bundle file or `NEXT_PUBLIC_*` env var
- The service role key MUST be verified absent from `.next/static/` before any deployment

**Why:** The service role key bypasses Row Level Security. Exposing it to the client would allow any user to read or modify any other user's data.

---

### RULE-07: All New API Routes Must Enforce Plan and Rate Limits

Every new API route that consumes a quota-limited resource (AI calls, search calls, report generation) MUST:

1. Check auth before any processing
2. Call `checkPlanLimit()` before generating output
3. Apply rate limiting via Upstash Redis
4. Track usage in `usage_tracking` table
5. Return `401 Unauthorized` if not authenticated
6. Return `402 Payment Required` if plan limit exceeded
7. Return `429 Too Many Requests` if rate limit hit

**Why:** Consistency of enforcement. One unguarded route creates an exploit path for unlimited usage.

---

### RULE-08: No Untyped Supabase Queries

After Step 1 of the Critical Path is complete and `SUPABASE_SERVICE_ROLE_KEY` is set:

1. Run `npx supabase gen types typescript --project-id <id> > types/supabase.types.ts`
2. Remove all `supabase as any` casts from research routes
3. Remove all `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comments in those routes

**Why:** The current stub type file makes all Supabase queries untyped. This means Supabase schema changes (column renames, type changes) produce no TypeScript errors — only runtime failures in production.

---

### RULE-09: Never Define Business Rules Inside Route Handlers

Decision Intelligence business rules MUST be defined in dedicated files under `lib/decision-intelligence/rules/`:
- `lib/decision-intelligence/rules/real-estate.ts`
- `lib/decision-intelligence/rules/leads.ts`
- `lib/decision-intelligence/rules/talent.ts`

Business rules MUST NOT be embedded in API route handlers or UI components.

**Why:** Rules are domain logic. Route handlers are transport logic. Mixing them makes rules impossible to test, audit, and version independently.

---

### RULE-10: Decision Intelligence Engine Is Always the Source of Truth for Scores

Do not compute confidence scores, weights, or recommendations outside of `runDecisionEngine()`. Do not shadow its calculations with manual scoring in routes or UI components.

**Why:** The calculate-then-narrate pattern depends on determinism. If any layer recomputes scores differently, the explainability output becomes incorrect. Same inputs must always produce same scores.

---

## Part III — Testing Discipline

### RULE-11: All New Library Code Must Have Tests

Any new file added to `lib/` must have a corresponding test file in the same directory under `__tests__/` or co-located as `*.test.ts`.

**Minimum coverage for new library code:**
- Happy path: at least one test
- Edge case: at least one boundary test
- Error path: at least one failure test

**Why:** The Decision Intelligence Engine and research pipeline reached production quality because they have tests. The legacy AI engine has zero tests and is the platform's highest-risk code. New code must not repeat this pattern.

---

### RULE-12: Never Merge Code That Breaks the Test Suite

Run `npx vitest run` before declaring any sprint complete. All 194 tests must pass. New tests must also pass.

**Why:** 25 test files / 194 tests currently all pass. This is the platform's primary quality signal. A failing test suite means the platform is not ready to ship.

---

### RULE-13: API Route Tests Are Required Before Billing Sprint

Before beginning the Billing Integration sprint, at least one test must exist for each of the following routes:
- `/api/intelligence` (plan limit enforcement)
- `/api/research/leads` (plan limit, rate limit, quota)
- `/api/admin/users/[id]/plan` (admin-only access)

**Why:** Billing is downstream of plan enforcement. If plan enforcement has bugs, billing will produce incorrect charges or under-enforce limits.

---

## Part IV — Knowledge Management

### RULE-14: Update Sprint Memory at End of Every Session

Before ending any session:
1. Append a session record to `.ai/CURRENT/SPRINT_MEMORY.md` with: date, scope, completed work, decisions made, outstanding items
2. Update `.ai/CURRENT/TASK_QUEUE.md` to reflect current next actions
3. Update `docs/PROJECT_EXECUTION_MASTER.md` status table if any module changed

**Why:** `docs/BOOTSTRAP_VALIDATION.md` proved that stale memory files cause new AI sessions to rebuild completed work or make incorrect assumptions. The session record is the primary synchronization mechanism.

---

### RULE-15: Never Trust MASTER_PROJECT_MEMORY.md for Current Phase

Until `MASTER_PROJECT_MEMORY.md` is repaired (Step 2 of Critical Path), every AI session must:
1. Read `docs/PROJECT_EXECUTION_MASTER.md` as the primary current-state document
2. Read the bottom of `.ai/CURRENT/SPRINT_MEMORY.md` for the most recent session
3. NOT treat `MASTER_PROJECT_MEMORY.md` as authoritative for anything after 2026-06-01

**Why:** The file currently says Decision Intelligence is "Pre-Implementation." It is completely built (15 files, 61 tests). A session that trusts this file will attempt to redesign and rebuild the engine from scratch.

---

### RULE-16: Document Architectural Decisions in the ADR Register

Any decision that:
- Changes the choice of external provider (e.g., switching from SerpAPI to another search provider)
- Changes the data model
- Changes the plan tier structure or enforcement mechanism
- Changes the billing provider
- Changes the authentication provider
- Retires or deprecates a module

...MUST be recorded in `docs/ADR_REGISTER.md` with: decision ID, date, context, decision, rationale, and consequences.

**Why:** These decisions have long-term consequences. Undocumented decisions become invisible dependencies that are violated by future changes.

---

## Part V — Security

### RULE-17: Never Commit Secrets

Never commit `.env`, `.env.local`, `.env.production`, or any file containing real API keys, service role keys, or connection strings.

`.gitignore` already excludes `.env.local`. Verify before every commit that no secret file is staged.

**Why:** A leaked `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` in git history requires key rotation and potentially exposes all user data. This is irreversible.

---

### RULE-18: The `debug-env` Route Must Never Return Secrets

`app/api/debug-env/route.ts` currently returns `{ ok: false }` with HTTP 404. This is correct. Do not change it to return environment variable values, even in a non-production check.

**Why:** Any route that reflects environment variables is a potential secret exfiltration vector. The route exists as a dead endpoint and should remain dead.

---

### RULE-19: Admin Routes Must Validate Admin Identity Before Any Operation

`app/api/admin/` routes must call `isAdminUser()` from `lib/admin/auth.ts` before any read or write. The check must be the first operation after auth verification.

**Why:** Without this check, any authenticated user could call admin endpoints and modify other users' plans or access private user data.

---

## Part VI — Isolation

### RULE-20: This Repository Is Independent

This repository (`eunoia-platform`) is completely independent. No references to, imports from, copies of, or comparisons with any other repository. No files moved between repositories.

All work stays inside this repository. All documentation describes only this repository's code.

**Why:** Cross-repository contamination is the primary cause of documentation hallucination. When an AI session references another repo, it risks applying incorrect context, outdated patterns, or conflicting data models to this codebase.

---

### RULE-21: Do Not Modify Unrelated Modules

Every sprint has a defined scope. Work is only permitted within that scope. If an adjacent module appears broken or improvable during a sprint, log it in `docs/TECHNICAL_DEBT_REGISTER.md` and continue. Do not fix it during the current sprint.

**Why:** Unbounded scope is the primary cause of regressions. A billing sprint that fixes an authentication edge case introduces risk in a module that wasn't being tested or reviewed.

---

*Execution Rulebook is mandatory. No exceptions without ADR.*
