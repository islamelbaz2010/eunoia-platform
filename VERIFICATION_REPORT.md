# Verification Report — Phases 1-11 Audited Against Evidence

**Purpose:** An adversarial, evidence-based re-audit of every claim made in this
mission's prior phase reports (Discovery through Phase 11). Nothing below is
restated from memory — every line is backed by a git command, a file read, or
a test/build run executed during this verification pass. Where a prior report
was wrong, this document says so explicitly.

**Scope note:** No code was modified to produce this report. `npm run build`
and `npx tsc --noEmit` were run to gather evidence (these write to the
gitignored `.next/` directory and to `tsconfig.tsbuildinfo`); the latter was
reverted with `git checkout -- tsconfig.tsbuildinfo` immediately after to leave
the working tree clean. `git status --short` is clean as of this report.

Verification branch: `claude/blissful-newton-Sdej0` @ `7496b8d` (= `origin/claude/blissful-newton-Sdej0`, no drift).

---

## CRITICAL FINDING #0 — None of Phases 1-11 are in `main`; PR #9 is open, unmerged

This supersedes every "production-active" claim in every prior phase report and is verified three independent ways:

1. **The PR is open.** `mcp__github__list_pull_requests` → PR #9, *"Platform improvement mission..."*, `state: open`, `merged: false`, `base: main @ 89b98929`, `head: claude/blissful-newton-Sdej0 @ 7496b8d`. It has never been merged.
2. **`origin/main` contains zero commits from this mission.** `git log origin/main..claude/blissful-newton-Sdej0 --oneline` lists all 13 Discovery→Phase 11 commits as exclusively on the feature branch. `git merge-base origin/main origin/claude/blissful-newton-Sdej0` resolves to `08d1795` (June 18), the point where the branches diverged — `main` has since taken its own independent path (19 commits: a real-estate UI redesign, a cashflow/NPV engine, two merges from a separate `research-intelligence-v2-data-layer` branch via PR #7/#8, and a June 18 "Add logging for LEADS API initialization" commit) while this mission worked the feature branch forward. `origin/main`'s current HEAD (`89b98929`, 2026-06-18 19:31 +0300) **predates this entire mission**, which started 2026-06-21.
3. **Direct content diff confirms every phase's change is absent from `main`,** not just commit-graph-absent:
   - `git show origin/main:app/api/users/init/route.ts` — trusts client-supplied `email`/`supabaseId` from the request body, **no session check**. Phase 1's fix does not exist there.
   - `git grep` on `origin/main` for `filterValidSources|dedupeCompanies|recommendDecisionMakerTitles|companySizeQueryModifier|bucketEmployeeCount|extractCompanySizeKey|extractMentionedDomains` → **zero matches**. None of Phases 2-9's six new engine modules exist on `main` in any form — confirmed by both file-tree listing (`lib/research/company-validation.ts`, `dedup.ts`, `source-quality.ts`, `company-expansion.ts`, `company-size.ts`, `decision-makers.ts`, and `lib/research/acquisition/apollo-adapter.ts` are all absent from `origin/main`'s tree) and full-text search.
   - `git show origin/main:app/api/demo/generate/route.ts` — no `checkRateLimit`/`getClientIp`. Phase 10b's fix is absent.
   - `git show origin/main:supabase/research-tables.sql` — `module` CHECK constraint is still `('lead_finder', 'talent_finder')`, missing `'market_intelligence'`. Phase 10a's SQL fix is absent.
   - `git ls-tree origin/main` still contains `database/schema.prisma`, `database/migrations/001_initial.sql`, `database/seed/seed.ts`, `app/api/debug-env/route.ts`, `app/api/debug/env/route.ts` — **all five files Phase 10 deleted as dangerous/secret-leaking are still present and presumably still reachable on `main`.**

