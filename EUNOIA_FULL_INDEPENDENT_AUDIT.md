# Eunoia Intelligence Platform — Full Independent Audit

**Date:** 2026-06-18/19
**Branch audited:** `research-intelligence-v2-data-layer`, HEAD `08d1795` (pushed to `origin`, confirmed durable)
**Methodology:** Direct code/git inspection in this session, plus four independent research passes (architecture/dead-code, security, research-quality, infra/cost) whose raw findings were spot-checked against the actual files before being included here.

## Methodology Caveat — Read This First

This sandbox's network egress policy blocks `serpapi.com`, `vercel.com`, and `ai.halannews.com` directly ("Host not in allowlist"). **I could not independently call the live production site.** Every claim in this report about *deployed* behavior rests on one of two things: (a) static analysis of the code that is provably committed and pushed to `origin/research-intelligence-v2-data-layer`, or (b) the `/api/debug-env` response you reported in chat (`hasSerpApi/hasOpenAI/hasSupabase: true`, `nodeEnv: production`) — which I did not re-verify myself, but which is internally consistent with this exact branch's code (the `hasSupabase` field only exists starting at commit `08d1795`, the current tip), so it's good circumstantial evidence this branch is what Vercel is actually serving. I'm flagging this explicitly rather than implying I watched it happen, per this engagement's standing rule against fabricating verification.

I also have no access to: Vercel's dashboard/usage data, Supabase's dashboard (whether the SQL migrations were actually run against the live DB), OpenAI/SerpAPI billing, or any analytics/usage telemetry. Anywhere this report says "estimated" or "cannot confirm," that's a real gap in what code alone can tell you — not a hedge.

---

## 1. Executive Summary

Eunoia is a Next.js 16 / Supabase / Prisma SaaS that grew from a single-purpose "Marketing Intelligence Engine" (AI-generated reports for real estate/marketing scenarios, via direct OpenAI prompt completions) into a broader "Research Intelligence" platform with two new live features — Lead Finder (real SerpAPI search + page-fetch + heuristic ranking + grounded AI summarization) and Talent Finder (a pure OpenAI prompt completion with no external data at all). Both new features, plus usage-tracking and plan-enforcement scaffolding, were built and validated in this session and are now pushed to `origin` and (per your report) live in production.

**The engineering is competent but the product has no moat, and there are unresolved Critical issues live in production right now**: two unauthenticated debug endpoints leaking infra config to the public internet, an unauthenticated user-creation endpoint, a shared (not per-user) daily search quota that will starve every user once one user/attacker exhausts it, and a cost-control chain (rate limiter + plan enforcement) that is explicitly designed to fail open — meaning any infra hiccup, or simply never having run the SQL migrations against the live DB, silently turns into unlimited OpenAI/SerpAPI spend with no alarm. Talent Finder produces AI-guessed salary data with a confidence score that measures form-completeness, not accuracy — it is not a research feature in the sense the brand name implies, though the code does carry a disclaimer.

This is an early-stage technical prototype with real but thin functionality, not a defensible product. There is no evidence anywhere in the codebase of actual usage, paying customers, or retention — this audit cannot speak to market validation, only to what the code does.

---

## 2. Technical Audit

### 2.1 Phase 1 — Current State Validation

