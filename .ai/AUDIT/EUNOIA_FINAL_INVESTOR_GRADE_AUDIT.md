# Eunoia Intelligence Platform — Final Investor-Grade Audit (Confirmed Production Reality)

Scope: `origin/main` @ `89b9892` only — the confirmed Vercel Production Branch. No branch-mismatch hedging; the contradiction from the prior two audits is resolved (see `EUNOIA_RECONCILIATION_REPORT.md`) and is not repeated here.

---

## Re-scored from scratch (evidence-grounded, /10 each)

| Dimension | Score | Evidence |
|---|---|---|
| Product value | 5 | Lead Finder is real: live SerpAPI search, honest "no results" path instead of fabrication, source URLs + confidence scoring (`app/api/research/leads/route.ts`). Talent Finder is an LLM market-overview generator with no real candidate data (`app/api/research/talent/route.ts:42` explicitly bans inventing named people). Legacy AI report engine (`app/api/intelligence/route.ts`, `services/legacy-ai-engine/`) is a third, separate, generic report generator. |
| Commercial viability | 2 | Zero billing/payment integration anywhere in `package.json` or codebase (no Stripe/Paddle/LemonSqueezy). `PLAN_LIMITS` (`types/plan.types.ts`) is enforcement scaffolding with nothing to charge against — there is no path from "user hits limit" to "user pays to raise it" today. |
| SaaS readiness | 3 | Signup/login exist (`app/(auth)/signup/page.tsx`, `app/(auth)/login/page.tsx`). No pricing page, no billing, no workspace/team management UI, no admin console for plan assignment (manual-only per `supabase/plan-enforcement.sql` comment). |
| Multi-tenant readiness | 3 | Per-user rate limiting and per-user monthly credit caps are real (`lib/research/rate-limit.ts`, `lib/research/plan-enforcement.ts`) — verified on `main`. But the SerpAPI daily search quota is a single global counter shared by every tenant (`lib/research/acquisition/quota.ts:11-13`, default 150/day total). One tenant's usage can 502 every other tenant's Lead Finder calls for the rest of the day. Additionally, `types/plan.types.ts`'s own comment confirms the Prisma `Workspace` model (seats/teams) is "never wired into the live research routes" — there are two incompatible tenancy concepts in the codebase, only one of which (per-user) is actually live. |
| Security | 3 | `app/api/users/init/route.ts` has no auth check at all — confirmed present and unchanged on `main`. `lib/research/plan-enforcement.ts:56-58` fails open silently (no logging) on any DB error. Two unauthenticated debug endpoints (`app/api/debug-env/route.ts`, `app/api/debug/env/route.ts`) live on `main`, exposing only booleans + `NODE_ENV` (corrected severity: Low, not Critical — no secret values exposed). `users.json` at repo root contains 3 bcrypt-hashed (`$2y$`, not plaintext) legacy-admin credentials for a separate PHP login system (`auth.php`) — hashed, so lower severity, but credential material has no reason to be committed to a repo at all. |
| Scalability | 2 | The global SerpAPI quota (item above) is a hard, deliberate, currently-150/day ceiling on the entire platform's primary paid feature, regardless of tenant count or revenue. No queue/worker layer — `ResearchService.run()` executes synchronously inside the HTTP request lifecycle (confirmed via `research-service.ts`), so request latency scales with SerpAPI + source-fetch + LLM latency directly. |
| Maintainability | 3 | Zero test files anywhere on `main` (`*.test.*`, `*.spec.*`, `__tests__` — none exist). No `.github/workflows` — no CI at all. Two parallel report-generation systems (legacy Prisma `Report` model + `/api/intelligence`, vs. new Supabase `reports`/`research_requests` + `/api/research/*`) with no stated deprecation plan. Repo root carries 15 audit/planning `.md` files, an `.xlsx`, 4 `.jpeg` images, 6 stray `text*.txt` files, and a full legacy PHP stack (`api.php`, `auth.php`, `config.example.php`, `test.php`, `index.html`, `feasibility.html`, `eunoia-worker.js`) alongside the Next.js app — all committed to the same branch that deploys to production. |
| Competitive differentiation | 2 | Lead Finder is a thin, well-built wrapper around SerpAPI + a heuristic ranker (`lib/research/acquisition/ranker.ts`, additive scoring, base 40 + bonuses) — no proprietary data source, no CRM/workflow integration, no distribution channel. A competent team could rebuild the core pipeline in days; the honest-disclosure UX (confidence scores, "no results found" instead of fabrication) is a real trust signal but not a moat. |