**What this means concretely:** if `ai.halannews.com` is served from `main` — and there is direct circumstantial evidence for this in `main`'s own history (`git log --all --graph` shows commit messages on `main` that are literally pasted shell commands, e.g. `"Merge remote-tracking branch 'origin/claude/blissful-newton-Sdej0' t push origin HEAD:main vercel --prod"`, indicating someone has been running `vercel --prod` manually from a local `main` checkout) — then **every security fix and every Lead Finder quality improvement from this entire mission is currently inert.** The two secret-leaking debug endpoints, the dead Prisma schema, the spoofable `/api/users/init`, and the unrate-limited public demo endpoint are all still live today, exactly as they were before this mission began.

**Caveat — what I could *not* verify from this sandbox:** I have no access to Vercel's actual project dashboard/settings, so I cannot directly read which branch is configured as the "Production" deployment target — it is possible (if unlikely, given the evidence above) that a different, unconfigured mechanism deploys from the feature branch instead. This is the single most important fact this report cannot close out with certainty, and it should be confirmed by whoever has Vercel dashboard access before trusting any "production-active" claim in this or prior reports.

---

## Per-phase verification

For every phase, "production-active" is governed by Critical Finding #0 above and is not re-derived per phase unless there's phase-specific spot-check evidence worth citing. "Active on the feature branch" (i.e., would be active if PR #9 merged and that branch were deployed) is reported separately since it's the more useful signal of whether the work is real.

### Phase 0 — Discovery (`94f50e6`)

