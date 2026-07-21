# DEMO ACCOUNT CHECKLIST
**Read-only analysis. No code modified. No commits created.**
**Date: 2026-07-07**

---

## Answer 1 — Can a brand-new account immediately reach the dashboard?

**NO.**

A brand-new Supabase user cannot reach `/dashboard` immediately after signup. Here is the exact flow:

**Signup path:**
1. User fills `/signup` → `supabase.auth.signUp()` is called
2. Supabase sends a **confirmation email** — the account is unconfirmed until the link is clicked
3. User clicks the confirmation link → browser hits `/auth/callback?code=...`
4. `app/auth/callback/route.ts` exchanges the code for a session, then calls `initUserFromSupabase()`
5. `initUserFromSupabase()` creates a Prisma `User` row + `Workspace` row in the PostgreSQL database
6. User is redirected to `/dashboard`

**Why it fails without completing step 3–5:**

`app/dashboard/layout.tsx` lines 14–21 runs on every dashboard page load:
```typescript
const dbUser = await prisma.user.findUnique({ where: { email: user.email ?? '' } })
if (!dbUser && user.email) {
  redirect('/dashboard/onboarding')
}
```

If the Prisma `User` row does not exist, the user is redirected to `/dashboard/onboarding` — a workspace setup form. They cannot proceed to the actual dashboard until they submit it.

**The onboarding page** (`app/dashboard/onboarding/page.tsx`) calls `/api/users/init`, which calls `initUserFromSupabase()` and creates the missing Prisma records. After submission, they are redirected to `/dashboard`.

**So a brand-new account reaches the dashboard only after either:**
- Completing email confirmation (creates the Prisma row automatically in `auth/callback`), OR
- Being redirected to onboarding and completing the workspace setup form

---

## Answer 2 — What exact conditions bypass onboarding?

A user bypasses the onboarding redirect if and only if **all three** of these are true:

**Condition 1:** The user is authenticated (has a valid Supabase session cookie).
Evidence: `app/dashboard/layout.tsx` line 9 — unauthenticated users go to `/login`, not onboarding.

**Condition 2:** A Prisma `User` row exists for the user's email address.
Evidence: `app/dashboard/layout.tsx` line 15 — `prisma.user.findUnique({ where: { email: user.email } })`

**Condition 3:** The Prisma database is reachable.
Evidence: `app/dashboard/layout.tsx` lines 19–21 — if the Prisma query throws (DB unreachable, wrong connection string), the catch block silently allows through. This is the "dev fallback" — in production it means a broken DB connection accidentally lets users in.

**When Condition 2 is satisfied (how a Prisma User row gets created):**
- Path A: User completes email confirmation → `app/auth/callback/route.ts` calls `initUserFromSupabase()` automatically
- Path B: User lands on onboarding and submits the workspace form → `/api/users/init` calls `initUserFromSupabase()`
- Path C: A Prisma `User` row is inserted manually into the database (admin action)

**An account created directly in Supabase dashboard** (no signup flow, no email confirmation) will NOT have a Prisma row and will be sent to onboarding on first login.

---

## Answer 3 — What database records are required?

Two separate databases are involved. Both must have the correct records.

### Supabase (Primary Database)

| Table | Required Record | How It's Created |
|-------|----------------|------------------|
| `auth.users` | One row with the demo account's email + confirmed status | Supabase auth signup + email confirmation |
| `user_plans` | Zero or one row for the user's UUID (defaults to STARTER if absent) | Optional manual insert; platform works without it |
| `research_requests` | Zero or more rows (usage tracking) | Created automatically when reports are generated |
| `reports` | At least 5 rows for a non-empty demo (pre-generated reports) | Created automatically when reports are generated |

**The `user_plans` row is optional.** `lib/research/plan-enforcement.ts` line 37 defaults to `STARTER` (20/month) if no row exists. No action needed unless you want a higher plan limit.

### Prisma/PostgreSQL (Legacy but Active Gatekeeper)

