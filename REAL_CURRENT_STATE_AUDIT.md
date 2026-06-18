# Real Current State Audit

**Date:** 2026-06-18
**Method:** Direct `git` inspection of this session's working repository (`/home/user/eunoia-platform`) and a live `git fetch origin main`, performed in this turn — not inferred from prior chat history or prior reports. Every claim below is backed by a command shown in this conversation.

## 0. The Critical Finding First

**There are two different states of this repository, and they are not the same codebase:**

| | This local sandbox checkout | `origin` (GitHub) |
|---|---|---|
| Current branch / ref | `research-intelligence-v2-data-layer` | `main` |
| HEAD commit | `5dbcc97` — "SerpAPI migration, usage tracking, plan enforcement foundation" | `7d30b9a` — "Cleanup local environment" |
| Common ancestor with the other side | `4cbd0d0` | `4cbd0d0` |
| Research Core Engine present? | Yes | No |
| Any root-level `*.md` audit docs present? | Yes (11 files) | No (zero) |

`git merge-base research-intelligence-v2-data-layer origin/main` returns `4cbd0d0` — both histories share that ancestor and then diverged onto **separate, unrelated paths**. `origin/main`'s path went through a merge of `claude/blissful-newton-Sdej0` and a "Cleanup local environment" commit. The local sandbox's path went through 12 commits of Research Intelligence V1/V2 work. Neither path is a superset of the other; they are siblings.

