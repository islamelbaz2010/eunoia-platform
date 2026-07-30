# Architectural Decision Register

**Date:** 2026-07-21  
**Owner:** Technical Lead  
**Purpose:** Record every architectural decision that has long-term consequences. Enables future contributors to understand WHY the current architecture exists, not just what it is.

**Format per ADR:**
- **Status:** ACTIVE | SUPERSEDED | PROPOSED | DEPRECATED
- **Context:** What problem required a decision?
- **Decision:** What was decided?
- **Rationale:** Why was this option chosen over alternatives?
- **Consequences:** What does this decision make easy, hard, or impossible?

---

## ADR-001 — Supabase as Primary Data Store

**Date:** Pre-2026 (prior to this sprint)  
**Status:** ACTIVE

**Context:** The platform needed authentication, real-time subscriptions capability, and a PostgreSQL database. The team is small (solo founder + AI sessions). Infrastructure management overhead must be minimal.

**Decision:** Supabase is the primary data store for all user data: auth.users, reports, research_requests, user_plans, demo_leads, audit_log, usage_tracking.

**Rationale:**
- Provides managed PostgreSQL with no infrastructure overhead
- Built-in auth with JWT session management compatible with Next.js App Router
- Row Level Security enforces data isolation at database level — no application-layer user filtering required
- Supabase JS client integrates natively with Next.js server components and API routes
- Free tier sufficient for pre-MVP scale

**Consequences:**
- EASY: Adding new tables is fast; RLS provides security without application code changes
- HARD: If Supabase is deleted or unavailable, the entire platform is non-operational (as demonstrated by the current crisis)
- REQUIRED: A Point-in-Time Recovery (PITR) policy must be enabled to prevent data loss
- RISK: Vendor lock-in at data layer; migration to another provider would require significant work

**Open Question:** After infrastructure recovery (Sprint 1), enable PITR in Supabase settings. Also evaluate Supabase's automatic backup retention policy for the chosen plan tier.

---

## ADR-002 — Prisma as Secondary ORM Layer

**Date:** Pre-2026  
**Status:** ACTIVE (partially — legacy role)

**Context:** The platform uses two data access patterns: Supabase JS client (for all RLS-enforced user data) and Prisma ORM (for admin/system-level operations and cross-table joins).

**Decision:** Prisma is retained as a secondary ORM, targeting the same Supabase PostgreSQL database. The `User` and `Workspace` models are active. The `Report` and `ApiUsage` models are LEGACY and unused.

**Rationale:**
- Prisma was the original ORM before Supabase was added
- `Workspace.plan` field provides a Prisma-accessible plan value for admin queries
- The User/Workspace Prisma models are created on onboarding; this is a live code path

**Consequences:**
- COMPLEXITY: Two ORM layers on the same database. Plan data lives in two places: Supabase `user_plans` (authoritative) and Prisma `Workspace.plan` (always 'STARTER', not enforced)
- DEBT: `Workspace.plan` always reads 'STARTER' because plan enforcement uses `user_plans` exclusively. The Prisma plan field is misleading.
- ACTION REQUIRED: Either: (a) remove `Workspace.plan` from Prisma schema and rely on `user_plans` for all plan data, OR (b) sync `Workspace.plan` when plan changes via billing webhook. Decision pending — see ADR-PENDING-001.

---

## ADR-003 — Decision Intelligence Engine as Pure-Function Library

**Date:** 2026-07 (Decision Intelligence Architecture Sprint)  
**Status:** ACTIVE

**Context:** The platform's core product differentiator is explainable, auditable decisions. An AI-first approach (generating text) would produce outputs that are non-reproducible and non-auditable.

**Decision:** The Decision Intelligence Engine is implemented as a pure TypeScript library with no I/O, no database calls, no AI calls in the core. The API is `runDecisionEngine(input: DecisionEngineInput): DecisionEngineOutput`. Same inputs always produce same outputs.

**Rationale:**
- Determinism: reproducibility is a first-class requirement for audit trails
- Testability: pure functions can be tested with unit tests; no mocking of external services
- Explainability: deterministic calculations can explain themselves; AI output cannot
- Separation: AI narration is a caller-side enrichment layer, not part of the core engine
- The "calculate-then-narrate" pattern keeps AI in a secondary role

**Consequences:**
- EASY: Engine can be tested exhaustively with Vitest; 61 tests currently all pass
- EASY: Engine can be called from any API route with no setup (just import and call)
- EASY: Same engine used for Real Estate, Leads, Talent — one codebase, three integrations
- HARD: Business rules must be defined explicitly per domain (no AI-generated rules)
- REQUIRED: Data adapters must be written to convert module-specific inputs to `DecisionEngineInput` type
- CONSTRAINT: AI narration (GPT-4o-mini post-scoring call) is always optional; the Decision Report is valid without it

