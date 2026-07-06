# Technical Debt

---

## CRITICAL

### TD-01: Committed Credentials in Git History
- **Root cause:** `users.json` tracked in git with bcrypt hashes for 3 accounts; never added to `.gitignore` before first commit
- **Impact:** Credentials exposed to anyone with repo access; persists in git history regardless of `git rm`
- **Fix:** BFG / `git filter-repo --path users.json --invert-paths`, add to `.gitignore`, rotate affected credentials
- **Effort:** S (history rewrite) + variable (credential rotation)
- **Risk:** CRITICAL if repo ever becomes public or shared

### TD-02: Zero Database Migration History
- **Root cause:** Project bootstrapped with `prisma db push` / manual SQL, never converted to `prisma migrate`; Supabase tables applied via SQL editor with no tracking
- **Impact:** Schema changes cannot be safely deployed; schema drift undetectable; impossible to reproduce database state from code alone
- **Fix:** `prisma migrate dev --name init --create-only` + `migrate resolve --applied`; adopt `supabase migration` for Supabase tables
- **Effort:** M
- **Risk:** HIGH — any schema change risks production data loss

### TD-03: All AI Inference via External Third-Party Proxy
- **Root cause:** `halannews.com/api-proxy` used as an AI inference gateway instead of direct provider SDK calls; `CLOUDFLARE_WORKER_URL` env var points to it
- **Impact:** User data (business intelligence queries, company financials, employee data) transmitted to uncontracted third party; platform is down if `halannews.com` is down
- **Fix:** Replace with direct `openai` SDK calls or Anthropic SDK calls; `OPENAI_API_KEY` already available
- **Effort:** M
- **Risk:** CRITICAL (data protection, availability, legal)

---

## HIGH

### TD-04: No Working Lint Pipeline
- **Root cause:** `next lint` subcommand removed in Next.js 16; `eslint-config-next@15.3.0` doesn't export flat config; no `eslint.config.mjs` exists
- **Impact:** Zero static analysis on any code change; no automated check for unused vars, hook dependency bugs, or accessibility issues
- **Fix:** Bump `eslint-config-next` to `^16.2.9`, create `eslint.config.mjs`, update `package.json` lint script
- **Effort:** S
- **Risk:** HIGH (bugs ship without static analysis)

### TD-05: No CI/CD Pipeline
- **Root cause:** GitHub Actions never configured; only Vercel's build check exists
- **Impact:** Tests (109 passing) are never automatically run; a broken test can reach `main` undetected; no type-check gate on PRs
- **Fix:** Add `.github/workflows/ci.yml` running `typecheck` + `test`
- **Effort:** S
- **Risk:** HIGH (regressions ship undetected)

### TD-06: `core/` and `services/` Excluded from TypeScript
- **Root cause:** `tsconfig.json` `exclude` array contains `"services"` and `"core"`; added to avoid Prisma generated types issues
- **Impact:** Any code in `core/data/` or `services/legacy-ai-engine/providers/` is completely untyped at build time; runtime errors only
- **Fix:** Remove from `exclude`; fix resulting type errors (likely few — these are data files and an interface)
- **Effort:** S
- **Risk:** HIGH (silent type errors in production)

### TD-07: NFT Bundle Bloat (24.66MB)
- **Root cause:** Custom Prisma `output` path triggers `process.cwd()` fallback; NFT sweeps entire project
- **Impact:** Larger cold starts, larger function deploys, users.json with secrets is included in function bundle
- **Fix:** Remove `output = "../lib/prisma/generated"` from `schema.prisma`; update import paths
- **Effort:** S
- **Risk:** HIGH (security: secrets in bundle; performance: bloated functions)

### TD-08: Split-Brain Plan Type Model
- **Root cause:** `types/plan.types.ts` (live, 4-tier: STARTER/PROFESSIONAL/AGENCY/ENTERPRISE) and `types/workspace.types.ts` (dead, 3-tier: STARTER/PROFESSIONAL/ENTERPRISE) independently define "plan" with different keys and shapes
- **Impact:** Adding billing will require reconciling two incompatible models; Prisma schema misaligns with live `user_plans` table
- **Fix:** Pick `plan.types.ts` as canonical; delete `workspace.types.ts`'s Plan/PLAN_LIMITS; migrate `hooks/use-workspace.ts`; add AGENCY to Prisma schema enum
- **Effort:** M
- **Risk:** HIGH (billing integration will be blocked by this)

### TD-09: Stale Supabase Types (`as any` in 4 routes)
- **Root cause:** `types/supabase.types.ts` not regenerated after `research_requests`, `user_plans`, `demo_leads` tables were added
- **Impact:** No type safety on live product data layer; `as any` casts bypass TypeScript in 4 production routes
- **Fix:** `supabase gen types typescript --project-id <id> > types/supabase.types.ts`; add to CI
- **Effort:** XS
- **Risk:** HIGH (type errors in DB queries are silent)

### TD-10: Missing Security Headers
- **Root cause:** Never added; not part of original requirements
- **Impact:** No CSP (XSS risk), no `X-Frame-Options` (clickjacking), no HSTS (protocol downgrade)
- **Fix:** Add `headers()` to `next.config.ts` with standard header set
- **Effort:** S
- **Risk:** HIGH (browser-level attack surface)

---

## MEDIUM

### TD-11: Build Pipeline Double-Install
- **Root cause:** `vercel.json` `buildCommand` runs `npm install` explicitly, but Vercel already runs install implicitly before executing buildCommand
- **Impact:** 2× install + 3× `prisma generate` per deploy; doubles build time and Vercel compute cost
- **Fix:** Remove the custom `buildCommand` override from `vercel.json`
- **Effort:** XS
- **Risk:** Low (no correctness issue; pure waste)

