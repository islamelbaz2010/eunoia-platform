# Reconciliation Report — Branch/Production Contradiction

**Root cause: my local git clone was stale.** A fresh `git fetch origin main research-intelligence-v2-data-layer` immediately resolves the entire contradiction. This is **answer (B)** from your four options: repository state was stale. Not (A) incorrect analysis logic, not (C) different paths, not (D) an alternate deploy mechanism.

## Exact evidence

| Item | Value |
|---|---|
| Vercel Production Branch (your confirmation) | `main` |
| `origin/main` HEAD before this re-fetch (what Audit #2 used) | `7d30b9a` |
| `origin/main` HEAD after `git fetch origin main` (just now) | `89b9892` |
| Merge commit that brought the research branch into `main` | `fa18d8f` — "Merge pull request #8 from islamelbaz2010/research-intelligence-v2-data-layer", **2026-06-18 19:16:39 +0300** (= 16:16:39 UTC) |
| `research-intelligence-v2-data-layer` HEAD at merge time | `08d1795` — committed 2026-06-18 16:07:29 UTC, 9 minutes before the merge |
| One commit that exists on `main` only, not on the research branch | `89b9892` — "Add logging for LEADS API initialization," adds 3 `console.log` lines to `app/api/research/leads/route.ts` (server-log only, not HTTP-exposed) |

Direct proof the code is on `main` right now (`git ls-tree -r --name-only origin/main`, run after the fresh fetch):

```
app/api/research/leads/route.ts
app/api/research/talent/route.ts
app/dashboard/research/leads/page.tsx
app/dashboard/research/page.tsx
app/dashboard/research/talent/page.tsx
lib/research/acquisition/ai-analysis.ts
lib/research/acquisition/index.ts
lib/research/acquisition/normalizer.ts
lib/research/acquisition/quota.ts
lib/research/acquisition/ranker.ts
lib/research/acquisition/research-service.ts
lib/research/acquisition/search-provider.ts
lib/research/acquisition/source-collector.ts
lib/research/acquisition/types.ts
lib/research/plan-enforcement.ts
lib/research/rate-limit.ts
lib/research/sources.ts
supabase/leads-table.sql
supabase/research-tables.sql
```

Plus both debug endpoints: `app/api/debug-env/route.ts` and `app/api/debug/env/route.ts` — confirmed present on `origin/main` by direct `git show origin/main:<path>`.

**Answers to your 4-part question:**
- Lead Finder exists in `main`: **yes** — `app/api/research/leads/route.ts`, `app/dashboard/research/leads/page.tsx`.
- Talent Finder exists in `main`: **yes** — `app/api/research/talent/route.ts`, `app/dashboard/research/talent/page.tsx`.
- Research Core (Search/Collect/Normalize/Rank/AI-Analysis) exists in `main`: **yes** — full `lib/research/acquisition/*` present.
- `lib/research` exists in `main`: **yes** — `lib/research/plan-enforcement.ts`, `lib/research/rate-limit.ts`, `lib/research/sources.ts`, plus the `acquisition/` subtree above.

---

## Section A — What was wrong in Audit #1

Nothing in Audit #1's branch assumptions, because Audit #1 never checked branch placement at all — it took the working tree (on `research-intelligence-v2-data-layer`) as the basis for code findings without comparing against `main`. That omission is itself the gap: it should have stated explicitly which branch the findings applied to and whether that branch was confirmed to be what Vercel serves. It wasn't wrong about the code it read — it was incomplete about where that code lives relative to production.

Separately, two of its severity/scope calls were corrected in Audit #2 and still stand corrected (see Section C): Finding B graded Critical when the evidence only supports Low; Finding C stated "usage tracking is global" when only one of three usage-control mechanisms (the SerpAPI daily quota) is actually global.

## Section B — What was wrong in Audit #2

Audit #2's §0 conclusion — "`origin/main` contains none of the Research Intelligence V2 code" and "PR #7/#8 were closed without merging" — was built on a **stale local `origin/main` ref** (`7d30b9a`), not re-fetched before concluding. At the moment that ref was cached, PR #8 genuinely had not yet merged (or the merge hadn't propagated to my fetch); merge commit `fa18d8f` landed at 16:16:39 UTC on 2026-06-18, and a further commit (`89b9892`) landed after that — both invisible to a clone that was never re-fetched after that point.

The compounding error: the GitHub API's `merged: false` flag on both PRs was treated as corroborating evidence for "not merged," when it was actually inconsistent with its own `merged_at` timestamp — that inconsistency should have prompted a re-fetch and a second look rather than being read as confirmation.

The procedural fix going forward: for any "X does not exist on `origin/<branch>`" claim, run `git fetch origin <branch>` immediately before concluding, not rely on whatever was cached earlier in the session.

## Section C — What remains verified (unaffected by the branch question)

These were verified against actual file contents and hold regardless of which branch/commit is live, and are now confirmed present on `main` itself after the fresh fetch:

- **Finding A** — `app/api/users/init/route.ts` has no auth check, identical on `main` and the research branch. Middleware (`proxy.ts`) only gates `/dashboard*`, not `/api/*`. Prisma's `DATABASE_URL` connects as the `postgres` superuser, which bypasses RLS regardless. **Verified, present on `main`.**
- **Finding D** — `lib/research/plan-enforcement.ts` fail-open catch block (`return { ok: true, ... }` on any error, no logging). **Verified, present on `main`.**
- **Finding C (corrected)** — `lib/research/rate-limit.ts` and `lib/research/plan-enforcement.ts` are keyed per-user (`user.id` in the Redis key / `user_id` filter in the Supabase query); only `lib/research/acquisition/quota.ts`'s daily SerpAPI quota is a global, dateonly key with no tenant dimension. **Verified, present on `main`.**
- **Finding B (corrected severity)** — both `app/api/debug-env/route.ts` and `app/api/debug/env/route.ts` return only booleans + `NODE_ENV`, no secret values. Now confirmed live on the branch Vercel actually serves, so this is a **live production exposure at corrected severity Low**, not a moot/branch-mismatched finding.
- RLS policies on `reports` and `research_requests` (`auth.uid() = user_id`) and the research routes' own `auth.getUser()` + rate-limit + plan-check sequence — present, unchanged, now confirmed on `main`.

## Section D — Final production architecture reality

- Vercel's Production Branch for `islamelbaz2010/eunoia-platform` is `main` (your confirmation); all other branches deploy as Preview only.
- `origin/main` at `89b9892` (current tip) **is** the Research Intelligence V2 codebase: Lead Finder, Talent Finder, the full Research Core Engine pipeline, both debug endpoints, plan-enforcement, and the per-user rate-limit + global SerpAPI quota are all present and are what `ai.halannews.com` builds and serves. Your earlier report of `/api/debug-env` returning `{hasSerpApi:true, hasOpenAI:true, hasSupabase:true, nodeEnv:"production"}` is consistent with this — there's no longer a contradiction to explain.
- `main` has diverged slightly ahead of `research-intelligence-v2-data-layer`: commit `89b9892` (debug `console.log` lines in `app/api/research/leads/route.ts`) exists only on `main`. Anyone continuing work on the research branch should pull `main` first or this line-level diff will need to be reconciled later.
- Everything in Audit #2's Task 1 (Findings A/B/C/D) and Task 1's evidence stands as written and now applies directly to confirmed production code — no further changes needed to those conclusions.
- Audit #2's Task 2/3/4 hedged, ranged answers (built on the now-resolved §0 contradiction) should be read as resolved in favor of the single "research branch is live" scenario in each of those sections, since that is now the confirmed reality rather than one of two possibilities.