---

## ADR-004 — Upstash Redis for Rate Limiting and Quota Management

**Date:** Pre-2026  
**Status:** ACTIVE

**Context:** The platform needed per-user rate limiting and global SerpAPI quota management without adding infrastructure.

**Decision:** Upstash Redis (serverless Redis) is used for: 5 req/hr per-user rate limiting, global SerpAPI daily quota (`SEARCH_DAILY_QUOTA=150`), per-user SerpAPI sub-quota (`SEARCH_DAILY_QUOTA_PER_USER=30`), and 24h legacy AI engine response caching.

**Rationale:**
- Upstash is serverless-native (compatible with Vercel Edge and serverless functions)
- No persistent connection management required
- HTTP-based Redis client works in all Next.js environments
- Free tier sufficient for pre-MVP rate

**Consequences:**
- RISK: If Redis is unavailable, quota enforcement fails open — all users get unlimited requests. A Redis outage simultaneously removes both rate limiting and SerpAPI quota controls.
- EASY: Adding new quota types is a new Redis key pattern; no database migration required
- CONSTRAINT: `SEARCH_DAILY_QUOTA_PER_USER` env var is undocumented in `.env.example` — must be added to Vercel env vars and `.env.example` during Sprint 1

---

## ADR-005 — Two-Proxy Architecture (CLOUDFLARE_WORKER_URL vs AI_PROXY_URL)

**Date:** Pre-2026 (implicit — discovered during canonicalization audit)  
**Status:** ACTIVE (but undocumented)

**Context:** Two separate API routes make AI calls through proxy services. The legacy AI engine uses one proxy; the demo generate route uses another.

**Decision (implicit):**
- `services/legacy-ai-engine/orchestrator.ts` uses `CLOUDFLARE_WORKER_URL`
- `app/api/demo/generate/route.ts` uses `AI_PROXY_URL`

**Rationale:** Unknown — this was not an explicit documented decision. The two proxy env vars appear to have evolved independently. Both default to `https://halannews.com/api-proxy` if the env var is not set.

