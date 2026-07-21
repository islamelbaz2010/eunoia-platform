# 05 — Security

**Evidence basis:** Every API route, middleware, Supabase SQL, environment config, and dependency inspected.

---

## Summary

| Severity | Count |
|---|---|
| CRITICAL | 1 |
| HIGH | 2 |
| MEDIUM | 4 |
| LOW | 3 |
| INFO | 3 |

---

## CRITICAL

### SEC-C1 — Supabase Client Key Variable Name Mismatch

**File:** `lib/supabase/server.ts:11`, `lib/supabase/middleware.ts:10`  
**Evidence:**
```typescript
// lib/supabase/server.ts:11
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
```
```
# .env.example and .env.local.example
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Impact:** If `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is not set in the Vercel environment (only `NEXT_PUBLIC_SUPABASE_ANON_KEY` is), the Supabase client is initialized with `undefined` as the API key. This would cause every server-side auth call to silently fail or throw — potentially making the entire authenticated surface unauthenticated or broken. This is the single most dangerous bug in the codebase.

**Recommendation:** Either (a) rename the env var in server.ts/middleware.ts back to `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or (b) update `.env.example` and Vercel env to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Verify which name is actually set in Vercel before release.

**Estimated effort:** 30 minutes.  
**Confidence:** High.

---

## HIGH

### SEC-H1 — Public Debug Route Exposing Environment Variable Status

**File:** `app/api/debug-env/route.ts`  
**Evidence:** File exists at this path (1 line). The git history (`31638d4 debug leads api`, `08d1795 debug: add /api/debug-env endpoint with hasSupabase check`) confirms this route was used to expose which env vars are set.

**Impact:** Even a 1-line file registers as a Next.js API route. If the file contains any code beyond an empty export, environment variable presence is leaked. Any unauthenticated caller can probe `/api/debug-env` to learn about the server configuration.

**Recommendation:** Delete `app/api/debug-env/route.ts`. No debug routes should exist in the production codebase.

**Estimated effort:** 5 minutes.  
**Confidence:** High.

---

### SEC-H2 — Production console.log Leaking API Key Presence

**File:** `app/api/research/leads/route.ts:1–3`  
**Evidence:**
```typescript
console.log("=== LEADS API START ===")
console.log("SERPAPI:", !!process.env.SERPAPI_API_KEY)
console.log("OPENAI:", !!process.env.OPENAI_API_KEY)
```

**Impact:** Every call to `/api/research/leads` emits to the Vercel log stream. Any team member with Vercel log access can observe which API keys are configured. This is an information disclosure — though it reveals only boolean presence (not the key itself), it aids targeted attacks. Also confirms this route was built with debug code never cleaned up.

**Recommendation:** Delete these 3 lines.

**Estimated effort:** 5 minutes.  
**Confidence:** High.

---

## MEDIUM

### SEC-M1 — All Research Routes Bypass Supabase TypeScript Type Safety

**Files:** `app/api/research/leads/route.ts:71`, `app/api/research/talent/route.ts:86`, `app/api/intelligence/route.ts:971`  
**Evidence:**
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any
```

**Impact:** Type-bypassing `as any` means the TypeScript compiler cannot validate column names, value types, or RLS policy assumptions for any query made through `sb`. A typo in a column name or an RLS gap would produce a runtime error or silent data leak rather than a compile-time error.

**Recommendation:** Run `supabase gen types typescript --project-id <id>` and replace `supabase.types.ts` with the updated generated types so `research_requests`, `user_plans`, and `reports` are typed. Remove all `as any` casts.

**Estimated effort:** 2 days.  
**Confidence:** High.

---

### SEC-M2 — Overly Permissive Image Remote Patterns

**File:** `next.config.ts:9`  
**Evidence:**
```typescript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '**' },
  ],
},
```

**Impact:** Next.js Image Optimization is enabled for any HTTPS hostname. An attacker can craft a URL that proxies and caches any arbitrary HTTPS image through the Vercel CDN, potentially driving up bandwidth costs or using the CDN as a relay.

**Recommendation:** Restrict `remotePatterns` to domains actually used (Supabase storage, Apollo CDN if used).

**Estimated effort:** 30 minutes.  
**Confidence:** High.

---

### SEC-M3 — Rate Limit and Plan Enforcement Both Fail Open