---

## A. Top 10 remaining critical issues

1. `app/api/users/init/route.ts` — no authentication; anyone can create a `Workspace`+`User` row via a single unauthenticated POST.
2. No billing/payment provider integrated anywhere — `PLAN_LIMITS` enforcement has nothing to monetize against.
3. SerpAPI daily search quota is a single global counter (`lib/research/acquisition/quota.ts`) — one tenant can exhaust the entire platform's search capacity for everyone, for the day.
4. `checkPlanLimit()` fails open silently on any Supabase error with zero logging (`lib/research/plan-enforcement.ts:56-58`) — if the plan/usage migrations were never applied to the live DB, this is a standing, invisible bypass, not a hypothetical one.
5. Two incompatible tenancy models coexist (Prisma `Workspace` vs. Supabase per-user `auth.uid()`) — confirmed by the codebase's own comment in `types/plan.types.ts` that the Workspace model is "never wired into the live research routes."
6. Two unauthenticated debug endpoints live in production (`/api/debug-env`, `/api/debug/env`) — low severity content, but no reason to keep them live.
7. Zero automated tests and zero CI — every change to `main` (the production branch) ships with no automated gate at all.
8. `users.json` (bcrypt-hashed legacy admin credentials) committed at repo root — credential material has no reason to be in version control regardless of hash strength.
9. Two parallel, overlapping report-generation systems (legacy AI report engine vs. Research Core Engine) with no deprecation plan, doubling the maintenance surface.
10. A full legacy PHP/static-site stack (`api.php`, `auth.php`, `eunoia-worker.js`, `index.html`, `feasibility.html`) lives in the same repo/branch as the production Next.js app with no documentation of whether it's still deployed anywhere — an unmanaged, unclear attack surface and maintenance burden.

## B. Top 20 quick wins

1. Add `auth.getUser()` check to `/api/users/init`.
2. Delete `/api/debug-env` and `/api/debug/env`.
3. Add a `user_id`/tenant component to the SerpAPI quota Redis key (or accept the global model explicitly and add alerting instead).
4. Add `console.error` logging to the `checkPlanLimit` catch block so fail-open events are at least visible.
5. Confirm `supabase/plan-enforcement.sql` and `supabase/usage-tracking.sql` have actually been run against the live database (`select * from user_plans limit 1`).
6. Fix `.env.example`'s `DATABASE_URL`/`DIRECT_URL` — both point at the unpooled `:5432` host despite the `pgbouncer=true` query string; the pooler needs the `:6543` host.
7. Remove or gate the 3 `console.log` lines added directly to `app/api/research/leads/route.ts` (commit `89b9892`) behind a non-production check.
8. Move the 15 root-level audit/planning `.md` files into a `/docs` folder.
9. Delete the stray `text.txt`, `text 2.txt` … `text 6.txt`, `IMG_0070-0073.jpeg`, and the `.xlsx` from repo root.
10. Remove `users.json` from the working tree and rotate the admin password it represents (the bcrypt hash itself is in git history regardless, so rotation matters more than file deletion).
11. Add a CI workflow that runs `tsc --noEmit` and `next build` on every PR — currently zero gate exists.
12. Add minimal smoke tests for `/api/research/leads` and `/api/research/talent` (auth-required-401, happy-path-200).
13. Add rate limiting to `/api/users/init` (currently none — only `/api/research/*` is rate-limited).
14. Add rate limiting to `/api/demo` (uses the service-role key, bypassing RLS, with no rate limit).
15. Pick one tenancy model (Workspace-seats or per-user) and remove the other from the data model — don't carry both.
16. Add a pricing page — signup exists, nothing tells a visitor what this costs.
17. Wire a minimal billing flow (even a single Stripe Checkout link + webhook that writes to `user_plans`) — this is the single missing piece between "working product" and "able to take money."
18. Add basic error monitoring (Sentry or equivalent) — today, failures are only visible via `console.error` in Vercel's function logs.
19. Document (in one README section) whether the legacy PHP stack (`api.php`, `auth.php`, `index.html`, `feasibility.html`) is still deployed anywhere, then either keep it intentionally or delete it — don't leave it ambiguous.
20. Add a max-length/character-allowlist validation on the free-text Lead/Talent Finder inputs (`industry`, `location`, `titles`, `skills`) before they're interpolated into search queries and LLM prompts — cheap defense-in-depth against abuse.

