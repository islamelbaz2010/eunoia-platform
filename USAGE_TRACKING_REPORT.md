# Usage Tracking Implementation Report

**Date:** 2026-06-18
**Status:** Implemented. Committed locally only — not pushed, not deployed, not merged.

## Summary

Per-request usage tracking was added to the existing `research_requests` table rather than creating a new, parallel tracking table — minimal change, maximum reuse, per the master plan's guiding principle.

## What Was Already There vs. What Was Added

`research_requests` (defined in `supabase/research-tables.sql`) already tracks:
- `user_id` — present
- `created_at` — present
- `module` (`'lead_finder' | 'talent_finder'`) — this **is** the requested `report_type` field; no duplicate column was added under a different name, since one already exists and serves the identical purpose.

The one genuinely new field was **`credits_used`** — not previously tracked anywhere. Added via `supabase/usage-tracking.sql`:
```sql
alter table research_requests
  add column if not exists credits_used integer not null default 1;
```

## Files Created

- **`supabase/usage-tracking.sql`** — the migration. Matches the existing repo convention of topical, manually-run SQL files (`research-tables.sql`, `reports-table.sql`, `leads-table.sql`) rather than introducing a new Prisma-managed migration path, since `research_requests` lives in Supabase and is managed that way already.

## Files Modified

- **`app/api/research/leads/route.ts`** — the existing `research_requests` insert now includes `credits_used: 1`.
- **`app/api/research/talent/route.ts`** — same change.

Both routes already insert a `research_requests` row on every submission (`status: 'submitted'`, later updated to `processing`/`completed`/`failed`) — usage tracking rides on that existing write path rather than adding a second insert call.

## Why a Flat `1` Credit, Not Cost-Weighted

Lead Finder runs a full search→collect→rank→AI pipeline; Talent Finder is a single AI call. They could reasonably cost different credit amounts. This report intentionally ships the simplest version (flat 1 credit per report) because the task scope is "usage tracking infrastructure," not a pricing model — cost-weighting credits per report type is a pricing decision that belongs with the billing work (Priority 1.3/1.4 in `MASTER_EXECUTION_PLAN.md`), not invented here without business sign-off.

## Not Done (Out of Scope for This Phase)

- No migration runner was executed against the live database — there is no automated Supabase migration tool wired into this project (the existing `.sql` files are explicitly "run this in Supabase SQL Editor" by convention, and no DB credentials were available in this session to execute it directly). **`supabase/usage-tracking.sql` must be run manually in the Supabase SQL Editor before the `credits_used` column exists in production** — until then, the `credits_used: 1` field in the insert calls will be silently accepted by PostgREST as an unknown JSON key... actually, PostgREST will reject inserts referencing a column that doesn't exist yet. **This SQL file must be applied before deploying the route changes**, or every Lead Finder/Talent Finder request will fail. This is called out again in the consolidated risk list.

## Rollback

Revert the two route changes (drop `credits_used: 1` from the insert payloads) and/or drop the column (`alter table research_requests drop column credits_used;`) — no data loss for any other field, since this is purely additive.