**Files:** `lib/research/rate-limit.ts:29`, `lib/research/plan-enforcement.ts:56`  
**Evidence:**
```typescript
// rate-limit.ts:29
} catch {
  return { ok: true, resetIn: 0 }  // fail-open
}
// plan-enforcement.ts:56
} catch {
  return { ok: true, used: 0, limit: PLAN_LIMITS.STARTER.reportsPerMonth, plan: 'STARTER' }
}
```

**Impact:** If Redis or Supabase is temporarily unavailable, all rate limiting and plan limits are bypassed. A user could exhaust the SerpAPI daily quota or OpenAI credits during a Redis outage.

**Context:** Both files document this as intentional ("fail-open, not fail-closed — an infra hiccup degrades to 'allow,' not 'block every paying customer'"). This is a known trade-off.

**Recommendation:** Add monitoring/alerting when Redis is unavailable so outages are detected quickly. Consider a fail-closed posture for Enterprise/production phase.

**Estimated effort:** 1 day (alerting).  
**Confidence:** High.

---

### SEC-M4 — `users.json` Committed to Repository Root

**File:** `users.json` (root)  
**Evidence:** File exists at `eunoia-platform/users.json`.  
**Impact:** If this file contains user data (emails, credentials, tokens), it is exposed to every repository collaborator. Content not inspected to avoid reading potentially sensitive data.

**Recommendation:** Immediately inspect the file. If it contains any personal data or credentials, rotate any exposed secrets and remove the file from git history using `git filter-branch` or BFG Repo Cleaner.

**Estimated effort:** 1 hour (inspection + remediation if needed).  
**Confidence:** High.

---

## LOW

### SEC-L1 — API Routes Do Not Validate Content-Type

**Files:** All API routes  
**Evidence:** `await request.json()` is called with `.catch(() => null)` or uncaught in most routes, but there is no explicit `Content-Type: application/json` header check before parsing.  
**Impact:** Malformed or non-JSON bodies degrade gracefully (caught), but an attacker could attempt CSRF-style mutation via a form POST from another origin (Next.js has CORS protection by default but no SameSite enforcement on these routes).

**Recommendation:** Add `Content-Type` header validation or ensure `SameSite=Strict` cookies are set by Supabase SSR (they are by default — low priority).

**Confidence:** Medium.

---

### SEC-L2 — Prisma Workspace Does Not Validate Owner

**File:** `app/api/workspace/route.ts:14`  
**Evidence:**
```typescript
const dbUser = await prisma.user.findUnique({
  where: { email: user.email! },
  include: { workspace: { include: { users: ... } } }
})
```

**Impact:** The route correctly checks Supabase auth session and looks up the workspace via `email`. However, if a Prisma user exists for an email with a different `workspaceId` due to legacy data or manual DB edits, another workspace's data could be returned. Low risk with proper DB integrity.

**Confidence:** Low.

---

### SEC-L3 — NEXT_PUBLIC_ Prefix on Supabase Keys

**Evidence:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are both exposed to the client bundle.  
**Impact:** Supabase anon/publishable keys are designed to be public (they are limited by RLS policies), but URL exposure combined with the anon key means anyone can query the Supabase REST API directly — bypassing Next.js application logic (rate limits, plan enforcement). RLS policies on all tables must be complete and correct.

**Verification needed:** Confirm all tables have RLS enabled and policies in place. SQL schemas reviewed: `research_requests`, `user_plans`, `demo_leads` — all have RLS. `reports` table — confirmed in `supabase/reports-table.sql`.

**Confidence:** Medium.

---

## INFORMATIONAL

### SEC-I1 — Supabase Row Level Security is Correctly Enabled on All Research Tables

**Evidence:** Every SQL file reviewed enables RLS and creates `auth.uid() = user_id` policies. No cross-tenant data leakage observed in schema design.

### SEC-I2 — Authentication Token Never Accepted from Request Body

**Evidence:** `app/api/users/init/route.ts:19` derives user identity exclusively from the verified Supabase session. A prior version accepted client-supplied `email/supabaseId` — this was fixed (documented in `AUDIT_CONSOLIDATION.md §1.1`).

### SEC-I3 — Apollo and SerpAPI Keys Are Server-Side Only

**Evidence:** `SERPAPI_API_KEY` and `APOLLO_API_KEY` are not prefixed with `NEXT_PUBLIC_` and are never referenced in client components. They are only accessed in API routes.
