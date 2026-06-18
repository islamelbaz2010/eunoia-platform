# Plan Enforcement Foundation Report

**Date:** 2026-06-18
**Status:** Infrastructure implemented. **No billing/payment provider connected** — exactly as scoped. Committed locally only — not pushed, not deployed, not merged.

## Summary

A plan-aware usage cap now sits in front of Lead Finder and Talent Finder, alongside the existing per-user rate limiter. It enforces a monthly report quota per `UserPlan` (Starter/Professional/Agency/Enterprise) by reading an assigned plan and summing this month's `credits_used` from `research_requests`. There is no Stripe/Paddle/PayPal integration, no checkout flow, and no automated plan-upgrade path — plans are assigned by a direct database write (manual today, by a future billing webhook later).

## A Deliberate Scope Decision: Per-User, Not Per-Workspace

`types/workspace.types.ts` already defines a `Plan`/`PLAN_LIMITS` concept, but it's Prisma's `Workspace` model — and per `FINAL_PLATFORM_AUDIT.md`, the live research routes never touch Prisma or workspace context at all; `research_requests`/`reports` are scoped only by `user_id` (Supabase auth). Bridging Supabase auth users into Prisma's workspace model would be a real architecture change, not "infrastructure only."

So this phase introduces a **new, parallel, deliberately separate type** (`types/plan.types.ts`'s `UserPlan`) rather than editing `types/workspace.types.ts`. Editing the existing `Plan` union to add `'AGENCY'` would have silently diverged it from the actual Postgres enum backing `Workspace.plan` (`database/migrations/001_initial.sql` defines `CREATE TYPE "Plan" AS ENUM ('STARTER','PROFESSIONAL','ENTERPRISE')` — no `AGENCY`), which is a real correctness risk, not a style preference. Reconciling workspace-level seats with per-user usage tracking is flagged as a Priority 3 decision in `MASTER_EXECUTION_PLAN.md`, not resolved here.

## Files Created

- **`types/plan.types.ts`** — `UserPlan` type (`STARTER | PROFESSIONAL | AGENCY | ENTERPRISE`), `PLAN_LIMITS` (Starter 20/mo, Professional 100/mo, Agency 300/mo, Enterprise unlimited), `PLAN_LABELS`.
  **The Agency tier's 300/mo figure is a placeholder estimate**, not a researched number — it was sized to sit between Professional (100) and unlimited Enterprise, consistent with the existing spacing pattern. It needs explicit business sign-off before being shown to a real customer as a commitment.
- **`lib/research/plan-enforcement.ts`** — `checkPlanLimit(supabase, userId)`: reads `user_plans.plan` (defaults to `STARTER` if no row exists), sums the current calendar month's `research_requests.credits_used` for that user, and returns `{ ok, used, limit, plan }`. Skips the usage query entirely for unlimited plans (`limit === -1`). **Fails open** (returns `ok: true`) on any Supabase error — consistent with every other guardrail in this module (`lib/research/rate-limit.ts`, `lib/research/acquisition/quota.ts`): an infra hiccup degrades to "allow," not "block every paying customer."
- **`supabase/plan-enforcement.sql`** — creates `user_plans` (`user_id` PK referencing `auth.users`, `plan` text with a check constraint, timestamps). RLS: users can `select` their own row; no `insert`/`update` policy for authenticated users — plan assignment is intentionally not self-service in this phase (writes go through the service-role key, which bypasses RLS).

## Files Modified

- **`app/api/research/leads/route.ts`** — `const sb = supabase as any` moved earlier (right after the existing rate-limit check) so `checkPlanLimit(sb, user.id)` can run before any research work starts; returns HTTP `403` with `{ error, used, limit, plan }` if the plan's monthly limit is exceeded.
- **`app/api/research/talent/route.ts`** — identical change.

Both routes now have two layers of request-time defense in this order: (1) rate limit — cheap, in-memory, prevents bursts; (2) plan limit — one Supabase query, enforces the monthly cap. This ordering avoids spending a DB round-trip on requests that are going to be rate-limited anyway.

## Why Plan Checks Run *Before* the Existing `research_requests` Insert

The plan check needed to read `research_requests` to sum usage, so it has to run before that request's own row is inserted (otherwise every check would see its own not-yet-completed request counted, or not, depending on insert order — avoided entirely by checking first).

## Not Done (Explicitly Out of Scope)

- No billing provider (Stripe/Paddle/PayPal) — per explicit instruction.
- No UI for plan display/upgrade — `app/dashboard/settings/page.tsx` already has a "Plan" section but it was not touched in this phase; wiring it to `user_plans` is a natural Priority 1.3/1.4 follow-up, not done here.
- No admin tool to assign a plan to a user — today that's a direct `insert`/`update` into `user_plans` via the Supabase dashboard or service-role key. Worth a small admin script before this is used for real customers.
- **`supabase/plan-enforcement.sql` has not been run against the live database** — same sequencing dependency as `usage-tracking.sql` (see `USAGE_TRACKING_REPORT.md`). Until both SQL files are applied, `user_plans` doesn't exist and `credits_used` doesn't exist; `checkPlanLimit`'s fail-open behavior means the *app* won't crash (it'll log/swallow the Supabase error and default to "allow, Starter, 0 used"), but the enforcement itself is inert until the SQL is applied.

## Risks

1. **Both SQL files must be run before this code is meaningfully active** — until then, enforcement silently no-ops (fails open) rather than erroring, by design. This is safe (matches existing conventions) but means: don't mistake "no errors in the logs" for "enforcement is working" — confirm by checking that `user_plans` and the `credits_used` column actually exist in the target database.
2. **Agency tier's limit (300/mo) is a placeholder** — needs business sign-off before being marketed.
3. **No plan-assignment UI** means every real user is implicitly `STARTER` (20 reports/mo) until someone manually inserts a `user_plans` row for them — worth knowing before onboarding the first paying customer under a higher tier.

## Rollback

Revert the two route changes (drop the `checkPlanLimit` call) and/or drop the `user_plans` table — no other table or code path depends on it. `research_requests.credits_used` can remain (harmless, additive) or be dropped per `USAGE_TRACKING_REPORT.md`'s rollback note.