| Table | Required Record | How It's Created |
|-------|----------------|------------------|
| `User` | One row with `email = demo account email` | Via `auth/callback` or `/api/users/init` |
| `Workspace` | One row linked to the User via `workspaceId` | Created in the same transaction as the User |

**These two Prisma rows are the single most critical prerequisite for the demo.** If they don't exist, the investor sees an onboarding form.

---

## Answer 4 — Can these records be prepared manually before tomorrow?

**YES — here is exactly how.**

### Option A: Use the existing signup + email confirmation flow (Recommended)
1. Go to `https://ai.halannews.com/signup`
2. Create a new demo account with a clean email address (e.g., `demo@eunoia.eg` or a Gmail alias)
3. Check the inbox and click the confirmation link
4. The `/auth/callback` route runs automatically, creates both Prisma records, and redirects to `/dashboard`
5. Verify you land on `/dashboard` (not `/dashboard/onboarding`)
6. Generate 5 reports across different types (this also creates the Supabase `reports` rows)

This is the cleanest path. Zero manual database manipulation required.

### Option B: Insert Prisma records manually via SQL (If Option A fails or you have an existing account)
Connect to the PostgreSQL database (Supabase dashboard → Table Editor or psql) and run:

```sql
-- Step 1: Create workspace
INSERT INTO "Workspace" (id, name, plan, "ownerId", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,          -- id (cuid-compatible)
  'Demo Workspace',                  -- name
  'STARTER',                         -- plan
  'SUPABASE-USER-UUID-HERE',         -- ownerId (paste from auth.users)
  NOW(),
  NOW()
);

-- Step 2: Create user (use the workspace id from step 1)
INSERT INTO "User" (id, email, name, role, "workspaceId", "createdAt", "updatedAt")
VALUES (
  'SUPABASE-USER-UUID-HERE',         -- id must match auth.users.id exactly
  'demo@youremail.com',              -- email must match auth.users.email exactly
  'Demo Account',
  'ADMIN',
  'WORKSPACE-ID-FROM-STEP-1',
  NOW(),
  NOW()
);
```

**Important:** The `User.id` in Prisma must match the Supabase `auth.users.id` exactly. The layout check uses `email` to look up the user, but `initUserFromSupabase` uses the Supabase `id` as the Prisma `User.id`.

### Option C: Assign a higher plan (Optional, for demo purposes)
If you want to show "Professional" plan limits or avoid the 20/month cap:
```sql
INSERT INTO "user_plans" (user_id, plan)
VALUES ('SUPABASE-USER-UUID-HERE', 'PROFESSIONAL')
ON CONFLICT (user_id) DO UPDATE SET plan = 'PROFESSIONAL';
```

---

## Answer 5 — Is there any hidden blocker that could prevent the dashboard from opening?

**YES. Six hidden blockers were found. Listed in order of probability.**

### Blocker 1 — Missing Prisma User Row (HIGHEST PROBABILITY)
**What happens:** Browser shows `/dashboard/onboarding` instead of `/dashboard`
**When it triggers:** Any account created outside the normal signup → email confirmation flow
**Evidence:** `app/dashboard/layout.tsx` lines 14–17
**Fix:** Complete onboarding once, OR insert Prisma records manually (see Answer 4)

### Blocker 2 — Wrong Environment Variable Name for Supabase Anon Key
**What happens:** Auth fails silently; all Supabase calls return unauthenticated errors; user cannot log in
**When it triggers:** If Vercel has `NEXT_PUBLIC_SUPABASE_ANON_KEY` set but NOT `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
**Evidence:** `.env.local.example` line 6 documents `NEXT_PUBLIC_SUPABASE_ANON_KEY`, but `lib/supabase/client.ts` line 9 and `lib/supabase/server.ts` line 11 both read `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
**These are different variable names.** If the Vercel dashboard has the old name set, auth would be broken for everyone.
**Mitigation:** Since the platform is reportedly live and working at `ai.halannews.com`, Vercel must have `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` set correctly. But this should be verified before the demo.