## C. What must be fixed before first paying customers

- Fix the `/api/users/init` auth bypass — non-negotiable; you cannot charge money on top of a product anyone can create accounts on for free, unauthenticated.
- Confirm (or apply) the `plan-enforcement.sql`/`usage-tracking.sql` migrations against the live database — if unapplied, the "plan limit" you'd be selling doesn't actually exist yet.
- Wire at least minimal real billing — there is currently no mechanism to take a customer's money and have it affect their account.
- Decide and fix the tenancy model — you cannot sell "team/workspace seats" on a backend that only tracks individual `auth.uid()` users, and you cannot sell "per-user" pricing cleanly while a parallel unused Workspace billing model still exists in the schema.
- Mitigate the global SerpAPI quota — at minimum, add per-tenant alerting/soft-caps so the first real paying customer doesn't get 502'd by another tenant's usage with zero warning.
- Delete the two debug endpoints — no reason to keep config-presence information public once paying customers are live.

## D. What must be fixed before scaling beyond first customers

- Replace the global SerpAPI quota with a real per-tenant quota/throttling architecture.
- Add CI + automated tests — manual verification does not scale past a handful of contributors or release cadence increases.
- Add observability (error monitoring, request tracing) — `console.log`/`console.error` into Vercel function logs is not an incident-response system.
- Move research-request execution out of the synchronous request/response cycle into a queue/worker model — the schema already anticipates this (`status` column lifecycle in `research_requests`), it's just not implemented yet.
- Consolidate the two parallel report-generation systems into one, or formally retire one with a migration path for any existing data.
- Fix database connection pooling everywhere it's templated incorrectly, not just in the gitignored local example.

## E. What should NOT be worked on right now

- New report types or new "Finder" modules — adding more surface area before fixing auth/billing/tenancy compounds the problems in §A rather than growing revenue.
- UI redesigns (e.g., further real-estate page polish) — not the current bottleneck to either security or revenue.
- Migrating off Prisma or off Supabase — neither is the actual constraint; this would be a large effort solving a problem that isn't on the critical path.
- Building enterprise features (SSO, audit logging, custom roles) — no paying customer yet to justify the investment; revisit after §C is resolved and there's a real enterprise prospect asking for it.
- Improving or extending the legacy PHP stack — decide to kill or formally freeze it; investing further engineering time into it while its deployment status is undocumented is wasted effort either way.
- Expanding i18n/localization — `next-intl` is already integrated; this is not where the product is currently weak.

## F. Updated investor score: 32/100

Methodology: same 6-dimension framework as prior audits (Product, Technology, Defensibility, Growth Potential, Monetization, Execution Quality), each /10, summed and rescaled to /100. Scores here map from the 8-dimension table above (Technology ≈ average of Scalability/Maintainability; Defensibility = Competitive differentiation):

Product 5, Technology 3, Defensibility 2, Growth Potential 3, Monetization 2, Execution Quality 4 → sum 19/60 → **32/100**.

This is a confirmed, non-hedged number — production reality is now settled. It is lower than Audit #2's "if the research branch is live" estimate (30–34) was centered, landing at the bottom of that range, because full re-verification on confirmed `main` surfaced two additional concrete gaps that weren't fully weighed before: zero billing infrastructure (not just "unconnected scaffolding" — literally nothing to connect to) and the explicit, codebase-documented tenancy-model conflict. Findings A and D (auth bypass, fail-open enforcement) remain the two single largest drags on this score, and both are fixable in days, not months.

## G. Updated founder score: 58/100

A different lens: not "is this fundable," but "does this reflect well on execution capability and is it worth continuing to build on." Genuinely positive signal: a real, working, honestly-designed search-driven research pipeline (proper RLS policies, per-user rate limiting, disclosure-conscious UX copy that refuses to fabricate results) was built and shipped in a short timeframe, with clean per-module code. That's real technical execution. The drag: a recurring pattern of shipping unauthenticated endpoints and temporary debug routes straight to the production branch with no review gate, plus committing real credential material and operational clutter (15+ audit docs, stray text files, a separate legacy PHP stack) into the same branch that deploys live. The capability is there; the operational discipline around what's safe to ship directly to `main` is the actual gap, and it's a process fix, not a rebuild.

