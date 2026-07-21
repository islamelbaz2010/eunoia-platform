# Deployment Reality Report

**Scope:** Production-truth audit only. No code was modified to produce this report. No implementation was performed. Every claim below is tagged with its evidence source and a confidence level. Where evidence does not exist, that is stated explicitly rather than inferred or assumed.

**Generated:** 2026-06-22, from sandbox session on branch `claude/blissful-newton-Sdej0`.

---

## 0. Hard constraint on this audit: network egress

This sandbox cannot reach `ai.halannews.com`, `intelligence.eunoiazones.com`, or `vercel.com`. Direct verification (`curl -D -`) against all three returns HTTP 403 with header `x-deny-reason: host_not_allowed` and body `Host not in allowlist: <host>`. This is the sandbox's own egress proxy, not a response from the target — confirmed by contrast with `api.github.com` (reachable, returns a real GitHub 403 with GitHub's own headers) and `example.com` (blocked with the identical sandbox deny message, proving this is a default-deny allowlist, not a block on these two domains specifically).

**Consequence:** No tool available in this session can read a live HTTP response from either production domain, query the Vercel API/dashboard, or run `vercel inspect`. Every claim in Sections 1–2 about *what is actually running on the live domains* is therefore inference from Git/GitHub evidence, not direct observation, and is labeled accordingly. This exact limitation was independently hit by at least two prior sessions in this repo (`EUNOIA_SECOND_PASS_AUDIT.md`, `EUNOIA_FULL_INDEPENDENT_AUDIT.md`) — it is a stable property of this environment, not a one-off.

If you want Section 1 answered with certainty, the fastest path is: open Vercel dashboard → each project → **Settings → Git → Production Branch**, and **Settings → Domains**, and report back what you see. That single screen resolves everything this sandbox cannot.

---

## 1. Which branch is deployed — direct evidence available

| Question | Answer | Confidence |
|---|---|---|
| Is `ai.halannews.com` reachable from this sandbox? | No — blocked by egress allowlist | N/A |
| Is `intelligence.eunoiazones.com` reachable from this sandbox? | No — blocked by egress allowlist | N/A |
| Is the Vercel dashboard/API reachable from this sandbox? | No — `vercel.com` blocked by egress allowlist | N/A |
| Are there Vercel projects connected to this GitHub repo? | **Yes, two**, confirmed via GitHub commit-status API (not inference) | **Verified** |
| Which two projects? | `eunoia-platform` (Vercel project ID `prj_RO4cTSQ4vYdDJ4xkNznYOelGf44O`) and `eunoianew` (`prj_2MH8gDM6mg4ywt9DmQn0f0AB8JaU`), both under Vercel team `islam-elbaz-s-projects` | **Verified** — from GitHub commit statuses + PR #9's Vercel bot comment |
| Does the Vercel integration auto-build every pushed branch (not just `main`)? | Yes — both projects attempted to build `claude/blissful-newton-Sdej0`'s HEAD (`814e0b1`), a non-main branch, confirming the GitHub App is configured to build on push/PR, independent of which branch is "Production" | **Verified** |
| Which Vercel project serves `ai.halannews.com`? | **Unknown** — no file in either branch's tree states this mapping; it lives exclusively in Vercel's Domains settings | **No evidence either way** |
| Which Vercel project serves `intelligence.eunoiazones.com`? | **Unknown**, same reason | **No evidence either way** |
| What is each project's configured "Production Branch"? | **Unknown** — this is a per-project Vercel dashboard setting, not stored in the Git repo (`vercel.json` in this repo contains only `buildCommand`/`outputDirectory`/`framework`, no branch config) | **No evidence either way** |
| What is the actual deployed commit SHA on either live domain? | **Unknown** — cannot be read from the live site (blocked) or from Vercel API (blocked) | **No evidence either way** |

### Circumstantial evidence (not proof) that `main` is the production source