### Blocker 3 — Rate Limit Already Hit on Demo Account
**What happens:** All AI route calls return `429 Rate limit exceeded: 5 requests per hour`
**When it triggers:** If the demo account was used for testing in the hour before the demo
**Evidence:** `lib/research/rate-limit.ts` — 5 requests per hour per user, keyed by `ratelimit:{module}:{user.id}`
**Fix:** Either wait for the hour window to reset, or delete the Redis key manually (requires Upstash console access)

### Blocker 4 — STARTER Plan Monthly Limit Exhausted
**What happens:** All AI route calls return `403 Monthly plan limit reached (20/20)`
**When it triggers:** If the demo account has already generated 20+ reports this month (including test runs)
**Evidence:** `lib/research/plan-enforcement.ts` — counts `research_requests.credits_used` for the current calendar month
**Fix:** Assign PROFESSIONAL plan (100/month) to the demo account via SQL, OR use an account with fewer reports used

### Blocker 5 — Prisma DATABASE_URL Not Configured or Wrong in Vercel
**What happens:** The dashboard layout's Prisma query throws. The catch block silently allows through — so the user DOES reach the dashboard. BUT onboarding is never triggered either, so this may not block the demo.
**Evidence:** `app/dashboard/layout.tsx` lines 19–21 — catch block says "DB not connected in dev — allow through"
**Net effect in production:** If DATABASE_URL is misconfigured, the Prisma check silently fails open and users bypass onboarding. This is technically a pass for the demo but hides a configuration error.

### Blocker 6 — Email Not Confirmed
**What happens:** Login returns "Email not confirmed" error from Supabase
**When it triggers:** If a fresh account is created but the confirmation email was never clicked
**Evidence:** Supabase default behavior — `signInWithPassword` returns error for unconfirmed emails unless "Confirm email" is disabled in Supabase project settings
**Fix:** Either click the confirmation email, OR disable email confirmation in the Supabase project settings (not recommended for production)

---

## Answer 6 — Every Possible Demo-Breaking Scenario

Ranked highest to lowest risk.

| Rank | Scenario | Probability | Impact | Recoverable During Demo? |
|------|----------|------------|--------|--------------------------|
| 1 | Demo account hits onboarding (missing Prisma row) | HIGH if account not pre-verified | Demo stops cold — investor sees workspace setup form | NO — requires DB fix |
| 2 | Rate limit hit during demo (5 req/hour) | MEDIUM if account used for testing beforehand | All AI features return 429 error | NO during demo — requires Redis flush or wait |
| 3 | STARTER plan limit hit (20/month) | MEDIUM if account used heavily this month | All AI features return 403 error | Partially — can work around by explaining |
| 4 | SERPAPI quota exhausted for the day | MEDIUM if Lead Finder used extensively for testing | Lead Finder returns zero results or error | NO — day's quota is fixed |
| 5 | Lead Finder cache miss → 20-second wait | MEDIUM if cache not pre-warmed | Long spinner while investor watches | YES — results eventually arrive |
| 6 | halannews.com proxy down during demo | MEDIUM | Demo form generates a static fallback report instead of AI-generated | Partially — fallback fires, but it's generic text |
| 7 | Dashboard shows "No reports yet" (empty state) | HIGH if demo account not pre-populated | Looks like no one uses the product | NO — cosmetic, but damaging |
| 8 | OpenAI API unavailable | LOW | All real estate + talent + lead AI routes fail | NO — nothing to do |
| 9 | Vercel cold start on first report generation | LOW-MEDIUM | 3–5 second delay on first request | YES — just wait |
| 10 | Upstash Redis unavailable | LOW | Rate limiting fails open (allow through) — actually fine | YES — fail-open behavior |
| 11 | Investor navigates to `/market-intelligence` manually | LOW (not in sidebar) | Sees halannews.com iframe | YES — navigate away and explain |
| 12 | Prisma DATABASE_URL wrong/missing | LOW in production | Silent fail-open — dashboard works anyway | YES — invisible to user |
| 13 | Supabase auth cookie expires during demo | VERY LOW (session lasts hours) | User logged out mid-demo | YES — log back in |

