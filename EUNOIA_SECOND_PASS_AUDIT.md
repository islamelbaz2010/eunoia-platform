# Eunoia Intelligence Platform — Second-Pass Audit (Evidence-Graded Re-Verification)

This is a re-verification pass on the first audit (`EUNOIA_FULL_INDEPENDENT_AUDIT.md`, score 26/100). Every claim below is graded **Verified / Likely / Possible / Unproven** with the exact evidence behind it. Several first-pass conclusions are corrected or walked back below — this is not a rubber stamp.

---

## 0. Blocking discovery — read this before Task 2 or Task 4

While re-verifying Task 2 ("the production system currently demonstrates Lead Finder/Talent Finder/SerpAPI/research reports working"), I found a direct contradiction in git history that **invalidates the premise** unless you can resolve it:

**`origin/main`'s current tip (`7d30b9a`) contains none of the Research Intelligence V2 code.** Verified directly:

```
git ls-tree -r --name-only origin/main | grep "^app/api/research"   → no output
git ls-tree -r --name-only origin/main | grep "^app/api/debug"      → no output
```

There is no `app/api/research/leads`, no `app/api/research/talent`, no `app/api/debug/env`, no `app/api/debug-env`, no `lib/research/`, no `app/dashboard/research/` anywhere on `main`. `main`'s `app/dashboard/` only has `analytics`, `feasibility`, `intelligence`, `onboarding`, `real-estate`, `reports`, `settings`.

This code exists **only** on `research-intelligence-v2-data-layer`. I checked the GitHub PR history to see if it was merged and then somehow reverted:

| PR | Head SHA | Claims | Reality |
|---|---|---|---|
| #7 "Research intelligence v2 data layer" | `4fb4da3` | `state: closed`, `merged_at: 2026-06-18T14:13:26Z`, **`merged: false`** | `git branch -r --contains 4fb4da3` → only `research-intelligence-v2-data-layer`. Not on `main`. |
| #8 "Research intelligence v2 data layer" | `08d1795` | `state: closed`, `merged_at: 2026-06-18T16:16:39Z`, **`merged: false`** | `git branch -r --contains 08d1795` → only `research-intelligence-v2-data-layer`. Not on `main`. |

`merge-base research-intelligence-v2-data-layer origin/main` = `4cbd0d0`, which is itself a commit *on* `main` ("chore: update tsconfig build info after report history page") — i.e., the two branches share history up to that point and then diverge; `main` never absorbed anything past it. GitHub's API shows `merged_at` populated but `merged: false` on both PRs — the `merged: false` boolean matches what git itself shows: **these PRs were closed without merging.**

**What this means:** if Vercel's "Production Branch" for this project is the default `main` (the standard Vercel Git-integration behavior), then `https://ai.halannews.com/api/debug-env`, `/dashboard/research/leads`, and `/dashboard/research/talent` should not exist at all — they'd 404. That's incompatible with your earlier report of `{hasSerpApi:true, hasOpenAI:true, hasSupabase:true, nodeEnv:"production"}` from that exact URL.

I also notice `main`'s commit history contains several merge commits whose messages contain literal leftover shell text — e.g. `b6cf1ea`: `"Merge remote-tracking branch 'origin/claude/blissful-newton-Sdej0'\nt push origin HEAD:main\nvercel --prod"`. That pattern (shell commands bleeding into a commit message) is consistent with deploys being triggered manually via `vercel --prod` from a local checkout, rather than purely through Vercel's git-push-triggered builds — which would mean "what's live" can be decoupled from any single branch's history entirely, and is determined by whatever was checked out on whoever's machine at the moment they ran `vercel --prod`.

**I cannot resolve this from the sandbox** — no Vercel API/dashboard access, and `vercel.com`/`ai.halannews.com` are both network-egress-blocked here (confirmed by `curl` failures earlier in this engagement). Three explanations are consistent with the evidence, and I can't tell which without more data:

1. Someone changed the Vercel project's **Production Branch** setting from `main` to `research-intelligence-v2-data-layer` in the dashboard (a setting git can't show me).
2. Production was deployed via a manual `vercel --prod` CLI run from a local checkout of `research-intelligence-v2-data-layer`, independent of git state.
3. The `/api/debug-env` response you reported was from a different URL than `ai.halannews.com` (e.g. a Preview deployment alias), or is stale.

**This blocks a definitive Task 2 and Task 4 answer.** See §5 for exactly what would resolve it — it's one piece of data away from being settled.

---

## Task 1 — Re-verification of Critical Findings