| Feature | Status | Evidence | Risk Level | Recommendation |
|---|---|---|---|---|
| Lead Finder | **Production-ready (shallow)** | `app/api/research/leads/route.ts`, `lib/research/acquisition/*` — real SerpAPI search → page fetch → keyword ranker → grounded AI summary | Medium (ranking false-positives, single-point batch failure) | Ship, but fix ranker before marketing "evidence-based" |
| Talent Finder | **Production-ready, but ungrounded** | `app/api/research/talent/route.ts` — zero external fetch, pure `gpt-4o-mini` completion | Medium (trust/accuracy risk, mitigated by an explicit disclaimer string in the output) | Either add real source grounding (job-board APIs/salary datasets) or rename/reposition away from "Finder," which implies discovery of real data |
| Legacy AI report engine (`/api/intelligence`, 5 report types: Feasibility, Campaign ROI, Market Entry, Lead Gen, Full Analysis) | **Production-ready** | `app/api/intelligence/route.ts`, `services/legacy-ai-engine/*`, surfaced at `/dashboard/real-estate` | Low | This is the most mature module in the repo — likely the actual current product, not legacy in the "dead" sense |
| Usage tracking (`credits_used`) | **Code complete, DB state unconfirmed** | `supabase/usage-tracking.sql`, written but "run manually in SQL editor" per its own header; no migration runner | High (if not applied, every insert referencing `credits_used` either fails or, per Postgres semantics, is silently ignored depending on column existence) | Confirm via Supabase dashboard today; this gates whether tracking is real anywhere |
| Plan enforcement (`user_plans`, `checkPlanLimit`) | **Code complete, fails open, DB state unconfirmed** | `lib/research/plan-enforcement.ts:56-58`, `supabase/plan-enforcement.sql` | **Critical** | Same as above — and even once applied, every real user defaults to STARTER with no plan-assignment UI, so paid tiers are currently theoretical |
| Rate limiting | **Live, Redis-backed, fails open** | `lib/research/rate-limit.ts`, `lib/redis/client.ts` — Upstash REST, 5 req/hr per module per user | High (silent bypass if Upstash env vars are ever unset) | Add alerting on the fail-open path, not just a silent catch |
| SerpAPI search quota | **Live, global (not per-user)** | `lib/research/acquisition/quota.ts:11-13` — single Redis key `quota:search-provider:${date}`, no user ID | **Critical for multi-tenant viability** | Must become per-user or per-plan before this can be sold as a metered product |
| Debug endpoints (`/api/debug/env`, `/api/debug-env`) | **Live in production, unauthenticated** | Both confirmed zero auth checks; reportedly reachable on `ai.halannews.com` right now | **Critical** | Delete both immediately (see §12) |
| `users/init` endpoint | **Live, unauthenticated** | `app/api/users/init/route.ts` — no session check, creates Workspace+User from any POSTed `email`/`supabaseId` | **Critical** | Add auth check before this ships to anyone outside a controlled signup flow |
| Prisma layer | **Live, narrowly scoped** | Only used by `users/init` and `workspace` routes for onboarding bootstrap; all report data is Supabase-only | Low | Valid pattern, not dead code, but document it so future engineers don't assume Prisma is the source of truth for reports |
| Legacy `intelligence`/`feasibility` standalone dashboard pages | **Do not exist** (already consolidated into `/dashboard/real-estate`) | Confirmed no such files on disk | None | Nothing to clean up here — prior audit docs describing these as separately "dead" were stale |
| Repo root clutter (15 `.md` audit/planning docs) | **Live in `origin/main`'s sibling history and this branch** | `ls *.md` → 15 files at repo root | Low (hygiene, not function) | Move to `/docs/audits/` or delete before any external eyes (investor, new hire) see the repo |

### 2.2 Phase 2 — Architecture Audit

