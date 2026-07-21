# Investor Demo Blockers Verified

Audit date: 2026-07-07
Scope: current repository only.

## Verification Commands

- `npm install`: succeeded.
- `npm run build`: initially failed, now passes after fix.
- `npm run typecheck`: initially failed, now passes after fix.
- `npm test`: passes after `npm install`.
- `npm audit --omit=dev`: still reports dependency advisories.

## Blockers

### 1. Empty API Route Breaks Build

Classification: VERIFIED

Evidence:
- `app/api/debug-env/route.ts` had 0 lines.
- Initial `npm run build` failed with: `File 'app/api/debug-env/route.ts' is not a module`.
- Initial `npm run typecheck` failed with the same module error.

Severity: P0

Estimated Fix Time: 5 minutes

Risk during Demo: Critical. A failing build blocks deployment and makes the repository impossible to defend in technical diligence.

Resolution:
- Added a minimal 404 JSON route.
- Final `npm run build` passes.
- Final `npm run typecheck` passes.

### 2. Lead Finder Production Debug Logging

Classification: VERIFIED

Evidence:
- `app/api/research/leads/route.ts` logged API route start plus boolean presence of `SERPAPI_API_KEY` and `OPENAI_API_KEY` at module load.

Severity: P0

Estimated Fix Time: 5 minutes

Risk during Demo: High. Logs do not expose secret values, but they expose key presence and make production logs look like debugging output.

Resolution:
- Removed the debug logs.

### 3. Supabase Public Key Environment Mismatch

Classification: VERIFIED

Evidence:
- Runtime code read `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Env examples documented `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Affected files included `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `proxy.ts`, and `app/(auth)/forgot-password/page.tsx`.

Severity: P0

Estimated Fix Time: 15 minutes

Risk during Demo: Critical if production only has the documented anon key. Auth and Supabase calls may fail.

Resolution:
- Runtime clients now accept `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with fallback to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Env examples now document both names plus demo email/service-role keys.

### 4. Public Demo Lead RLS Was Open

Classification: VERIFIED

Evidence:
- `supabase/leads-table.sql` defined `FOR INSERT WITH CHECK (true)` and `FOR SELECT USING (true)` for `demo_leads`.

Severity: P0 for investor trust, P1 for code runtime because SQL must be applied in Supabase.

Estimated Fix Time: 10 minutes to update SQL, plus deployment/apply time.

Risk during Demo: High if the SQL was applied as written and demo captures real emails or phone numbers.

Resolution:
- Updated SQL to drop the open policies and create a deny-all public RLS policy. The server-side demo route uses service role and should continue to bypass RLS.

### 5. External Market Intelligence Iframe

Classification: VERIFIED

Evidence:
- `app/market-intelligence/page.tsx` embedded `https://halannews.com/` in an iframe after auth.

Severity: P0 for investor demo credibility.

Estimated Fix Time: 5 minutes

Risk during Demo: High. If clicked, it displays an unrelated external website inside the product.

Resolution:
- Authenticated users are redirected to the internal `/dashboard/analytics` Market Intelligence Hub.

### 6. Test Command Failure

Classification: NOT REPRODUCED after required `npm install`

Evidence:
- Before running `npm install`, a prior run failed because `vitest` was not available locally.
- Required Phase 1 `npm install` succeeded.
- After install, `npm test` passed: 11 test files, 109 tests.

Severity: Not a current blocker.

Estimated Fix Time: None for tomorrow's demo.

Risk during Demo: Low.

Resolution:
- No code change required.

### 7. Production Dependency Audit Advisories

Classification: VERIFIED

Evidence:
- `npm audit --omit=dev` reports 8 vulnerabilities: 3 low, 4 moderate, 1 high.
- `form-data` has a high-severity advisory with a non-breaking `npm audit fix` path.
- Several other fixes require force-upgrading core packages such as `ai` or `next`, which is not appropriate for a demo-day readiness sprint.

Severity: P1 for tomorrow's demo, P0 before production/commercial launch.

Estimated Fix Time: 30-90 minutes for non-breaking fix validation; longer for breaking upgrades.

Risk during Demo: Medium in technical diligence if asked directly. Low for a controlled product walkthrough.

Resolution:
- Not changed in this sprint to avoid destabilizing working build/test paths.

### 8. Next.js Build Warnings

Classification: PARTIALLY VERIFIED

Evidence:
- Final build passes but warns that Next inferred workspace root from `/Users/ahmed/package-lock.json`.
- Final build also warns about Turbopack/NFT tracing through Prisma generated files and `app/api/workspace/route.ts`.

Severity: P1

Estimated Fix Time: 30-60 minutes, but requires config validation.

Risk during Demo: Low if build artifact is deployed successfully. Medium for technical diligence if warnings are shown.

Resolution:
- Left unchanged to avoid config churn before investor demo.