1. `main`'s own commit history contains commit messages with literal leftover shell text — `"...git push origin HEAD:main vercel --prod"` (commits `b6cf1ea`, `bdbaa6a`, `5b77a41`, dated 2026-06-09) — indicating a human ran `vercel --prod` manually from a local `main` checkout at least three times historically. This shows `main` has been *a* deploy source in the past; it does not prove it is the *current* Production Branch for either Vercel project today.
2. `CURRENT_SYSTEM_MAP.md:7` (committed to this repo, authored by a prior session) asserts as fact: "deployed on Vercel (production: `ai.halannews.com`, Vercel Production Branch: `main`)." No evidentiary citation is given in that file for this claim — it cannot be upgraded above "asserted by a prior session, unverified."
3. Two later prior-session documents (`EUNOIA_SECOND_PASS_AUDIT.md`, `EUNOIA_RECONCILIATION_REPORT.md`) explicitly debate this same question and resolve it only by citing a **user-supplied, never independently re-verified** `/api/debug-env` response allegedly fetched from `ai.halannews.com`. No session, including this one, has independently reproduced that response. It cannot be treated as evidence.
4. There is no GitHub Actions workflow in this repo (`.github/workflows` does not exist) — deployment is 100% dependent on Vercel's GitHub App integration, which means the only deploy trigger surface is exactly what's visible in Section 1's verified rows above: push-based builds on connected branches, with the production-vs-preview distinction controlled solely by Vercel's per-project dashboard setting this sandbox cannot read.

**Bottom line on Task 1: cannot be verified from this sandbox.** The claim "Production Branch = `main`" is plausible and has circumstantial support, but every document that asserts it as settled fact is ultimately tracing back to either an unsourced assertion or a self-reported, unverified debug-endpoint response. This report will not repeat that claim as fact.

---

## 2. Deployed code vs. `main` vs. PR #9 — file-level, fully verified

This section does not depend on network access — it is pure Git history comparison, fully reproducible by anyone with repo access. If Production Branch is genuinely `main` (per the circumstantial evidence above), this section is the most complete answer available to "what's live" anywhere in this audit.

| | |
|---|---|
| `main` HEAD | `89b98929f52c4ced98e1a11e38c545e8f11e5ccf` — "Add logging for LEADS API initialization" |
| PR #9 branch HEAD | `814e0b162c7b502a0efacba3f75c9b416a2970f1` (`claude/blissful-newton-Sdej0`) |
| Merge base | `08d1795727a8edb3f3c3f4aefe63732f5a9f8edc` |
| Files changed `main` → PR #9 branch | 53 files, +4198 / -529 lines (GitHub API, confirmed) |
| Commits ahead | 18 |

### Full file-level diff, `main` vs. PR #9 branch

```
M  .env.example
M  .gitignore
A  AUDIT_CONSOLIDATION.md
A  COMMERCIAL_READINESS_REPORT.md
A  CURRENT_SYSTEM_MAP.md
A  EUNOIA_FINAL_INVESTOR_GRADE_AUDIT.md
A  EUNOIA_FULL_INDEPENDENT_AUDIT.md
A  EUNOIA_RECONCILIATION_REPORT.md
A  EUNOIA_SECOND_PASS_AUDIT.md
A  VERIFICATION_REPORT.md
D  app/api/debug-env/route.ts
D  app/api/debug/env/route.ts
M  app/api/demo/generate/route.ts
M  app/api/intelligence/route.ts
M  app/api/research/leads/route.ts
A  app/api/users/init/route.test.ts
M  app/api/users/init/route.ts
M  app/auth/callback/route.ts
M  app/dashboard/onboarding/page.tsx
M  app/dashboard/research/leads/page.tsx
D  database/migrations/001_initial.sql
D  database/schema.prisma
D  database/seed/seed.ts
A  lib/prisma/init-user.test.ts
A  lib/prisma/init-user.ts
M  lib/research/acquisition/ai-analysis.ts
A  lib/research/acquisition/apollo-adapter.test.ts
A  lib/research/acquisition/apollo-adapter.ts
M  lib/research/acquisition/index.ts
M  lib/research/acquisition/normalizer.ts
A  lib/research/acquisition/quota.test.ts
M  lib/research/acquisition/quota.ts
A  lib/research/acquisition/ranker.test.ts
M  lib/research/acquisition/ranker.ts
M  lib/research/acquisition/research-service.ts
M  lib/research/acquisition/search-provider.ts
M  lib/research/acquisition/types.ts
A  lib/research/company-expansion.test.ts
A  lib/research/company-expansion.ts
A  lib/research/company-size.test.ts
A  lib/research/company-size.ts
A  lib/research/company-validation.test.ts
A  lib/research/company-validation.ts
A  lib/research/decision-makers.test.ts
A  lib/research/decision-makers.ts
A  lib/research/dedup.test.ts
A  lib/research/dedup.ts
A  lib/research/source-quality.test.ts
A  lib/research/source-quality.ts
M  package-lock.json
M  package.json
M  supabase/research-tables.sql
M  tsconfig.json
A  vitest.config.ts
```