**Root cause:** every phase of the Research Intelligence work (V1 hub, V2 Core Engine Phase 1/2, and today's SerpAPI/usage-tracking/plan-enforcement work) was committed **locally only**, per explicit, repeated instructions in this engagement ("commit locally only," "do NOT push," "no push, no merge, no deploy"). None of it was ever pushed to `origin`. This sandbox is an ephemeral container — if you are looking at this project from anywhere else (GitHub web UI, a fresh clone, a different session/container), you are looking at `origin`, and you will correctly see none of this work, because it was never sent there. That is the entire explanation for the "new evidence" — it is not evidence that the work didn't happen; it's evidence that it was never pushed, exactly as instructed at every step.

**This is a real risk worth naming plainly: if this sandbox container is reclaimed (the harness reclaims idle containers), all 12 commits of local-only work are permanently lost, because they exist nowhere else.** This report documents what exists *in this container, right now* — it does not claim that state is durable.

---

## 1. Does the Research Core Engine Exist?

**In this sandbox: Yes, verified file-by-file.**

```
lib/research/acquisition/
├── ai-analysis.ts        (78 lines)
├── index.ts               (barrel export)
├── normalizer.ts
├── quota.ts               (modified today — provider-agnostic)
├── ranker.ts
├── research-service.ts    (modified today — SerpApiProvider default)
├── search-provider.ts     (modified today — SerpApiProvider class, 99 lines)
├── source-collector.ts
└── types.ts
```
All 9 files present on disk in this checkout, non-empty, last touched per their actual edit history (verified via `wc -l` and direct `Read` in this conversation).

**On `origin/main`: No.** `git ls-tree -r origin/main --name-only` returns zero matches for `lib/research/`.

## 2. Does Lead Finder Exist?

**In this sandbox: Yes.** `app/api/research/leads/route.ts` exists, imports `getResearchService` from `lib/research/acquisition`, calls `.run()`, inserts into Supabase `research_requests`/`reports`. `app/dashboard/research/leads/` UI also referenced in this engine's earlier read-throughs.

**On `origin/main`: No.** `git ls-tree -r origin/main` shows no `app/api/research/*` path at all — the API surface on `origin/main` is `app/api/demo`, `app/api/intelligence`, `app/api/reports/*`, `app/api/users/init`, `app/api/workspace` only.

## 3. Does Talent Finder Exist?

**In this sandbox: Yes.** `app/api/research/talent/route.ts` exists (modified today to add plan-limit enforcement), does a direct OpenAI call (not the Core Engine) for salary/demand estimation.

**On `origin/main`: No.** Same evidence as #2 — no `app/api/research/` directory exists there at all.

## 4. Does the SerpAPI Migration Exist?

**In this sandbox: Yes, implemented this session.** `lib/research/acquisition/search-provider.ts` contains a `SerpApiProvider` class (confirmed via direct grep in this turn: `class SerpApiProvider implements SearchProvider`); `GoogleCustomSearchProvider` no longer exists in the file. `research-service.ts`'s constructor default was changed to `new SerpApiProvider()`. `tsc --noEmit` and `npm run build` both passed against this code earlier in this session.

**On `origin/main`: No** — neither the old Google CSE provider nor SerpAPI exist there, because the entire `lib/research/acquisition/` directory doesn't exist on that branch.

**Caveat that applies regardless of which repo state you trust:** no live SerpAPI call has ever been executed against a real API key in any session. This was validated by build/typecheck only.

## 5. Does Usage Tracking Exist?

**In this sandbox: Code exists; the database migration has NOT been applied anywhere.** `supabase/usage-tracking.sql` (adds `credits_used` to `research_requests`) exists on disk; both research routes were edited to write `credits_used: 1`. **This SQL has not been run against any live Supabase database in any session** — there is no tool/credential in this sandbox to execute it, and it was always documented as "run manually in the Supabase SQL Editor." So even within this sandbox's own state, usage tracking is "implemented in code, not yet active in any real database."

**On `origin/main`: No code for this exists at all.**

## 6. Does Plan Enforcement Exist?

**In this sandbox: Code exists; same caveat as #5.** `types/plan.types.ts`, `lib/research/plan-enforcement.ts`, `supabase/plan-enforcement.sql` all exist on disk; both research routes call `checkPlanLimit()`. The underlying `user_plans` table has never been created in any live database.

**On `origin/main`: No.** `origin/main` does have `types/workspace.types.ts` (a *different*, Prisma-linked `Plan` concept, STARTER/PROFESSIONAL/ENTERPRISE, tied to `Workspace.plan` — see `FINAL_PLATFORM_AUDIT.md` for why that one was deliberately not reused). It does not have `types/plan.types.ts` or any per-user enforcement code.

---

## 7. What Actually Exists (Summary)

**Exists in this sandbox container only, nowhere else, never pushed:**
- 12 commits of Research Intelligence V1/V2 work (`4fb60fa` through `5dbcc97`), including the full Research Core Engine, Lead Finder, Talent Finder, the SerpAPI migration, usage-tracking code, and plan-enforcement code.
- 11 root-level audit/design `.md` documents (`PROJECT_AUDIT.md`, `RESEARCH_ASSET_AUDIT.md`, `RESEARCH_DATA_LAYER_DESIGN.md`, `MASTER_SKILLS_CROSS_REFERENCE.md`, `COMPOSIO_AUDIT.md`, `RESEARCH_CORE_ENGINE_PHASE1.md`, `RESEARCH_CORE_ENGINE_PHASE2.md`, `FINAL_PLATFORM_AUDIT.md`, `SERPAPI_MIGRATION_PLAN.md`, `MASTER_EXECUTION_PLAN.md`, plus the three just-created phase reports).
- A clean working tree, passing `tsc --noEmit`, passing `npm run build` (verified earlier this session).

**Exists on `origin/main` (i.e., what any fresh clone or GitHub view will show):**
- The pre-research-intelligence codebase: `services/ai-engine/` (not yet relocated/renamed to `legacy-ai-engine`), `app/api/intelligence`, `app/api/reports/*`, `app/dashboard/intelligence`, `app/dashboard/feasibility`, `app/dashboard/real-estate`, `app/dashboard/reports`, `types/workspace.types.ts`'s Prisma-linked Plan concept. Zero `.md` audit docs, zero research/, zero lead/talent finder, zero SerpAPI/usage/plan-enforcement code.

## 8. Which Previous Claims Cannot Be Verified

Every specific technical claim in my prior reports about *this sandbox's* code (file contents, line numbers, function names, commit hashes) was re-verified directly in this turn and held up. What cannot be verified, and never could be from inside this sandbox, is **durability** — whether that work would still exist after this container is reclaimed. I do not have a way to check that from inside the very container in question; it can only be confirmed by checking `origin` after a push, which has never happened.

## 9. What Must Be Rebuilt

**If `origin/main` (`7d30b9a`) is treated as the only durable source of truth going forward, and this sandbox is discarded:** everything in §7's "sandbox only" list must be rebuilt from scratch — none of it is recoverable from `origin`.

**If instead this sandbox's branch is pushed to `origin` before the container is reclaimed:** nothing needs to be rebuilt. This is the simple fix, and it is the obvious next question — but per the standing "do not push" instruction repeated throughout this engagement, I have not done this and will not do it without an explicit go-ahead, since pushing is exactly the kind of remote-state-changing action that needs your direct sign-off.

## 10. Estimated Rebuild Effort (Worst Case — Starting From `origin/main`)

If rebuild from `origin/main` is actually needed, in original sequence:

| Work | Estimated effort |
|---|---|
| Project/asset audits (the 7 pre-existing `.md` docs) | 1 day (mostly thinking/analysis, not code) |
| Research Intelligence Hub UI + relocate legacy AI engine | 1–2 days |
| Research Core Engine Phase 1 (Search/Collect/Normalize/Rank/AI-Analysis) | 1–2 days |
| Research Core Engine Phase 2 (Lead Finder integration) | 0.5–1 day |
| `FINAL_PLATFORM_AUDIT.md` / `SERPAPI_MIGRATION_PLAN.md` / `MASTER_EXECUTION_PLAN.md` | 0.5 day |
| SerpAPI migration + usage tracking + plan enforcement (today's work) | 0.5 day |
| **Total** | **~5–7 days of equivalent work**, assuming no new design disagreements — the actual code is simple in retrospect (it's the iterative discovery/audit work, not line count, that drove most of the elapsed time) |

This is a real cost, not a rounding error — worth pushing the current branch rather than re-deriving it, if the content holds up to your own review.

---

## 11. Recommendation

Before anything else happens to this container: confirm whether you want this branch (`research-intelligence-v2-data-layer`, HEAD `5dbcc97`) pushed to `origin` so it's durable. I have not done this — it's a deliberate pause for your explicit decision, not an oversight. No other implementation action has been taken in response to this audit, per your instruction.
