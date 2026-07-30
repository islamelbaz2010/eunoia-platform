# P1-A DOMAIN CONSISTENCY REPORT
**Generated:** 2026-07-30  
**Phase:** 3 — P1 Hardening, Sub-phase A

---

## 1. Prisma Schema Validation

Schema is structurally valid. `prisma generate` completes without errors.

**Models:**
| Model | Status |
|---|---|
| `User` | Active — used by auth, workspace, admin routes |
| `Workspace` | Active — workspace API, init-user, use-workspace hook |
| `Report` | LEGACY — no active writes, kept for historical data |
| `ApiUsage` | LEGACY — no active writes, kept for historical data |

**Enums:**
| Enum | Status |
|---|---|
| `Role` | Active — ADMIN/AGENCY/SALES/VIEWER, used in User model |
| `Plan` | Active — now 4 values after this fix (see below) |
| `ReportStatus` | LEGACY — for retired Report model only |
| `ReportType` | LEGACY — for retired Report model only (27 values) |

---

## 2. AGENCY Enum Addition — Business Model Verification

**Verified AGENCY is a real product tier** from the following sources:

| Source | Evidence |
|---|---|
| `types/plan.types.ts` | `AGENCY: { reportsPerMonth: 300 }` — 300 reports/month quota |
| `supabase/plan-enforcement.sql` | `check (plan in ('STARTER', 'PROFESSIONAL', 'AGENCY', 'ENTERPRISE'))` — enforced at DB |
| `app/api/admin/users/[id]/plan/route.ts` | `VALID_PLANS = ['STARTER', 'PROFESSIONAL', 'AGENCY', 'ENTERPRISE']` |
| `app/dashboard/admin/admin-console-client.tsx` | `PLANS = ['STARTER', 'PROFESSIONAL', 'AGENCY', 'ENTERPRISE']` with AGENCY color `#7c3aed` |
| `app/dashboard/admin/admin-console-client.tsx` | `PLAN_COLORS.AGENCY = '#7c3aed'` — UI fully supports it |

**Decision: AGENCY added.** The enum was the only place it was missing.

**Change made:**
- `prisma/schema.prisma`: Added `AGENCY` to `Plan` enum between PROFESSIONAL and ENTERPRISE
- `types/workspace.types.ts`: Added `'AGENCY'` to `Plan` type union (mirrors Prisma)
- `lib/prisma/generated/`: Regenerated via `npx prisma generate` (gitignored, regenerated on every `npm install` via `postinstall`)
- **Commit:** `9fbd8c8`

---

## 3. All Locations Using Workspace.plan — Verified

| File | Usage | Impact of Adding AGENCY |
|---|---|---|
| `lib/prisma/init-user.ts:35` | `plan: 'STARTER'` (hardcoded on workspace create) | None — STARTER remains valid |
| `app/api/workspace/route.ts` | Reads `dbUser.workspace` (includes `.plan`) and returns it as JSON | None — AGENCY now valid in schema, API just passes through the value |
| `hooks/use-workspace.ts` | Fetches `/api/workspace`, casts to `WorkspaceWithMembers` | None — `Plan` type now includes AGENCY |
| `types/workspace.types.ts` | Defines `Plan = 'STARTER' | 'PROFESSIONAL' | 'AGENCY' | 'ENTERPRISE'` | Updated ✓ |

**Critical finding:** `Workspace.plan` is NOT used for quota enforcement anywhere. It is read and displayed (workspace settings view) but never drives a `checkPlanLimit()` call. The authoritative enforcement model is `UserPlan` from `types/plan.types.ts` backed by the Supabase `user_plans` table.

---

## 4. Database Compatibility

**Migration required before deploying this commit to production.**

```sql
-- Run in Supabase SQL Editor (or psql) before deploying
ALTER TYPE "Plan" ADD VALUE 'AGENCY';
```

**Risk assessment:**
- This is an additive DDL change. PostgreSQL allows adding values to existing enum types non-destructively.
- No existing rows use `Plan = 'AGENCY'` (the Workspace model only sets STARTER on creation).
- No rollback needed: adding an enum value is safe and cannot conflict with existing data.
- If this migration is NOT applied before deploying, Prisma writes with `plan: 'AGENCY'` would fail at runtime — but no code path currently sets `Workspace.plan` to AGENCY (only STARTER is written in `init-user.ts`), so the practical risk is low until plan-upgrade code is wired to Workspace.

**Migration conflicts:** None. There is no `prisma/migrations/` directory. The project uses `prisma db push` for schema changes.

---

## 5. Supabase Types — BLOCKED

**`types/supabase.types.ts` is a 10-line placeholder stub**, not generated output:

```typescript
// Auto-generated Supabase type stub — replace with `supabase gen types typescript` output
export type Database = {
  public: {
    Tables: Record<string, unknown>
    ...
  }
}
```

Tables missing from types: `user_plans`, `research_requests`, `reports`, `leads`, `audit_log`, `usage_events`.

**Why this is BLOCKED:** Regenerating requires:
```bash
npx supabase gen types typescript --project-id <project-id> > types/supabase.types.ts
```
This requires a live Supabase project connection with a valid service-role key. `.env.local` has all Supabase credentials as empty strings. Production credentials are in Vercel env vars but are not available locally.

**Impact of the stub:** Research routes use `as any` casts when reading from `user_plans`, `research_requests`. This is tracked as tech debt but does not cause runtime failures (the data shapes are validated at the Supabase level via CHECK constraints and RLS).

**Action required by owner:** Run `npx supabase gen types typescript` with production credentials and commit the output to `types/supabase.types.ts`.

---

## 6. Validation Results

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ PASS — 0 errors |
| `npm run lint` | ✅ PASS — 0 warnings |
| `npm test` | ✅ PASS — 25 files / 194 tests |
| `npm run build` | ✅ PASS — all routes compiled |
| `npx prisma generate` | ✅ PASS — client generated successfully |

---

## Summary

| Item | Status |
|---|---|
| Prisma schema valid | ✅ Confirmed |
| AGENCY matches business model | ✅ Confirmed — 4 independent sources |
| AGENCY added to `schema.prisma` | ✅ Done — commit `9fbd8c8` |
| AGENCY added to `workspace.types.ts` | ✅ Done — commit `9fbd8c8` |
| Prisma client regenerated | ✅ Done — `prisma generate` |
| Workspace.plan usages verified | ✅ 4 locations, none enforcement-critical |
| DB migration conflict check | ✅ None — no migrations history |
| DB migration required | ⚠️ OWNER ACTION: `ALTER TYPE "Plan" ADD VALUE 'AGENCY';` |
| Supabase types regeneration | 🔴 BLOCKED — requires live Supabase credentials |

---

## Next Phase

**P1-B — Operational Health** approved to begin.