### TD-12: `app/api/workspace/route.ts` — Dead Endpoint
- **Root cause:** Created for a `use-workspace.ts` hook that itself is dead; never connected to any UI that ships
- **Impact:** Unused code in production; one of 4 NFT-bloated routes; has `user.email!` non-null assertion risk
- **Fix:** Delete `app/api/workspace/route.ts` and `hooks/use-workspace.ts`
- **Effort:** XS
- **Risk:** Low (no callers)

### TD-13: `proxy.ts` Fail-Open Pattern
- **Root cause:** Intentional design decision (fail-open on missing env or exception); mitigated by layout-level re-check
- **Impact:** Missing Supabase env vars → middleware doesn't protect `/dashboard` (relies on layout as sole guard)
- **Fix:** Fail-closed for `/dashboard` matcher; return 503 or redirect on missing env
- **Effort:** S
- **Risk:** Medium (defense-in-depth reduced to single layer)

### TD-14: `images.remotePatterns` Wildcard
- **Root cause:** `{ hostname: '**' }` — copy-paste from a tutorial or permissive default
- **Impact:** `/_next/image` accepts any HTTPS URL — SSRF surface
- **Fix:** Restrict to actual external image domains or remove `images` block
- **Effort:** XS
- **Risk:** Medium-High (live SSRF surface)

### TD-15: Unsanitized Input in Demo Route
- **Root cause:** User POST fields interpolated into AI prompt and HTML email without escaping
- **Impact:** Prompt injection in AI output; HTML injection in outbound email
- **Fix:** HTML-escape before email interpolation; use structured prompt format for AI
- **Effort:** S
- **Risk:** Medium

### TD-16: `tsconfig.json` `baseUrl` Deprecated
- **Root cause:** `baseUrl: "."` added for path aliases; deprecated in TypeScript 5.9+ (error TS5101)
- **Impact:** Will break in TypeScript 7.0; path aliases will stop resolving
- **Fix:** Remove `baseUrl`; use `paths` alone with `bundler` module resolution (already set); add `"ignoreDeprecations": "5.0"` as temp fix
- **Effort:** S
- **Risk:** Medium (future break on TS upgrade)

### TD-17: Rate Limit Counter Non-Atomic
- **Root cause:** `incr()` then separate `expire()` call — not atomic
- **Impact:** A crash between the two calls leaves a counter with no TTL; builds up indefinitely
- **Fix:** Use `SET key 1 EX window NX` for first-write atomicity
- **Effort:** S
- **Risk:** Medium (edge case, not currently causing issues)

### TD-18: No Fetch Timeout in `FetchSourceCollector`
- **Root cause:** `fetch(url)` called with no `AbortSignal`/timeout
- **Impact:** A slow target server holds the Vercel function slot open until the platform-level timeout (10s/60s)
- **Fix:** `AbortController` with 5s timeout per fetch
- **Effort:** S
- **Risk:** Medium (function timeout at scale)

### TD-19: `market-intelligence/page.tsx` iframe Auth Boundary
- **Root cause:** Entire "feature" is an iframe to an external site within the authenticated dashboard
- **Impact:** External site inside auth shell; clipboard access granted; no real product functionality
- **Fix:** Replace with internal content or proper API integration
- **Effort:** M-L (depends on what the market intelligence content should be)
- **Risk:** Medium (security trust model; feature completeness)

---

## LOW

### TD-20: `lib/supabase/middleware.ts` Dead File
- **Root cause:** Exported `updateSession()` function never imported; `proxy.ts` reimplements session logic inline
- **Impact:** Confusion for future developers; two implementations of the same logic
- **Fix:** Delete `lib/supabase/middleware.ts` or have `proxy.ts` import from it
- **Effort:** XS

### TD-21: `framer-motion` and Other Unused Packages
- **Root cause:** Installed, never wired to real UI
- **Impact:** Bundle weight; npm audit vulnerabilities (4 of 10 are from `ai` package)
- **Fix:** Remove `ai`, `framer-motion`, `sonner`, `@upstash/ratelimit`, 8 Radix packages
- **Effort:** XS

### TD-22: 26 Root-Level Audit `.md` Files
- **Root cause:** Successive audit reports committed at repo root, never cleaned up
- **Impact:** NFT bloat (~several MB swept into serverless bundles); no single source of truth
- **Fix:** Delete or archive to a `docs/archived-audits/` directory
- **Effort:** XS

### TD-23: `NEXT_PUBLIC_SUPABASE_ANON_KEY` vs `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` Mismatch
- **Root cause:** `.env.example` uses the old variable name; code uses the new Supabase naming convention
- **Impact:** Developer following `.env.example` would use the wrong variable name; app would fail silently (fail-open via proxy.ts)
- **Fix:** Update `.env.example` to use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and add `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SITE_URL`
- **Effort:** XS

### TD-24: No `engines.node` in `package.json`
- **Root cause:** Never specified
- **Impact:** Vercel uses a default Node version that may not match what was tested locally
- **Fix:** Add `"engines": { "node": ">=20" }` to `package.json`
- **Effort:** XS

### TD-25: `demo_leads` SELECT Policy `USING (true)` Too Permissive
- **Root cause:** Copy-paste from documentation; service-role intent not correctly encoded in policy
- **Impact:** Any authenticated Supabase user can read all demo lead contact data
- **Fix:** `DROP POLICY "Service role can select" ON demo_leads; CREATE POLICY ... USING (false);`
- **Effort:** XS

---

## Debt Summary

| Severity | Count | Total effort |
|---|---|---|
| Critical | 3 | M-L |
| High | 7 | S-M each |
| Medium | 9 | XS-M each |
| Low | 6 | XS each |
| **Total** | **25** | **~15-20 developer-days** |