## H. Updated customer value score: 47/100

For a real prospective customer today: Lead Finder delivers genuine, verifiable, search-derived leads with honest confidence scoring and a real "no results" path instead of invented data (`leads/route.ts:25-27`) — a small agency or freelance lead-gen consultant doing prospecting research would get real value from this specific module. Talent Finder is closer to a generic LLM salary-estimate generator than a "finder" of anything real (it's explicitly forbidden from naming real candidates) — much thinner value. Drags on the score: no pricing page, no billing, no team/seat concept for a recruiter to add colleagues, and a customer depending on this for repeated research work is one global-quota exhaustion event away from a 502 with zero advance warning or status page. Real, honest value in one module; thin packaging and no reliability guarantees around it.

## I. 30-day roadmap

**Week 1:** Fix `/api/users/init` auth bypass. Delete both debug endpoints. Confirm (or apply) the `plan-enforcement.sql`/`usage-tracking.sql` migrations against the live DB. Add logging to the `checkPlanLimit` fail-open catch block.
**Week 2:** Add per-tenant dimension (or at minimum alerting) to the SerpAPI quota. Fix the `.env.example` DB pooling bug. Decide and document the tenancy model (Workspace-seats vs. per-user) and remove the unused one from the schema/types.
**Week 3:** Wire a minimal billing flow (Stripe Checkout + webhook → `user_plans`). Add a pricing page.
**Week 4:** Add a CI workflow (typecheck + build gate) and smoke tests for the two research routes. Clean the repo root (move audit docs to `/docs`, delete stray files, resolve the `users.json`/legacy-PHP-stack question).

## J. 90-day roadmap

- Replace the global SerpAPI quota with real per-tenant throttling/quota architecture.
- Move research-request execution to a queue/worker model using the existing `status` lifecycle column.
- Add observability (Sentry or equivalent) for both API routes and the research pipeline.
- Consolidate the legacy AI report engine and the Research Core Engine into a single report system, or formally sunset one with a data-migration path.
- Decide the fate of the legacy PHP/static stack — either re-platform it onto the same Next.js app or retire it entirely.
- Expand Lead Finder's source diversity and dedupe quality now that the core pipeline and billing are stable, since this is the one module with demonstrated standalone value.
- Build a minimal admin console for plan assignment/usage visibility, replacing the current "manual SQL only" process.

## K. Revenue potential estimate

No real usage, conversion, or revenue data exists anywhere in this repository — this is a model built from the existing `PLAN_LIMITS` tiers and SerpAPI's own cost structure, **not** a forecast based on observed demand.

- Plausible early pricing, using the tiers already defined in code (`types/plan.types.ts`): Starter (20 reports/mo) ~$29-49/mo, Professional (100/mo) ~$99-149/mo, Agency (300/mo) ~$249-349/mo.
- At a modest 50 paying accounts skewed toward Starter/Professional: roughly **$2,500-$7,500 MRR ($30K-$90K ARR)** as a directional, non-validated estimate.
- **Hard ceiling, independent of demand:** the SerpAPI quota defaults to 150 searches/day app-wide (`SEARCH_DAILY_QUOTA`, `lib/research/acquisition/quota.ts:8`), and each Lead Finder report consumes roughly one search call. At default settings, the entire platform cannot serve more than ~150 Lead Finder reports/day across *all* customers combined, regardless of how many sign up or pay — the code already supports raising this via an env var, but it has to actually be raised (and the underlying SerpAPI plan upgraded) before revenue could scale meaningfully past a small handful of active paying accounts.

## L. Final verdict: **Build**

Not **Sell** — there is no revenue, no billing infrastructure, and no usage data to sell against; there's nothing here a buyer could acquire except code and one promising module.
Not **Pivot** — the core thesis (real, search-grounded, honestly-disclosed lead research, refusing to fabricate results) is validated by the code's own quality and behavior; it isn't broken or pointed the wrong direction.
Not **Kill** — the single largest blocking issue (`/api/users/init`) is fixable with one auth check, not a structural flaw; the rest of §C is days-to-weeks of focused work, not a rebuild.

**Build**, conditioned explicitly on completing §C before taking a single paying customer, and §D before any deliberate growth push. The investor score (32/100) reflects "not fundable as-is today" — it does not mean "not worth continuing." Founder and customer-value scores (58, 47) both point the same direction: there's a real, narrow core worth finishing properly rather than expanding around.