- **Two parallel "report" systems by design, not accident.** The legacy AI engine (`services/legacy-ai-engine/` + `/api/intelligence`) and the new Research Core Engine (`lib/research/acquisition/`) both write into the same Supabase `reports` table via different `report_type` values. This isn't broken, but it means there are now two different mental models for "how a report gets made" in one codebase — one prompt-template-driven, one pipeline-driven — and no document in the repo says which one new modules should follow going forward.
- **Prisma/Supabase split is real but under-documented.** Prisma bootstraps `User`/`Workspace` at signup; Supabase owns everything else (`research_requests`, `reports`, `user_plans`, `demo_leads`). This is a legitimate "auth bootstrap in one store, app data in another" pattern, but it means a future engineer reading `prisma/schema.prisma` and seeing a `Plan` enum (`STARTER/PROFESSIONAL/ENTERPRISE`) will reasonably but incorrectly assume that's what gates the research routes — it isn't; `types/plan.types.ts`'s separate `UserPlan` (with an added `AGENCY` tier) does that. Two plan concepts, same names, different backing stores — a real maintainability trap.
- **Module-level singletons (`getResearchService()`, the Redis client, Prisma's global client) are standard Next.js serverless patterns**, not bugs, but `getResearchService()`'s `SerpApiProvider` specifically captures `process.env.SERPAPI_API_KEY` once at first construction and never re-reads it — this was the literal root cause investigated earlier this session and is worth keeping in mind for any future env-var rotation: a warm instance won't pick up a new key without a redeploy/cold start.
- **The SerpAPI daily quota counter is architecturally a single global bottleneck** (`quota.ts`), which is the most consequential architecture finding in this audit: it means the system, as built, **cannot support multiple paying tenants with independent usage** — one tenant's usage directly degrades every other tenant's access for the rest of the day. This contradicts the entire purpose of the plan-enforcement layer being built in parallel (Starter/Professional/Agency/Enterprise) — there's no point having per-user monthly caps if the underlying search capacity is a single shared daily pool that any one user can exhaust in minutes.
- **No CI pipeline visible in the repo** (no `.github/workflows`), so `npm run build`/`tsc --noEmit` are run manually per-session, not gated automatically on push — this is consistent with the "deploy from a non-`main` feature branch" pattern observed, which is itself an operational anti-pattern for anything beyond a single-developer prototype phase.

### 2.3 Phase 3 — Code Audit & Prioritized Remediation

**Dead code:** none significant — Prisma's `Report`/`ApiUsage` models are marked legacy in comments but that's documentation, not dead code (they're not imported, but they're not pretending to be live either, given prior in-engagement decisions).

**Duplication:** the `Plan`/`UserPlan` double-type described above; no duplicate rate-limiters or Supabase client factories found.

**Security risks (full detail in §4):** unauthenticated debug endpoints, unauthenticated `users/init`, fail-open cost controls, global search quota.

**Performance/race conditions:** the global SerpAPI quota counter (`quota.ts:26-46`) does a read-then-write without atomic increment-and-check in a single step for the zero-case (`if used === 0, set; else incr`) — under concurrent first-requests-of-the-day this has a narrow race where two simultaneous requests could both see `used === 0` and both `set` to `1` instead of one becoming `2`, undercounting by one. Low impact given the quota is already systemically broken by being global, but worth folding into the same fix.

**Missing validation:** `users/init` trusts client-supplied `supabaseId` as the row's primary key with no verification it matches an authenticated session — this is the same root issue as the missing auth check, not a separate validation gap.

**Error handling:** consistently fail-open across rate-limit, quota, and plan-enforcement — a deliberate, documented convention, but its cumulative effect (three independent layers, all fail open) compounds into the cost-exposure finding in §4. A consistent convention applied three times without anyone tallying the combined effect is itself the bug.

**Prioritized remediation (highest impact first):**
1. Add auth check to `users/init` (trivial fix, currently exploitable)
2. Delete or auth-gate both debug endpoints (trivial fix, currently exploitable)
3. Make the SerpAPI quota per-user/per-plan instead of global (moderate fix, blocks any real multi-tenant launch)
4. Confirm `usage-tracking.sql`/`plan-enforcement.sql` are actually applied to the live DB, and add alerting/logging when the fail-open paths in `rate-limit.ts`/`plan-enforcement.ts` actually trigger (currently silent)
5. Resolve the `Plan`/`UserPlan` dual-type confusion with a short doc note, even if not unifying the types
6. Fix the .env.example DB-pooling template (see §5) so the committed default doesn't point newcomers at a non-pooled connection string

---

## 3. Product Audit

**Would users pay for this tomorrow?** Based purely on code-level capability (no usage data available to me): for the legacy AI report engine, plausibly yes — it's the most complete, focused module. For Lead Finder, only as a novelty/lightweight tool — it's a thin single-source web search wrapper, not a verified contact database, and the ranking is naive enough to produce confident-looking false positives. For Talent Finder, no — paying for "talent intelligence" that is provably just an LLM's prior on salary data, however well-disclaimed, is a hard sell once a buyer realizes there's no real data behind it.

**What's missing:** verified contact/entity data, any multi-tenant-safe usage isolation (the global quota blocks this outright), a billing integration (none exists — plan enforcement has no connection to Stripe/Paddle/anything), and any usage/success metrics that would justify a unit-economics argument to a buyer.

**What blocks adoption:** the Talent Finder's lack of grounding will erode trust fast for any informed buyer; the shared search quota means the product degrades for everyone as soon as it has more than a handful of concurrent users — the opposite of what you want at the moment adoption starts working.

**What blocks retention:** no proprietary data advantage anywhere — nothing keeps a user from getting the same SerpAPI results or the same LLM guesses elsewhere for less.

**What blocks scale:** the global daily search quota, full stop — this is a hard architectural ceiling, not a tuning knob.

**What blocks enterprise sales:** no SSO, no audit logging, no SOC2/security posture (and actively the opposite — two unauthenticated debug endpoints live in prod), no SLA story, no multi-seat/workspace billing wired to anything real.

### Module scoring (0–10, my independent judgment from code capability only — no market data)

| Module | Usefulness | Differentiation | Scalability | Monetization potential |
|---|---|---|---|---|
| Legacy AI report engine | 6 | 4 | 7 | 6 |
| Lead Finder | 5 | 3 | 3 (global quota) | 4 |
| Talent Finder | 3 | 1 | 8 (cheap LLM call) | 2 |
| Usage tracking / plan enforcement infra | 7 (if completed) | n/a | n/a | 2 today (inert pending DB confirmation + no billing) |

### Phase 5 — Research Quality Audit (independent agent findings, spot-checked)

**Lead Finder pipeline, verified real:** SerpAPI search → live page fetch (8s timeout, 500KB cap, graceful `null` fallback to snippet text on failure) → keyword-substring normalizer/ranker → AI summary constrained to the fetched excerpt (`lib/research/acquisition/ai-analysis.ts:33-46`, explicitly instructed to answer only from the given excerpt). No fabricated company ever enters the pipeline — failure modes return fewer/thinner results, never invented ones.

**Concrete ranking flaw, with numbers:** the scorer (`ranker.ts:17-48`) is base 40, +20 own-website / +10 directory / +5 public listing, +15 sector-keyword hit, +15 city-keyword hit, +5 long-text — pure substring matching with no semantic check. A directory page that incidentally contains the target city and a sector word in boilerplate scores **85**, beating a genuinely relevant but sparsely worded company homepage scoring **60**. This is a real, demonstrable false-positive risk for anyone paying for "evidence-based" leads.

**Talent Finder, verified ungrounded:** zero fetch calls anywhere in the route; `confidence_score` is `35 + completeness-bonus + (LLM's own array length bonus)` (`lib/research/sources.ts:89-99`) — a measure of how many form fields were filled and how many profiles the model decided to list, not a measure of accuracy. The salary/demand numbers are pure model priors. A disclaimer string (`estimate_disclaimer`) is present in the output, which is good practice, but doesn't change the underlying lack of evidence.

**Honest competitive framing:** Lead Finder is closer to "Clay without the provider waterfall" — one data source, no contact verification, no firmographic enrichment — not a contender against Apollo/ZoomInfo's curated, telemetry-backed databases. Talent Finder has none of the search→read→cross-check→cite loop that defines Perplexity/OpenAI Deep Research/Gemini Deep Research; it's a single completion call with a market-research framing on top.

**Scores:** Lead Finder — evidence-based-ness 6/10, reliability 5/10. Talent Finder — evidence-based-ness 1/10, reliability 2/10.

---

## 4. Security Audit (Phase 6)

| Finding | Severity | Evidence |
|---|---|---|
| `/api/debug/env` and `/api/debug-env` are unauthenticated and (per your report) live in production | **Critical** | Both files confirmed: zero auth check, return `hasSerpApi`/`hasOpenAI`/`hasSupabase`/`nodeEnv` to anyone |
| `/api/users/init` has no auth check; anyone can create a Workspace+User from arbitrary POST data | **Critical** | `app/api/users/init/route.ts:8-22` — confirmed directly, no `auth.getUser()` call anywhere in the file |
| Rate limiter and plan-enforcement both fail open on any error | **Critical (compounding)** | `lib/research/rate-limit.ts` catch block; `lib/research/plan-enforcement.ts:56-58` — independently each is a reasonable convention, together they mean cost controls can silently be fully inert |
| SerpAPI daily quota is a single global counter, not per-user | **Critical (for multi-tenant cost containment)** | `lib/research/acquisition/quota.ts:11-13`, no user ID in the Redis key |
| `user_plans`/`credits_used` SQL migrations' live-DB status is unconfirmed | **High** | Both `.sql` files are "run manually" with no migration runner; if unapplied, every plan/usage check throws and fails open |
| `app/api/demo/route.ts` uses the service-role key (bypasses RLS) to write `demo_leads` | **Low** | Table itself has a `USING (true)` policy already, so the blast radius of this particular bypass is small, but it establishes the service-role pattern is already in the codebase |
| No hardcoded secrets found in tracked source | **Resolved/Clean** | Grepped all tracked files for `sk-`, `AIza`, `service_role`, JWT patterns — only placeholders in `.env*.example` |
| Research routes (`leads`, `talent`) — auth + RLS correctly enforced | **Resolved/Clean** | Both check `auth.getUser()` and use the RLS-respecting client; `reports`/`research_requests` RLS policies scope by `auth.uid()` |

**Worst-case cost exposure (explicit assumptions: SerpAPI $0.015/search, gpt-4o-mini $0.15/1M in + $0.60/1M out):**
- Rate limiter intact, plan enforcement intact: ~$0.08/hour per account — trivial.
- Rate limiter bypassed (e.g., Upstash env vars unset) — unbounded, scaling linearly with attacker request volume; back-of-envelope at a sustained 10 req/sec this is on the order of **hundreds of dollars per hour**.
- Rate limiter intact but plan enforcement inert (DB migrations never applied) — roughly **$115/month per single account** with no ceiling ever engaging, since STARTER's 20/month cap never fires.
- Both inert simultaneously — unbounded, limited only by your SerpAPI/OpenAI account-level throughput caps.

This is the single most important number in this report for a financial-risk conversation: **the system's only real cost ceiling today is whichever provider-side spending cap you've set directly in the OpenAI and SerpAPI dashboards** — not anything in this codebase, until the two SQL migrations are confirmed applied and the global quota is fixed.

---

## 5. Infrastructure Audit (Phase 7)

**Paid dependencies, all required:** OpenAI (gpt-4o-mini), SerpAPI, Upstash Redis (cache + rate limit + quota — `lib/redis/client.ts` throws if unconfigured), Supabase (Postgres + Auth), Vercel hosting. `resend` is present in `package.json` for transactional email but wasn't traced further in this audit.

**Rough monthly cost** (stated assumptions: SerpAPI ~$0.013/search or $50/mo for 5,000 searches; gpt-4o-mini at ~2,000in/1,000out tokens per call ≈ $0.0009/call; Supabase free→Pro $25/mo; Vercel Pro $20/mo base):
- 10 users × 5 reports/mo: **≈ $21–25/mo**
- 100 users × 5 reports/mo: **≈ $58–95/mo**
- 1,000 users × 5 reports/mo: **≈ $230–330/mo**, dominated by SerpAPI plan tier and Vercel function usage — OpenAI cost is negligible at every tier given the token budget involved.

**Scaling bottlenecks:**
- **DB connection pooling is correctly templated in `.env.local.example` (pgbouncer pooler on `DATABASE_URL`, raw connection only for `DIRECT_URL`) but `.env.example` — the file new engineers actually copy from — points both URLs at the same unpooled `5432` host.** Anyone provisioning from the committed template, rather than the gitignored local example, will under-provision connection pooling and risk exhausting Postgres connections under concurrent serverless invocations. This is a real, fixable repo hygiene bug.
- **The global SerpAPI quota (§2.3/§4) is the dominant scaling bottleneck**, ahead of database or compute cost — it caps the entire platform's search throughput at one shared number regardless of how many paying tenants exist.
- **No disaster recovery configuration exists in code at all** — no backup/retention/PITR settings anywhere in the repo; this is entirely a Supabase-dashboard concern today, unconfirmed and unversioned.

---

## 6. Business Audit (Phase 8)

Acting as a SaaS investor evaluating this purely on the technical/product evidence available (no usage, revenue, or customer data was available to this audit):

| Dimension | Score /10 | Why |
|---|---|---|
| Product | 4 | Real but thin functionality; one genuinely useful module (legacy AI report engine), one shallow-real module (Lead Finder), one not-actually-a-research-feature module (Talent Finder) |
| Technology | 5 | Competent modern stack and some good architectural instincts (provider abstraction, RLS, consistent fail-open convention), undercut by unresolved Critical security/cost-control gaps currently live |
| Defensibility | 2 | No proprietary data, no distribution moat, no workflow lock-in — every component is a thin wrapper around SerpAPI/OpenAI that a competent team could rebuild in days |
| Growth Potential | 3 | Speculative without traction evidence; the global search quota architecturally caps growth before market dynamics even come into play |
| Monetization | 3 | Plan-enforcement scaffolding exists but is unconnected to any billing provider and unconfirmed as active in the live DB; the very layer meant to protect margin currently fails open |
| Execution Quality | 4 | Fast iteration and clean individual commits, but a cluttered repo root (15 audit docs), production deploying from a non-`main` branch, and unauthenticated endpoints shipped to prod are signals that would concern a technical diligence reviewer |

**Final score: 26/100.** This reads as an early-stage technical prototype with real engineering competence and zero moat, carrying multiple unresolved Critical security/financial-exposure issues live in production today. It is not, on this evidence alone, a company I would value at a level implying $1M of committed capital without first seeing real usage/retention data and a fixed list of the Critical items in §4 resolved. The gap between "interesting prototype" and "fundable business" here is almost entirely about defensibility and proof of demand, neither of which any amount of code review can supply — that's the honest limit of what this audit can tell you.

---

## 7. Top 20 Critical Issues

1. `/api/debug/env` and `/api/debug-env` — unauthenticated, live in production, leaking config presence to the public internet
2. `/api/users/init` — unauthenticated, anyone can create arbitrary Workspace+User rows
3. SerpAPI daily quota is global, not per-user — one user/attacker can starve the entire platform for the rest of the day
4. Rate limiter fails open on any Redis/env error, silently, with no alert
5. Plan enforcement fails open on any Supabase error, silently, with no alert
6. `usage-tracking.sql` / `plan-enforcement.sql` live-DB application status is unconfirmed — the entire cost-control story may be inert right now
7. No billing provider connected — plan tiers are not enforceable against real payment
8. No plan-assignment UI — every real user is implicitly STARTER forever absent a manual DB write
9. `.env.example`'s committed DB connection template is unpooled, risking connection exhaustion if followed as-is
10. Talent Finder presents AI-guessed data with a formulaic "confidence score" that doesn't measure accuracy
11. Lead Finder's ranker can score an irrelevant directory page above a relevant company homepage (demonstrated, not hypothetical)
12. No CI pipeline — build/typecheck are run manually, not gated automatically
13. Production deploys from a feature branch (`research-intelligence-v2-data-layer`), not `main` — operational confusion risk
14. No disaster-recovery/backup configuration anywhere in version control
15. `Plan` (Prisma) and `UserPlan` (new) are two different types with overlapping names and no doc cross-reference
16. `app/api/demo/route.ts` already establishes a service-role-key-bypasses-RLS pattern in the codebase, a template risk for future routes
17. No usage/cost alerting at the infra level (Vercel/OpenAI/SerpAPI dashboards) confirmed configured — the codebase's fail-open paths have no compensating external alarm
18. No SSO/audit logging — blocks any near-term enterprise motion
19. Quota counter has a narrow race condition on the first request of each day (minor, but compounds with #3)
20. 15 audit/planning markdown docs at repo root — not a functional bug, but a real diligence-readiness signal

## 8. Top 20 Quick Wins

1. Add an auth check to `/api/users/init` (minutes of work, closes a real hole)
2. Delete both debug endpoints, or gate them behind a header/secret check (minutes of work)
3. Add `userId` to the SerpAPI quota Redis key to make it per-user (small, high-leverage change)
4. Confirm in the Supabase dashboard, today, whether `usage-tracking.sql`/`plan-enforcement.sql` were applied
5. Add a `console.error`/log line (or a Sentry/observability call) inside every fail-open `catch` block so silent failures become visible
6. Fix `.env.example`'s `DATABASE_URL`/`DIRECT_URL` to match the correct pooled template already in `.env.local.example`
7. Move the 15 root-level `.md` files into `/docs/`
8. Add a one-line doc note clarifying `types/plan.types.ts`'s `UserPlan` is the live enforcement type, not Prisma's `Plan`
9. Set hard spending caps directly in the OpenAI and SerpAPI dashboards as a backstop independent of app code
10. Add a basic GitHub Actions workflow running `tsc --noEmit` + `npm run build` on push
11. Document which branch is actually deployed to production, and align it with `main` or rename `main`'s role
12. Add the missing disclaimer language to the Talent Finder UI (not just the API payload) so end users see it before reading numbers
13. Add a minimal admin script/page to assign a `user_plans` row, rather than requiring a raw DB write
14. Add an atomic increment for the quota's zero-case to remove the narrow race condition
15. Add basic per-IP or per-account anomaly alerting (e.g., a Slack webhook) when the rate limiter or quota check fails open
16. Cap `SEARCH_DAILY_QUOTA` to a number that reflects actual budget tolerance today, not the placeholder default
17. Add a smoke test that hits `/api/research/leads` and `/api/research/talent` post-deploy to catch the exact class of bug this session's SerpAPI investigation found
18. Note in the README which of the two report systems (`legacy-ai-engine` vs `research/acquisition`) new modules should extend
19. Remove or clearly label the `services/legacy-ai-engine` naming if it's actually still the primary revenue-relevant module (the name implies deprecation it may not deserve)
20. Add request-size/timeout limits explicitly documented for the Lead Finder's page-fetch step (already has 8s/500KB caps — just surface them in code comments/docs for future maintainers)

## 9. 30-Day Roadmap

- Week 1: close the three unauthenticated/exploitable issues (#1, #2 above), confirm SQL migrations are live, add fail-open alerting
- Week 2: fix the global search quota to be per-user/per-plan; set provider-side spend caps as a backstop
- Week 3: wire a real billing provider (Stripe) to `user_plans`, even minimally (manual plan upgrade via webhook)
- Week 4: repo hygiene pass (docs into `/docs/`, fix `.env.example`, add CI workflow); decide and document canonical deploy branch

## 10. 90-Day Roadmap

- Month 2: improve Lead Finder's ranker with real relevance scoring (embeddings/semantic match) instead of substring keyword matching; decide whether Talent Finder gets real grounding (job-board APIs, salary survey data) or gets repositioned/removed
- Month 2: build a minimal plan-assignment UI and connect it to the existing `/dashboard/settings` "Plan" section
- Month 3: add usage analytics/observability (even basic dashboards) so future audits like this one have real traction data to evaluate, not just code
- Month 3: first real enterprise-readiness pass (audit logging, SSO evaluation) only if a specific enterprise prospect justifies the investment

## 11. What Should Be Built Next

A real per-tenant usage/quota system (replacing the global SerpAPI counter) and a minimal but real billing connection — in that order. Neither is large engineering lift; both are prerequisites for everything else in this report to matter commercially.

## 12. What Should Be Deleted Immediately

- `app/api/debug/env/route.ts` and `app/api/debug-env/route.ts` — both explicitly self-documented as temporary, both still live, both unauthenticated
- The 15 root-level audit/planning `.md` files — not a security issue, but should not sit in repo root indefinitely

## 13. Final Investment Verdict

**Not fundable at a $1M level on the evidence in this repository alone.** The team can clearly ship — three working features were built, tested, and deployed in a single engagement. But the product today is a thin orchestration layer over commodity APIs with no proprietary data or workflow moat, a hard architectural cap on multi-tenant growth (the global search quota), and several Critical security/cost-control gaps live in production right now that a serious technical diligence process would flag immediately and that should be fixed regardless of any funding conversation. The honest next step isn't more audits — it's fixing the items in §7, then coming back with real usage data, because no amount of code review can answer the question that actually determines whether this is investable: does anyone want this enough to pay and stay.