### What this means, mapped to the mission's Phases 1–11

| Phase / capability | Status on `main` | Status in PR #9 |
|---|---|---|
| Phase 1 — `/api/users/init` auth fix (identity from Supabase session, not request body) | **Absent** — `app/api/users/init/route.ts` is unchanged from before the fix | **Present** |
| Phase 1 — `/api/debug-env`, `/api/debug/env` endpoints | **Present and live** (never removed on `main`) | **Removed** (`D` in diff above) |
| Phases 2–9 — Research Core Engine (`company-expansion`, `company-size`, `company-validation`, `decision-makers`, `dedup`, `source-quality`, `apollo-adapter`, `ranker` updates, `quota.ts` per-user quota) | **100% absent** — none of these files exist on `main` at all | **Present**, all newly added or modified |
| Research orchestration wiring (`research-service.ts` calling the above engines) | `research-service.ts` exists on `main` but **does not call any of the Phase 2–9 engines** — they don't exist for it to call | **Modified** to wire in every engine |
| `app/api/research/leads/route.ts` (rate limit, plan limit, decision-maker titles, request lifecycle tracking) | Has only a 5-line logging addition (`89b9892`) — **none of the Phase 2–9 wiring is present** | **Modified** with full wiring |
| `app/api/intelligence/route.ts` (rate limit, plan limit, `research_requests` tracking added by Phase 10a) | **Absent** | **Present** |
| Multi-tenant plan enforcement (`supabase/plan-enforcement.sql`, plan-limit checks) | File doesn't exist on `main`'s tracked diff scope here / not wired into any route | **Present and wired** |
| Test suite (`vitest`, 109 tests across 11 files per this branch's local run) | **Does not exist** — `main`'s `package.json` has no `test` script, no `vitest` dependency, no `vitest.config.ts` | **Present** — full suite added |
| `SERPAPI_API_KEY` production incident investigation (`SERPAPI_ROOT_CAUSE_ANALYSIS.md`, `_IMPLEMENTATION_REPORT.md`, `_MIGRATION_PLAN.md`) | **Present** on `main` (commits `08d1795`, `e025b33`, `8e35321`) — this is a separate, already-merged-to-main incident response, unrelated to PR #9 | Inherited via merge-base, not modified by PR #9 |

**Direct implication:** if `main` is genuinely what's running in production (Section 1's unverified-but-plausible claim), then **none of Phases 2–11 of the platform-improvement mission are live**, and the Phase 1 auth fix is also not live — the request-body-trusts-client-identity vulnerability in `/api/users/init` would still be exploitable in production today, and the two debug-env endpoints (which leak `hasSupabase`/`hasOpenAI`/`hasSerpApi`/`nodeEnv` flags, unauthenticated, per the route source still present on `main`) would still be live and reachable.

---

## 3. Can PR #9 be merged cleanly? — Verified, not inferred

```
$ git merge-tree origin/main origin/claude/blissful-newton-Sdej0
4aa27e349eba7dad2f5008f080e0fab135b98fe9
$ echo $?
0
```