### Finding A — `/api/users/init` has no authentication

**VERIFIED.**

- **File:** `app/api/users/init/route.ts`, full file (32 lines). No call to `supabase.auth.getUser()`, no session check, no API key check — confirmed by reading the entire file, not a snippet.
- **Identical on `main` and `research-intelligence-v2-data-layer`** (`diff` between the two versions produces zero output) — this finding applies regardless of which branch is live.
- **Middleware:** the project's root middleware is `proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`; confirmed via `git log --follow -- proxy.ts`, which shows the literal commit `ebfe2c7 fix: rename middleware to proxy (Next.js 16)`, and `package.json` pins `"next": "^16.2.6"`). Its matcher (`config.matcher`) runs on every path except `_next/static`, `_next/image`, `favicon.ico` — so it does execute for `/api/users/init`. But its auth-enforcement branch only fires for `protectedPaths = ['/dashboard']` (`proxy.ts:31-39`). `/api/users/init` is never checked — the middleware calls `supabase.auth.getUser()` unconditionally but takes no action on the result for any path outside `/dashboard`.
- **Database-layer protection:** none applies. `app/api/users/init` writes via Prisma (`@/lib/prisma/client`), not the Supabase client — Prisma connects with `DATABASE_URL`, and `.env.example`/`.env.local.example` both show this as `postgresql://postgres:...` — the Postgres **superuser** role, which always bypasses RLS regardless of whether RLS is enabled on a table. Separately, and independently sufficient on its own: there is no RLS policy SQL anywhere in the repo for the Prisma-managed `User`/`Workspace` tables at all (`supabase/*.sql` only has RLS for `demo_leads`, `user_plans`, `reports`, `research_requests` — none of which are the Prisma `User`/`Workspace` models).
- **Attack scenario:** `POST /api/users/init {"email":"anyone@example.com","supabaseId":"<any-uuid>","role":"ADMIN"}` (role is hardcoded to `'ADMIN'` in the handler regardless of input, `route.ts:41`) creates a real `Workspace` + `User` row with no auth of any kind, repeatable for arbitrary emails. Idempotent per email (line 23-25 returns existing record), so it's not a duplication bug, but it's still unauthenticated arbitrary row creation tied to a `Workspace`.
- **Exploitability:** trivial — single unauthenticated POST, no rate limit on this specific route (the rate limiter only wraps `/api/research/*`), no CAPTCHA, no email verification at this endpoint.

**Severity:** stands as **Critical** — auth bypass, not theoretical, present on both branches.

### Finding B — Debug endpoints are a production risk

**PARTIALLY VERIFIED — severity corrected down from Critical to Low/Medium, and existence is branch-conditional.**

Exact current contents (re-read in full, not summarized):

`app/api/debug/env/route.ts`:
```ts
export async function GET() {
  return NextResponse.json({
    hasSerpApi: !!process.env.SERPAPI_API_KEY,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    nodeEnv: process.env.NODE_ENV,
  })
}
```

`app/api/debug-env/route.ts`:
```ts
export async function GET() {
  return NextResponse.json({
    hasSerpApi: !!process.env.SERPAPI_API_KEY,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasSupabase: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    nodeEnv: process.env.NODE_ENV,
  })
}
```

**What IS exposed:** 3-4 booleans (whether each named env var is non-empty) + the literal string of `NODE_ENV`. **What is NOT exposed:** actual key values, key lengths, any database content, any user data, any stack traces, any internal hostnames/IPs, any file paths.

**Corrected severity reasoning:** the first-pass report called this Critical. On stricter re-grading, a boolean-only config-presence leak with no secret material, no PII, and no error detail is **Low** in isolation by standard practice (it tells an attacker which 3rd-party integrations exist — useful for reconnaissance/targeting phishing or credential-stuffing efforts against those specific providers, but it grants no direct access to anything). It does not meet the bar for Critical or High on its own. I'm correcting this down.

**Existence is unconfirmed for production**, per §0: both files exist only on `research-intelligence-v2-data-layer`, not `main`. If `main` is what's live, **this finding doesn't apply to production at all today** — zero risk, because the routes don't exist there.

**Recommended action unchanged regardless of severity: delete both.** They're temporary diagnostics, serve no purpose now that the root cause investigation is done, and cost nothing to remove.

**Output: LOW** (corrected from Critical), conditional on the branch question in §0.

### Finding C — Usage tracking is global instead of tenant-based

**NOT VERIFIED as originally stated — corrected to PARTIALLY VERIFIED with a narrower, more precise claim.**