- **Files actually changed:** `CURRENT_SYSTEM_MAP.md` (new, 112 lines), `AUDIT_CONSOLIDATION.md` (new, 57 lines). Docs only, zero code.
- **Commit:** `94f50e6d0b66a4b3034e06d37c6e7951c7e46039`
- **Current code paths:** N/A — documentation, not code.
- **Production-active:** N/A (docs aren't deployed).
- **Test coverage / pass status:** N/A.
- **Flags:** None — accurately scoped as a docs-only recon step, not a fix.

### Phase 1 — `fix(security): require authenticated session in /api/users/init` (`319478f`)

- **Files actually changed:** `app/api/users/init/route.ts` (72 lines touched), `app/api/users/init/route.test.ts` (new, 84 lines), `lib/prisma/init-user.ts` (new, 54 lines), `lib/prisma/init-user.test.ts` (new, 101 lines), `app/auth/callback/route.ts` (22 lines), `app/dashboard/onboarding/page.tsx` (3 lines), `package.json`/`package-lock.json` (added vitest), `vitest.config.ts` (new).
- **Commit:** `319478fc0dfee4768278c3d661d095479b7d67e0`
- **Current code paths:** `app/api/users/init/route.ts` — verified by direct read: identity is derived from `supabase.auth.getUser()`, the route returns `401` if `!user?.email`, and the find-or-create logic lives in `lib/prisma/init-user.ts`'s `initUserFromSupabase()`. Matches the claim exactly.
- **Production-active:** **NO.** Directly confirmed by reading `origin/main:app/api/users/init/route.ts` — it still trusts a client-supplied `email`/`supabaseId`, no session check. The spoofing vulnerability this phase claims to have closed is still open in whatever `main` currently serves.
- **Test coverage:** `app/api/users/init/route.test.ts` (4 tests) + `lib/prisma/init-user.test.ts` (4 tests). Both exist and both ran in this session's fresh `vitest run`.
- **Test pass status:** Passing (part of the 109/109 confirmed this session — see Phase 11 section for the full run).
- **Flags:** None on the feature branch itself — this is a real, tested, correctly-wired fix. The only issue is Critical Finding #0 (not merged/deployed).

### Phase 2 — Company Validation Engine (`ef0b926`)

- **Files actually changed:** `lib/research/company-validation.ts` (new, 108 lines), `lib/research/company-validation.test.ts` (new, 90 lines), `lib/research/acquisition/research-service.ts` (+5/-1), `lib/research/acquisition/types.ts` (+4), `app/api/research/leads/route.ts` (+1), `app/dashboard/research/leads/page.tsx` (+1).
- **Commit:** `ef0b9267f3e42505cce25b38ef3309f533a6e3a6`
- **Current code paths:** `lib/research/company-validation.ts` exports `filterValidSources`, imported and called at `lib/research/acquisition/research-service.ts:8,196` — confirmed by direct read of the orchestration sequence (`validated = filterValidSources(normalized)`).
- **Production-active:** **NO** — file doesn't exist on `origin/main` at all (confirmed via tree listing and full-text grep, Critical Finding #0).
- **Test coverage:** `lib/research/company-validation.test.ts`, 8 `it(...)` blocks.
- **Test pass status:** Passing (in the 109/109 total).
- **Flags:** **Important scope correction.** This engine is wired into `research-service.ts`, which is called **only** by `/api/research/leads` (Lead Finder). `/api/research/talent` (Talent Finder) does **not** import `research-service.ts`, `search-provider.ts`, or any Phase 2-9 engine — confirmed by reading `app/api/research/talent/route.ts` in full: its only research-related import is `lib/research/sources.ts` (`buildCandidateSources`, `computeConfidence`), and its entire report body is generated from a single OpenAI prompt with no search/validation/dedup step. **Phase 2 (and every other Phase 2-9 engine) applies to Lead Finder only, never to Talent Finder.** This directly contradicts the Phase 11 `COMMERCIAL_READINESS_REPORT.md` line "Lead Finder and Talent Finder now deliver on their promise (Phases 2-9 made them evidence-based, not AI-invented)" — that sentence is **false as written** for Talent Finder. See Category 5 below.

### Phase 3 — Company Deduplication Engine (`ec37c87`)

- **Files actually changed:** `lib/research/dedup.ts` (new, 208 lines), `lib/research/dedup.test.ts` (new, 123 lines), `research-service.ts` (+5/-1), `types.ts` (+1), `leads/route.ts` (+1), `leads/page.tsx` (+1).
- **Commit:** `ec37c876fe26370ee7802b4d6390f7effec919e3`
- **Current code paths:** `dedupeCompanies` imported at `research-service.ts:9`, called at line 197 (`const deduped = dedupeCompanies(validated)`).
- **Production-active:** **NO** (absent from `main`, Critical Finding #0).
- **Test coverage:** `lib/research/dedup.test.ts`, 8 tests.
- **Test pass status:** Passing.
- **Flags:** Same Lead-Finder-only scope as Phase 2 — applies, not previously called out this precisely in the Phase 3 report.

### Phase 4 — Confidence Engine rebuild around validation score (`91b4f35`)

- **Files actually changed:** `lib/research/acquisition/ranker.ts` (67 lines touched), `lib/research/acquisition/ranker.test.ts` (new, 79 lines). **No other files** — this phase was a pure refactor of the existing ranker, not a new module.
- **Commit:** `91b4f3592c454aa47eec73a3b97567854bdcbb69`
- **Current code paths:** `lib/research/acquisition/ranker.ts`, `rankSources()`, called from `research-service.ts:198`.
- **Production-active:** **NO** — `origin/main`'s copy of `ranker.ts` is the pre-Phase-4 version (confirmed: `main` has `ranker.ts` but it's never touched by any commit on the feature side that reached `main`; the Phase 4-9 diffs to this file are exclusively on the feature branch).
- **Test coverage:** `ranker.test.ts`, 9 tests.
- **Test pass status:** Passing.
- **Flags:** None beyond Critical Finding #0.

### Phase 5 — Source Quality Engine (`ec1a298`)

- **Files actually changed:** `lib/research/source-quality.ts` (new, 110 lines), `lib/research/source-quality.test.ts` (new, 134 lines), `research-service.ts` (+52/-10).
- **Commit:** `ec1a298837b2602f78e5a8fe509ed555bca8e81a`
- **Current code paths:** `isParkedDomainProvider`, `detectBrokenPage`, `recordSourceOutcome`, `getSourceReputation` imported at `research-service.ts:10`. Confirmed used inside the source-collection step (`collectAndVet`).
- **Production-active:** **NO.**
- **Test coverage:** `source-quality.test.ts`, 12 tests.
- **Test pass status:** Passing.
- **Flags:** The reputation tracking in this engine (`recordSourceOutcome`/`getSourceReputation`) is in-memory only (no Redis/DB persistence) — verified by reading the file: it keeps a module-level `Map`. This means reputation learned in one serverless invocation is **lost on every cold start** in a real Vercel deployment; it only accumulates value within a single warm function instance's lifetime. This nuance was not flagged in the original Phase 5 report and should be treated as a known limitation, not a bug — but it does mean the "reputation tracking" framing overstates persistence.

### Phase 6 — Company Expansion Engine (`9de96d6`)

- **Files actually changed:** `lib/research/company-expansion.ts` (new, 97 lines), `lib/research/company-expansion.test.ts` (new, 105 lines), `research-service.ts` (+84/-30), `types.ts` (+2), `leads/route.ts` (+1).
- **Commit:** `9de96d6e10eaad1159315273235cb2e41811469f`
- **Current code paths:** `extractMentionedDomains` imported at `research-service.ts:11`, used at line ~184 to mine collected text for additional domains and feed them back through `collectAndVet`. Confirmed by direct read of the orchestration block.
- **Production-active:** **NO.**
- **Test coverage:** `company-expansion.test.ts`, 13 tests.
- **Test pass status:** Passing.
- **Flags:** None beyond Critical Finding #0.

### Phase 7 — Company size signal (`bb18c96`)

- **Files actually changed:** `lib/research/company-size.ts` (new, 51 lines), `lib/research/company-size.test.ts` (new, 57 lines), `app/api/research/leads/route.ts` (+18/-2), `app/dashboard/research/leads/page.tsx` (+6/-2), `normalizer.ts` (+2), `ranker.ts`/`ranker.test.ts` (+11/+21), `research-service.ts` (+8), `types.ts` (+2).
- **Commit:** `bb18c9657b888eaf20c0394778d9fa7fdc34507a`
- **Current code paths:** `companySizeQueryModifier` imported and called in `leads/route.ts:9,29` (biases the search query string); `extractCompanySizeKey` in `normalizer.ts`; `companySizeMatch` reward (+5) in `ranker.ts:68-70`. **UI exposure confirmed:** `app/dashboard/research/leads/page.tsx` imports `COMPANY_SIZE_BUCKETS` and renders a `<select>` bound to `companySize` state, sent in the POST body.
- **Production-active:** **NO.**
- **Test coverage:** `company-size.test.ts` (8 tests) + the relevant `ranker.test.ts` additions.
- **Test pass status:** Passing.
- **Flags:** None — this is fully wired end-to-end (query → ranking signal → UI) on the feature branch, exactly as claimed.

### Phase 8 — Decision-maker role intelligence (`b789fd8`)

- **Files actually changed:** `lib/research/decision-makers.ts` (new, 105 lines), `lib/research/decision-makers.test.ts` (new, 51 lines), `app/api/research/leads/route.ts` (+40/-?), `app/dashboard/research/leads/page.tsx` (+4/-?), `ai-analysis.ts` (+1), `types.ts` (+2).
- **Commit:** `b789fd89ab18ab013e34454fd3a2e494cfa74139`
- **Current code paths:** `recommendDecisionMakerTitles` imported and called at `leads/route.ts:10,120` — confirmed by direct read: for each user-typed title, it recommends related titles scaled by the company's size bucket, deduplicated, and mapped to a LinkedIn people-search URL (never a fabricated name/email). **UI exposure confirmed:** rendered per-company in `leads/page.tsx` (`c.decision_makers.map(...)`).
- **Production-active:** **NO.**
- **Test coverage:** `decision-makers.test.ts`, 9 tests.
- **Test pass status:** Passing.
- **Flags:** None — fully wired end-to-end and UI-exposed, as claimed.

### Phase 9 — Apollo enrichment adapter (`524689c`)

- **Files actually changed:** `lib/research/acquisition/apollo-adapter.ts` (new, 120 lines), `lib/research/acquisition/apollo-adapter.test.ts` (new, 123 lines), `research-service.ts` (+28/-4), `ai-analysis.ts` (+1), `index.ts` (+1), `types.ts` (+6), `company-size.ts` (+3), `.env.example` (+3).
- **Commit:** `524689c6109b1faf9285216564bce4b201ce1ee1`
- **Current code paths:** `ApolloOrgEnrichAdapter`/`applyApolloEnrichment` imported at `research-service.ts:13`, gated behind `this.apolloAdapter.isConfigured()` (line 148) — only calls Apollo's API if `APOLLO_API_KEY` is set; otherwise a guaranteed no-op (confirmed by reading `apollo-adapter.ts:60-63`).
- **Production-active:** **NO.** Independently of Critical Finding #0, this feature is **also blocked by missing configuration** in every environment inspectable from this sandbox: `.env.local` here contains `RESEND_API_KEY`, `OPENAI_API_KEY`, `SERPAPI_API_KEY` only — **no `APOLLO_API_KEY`**. I cannot see production's actual environment variables from this sandbox, but absent contrary information, Apollo enrichment should be assumed inert until someone confirms an Apollo subscription/key exists in the real Vercel project settings.
- **Test coverage:** `apollo-adapter.test.ts`, 11 tests — read in full; they're substantive (mock `fetch`, assert no-op-when-unconfigured, 98-point confirmed-ceiling, employee-count overwrite, network-failure-returns-null), not placeholders.
- **Test pass status:** Passing.
- **Flags:** Correctly engineered as optional/fail-safe, but **this is the one phase where "blocked by missing API key" is true even on the feature branch itself**, independent of the deploy-branch question.

### Phase 10a — Three CRITICAL multi-tenant gaps (`f25aab8`)

- **Files actually changed:** `app/api/intelligence/route.ts` (+59/-10 — confirmed via `git diff --stat origin/main claude/blissful-newton-Sdej0 -- app/api/intelligence/route.ts` matches exactly), `app/api/research/leads/route.ts` (+1), `lib/research/acquisition/quota.ts` (rewritten, +49/-?), `lib/research/acquisition/quota.test.ts` (new, 81 lines), `lib/research/acquisition/research-service.ts` (+12), `lib/research/acquisition/search-provider.ts` (+4/-?), `supabase/research-tables.sql` (+11/-?), `tsconfig.json` (-1), `.env.example` (+5), and **deleted**: `database/schema.prisma`, `database/migrations/001_initial.sql`, `database/seed/seed.ts` (168+97+88 = 353 lines removed).
- **Commit:** `f25aab849b5983194166c82dc7e58f202176a560`
- **Current code paths:** Read in full this session. `app/api/intelligence/route.ts:964` (`checkRateLimit`), `:973` (`checkPlanLimit`), `:987` (insert `research_requests`), `:993/1025/1043` (status transitions). `lib/research/acquisition/quota.ts` — `checkCounter()` helper, `PER_USER_DAILY_SEARCH_QUOTA` (env `SEARCH_DAILY_QUOTA_PER_USER`, default 30), `checkSearchQuota(userId?)` checks the per-user counter first, then the shared global one — read and confirmed matches the design described in prior reports exactly.
- **Production-active:** **NO**, confirmed four independent ways: `origin/main`'s `app/api/intelligence/route.ts` lacks the rate-limit/plan-check block; `origin/main`'s `supabase/research-tables.sql` lacks the `market_intelligence` CHECK value; `origin/main` still has the global-only (non-per-tenant) quota logic; and **`database/schema.prisma`, `database/migrations/001_initial.sql`, `database/seed/seed.ts` are all still present on `origin/main`** — the dangerous duplicate-schema risk this phase eliminated is still live wherever `main` is deployed.
- **Test coverage:** `quota.test.ts`, 6 tests — read in full, exercises per-user-then-global ordering, fail-open on Redis error, independent counters per user.
- **Test pass status:** Passing.
- **Flags:** **The SQL `ALTER TABLE` for the widened `module` CHECK constraint has only ever been applied to the repo's `.sql` file, never confirmed run against the live Supabase database** (no migration runner exists in this repo; this was explicitly flagged as a risk in the original Phase 10 report and remains unverified from this sandbox — I have no Supabase credentials/connection here to check). Until that ALTER is actually executed against production Postgres, `market_intelligence`-module `research_requests` inserts will violate the CHECK constraint and fail (the insert error is caught and logged, not surfaced to the user — a fail-silent path, not a crash).

### Phase 10b — Two HIGH multi-tenant findings (`84995c2`)

- **Files actually changed:** `app/api/demo/generate/route.ts` (+13/-0), and **deleted**: `app/api/debug-env/route.ts` (10 lines), `app/api/debug/env/route.ts` (16 lines).
- **Commit:** `84995c293952a10a336fd427327a303da2dd586d`
- **Current code paths:** `app/api/demo/generate/route.ts` — read in full this session. `getClientIp()` (lines 177-181) reads `x-forwarded-for`/`x-real-ip`; `checkRateLimit(`ratelimit:demo:${getClientIp(req)}`)` is the first statement inside `POST()` (line 186), returning 429 before any AI call or DB write if exceeded.
- **Production-active:** **NO.** `origin/main`'s `app/api/demo/generate/route.ts` has no `checkRateLimit`/`getClientIp` (confirmed by grep — zero matches). **`app/api/debug-env/route.ts` and `app/api/debug/env/route.ts` are both still present in `origin/main`'s tree** — if `main` is what's deployed, these two secret-presence-leaking, unauthenticated debug endpoints are live on production right now.
- **Test coverage:** **None.** No test file exists for `app/api/demo/generate/route.ts`'s rate-limiting behavior — this was not caught by my own prior reports as a gap; flagging it now.
- **Test pass status:** N/A (no tests).
- **Flags:** No automated regression protection for this fix — a future refactor of `demo/generate/route.ts` could silently drop the rate-limit call with nothing in CI to catch it.

### Phase 11 — Commercial Readiness Report (`7496b8d`)

- **Files actually changed:** `COMMERCIAL_READINESS_REPORT.md` (new, 64 lines). Docs only.
- **Commit:** `7496b8d54be92697d4d8bd24ec2da895e346a532`
- **Current code paths:** N/A — documentation.
- **Production-active:** N/A (a document isn't "active," but its claims are evaluated below).
- **Test coverage / pass status:** A fresh, full run was executed this session as part of verifying this phase's "Test coverage for X has zero tests" claims:
  ```
  npx vitest run
  Test Files  11 passed (11)
       Tests  109 passed (109)
  ```
  This confirms the 109/109 figure independently (not carried over from memory) and confirms `npx tsc --noEmit` is clean and `npm run build` succeeds (25 routes generated, no errors) on the feature branch as of `7496b8d`.
- **Flags — re-checked every factual claim in the report body against live code:**
  - ✅ **"`plan-enforcement.ts` and `rate-limit.ts` have zero tests"** — confirmed true; no `plan-enforcement.test.ts` or `rate-limit.test.ts` exists anywhere in the repo.
  - ✅ **"`research-service.ts`, `ai-analysis.ts`, `search-provider.ts` are untested"** — confirmed true; none of these three files has a corresponding `.test.ts`.
  - ✅ **"`app/dashboard/analytics/page.tsx` is static hardcoded content"** — confirmed by direct read: a `'use client'` component with a single `const SECTIONS: Section[] = [...]` array of hardcoded strings, zero `fetch`/`useEffect`/data loading of any kind, and its own on-page disclaimer (`mi-disclaimer` div). The Phase 11 sub-agent's summary, which I had not independently re-verified before this audit, holds up.
  - ✅ **"Settings tells customers to email support for plan changes"** — confirmed: `app/dashboard/settings/page.tsx` literally reads "Contact hello@eunoia.eg to upgrade your plan or add team members." with no in-app upgrade flow.
  - ✅ **"No usage/quota widget on any dashboard page"** — confirmed: `grep` for `used.*limit|usage|quota` across `app/dashboard/**/*.tsx` returns zero matches.
  - ✅ **"`app/dashboard/error.tsx` renders raw `error.message`"** — confirmed by direct read, line ~25: `{error.message && (<p ...>{error.message}</p>)}`, unconditionally shown to the user whenever one exists.
  - ✅ **"Resend is a dependency but never fires for authenticated users"** — confirmed: `grep -rl "resend|Resend"` across `app/` and `lib/` returns exactly two files, `app/api/demo/route.ts` and `app/api/demo/generate/route.ts` — both unauthenticated public endpoints. Zero usage in `leads/route.ts`, `talent/route.ts`, or `intelligence/route.ts`.
  - ✅ **"Zero payment integration"** — confirmed: case-insensitive grep for "stripe" across the entire repo (excluding `node_modules`/lockfiles) returns zero matches.
  - ❌ **Inaccuracy found in this report's own body, not previously caught:** *"Lead Finder and Talent Finder now deliver on their promise (Phases 2-9 made them evidence-based, not AI-invented)."* This is **false for Talent Finder**. As detailed under Phase 2 above, `/api/research/talent` never calls `research-service.ts` or any Phase 2-9 engine — it is a single OpenAI prompt producing salary estimates and candidate "archetypes," explicitly labeled `"AI-generated research... verify before outreach"` in its own output (`lib/research/sources.ts:97`) and capped at a 95% confidence ceiling for that reason. Talent Finder is **honest about being AI-estimated** in its own UI copy, but the Commercial Readiness Report incorrectly implies it received the same evidence-based upgrade Lead Finder did. It did not.

---

## Cross-cutting classification

### 1. Features fully implemented and actively used *(on the feature branch — none are live in production per Critical Finding #0)*

- Lead Finder's full Research Core Engine pipeline: Search → Collect → Company Expansion → Normalize → Validate → Dedupe → Rank → Apollo (if configured) → AI Analysis, called from `app/api/research/leads/route.ts`, rendered in `app/dashboard/research/leads/page.tsx`. All six engines (validation, dedup, ranker rebuild, source-quality, company-expansion, company-size, decision-makers) are demonstrably imported and called in this one real call path, not just defined.
- Per-user rate limiting (`checkRateLimit`) on `/api/users/init`, `/api/research/leads`, `/api/research/talent`, `/api/intelligence`, and IP-keyed on the public `/api/demo/generate`.
- Plan/quota enforcement (`checkPlanLimit`) on the same four authenticated routes, backed by real `research_requests` row inserts with full lifecycle status tracking.
- Per-tenant fair-share search quota (`checkSearchQuota`) ahead of the shared global SerpAPI budget.
- Company size as a query modifier and ranking signal, end-to-end including the UI selector.
- Decision-maker role recommendations, end-to-end including UI rendering, with real LinkedIn search-URL construction (never fabricated names/emails/profiles).
- Supabase RLS for tenant isolation on `research_requests`/`reports`/`user_plans` (verified by direct read of all three `.sql` files this session).

### 2. Features implemented but currently unused

- **Source reputation tracking** (`recordSourceOutcome`/`getSourceReputation` in `lib/research/source-quality.ts`) — wired into the pipeline, but in-memory only (a plain `Map`), so its accumulated value resets on every cold start in a serverless deployment. Functionally "used" per-request but never persists learning across invocations the way the original framing implied.
- **`research_requests.module = 'market_intelligence'`** — the CHECK constraint was widened in the repo's SQL file (Phase 10a) but, as far as this sandbox can verify, no route currently inserts a row with that module value, and the ALTER may not even have been run against the live database yet (unverifiable from here). This is implemented capacity with no current caller and unconfirmed deployment.

### 3. Features implemented but blocked by missing API keys/configuration

- **Apollo enrichment** (Phase 9) — `ApolloOrgEnrichAdapter.isConfigured()` returns `false` and the step no-ops whenever `APOLLO_API_KEY` is unset. Confirmed absent from this sandbox's `.env.local`. Cannot confirm production state.
- **Redis-backed rate-limit/quota/cache** — `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are absent from this sandbox's `.env.local`. By design these fail open (request allowed, not blocked) when Redis is unreachable, so the *code* still runs, but every quota/rate-limit/reputation/cache feature in this entire mission is silently a no-op without it. Cannot confirm production state — if production also lacks these, every "we now enforce X" claim in Phases 1, 10a, and 10b is enforcing nothing.
- **Supabase** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, `DIRECT_URL`) — absent from this sandbox's `.env.local`. Every auth-gated route, every RLS policy, every `research_requests`/`reports` insert depends on this; none of it is exercisable end-to-end from this sandbox. Production almost certainly has these configured (the platform demonstrably runs at `ai.halannews.com`), but that cannot be directly confirmed from here.

### 4. Features implemented but not exposed in UI

- **Usage/quota visibility** — `checkPlanLimit` computes `used`/`limit` server-side on every request and returns them in the 403 JSON body, but no dashboard page (`reports`, `analytics`, `settings`) reads or displays them. This is backlog item #3/#18 in the Commercial Readiness Report and is confirmed still open by direct grep.
- **`research_requests` status lifecycle** (`submitted`→`processing`→`completed`/`failed`) — written to on every Lead Finder/Talent Finder/Intelligence call, but there is no UI anywhere that reads this table; only the final `reports` row is ever displayed to the user. A failed request currently has no user-visible trace at all (ties to backlog item #14, failed-report retry/recovery UX).
- **Apollo-verified badge** — `applyApolloEnrichment` sets `apolloVerified: true` on a `RankedSource` and appends "Confirmed by Apollo company database" to `rankReason`, but `app/dashboard/research/leads/page.tsx` never renders `rankReason` or an Apollo-verified indicator to the user — the signal exists in the data model and is silently dropped before render.

### 5. Features claimed in reports but not actually present in runtime execution

- **"Lead Finder and Talent Finder... evidence-based, not AI-invented"** (`COMMERCIAL_READINESS_REPORT.md`, Product completeness row) — **false for Talent Finder**, as detailed above. Talent Finder runs zero search/validation/dedup/ranking; it is a single AI completion with templated job-board links.
- **Every "production fix" framing in this mission's own commit messages and reports** (e.g. Phase 1's PR description: *"Identity is now always derived from the verified Supabase session"*) is true of the code on the feature branch but, per Critical Finding #0, **not true of whatever currently serves `ai.halannews.com`** if that's deployed from `main`. No prior report in this mission ever checked this until now — every phase report implicitly assumed merging-and-deploying would follow, which it never did.
- **Source reputation "tracking"** (Phase 5) implies persistence; it does not persist across cold starts (Map-based, in-memory). Not a fabrication, but the word "tracking" oversells a per-instance cache.

---

## Bottom line

The code itself, on `claude/blissful-newton-Sdej0`, is real: 109/109 tests pass fresh, `tsc --noEmit` is clean, `npm run build` succeeds, and every Phase 1-10 engine/fix is genuinely wired from its module into a real route handler and (where applicable) a real UI control — verified by direct read of the call chain, not by trusting prior summaries. That part of every prior report holds up.

What does not hold up is the unstated assumption running through every phase report that this work was protecting or improving production. **It was not, and still is not** — PR #9 is open, `main` has moved on independently since June 18 with its own unrelated feature work, and direct content comparison confirms all three CRITICAL and both HIGH security findings from Phase 10 are still exploitable on `main` today, six commits' worth of Research Core Engine quality work never reached the product Lead Finder actually serves from `main`, and the one report-level inaccuracy this audit found — conflating Talent Finder with Lead Finder's evidence-based upgrade — has been live in `COMMERCIAL_READINESS_REPORT.md` since Phase 11 with no prior check catching it.

**The single highest-priority action implied by this audit is not on the Phase 11 backlog at all: get a human with Vercel dashboard access to confirm the production deploy branch, and merge PR #9 if it is `main`.** Until that happens, every security and quality claim in Phases 1-10 is true only of a branch nobody is serving.