`git merge-tree` (non-destructive 2-ref form; touches no working tree, index, or ref) returns a single resulting tree SHA with **zero conflict markers** and exit code 0. **The merge is clean at the Git level.**

This was cross-checked by computing exactly which files were touched independently on both sides since the merge-base (`08d1795`):

- `main`-only changes since divergence: `.gitignore`, `app/api/research/leads/route.ts` (+5 lines, logging only)
- Intersection with PR #9's changes: only `app/api/research/leads/route.ts` overlaps — and `git merge-tree` already proves even this resolves with no conflict, because the PR's changes to that file are structurally additive (new imports/wiring) and don't touch the same lines as `main`'s 5-line logging addition.

GitHub's own `mergeable_state` field for PR #9 currently reads `"unstable"`. Per GitHub's documented semantics, `unstable` means **no merge conflicts, but failing or pending required status checks** — consistent with, not contradicting, the clean `merge-tree` result.

**Conclusion: PR #9 can be merged cleanly at the code/diff level, right now, with no manual conflict resolution required.**

---

## 4. What's actually failing (and what isn't)

| Check | Result | Source |
|---|---|---|
| `git merge-tree` (mergeability) | **Clean — 0 conflicts** | Verified, this session |
| Local `npm run build` on PR #9 branch HEAD | **Succeeds** — 25 routes built | Verified, this session |
| Local `npx tsc --noEmit` | **Clean, exit 0** | Verified, this session |
| Local `npx vitest run` | **109/109 tests passing, 11/11 files** | Verified, this session |
| Vercel build, project `eunoia-platform`, PR #9 HEAD (`814e0b1`) | **FAILED** | GitHub commit status API, re-confirmed at time of writing |
| Vercel build, project `eunoianew`, PR #9 HEAD (`814e0b1`) | **FAILED** | GitHub commit status API, re-confirmed at time of writing |
| GitHub Actions CI | **None configured** — no `.github/workflows` directory exists | Verified, this session |
| "Vercel Preview Comments" check | Success (this only posts the PR comment, it is not a build check) | GitHub API |

**The discrepancy is real and unresolved:** the exact same commit builds successfully in this sandbox but fails on Vercel's infrastructure, on both connected projects. Hypotheses ruled out by evidence gathered this session:

- *Missing required env var at build time* — ruled out. The two new env vars introduced by this branch (`SEARCH_DAILY_QUOTA_PER_USER`, `APOLLO_API_KEY`) are both explicitly optional with code-level defaults (`.env.example` diff confirms this), and both are read at request-time, not build-time.
- *Missing Prisma schema* — ruled out. `database/schema.prisma` was deleted by this branch, but `prisma/schema.prisma` (the path `prisma generate` actually uses, per `vercel.json`'s `buildCommand`) is present and unchanged on both branches.
- *tsconfig/build-config drift* — ruled out as a likely cause. The only `tsconfig.json` change is removing the now-defunct `database` exclude path; `tsc --noEmit` passes clean locally.

**Root cause: unknown.** Diagnosing it requires Vercel build logs (`npx vercel inspect dpl_4TW3LF9MUHnJG7RcSJnL5d2egMLu --logs` / `dpl_CkUGd6WMdxBA4MiksG7R5bLbUKou --logs`), which require Vercel CLI authentication this sandbox does not have and `vercel.com` network access this sandbox's egress allowlist blocks. This is a hard stop for this audit — it cannot be resolved without either Vercel dashboard/CLI access or an egress-allowlist change.

---

## 5. Merge Risk Matrix

| Risk | Likelihood | Impact if it materializes | Evidence basis | Mitigation before merging |
|---|---|---|---|---|
| **Git-level merge conflicts** | None | N/A | `git merge-tree` clean, verified | None needed |
| **Vercel build failure on merge to `main`** | **High** — both projects fail to build this exact commit right now | **Severe** — if `main` auto-deploys to production, merging would either fail to deploy (safe but blocks the mission) or, worse, if any retry/caching behaves differently, risk a partial/broken production deploy | Verified GitHub commit statuses, both projects, `state: failure` | Get Vercel build logs before merging. Do not merge until at least one project's build succeeds against this branch. This is the single largest blocker. |
| **Unknown current Production Branch** | Unknown by design (no evidence) | If Production Branch is *not* `main` for one or both projects, merging PR #9 may have **zero effect on either live domain**, giving false confidence that "the mission shipped" | No direct evidence either way (Section 1) | Confirm Production Branch setting in Vercel dashboard for both projects before treating a merge as equivalent to "shipped to production." |
| **Unknown domain-to-project mapping** | Unknown by design (no evidence) | Cannot predict which live domain (if any) would actually change after a successful deploy | No evidence (Section 1) | Confirm in Vercel dashboard → Domains for each project. |
| **Debug endpoint removal** (`/api/debug-env`, `/api/debug/env`) | Certain — PR #9 deletes both | **Positive** if merged: removes an unauthenticated env-flag-leaking endpoint from whatever serves `main` today | Verified file diff (Section 2) | None — this is a risk-reducing change, not a risk. |
| **Auth fix regression** (`/api/users/init` rewrite + `app/auth/callback/route.ts` now calling `lib/prisma/init-user.ts` in-process instead of self-fetching) | Low-moderate — substantive behavioral change to the signup/onboarding path | If the in-process call has any subtle behavioral difference from the old self-`fetch()`, email-confirmation onboarding could break | PR #9's own description flags this as only manually-tested in a "staging environment" — checkbox for that manual test is **unchecked** in the PR body | Manually verify signup → email confirmation → onboarding flow end-to-end in a real (non-production) environment before merging, per the PR author's own un-checked test-plan item. |
| **Schema/data migration risk** (`supabase/research-tables.sql` modified, `database/schema.prisma` + `database/migrations/001_initial.sql` deleted) | Moderate — deleting tracked migration files doesn't undo applied DB state, but means there is no in-repo record of how the live DB schema was originally created if it still depends on those migrations | Could complicate any future rebuild-from-scratch of the database, or future audits | Verified file diff (Section 2) | Confirm these migrations were already applied to the live Supabase instance and that nothing currently depends on the deleted files being present in-repo. |
| **Test suite introduced for the first time** | N/A (positive change) | Establishes a regression baseline that didn't exist on `main` at all | Verified — `main` has no `test` script, no vitest dep | None — risk-reducing. |
| **Scope-correction transparency** (per `VERIFICATION_REPORT.md`, Talent Finder route does not actually use the Research Core Engine despite mission narrative implying broader coverage) | N/A — already documented | Reputational/expectations risk if PR #9 is presented as "evidence-based research across the platform" without that caveat | Already documented in `VERIFICATION_REPORT.md`, re-affirmed here, not re-litigated | Carry the existing caveat forward in any merge/release notes. |

---

## 6. Direct answers to the six tasks

1. **Which branch is deployed where** — Cannot be verified from this sandbox (no Vercel/dashboard access, both production domains and `vercel.com` blocked by network egress allowlist). Two Vercel projects exist and are connected via GitHub integration; which one (if either) serves which domain, and what each project's Production Branch is set to, is unknown.
2. **Deployed code vs. `main` vs. PR #9** — Full file-level diff produced in Section 2 (53 files, verified via `git diff`). If `main` is production (unverified), Phases 2–11 and the Phase 1 fix are not live.
3. **DEPLOYMENT_REALITY_REPORT.md** — this file.
4. **Can PR #9 merge cleanly** — **Yes**, verified via non-destructive `git merge-tree`, zero conflicts.
5. **Merge risk matrix** — Section 5. Largest concrete risk: both connected Vercel projects currently fail to build this exact branch HEAD, for an undiagnosed reason (logs inaccessible from this sandbox).
6. **No code modified, nothing implemented** — confirmed; this session's only filesystem write is this report.
