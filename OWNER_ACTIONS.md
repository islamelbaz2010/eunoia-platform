# OWNER ACTIONS
**Platform:** Eunoia Intelligence Platform  
**Date:** 2026-07-30  
**Audience:** Founder (Islam Elbaz)

This document lists every action that requires human access to external systems. No engineer or AI agent can complete these. All are blocking or near-blocking for either security or production correctness.

---

## ACTION-01 — Revoke Exposed Anthropic API Key

**Priority: CRITICAL — Do this first.**

**Why:** A plaintext Anthropic API key was committed to the repository in `test.php`. Although the file has been deleted from the working tree, the key remains in git history and is derivable by anyone with repository access. It is currently active.

**Steps:**
1. Go to: `https://console.anthropic.com/settings/keys`
2. Locate the key with prefix: `sk-ant-api03-oGEaSqVDuPBKOgxMhod89FUYEpcO2hAHW_E...`
3. Click **Revoke**
4. Confirm revocation

**Optional hardening:** After revoking, purge the key from git history:
```bash
# Install git-filter-repo first: pip install git-filter-repo
git filter-repo --path test.php --invert-paths
```
This rewrites history and requires a force-push. Coordinate with anyone who has cloned the repository.

**Status if not done:** Active key can be used to generate API charges on your account.

---

## ACTION-02 — Apply Database Migration for AGENCY Plan Tier

**Priority: HIGH — Apply before next Vercel deployment.**

**Why:** The Prisma schema now defines the `AGENCY` plan tier, but the live PostgreSQL database still has the old 3-value enum. Deploying without this migration leaves the code and database out of sync.

**Steps:**
1. Open Supabase dashboard → SQL Editor
2. Run the following SQL:
   ```sql
   ALTER TYPE "Plan" ADD VALUE 'AGENCY';
   ```
3. Confirm the query completes without error

**Note:** This is a non-destructive additive change. No existing data is modified or at risk. It cannot be undone cleanly in PostgreSQL (enum value removal is not supported), but AGENCY is a real business tier so it should not need to be removed.

**Status if not done:** No immediate runtime failure (no current code writes `AGENCY` to `Workspace.plan`), but schema drift compounds over time and will cause Prisma errors if workspace plan upgrade logic is added.

---

## ACTION-03 — Provide Supabase Credentials for Local Development & Types

**Priority: HIGH — Required before any engineer can work locally.**

**Why:**
1. `.env.local` has all service credentials as empty strings. No engineer can run the platform locally in any functional state.
2. `types/supabase.types.ts` is a 10-line placeholder stub. Proper TypeScript types for all Supabase tables cannot be generated without a live connection.

**Steps — Part A: Populate `.env.local`**

Open `.env.local` and fill in the following variables with your Supabase project's values:

```bash
# Supabase — get from: https://supabase.com/dashboard/project/<project-id>/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>   # if using new SDK naming
DATABASE_URL=postgresql://postgres.xxx:<password>@aws-0-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxx:<password>@aws-0-xxx.supabase.com:5432/postgres

# OpenAI — get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# Upstash Redis — get from: https://console.upstash.com
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# SerpAPI — get from: https://serpapi.com/dashboard
SERP_API_KEY=...

# Apollo.io — get from: https://developer.apollo.io
APOLLO_API_KEY=...
```

**Steps — Part B: Regenerate Supabase TypeScript types**

After `.env.local` is populated, run:
```bash
npx supabase login
npx supabase gen types typescript --project-id <your-project-id> > types/supabase.types.ts
```

Then commit the updated `types/supabase.types.ts`.

**Status if not done:**
- Engineers cannot run or test the platform locally
- Research routes use `as any` casts — type safety is absent on the enforcement-critical code path

---

## ACTION-04 — Billing Provider Decision (ADR-PENDING-003)

**Priority: MEDIUM — Required before commercial launch.**

**Why:** The platform has no billing integration. Users are manually assigned plan tiers by an admin. Commercial launch requires self-service plan upgrades, and the two plan models (Prisma `Workspace.plan` and Supabase `user_plans`) cannot be unified until the billing webhook target is decided.

**Decision required:** Choose one:

| Option | Notes |
|---|---|
| **Stripe** | Most widely used for SaaS. Excellent webhooks for plan changes. Requires business registration. |
| **Paddle** | Handles VAT/tax automatically (relevant for MENA/EU customers). Acts as Merchant of Record. |
| **Lemon Squeezy** | Simplest setup for solo founders. Merchant of Record model. Lower monthly fees. |

**What engineering needs from this decision:**
1. The chosen provider's account credentials (API keys, webhook secrets)
2. Whether billing writes to `Workspace.plan`, `user_plans`, or both
3. Price IDs for each plan tier (STARTER, PROFESSIONAL, AGENCY, ENTERPRISE)

**Record decision in:** `docs/ADR_REGISTER.md` as ADR-003.

**Status if not done:** Plan upgrades remain manual admin console operations. Commercial launch is blocked.

---

## ACTION-05 — Confirm Production Supabase Project Identity

**Priority: MEDIUM — Needed before Phase 4 DI Engine integration.**

**Why:** Prior session documentation stated "Supabase project DELETED — DNS returns NXDOMAIN." However, live testing showed `intelligence.eunoiazones.com` redirects correctly to `/login`, which requires a working Supabase auth layer. This discrepancy was never formally resolved.

**Steps:**
1. Log in to `https://supabase.com/dashboard`
2. Confirm which project is serving `intelligence.eunoiazones.com`
3. Note the project ID (format: 20-character alphanumeric string)
4. Confirm that the `user_plans`, `research_requests`, `audit_log`, and `reports` tables exist and have data

**What to tell engineering:**
- The Supabase project ID currently in production
- Whether the project was deleted and recreated (if so, old auth user UUIDs may not exist)
- Whether any data migration was performed between the old and new project

**Status if not done:** DI Engine integration (Phase 4) cannot be planned accurately without knowing which Supabase project is authoritative.

---

## Summary

| Action | Priority | Blocks | Time Required |
|---|---|---|---|
| ACTION-01: Revoke Anthropic key | **CRITICAL** | Security | 2 minutes |
| ACTION-02: Apply DB migration | **HIGH** | Production correctness | 5 minutes |
| ACTION-03: Supabase credentials + types | **HIGH** | Local development, type safety | 30 minutes |
| ACTION-04: Billing provider decision | **MEDIUM** | Commercial launch | Business decision |
| ACTION-05: Confirm Supabase project | **MEDIUM** | Phase 4 planning | 10 minutes |

**Minimum to unblock engineering for Phase 4:** ACTION-01 + ACTION-02 + ACTION-03 + ACTION-05.