I re-read all three usage-control modules in full and traced every call site. There are three separate mechanisms, and they are not all the same:

| Mechanism | File | Key shape | Scope |
|---|---|---|---|
| Rate limit (5 req/hr) | `lib/research/rate-limit.ts` | `ratelimit:research:leads:${user.id}` / `ratelimit:research:talent:${user.id}` (call sites: `app/api/research/leads/route.ts:49`, `app/api/research/talent/route.ts:79`) | **Per-user.** Verified not global. |
| Plan/credit monthly limit | `lib/research/plan-enforcement.ts` `checkPlanLimit(supabase, userId)` | Queries `research_requests` `.eq('user_id', userId)` (line 45) | **Per-user.** Verified not global. |
| SerpAPI daily search quota | `lib/research/acquisition/quota.ts` | `quota:search-provider:${date}` (`todayKey()`, line 11-13) — date only, no user/tenant component anywhere | **Global, app-wide.** Verified global. |

**Corrected finding:** the customer-facing controls that matter for billing/plan enforcement (rate limit, monthly credit cap) **are correctly scoped per user.** The only genuinely global counter is the *upstream cost-control budget* on SerpAPI itself (a shared daily search allowance across the whole app, independent of who's asking) — which is a legitimate architecture choice for protecting a single shared SerpAPI bill, not a tenant-isolation bug. It does mean one tenant's heavy usage can exhaust the shared daily quota and 502 every other tenant's `SerpApiProvider` calls that day (`search-provider.ts` throws `SearchProviderError` when `checkSearchQuota()` returns `ok:false`) — that's a real noisy-neighbor risk, but it is **not** the same claim as "usage tracking is global instead of tenant-based," which was overbroad as originally written.

**Output: PARTIALLY VERIFIED** (1 of 3 mechanisms is global; the 2 that gate customer billing/limits are correctly per-tenant). Also branch-conditional per §0 — none of this code exists on `main`.

### Finding D — Plan enforcement is fail-open

**VERIFIED.**

`lib/research/plan-enforcement.ts:56-58`:
```ts
} catch {
  return { ok: true, used: 0, limit: PLAN_LIMITS.STARTER.reportsPerMonth, plan: 'STARTER' }
}
```

**Exact code path:** `checkPlanLimit()` wraps its Supabase queries (`user_plans` lookup, `research_requests` sum) in a single `try`. Any failure — missing table (e.g. the `user_plans`/`credits_used` SQL migrations never applied), RLS misconfiguration, transient network error, malformed row — falls into this `catch` and returns `ok: true`, i.e., "allow." Worth noting beyond the original report: **the catch block has no logging at all** (no `console.error`), unlike the route handlers' own catch blocks which do log. This means fail-open events here are invisible in logs — you would not even know enforcement was silently bypassed without instrumenting this function directly.

**Consequence:** if the `user_plans`/`credits_used` migrations were never run against the live database (unconfirmed — see §5), every single call to `checkPlanLimit` throws on the very first query and returns the default allow-with-zero-usage result, meaning **the monthly plan cap has never actually fired for any user, ever**, silently.

**Exploitation scenario:** no special action needed — this isn't a bypass an attacker has to trigger, it's a default-allow on infrastructure error that could already be the permanent steady state if a manual SQL step was skipped.

**Output: VERIFIED.** Also branch-conditional per §0.

---

## Task 2 — Production Reality Check

I cannot independently hit `ai.halannews.com` (network-egress-blocked from this sandbox — confirmed by failed `curl` attempts earlier in this engagement) and the branch contradiction in §0 means I cannot take your earlier self-report at face value without resolving it first. This table states confidence honestly rather than assuming either scenario:

| Feature | Working | Evidence | Confidence |
|---|---|---|---|
| Legacy AI report engine (`/api/reports/generate`, 8 report types) | Likely yes | Exists on `main` with proper auth (`createClient()` + `auth.getUser()` check, `route.ts:21-25`) and Prisma onboarding gate; this is the one feature set that's unambiguously on whichever commit is deployed if it's anywhere near `main`'s tip | **Likely** — code is sound and present regardless of the branch question, but "live and working" still assumes no other breakage |
| Lead Finder (`/dashboard/research/leads`, `/api/research/leads`) | **Unproven** | Code exists and is well-formed (auth-gated, rate-limited, plan-checked, RLS-respecting) — but only on `research-intelligence-v2-data-layer`, confirmed absent from `main`'s tip (§0) | **Unproven** until the branch/deploy-source question is resolved |
| Talent Finder (`/dashboard/research/talent`, `/api/research/talent`) | **Unproven** | Same code quality and same branch-absence issue as Lead Finder | **Unproven**, same reason |
| SerpAPI/OpenAI/Supabase "configured" (per your `/api/debug-env` report) | **Unproven** | The route returning that data doesn't exist on `main` at all; can't confirm which deployment answered your request | **Unproven** — this is the crux of §0 |
| Research reports being generated end-to-end | **Unproven** | Depends entirely on Lead/Talent Finder being live, which depends on the unresolved branch question | **Unproven** |
| `/api/users/init` unauthenticated write path | Yes (if reachable at all) | Present and identical on both `main` and the research branch (Finding A) | **Verified** the *code* is exploitable wherever it's deployed; whether the deployed app is currently reachable by the public internet is assumed, not tested by me |

**Bottom line: I cannot complete Task 2 with confidence today.** The single largest input to a correct answer — which branch/commit Vercel actually serves at `ai.halannews.com` — is not visible from this sandbox. See §5.

---

## Task 3 — Business Value Audit (code quality ignored; revenue/usability judgment only)

This has to be split by scenario, because "can this generate revenue" depends entirely on what's actually deployed.

**If `research-intelligence-v2-data-layer`'s code is (or becomes) what's live:**
- **Lead Finder** is the most commercially credible single feature in the whole repo: real Google/SerpAPI search results, real source URLs, an honest "no results found" path instead of fabrication, LinkedIn search-URL generation for decision-makers. A marketing agency or small B2B sales team could plausibly use this today for prospecting research, with the caveat that it returns search-result-derived leads, not a verified contact database (the code says this to the user directly — `outreach_disclaimer` field, `leads/route.ts:126`). That honesty is a real product-trust asset, not a flaw.
- **Talent Finder** is an LLM salary/market-overview generator with no real candidate data (explicitly instructed not to invent named people, `talent/route.ts:42`) — useful as a quick market-sizing tool for a recruiter, not as a sourcing tool. Lower standalone willingness-to-pay.
- **Agencies:** plausible buyer for Lead Finder specifically — this is the kind of recurring-research task agencies bill clients for.
- **Real-estate companies:** the *separate*, older real-estate intelligence module (on `main`, NPV/ROI/cashflow calculators, Egypt-specific benchmarks) is the more relevant fit for that vertical, not Lead/Talent Finder.
- **SaaS / managed-service sale:** feasible in principle for Lead Finder alone, contingent on fixing Finding A (open signup-bypass) and the global SerpAPI quota (one heavy customer can starve all others) before charging anyone money for it.

**If `main` is what's actually live:** the sellable surface today is the **legacy AI report engine** (8 structured marketing/feasibility report types, Egypt-specific macro data, proper auth) plus the **real-estate intelligence module** (NPV/ROI calculators). Both are real, authenticated, working features with no equivalent open-auth-bypass bug found in this pass. They are more "AI report generator" than "research/data" tools — closer to a content/analysis SaaS than a Clay/Apollo-style data product.

**Scoring (revenue potential, /10, ignoring code quality, conditional on confirming what's live):**

| Dimension | Score | Why |
|---|---|---|
| Current Revenue Potential | 4–5 | Real functioning features exist either way; nothing is currently billable (no billing provider wired in either branch) |
| SaaS Potential | 5 | Plausible with the open-auth and global-quota issues fixed; no moat beyond execution speed |
| Agency Potential | 6 (if Lead Finder is live) / 4 (if only `main`) | Lead Finder maps directly onto an agency workflow; the legacy report engine is more generic |
| Enterprise Potential | 2 | No SSO, no audit log, no admin console, no SLA story, no data-residency story — nothing here is enterprise-ready regardless of branch |

---

## Task 4 — Investor Reassessment

**Methodology:** same 6-dimension framework as the first pass (Product, Technology, Defensibility, Growth Potential, Monetization, Execution Quality), each /10, summed and rescaled to /100 with equal weighting (no dimension privileged over another — a simplification, not a claim that real investors weight evenly).

**Why I cannot give you a single corrected number yet:** the score is materially different under the two §0 scenarios, and picking one without evidence would be exactly the "guessing" the brief tells me not to do.

- **If `research-intelligence-v2-data-layer` is live:** the first pass's 26/100 holds *directionally*, but should move up slightly because Finding B is corrected from Critical to Low and Finding C is corrected from "global usage tracking" (sounds like a tenant-isolation failure) to "one shared upstream API quota" (a real but much narrower issue) — both of those corrections reduce assessed risk. Findings A and D are fully confirmed and keep their severity. Revised estimate: **30–34/100** — still not fundable at $1M on this evidence, for the same root reasons as before (no moat, no billing, unresolved Critical auth bug), just slightly less alarming than the first pass implied.
- **If `main` is live and the research branch was never actually deployed:** the entire premise of "research reports are being generated in production" is false, the debug-endpoint and global-quota findings don't apply to production at all, and the live product is the legacy report engine + real-estate module — both authenticated, neither carrying the Critical findings above. That's a *smaller, more boring, but more honestly-secured* product. Estimated in that scenario: **22–28/100** — lower on Product/Defensibility (less differentiated, no real-time search-driven research story to tell investors) but higher on the security/execution dimensions (no live unauthenticated debug routes, no global-quota noisy-neighbor risk in the deployed system).

Either way, **Finding A (`/api/users/init`) is real and present in both scenarios** — that alone caps any version of this score well short of "fundable" until fixed, independent of which branch is live.

---

## Task 5 — Missing Data Required Before a Definitive Verdict

In priority order:

1. **Vercel project's Production Branch setting** (Project Settings → Git → Production Branch) for the project serving `ai.halannews.com`. This single fact resolves §0 entirely. A screenshot or a copy-pasted value is sufficient.
2. **Confirmation of the exact URL tested** when you got `{hasSerpApi:true, hasOpenAI:true, hasSupabase:true, nodeEnv:"production"}` — the literal URL bar contents, not just "production." If there's a Vercel preview-deployment alias involved, that changes the read entirely.
3. **The deployed commit SHA.** I can make this self-serve: if you want, I'll add one field — `commitSha: process.env.VERCEL_GIT_COMMIT_SHA` (Vercel auto-injects this; no new risk beyond what's already in the debug endpoint, which you've already flagged for deletion anyway) — to `/api/debug-env`, you redeploy and hit it once, and report back the SHA. I can match that SHA against `main` and `research-intelligence-v2-data-layer` instantly and close this question completely. Say the word and I'll make that one-line change.
4. **Whether `supabase/plan-enforcement.sql` and `supabase/usage-tracking.sql` were actually run against the live database** (Supabase SQL Editor history, or a `select * from user_plans limit 1;` / `select credits_used from research_requests limit 1;` result). This determines whether Finding D is a live, currently-firing bypass or a latent one waiting for the first infra hiccup.
5. **Supabase RLS policy list as currently configured in the dashboard** (Database → Policies), to confirm the `.sql` files in the repo actually match what's live — repo SQL files are "run this manually," not a tracked migration history, so repo state and DB state could have drifted.
6. **Any Vercel environment-variable screenshot** showing scope (Production/Preview/Development checkboxes) for `SERPAPI_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_URL/TOKEN` — relevant if scenario 1 in §0 (env-scope mismatch) turns out to be the explanation.
7. **Confirmation of whether `vercel --prod` has ever been run manually from a local machine for this project**, and if so, from which branch checkout — relevant to scenario 2 in §0, and not discoverable from git history alone.

I'm explicitly not guessing at any of these — every number in §3/§4 above is presented as conditional/ranged specifically because of this gap.

---

## Final Evidence-Quality Table

| Issue | Evidence Quality | Confidence | Additional Data Needed |
|---|---|---|---|
| A — `/api/users/init` unauthenticated | Direct code read, full file, both branches identical, middleware matcher traced, Prisma role traced | **Verified** | None — this is closed |
| B — Debug endpoints expose config booleans | Direct code read, full file content, severity re-graded | **Verified (content)** / **Unproven (live on prod)** | Item 1, 2, 3 above |
| C — "Usage tracking is global" | Direct code read of all 3 mechanisms, all call sites traced | **Partially verified — corrected, narrower than first stated** | Item 1 above (branch), item 4 (whether per-user enforcement is even reachable in prod) |
| D — Plan enforcement fail-open | Direct code read, exact catch block cited | **Verified (code)** / **Unproven (whether it's currently firing in prod today)** | Item 4 above |
| Lead/Talent Finder "working in production" | Contradicted by direct git evidence (§0) | **Unproven — premise itself is in question** | Item 1, 2, 3 above |
| Investor score | Two ranged estimates provided, no single number | **Cannot finalize** | Items 1–7 above |

No further conclusions should be drawn beyond what's in this document until item 1 (or item 3, via the self-serve `commitSha` field) resolves §0.