---

## DEMO_ACCOUNT_CHECKLIST

### SECTION 1 — Required User Account

```
□ Demo account email exists in Supabase auth.users
□ Email is confirmed (not pending confirmation)
□ Password is known and documented
□ Account was created via the signup → email confirmation flow
  OR Prisma records were inserted manually (see Answer 4)
```

### SECTION 2 — Required Prisma Records

```
□ Prisma User row exists
  - Query to verify: SELECT * FROM "User" WHERE email = 'demo@yourdomain.com';
  - id column must match auth.users.id exactly

□ Prisma Workspace row exists
  - Query to verify: SELECT * FROM "Workspace" WHERE "ownerId" = 'SUPABASE-UUID';
  - workspaceId in User row must reference this Workspace
```

**If either row is missing, the investor sees an onboarding form instead of the dashboard.**

### SECTION 3 — Required Supabase Records

```
□ auth.users row with confirmed email ← prerequisite for everything
□ reports table: minimum 5 rows for demo account
  - 2 × feasibility study (different projects and cities)
  - 1 × campaign_roi
  - 1 × lead_finder (creates cache hit for Section 7)
  - 1 × talent_finder
  
□ user_plans (optional — defaults to STARTER if absent)
  - Recommended: insert PROFESSIONAL plan to give headroom
  - SQL: INSERT INTO user_plans (user_id, plan) VALUES ('UUID', 'PROFESSIONAL')
    ON CONFLICT (user_id) DO UPDATE SET plan = 'PROFESSIONAL';

□ research_requests: will be created during report generation above
  - Verify: count must be < plan limit (20 for STARTER, 100 for PROFESSIONAL)
```

### SECTION 4 — Required Environment Variables (Vercel)

```
□ NEXT_PUBLIC_SUPABASE_URL         — must be set
□ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  — must be set
  ⚠️  NOTE: .env.local.example documents NEXT_PUBLIC_SUPABASE_ANON_KEY
      but the code reads NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      These are DIFFERENT names. Verify Vercel has the correct name set.

□ OPENAI_API_KEY                   — required for all AI routes
□ SERPAPI_API_KEY                  — required for Lead Finder
□ UPSTASH_REDIS_REST_URL           — required for rate limiting + caching
□ UPSTASH_REDIS_REST_TOKEN         — required for rate limiting + caching
□ DATABASE_URL                     — required for Prisma (onboarding check)
□ DIRECT_URL                       — required for Prisma migrations
□ RESEND_API_KEY                   — required for demo form email delivery
□ SUPABASE_SERVICE_ROLE_KEY        — required for demo lead capture (/api/demo)
  ⚠️  NOTE: NOT documented in .env.local.example
```

### SECTION 5 — Required API Key Status

```
□ OpenAI API key is active and has billing balance
□ SerpAPI key is active and has daily quota remaining
  - Verify daily quota: check SerpAPI dashboard
  - Default quota cap in code: SEARCH_DAILY_QUOTA (default 150 searches/day)
  - Do NOT exhaust quota during pre-demo testing

□ Upstash Redis is active (check Upstash console)
□ Resend API key is active
□ Supabase project is active (not paused)
  ⚠️  Supabase free-tier projects PAUSE after 1 week of inactivity
      If the project has been paused, all auth + DB calls fail
      Check: supabase.com/dashboard → your project → check for "Project paused" banner
```

### SECTION 6 — Required Cache State

```
□ Lead Finder query is pre-warmed in Redis
  - Run the Lead Finder with your EXACT planned demo query
    (same industry, same city, same company size, same maxResults)
  - Verify the second run returns in < 2 seconds (cache hit)
  - Cache TTL is 24 hours — warm it within 24 hours of the demo
  - The cache key excludes user_id, so warming from any account works

□ Rate limit counters are clear
  - Check Redis for keys matching: ratelimit:intelligence:{user-id}
  - Check Redis for keys matching: ratelimit:research:leads:{user-id}
  - Check Redis for keys matching: ratelimit:research:talent:{user-id}
  - If any counter is at 5, wait for the 1-hour TTL or flush via Upstash console
```