**Consequences:**
- COMPLEXITY: Two env vars for the same apparent purpose (AI proxy)
- RISK: Setting one but not the other produces subtle breakage (demo works but Real Estate AI doesn't, or vice versa)
- ACTION REQUIRED: Determine whether these should be unified to one env var and one proxy configuration. See ADR-PENDING-002.

---

## ADR-006 — Plan Enforcement via Supabase user_plans Table

**Date:** Pre-2026  
**Status:** ACTIVE

**Context:** The platform needed server-side plan enforcement that could not be bypassed by client-side code.

**Decision:** Plan limits are enforced at the API route level using `checkPlanLimit()` from `lib/research/plan-enforcement.ts`. The function reads from the Supabase `user_plans` table. Plan tiers: STARTER=20 reports/month, PROFESSIONAL=100, AGENCY=300, ENTERPRISE=unlimited.

**Rationale:**
- Server-side enforcement cannot be bypassed by UI manipulation
- Supabase `user_plans` table is the single source of truth for billing state
- Prisma `Workspace.plan` was kept but is always 'STARTER' and is not used for enforcement

**Consequences:**
- CRITICAL GAP: `/api/intelligence` (Real Estate) does NOT currently call `checkPlanLimit()`. Only research routes enforce limits. Sprint 5 must fix this.
- RISK: If `user_plans` table is empty for a user (e.g., newly created account), plan enforcement behavior is undefined. Test this case.

---

## ADR-007 — proxy.ts Does Not Execute as Next.js Middleware

**Date:** Discovered 2026-07-21 (Canonicalization Sprint)  
**Status:** ACTIVE (documenting a discovered defect, not an intentional decision)

**Context:** A file named `proxy.ts` exists at the repository root. Documentation claimed it was the root middleware. Investigation revealed it exports a function named `proxy` (not `middleware`). Next.js requires: (a) filename `middleware.ts` at project root, (b) exported function named `middleware`.

**Decision:** The current `proxy.ts` is dead code at the middleware layer. No decision was made to have no middleware — this is an accidental state.

**Consequences:**
- SESSION REFRESH is not occurring on every request
- `/dashboard` protection relies solely on the layout server component auth check
- Sprint 3 must rename `proxy.ts` → `middleware.ts` and rename the function

**Action:** Sprint 3 (Root Middleware + Security Baseline) addresses this.

---

## ADR-008 — AI Provider: OpenAI GPT-4o-mini Only

**Date:** Pre-2026  
**Status:** ACTIVE

**Context:** The platform needed an AI provider for: legacy AI engine report generation (35 types), demo report generation, and future Decision Intelligence narration.

**Decision:** OpenAI GPT-4o-mini is the sole AI provider. All calls go through proxy services (`CLOUDFLARE_WORKER_URL` for legacy engine, `AI_PROXY_URL` for demo).

**Rationale:** Unknown (pre-dates this audit). Cost-effectiveness of GPT-4o-mini for high-volume report generation is likely a factor.

**Consequences:**
- Single provider dependency: an OpenAI outage affects all AI features
- No fallback provider configured
- Vercel AI SDK (`ai: ^4.3.16`) is installed but its multi-provider capabilities are unused
- OPTION: Vercel AI Gateway (GA since August 2025) supports multi-provider failover with the same SDK — could add Anthropic Claude as fallback without changing application code

---

## ADR-PENDING-001 — Prisma Workspace.plan Field: Sync or Remove

**Date:** 2026-07-21  
**Status:** PROPOSED — DECISION REQUIRED

**Context:** The Prisma `Workspace.plan` field always reads 'STARTER'. It is misleading: a PROFESSIONAL plan user would have `Workspace.plan = 'STARTER'` in Prisma while `user_plans.plan = 'PROFESSIONAL'` in Supabase.

**Option A:** Remove `Workspace.plan` from Prisma schema. All plan queries go to `user_plans` via Supabase client.  
**Option B:** Sync `Workspace.plan` in the billing webhook: when `user_plans` is updated, also update `Workspace.plan`.

**Recommended:** Option A — remove the field. Maintaining two sources of truth for the same data is the root cause of this confusion. After billing is integrated (Sprint 6), all plan reads should use `user_plans` exclusively.

**Decision Required:** Founder / technical lead approval before Sprint 6.

---

## ADR-PENDING-002 — Unify Proxy Environment Variables

**Date:** 2026-07-21  
**Status:** PROPOSED — DECISION REQUIRED

**Context:** Two env vars (`CLOUDFLARE_WORKER_URL` and `AI_PROXY_URL`) serve what appears to be the same function (routing AI calls through a proxy) but are used by different parts of the codebase.

**Option A:** Unify to one env var (`AI_PROXY_URL`) and update both callers to use it.  
**Option B:** Keep separate env vars, document both clearly, and ensure both are set in Vercel.  
**Option C:** Remove the proxy layer and call OpenAI directly using `OPENAI_API_KEY` in both locations.

**Recommended:** Option C if `OPENAI_API_KEY` can be set directly in Vercel (no need for a proxy). Option B if the proxy is required for cost or routing reasons. Determine which proxy is actually in use and why before deciding.

**Decision Required:** Founder must clarify purpose of both proxy endpoints before Sprint 3.

---

## ADR-PENDING-003 — Billing Provider Selection

**Date:** 2026-07-21  
**Status:** PROPOSED — DECISION REQUIRED

**Context:** Sprint 6 (Billing Integration) requires a payment provider. No provider has been selected or integrated.

**Options:**
- **Stripe** — industry standard; excellent webhook support; Stripe Radar for fraud; documentation is comprehensive
- **LemonSqueezy** — simpler setup for SaaS; handles VAT/tax automatically for digital products (relevant for MENA customers)
- **Paddle** — merchant of record; handles tax compliance globally

**Recommended:** Stripe (most documentation, most Next.js examples, most predictable behavior).

**Decision Required:** Founder must choose provider before Sprint 6 begins.

---

## ADR-PENDING-004 — APM Provider Selection

**Date:** 2026-07-21  
**Status:** PROPOSED — DECISION REQUIRED

**Context:** Sprint 9 (Observability) requires an APM provider. No provider is configured.

**Options:**
- **Sentry** — error tracking + performance; Next.js SDK is maintained; generous free tier
- **Vercel Observability** — native Vercel integration; zero-config; limited compared to dedicated APM
- **Axiom** — structured log ingestion; excellent Vercel integration; cost-effective at scale

**Recommended:** Sentry for errors + Vercel Observability for request metrics. Low setup cost; covers the primary monitoring needs.

**Decision Required:** Founder must choose provider before Sprint 9 begins.

---

*ADR Register is append-only for ACTIVE decisions. PENDING decisions become ACTIVE or DEPRECATED when resolved.*