### SECTION 7 — Required Reports (Pre-Generated Demo Content)

```
□ 2 × Real Estate Feasibility Study
  - Use realistic Egyptian project data (New Capital, Madinaty, etc.)
  - Different projects + cities to show variety
  - Verify report renders fully in the ReportView component

□ 1 × Campaign ROI Audit
  - Use a real estate developer scenario
  - Include Meta + Google channels for full section rendering

□ 1 × Lead Finder result
  - Suggested: Real Estate Developers in New Cairo, 51–200 employees
  - This run also pre-warms the Redis cache for the live demo

□ 1 × Talent Finder result
  - Suggested: Sales Manager, Cairo, Real Estate sector
  - Fast, no external quota dependency

□ Total: 5 reports minimum
  - Verify all appear in /dashboard/reports
  - Verify dashboard stat cards show non-zero counts
  - Verify /dashboard/reports search + filter work on pre-generated data
```

### SECTION 8 — Required Onboarding State

```
□ Demo account has completed onboarding
  - Test: log in → you should land on /dashboard (NOT /dashboard/onboarding)
  - If you see "Set up your workspace" → the Prisma rows are missing
  - Fix: submit the workspace form (this calls /api/users/init automatically)
    OR insert Prisma records manually (see Answer 4, Option B)

□ Workspace name is set to something professional
  - Default: "{email-prefix}'s Workspace"
  - Recommended: "Eunoia Demo Workspace" or similar
  - Edit: update the Prisma Workspace.name field directly in the DB
```

### SECTION 9 — Final Pre-Demo Verification (Day-Of)

```
□ Log in to demo account at ai.halannews.com
□ Confirm browser lands on /dashboard (no redirect to onboarding)
□ Confirm dashboard stat cards show ≥ 5 reports
□ Confirm 5 pre-generated reports appear in /dashboard/reports
□ Click one report in history — confirm it expands correctly
□ Navigate to /dashboard/real-estate — confirm form loads
□ Run ONE real estate report (live, to verify the route works)
  - This uses 1 of your hourly rate limit quota (5/hour)
  - Leave 4 remaining for the actual demo
□ Navigate to /dashboard/research → Lead Finder
  - Run the pre-warmed query — confirm < 2 second response (cache hit)
□ Navigate to /dashboard/research → Talent Finder
  - Run one query — confirm it returns results
□ Navigate to /dashboard/analytics — confirm page loads (static, never fails)
□ Navigate to /dashboard/reports — confirm archive shows all reports
□ Do NOT navigate to: /market-intelligence, /dashboard/settings
```

---

## CRITICAL NOTES

### Note 1 — Supabase Free Tier Pausing
If the Supabase project is on the free tier, it pauses after 1 week of inactivity. If it's paused, login will fail with a network error (the project doesn't respond). Check the Supabase dashboard before the demo. Resuming a paused project takes 1–2 minutes.

### Note 2 — The Prisma Row is the Gate
The single highest-probability demo failure is arriving at `/dashboard/onboarding` instead of `/dashboard`. This has one cause (missing Prisma User row) and one fix (complete onboarding once, or insert manually). Verify this specific thing before the demo.

### Note 3 — Rate Limit Window is 1 Hour
The rate limit (5 requests/hour) is a rolling 1-hour window stored in Redis. Do not run tests extensively in the hour immediately before the demo. If the limit is hit during the demo, there is no way to fix it without Redis console access. Leave at least 4 requests free in the window when the demo starts.

### Note 4 — Environment Variable Name Mismatch
`.env.local.example` documents `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
The actual code reads `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
On Vercel, the correct variable must be set with the exact name `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Since the platform is reportedly live, this is presumably correct — but verify it in the Vercel dashboard before the demo if there is any doubt.

---

*Checklist complete. No code was modified. No commits were created.*
*All findings are evidence-based and cite specific files and line numbers.*
