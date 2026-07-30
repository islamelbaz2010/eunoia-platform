# PROJECT REALITY REPORT
**Generated:** 2026-07-30  
**Phase:** 1 — Reality Validation  
**Method:** Live command execution against repository and production environment  
**No code was modified during this phase.**

---

## Executive Summary

| Check | Result |
|---|---|
| Build (`npm run build`) | ✅ PASSES |
| Typecheck (`npm run typecheck`) | ✅ PASSES |
| Tests (`npm test`) | ✅ 25 files / 194 tests — ALL PASSING |
| Lint (`npm run lint`) | ✅ PASSES |
| Production site | ✅ LIVE at `https://intelligence.eunoiazones.com` |
| Local environment credentials | 🔴 ALL EMPTY — cannot connect to any service locally |
| Security vulnerabilities | 🔴 4 HIGH / 2 MODERATE / 3 LOW (0 critical) |
| Root middleware | 🔴 NOT EXECUTING — confirmed by build manifest |
| Hardcoded secret in repo | 🔴 `test.php` contains Anthropic API key |
| DI Engine integration | ⚠️ Library exists, not wired to any route |

---

## 1. Build Verification

**Command:** `npm run build`  
**Result:** PASS

**Warnings (pre-existing, non-blocking):**

| Warning | Cause | Action |
|---|---|---|
| Turbopack workspace root detection | `/Users/ahmed/package-lock.json` exists at home directory | Not a code issue; set `turbopack.root` in next.config.ts to silence |
| Prisma NFT tracing via `/api/workspace` | `@prisma/client` triggers full project trace | Pre-existing; `serverExternalPackages` already set in next.config.ts |

**Build output — routes compiled:**

```
○ Static:  /_not-found, /demo, /forgot-password, /login, /privacy, /signup, /terms
ƒ Dynamic: / (root), all /api/* routes, all /dashboard/* routes, /market-intelligence

Middleware manifest: { "middleware": {}, "sortedMiddleware": [] }
```

**Critical observation from build:** `middleware-manifest.json` shows `"middleware": {}` and `"sortedMiddleware": []`. This is the definitive Next.js build artifact for middleware registration. It is **empty** — `proxy.ts` is confirmed NOT registered as middleware. See Section 7.

---

## 2. Typecheck Verification

**Command:** `npm run typecheck`  
**Result:** PASS — zero errors, zero warnings  
**Excluded from typecheck:** `services/`, `core/`, `*.test.ts`, `*.test.tsx` (per tsconfig.json)

---

## 3. Test Suite Verification

**Command:** `npm test`  
**Result:** PASS

```
Test Files:  25 passed (25)
     Tests:  194 passed (194)
  Duration:  9.76s
```

| Test Group | Files | Tests |
|---|---|---|
| Decision Intelligence Engine | 6 | 61 |
| Research — acquisition pipeline | 6 | ~60 |
| Research — utility modules | 10 | ~55 |
| App routes (health, users/init, dashboard error) | 3 | ~18 |
| **Total** | **25** | **194** |

**Note:** Tests run against pure functions and mocks. No live Supabase or Redis connection is required for tests to pass.

---

## 4. Lint Verification

**Command:** `npm run lint`  
**Result:** PASS — zero findings  
**Config:** ESLint 9 flat config (`eslint.config.mjs`)  
**Known version gap:** `eslint-config-next@15.3.0` while `next@16.2.10`. Lint passes; alignment is a P1 item.

---

## 5. Environment Variables

### Local Development (`.env.local`)

| Variable | Status |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | EMPTY |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | EMPTY |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | EMPTY |
| `DATABASE_URL` | EMPTY |
| `DIRECT_URL` | EMPTY |
| `SUPABASE_SERVICE_ROLE_KEY` | EMPTY |
| `OPENAI_API_KEY` | EMPTY |
| `RESEND_API_KEY` | EMPTY |
| `SERPAPI_API_KEY` | EMPTY |
| `UPSTASH_REDIS_REST_URL` | EMPTY |
| `UPSTASH_REDIS_REST_TOKEN` | EMPTY |
| `ADMIN_EMAILS` | EMPTY |
| `NEXT_PUBLIC_SITE_URL` | SET (21 chars) |
| `VERCEL_OIDC_TOKEN` | SET (1257 chars — Vercel OIDC federation) |

**Finding:** All service credentials are empty strings in `.env.local`. Local development cannot connect to Supabase, Prisma, OpenAI, Redis, or SerpAPI. `.env.local` is a template with no real values.

**Missing from `.env.example` and `.env.local`:**
- `AI_PROXY_URL` — referenced in some proxy code paths; not documented
- `CLOUDFLARE_WORKER_URL` — in `.env.example` but not `.env.local`

### Production (Vercel)

Evidence: `https://intelligence.eunoiazones.com/dashboard` → 307 → `/login` (auth working).  
The per-route auth redirect at `app/dashboard/layout.tsx` calls `supabase.auth.getUser()` — this redirect only works if Supabase is configured and responding in production.

**Production site is LIVE and responding correctly.** Vercel env vars are set separately from `.env.local`.

**CORRECTION to prior session documentation:** Session notes from 2026-07-21 stated "Supabase project DELETED — platform non-operational." This is contradicted by the production site responding correctly with auth-dependent behavior. The Supabase project appears to have been restored, OR a new project was created and configured in Vercel. Local `.env.local` is not updated.

---

## 6. Security Vulnerabilities

**Command:** `npm audit`  
**Result:** 9 vulnerabilities — 0 critical, **4 high**, 2 moderate, 3 low

### HIGH Severity

#### H1 — Next.js 16.2.10 (multiple CVEs) — **P0**
**Current version:** 16.2.10  
**Fixed in:** 16.2.11  
**Fix:** `npm audit fix` (no breaking changes — patch version)

| Title | Severity | Relevance |
|---|---|---|
| Middleware/Proxy bypass in Turbopack + single locale apps | HIGH | DIRECT — this repo uses Turbopack + next-intl (single locale in effect) |
| Denial of Service via Server Actions | HIGH | DIRECT — platform uses Server Components |
| SSRF in Server Actions on custom servers | HIGH | INDIRECT — platform uses Vercel, not custom server |
| SSRF in rewrites via attacker-controlled destination | HIGH | INDIRECT |
| Cache confusion via request bodies | MODERATE | POSSIBLE |
| Unbounded Server Action payload in Edge runtime | MODERATE | INDIRECT |
| Internal Server Function endpoint disclosure | MODERATE | POSSIBLE |
| Image API DoS via SVGs | MODERATE | POSSIBLE |

**The "Middleware/Proxy bypass" vulnerability is directly relevant:** it affects Turbopack-compiled apps with a single locale, allowing middleware bypass. Combined with the fact that `proxy.ts` is already not executing, this compounds the middleware security gap.

#### H2 — PostCSS path traversal (sourceMappingURL) — **P1**
Build-time tool. Can expose `.map` files if triggered during build. Fix available.

#### H3 — brace-expansion DoS — **P1**
Used in glob pattern matching in dev tools. Fix available.

#### H4 — sharp/libvips CVEs — **P1**
Image optimization library. Fix available.

---

## 7. Middleware — Definitive Finding

**File:** `proxy.ts` (root)  
**Compiled manifest:** `.next/server/middleware-manifest.json`

```json
{
  "version": 3,
  "middleware": {},
  "sortedMiddleware": [],
  "functions": {}
}
```

**CONFIRMED:** `proxy.ts` is NOT executing as middleware. The `middleware-manifest.json` is the authoritative Next.js build artifact that registers middleware for execution. It is empty.

**Why:** Next.js requires the file to be named `middleware.ts` (or `middleware.js`) at the project root. The file `proxy.ts` is compiled and included in the bundle but is not registered in the middleware execution chain regardless of its `config.matcher` export.

**Current auth protection:** `app/dashboard/layout.tsx` calls `createClient()` + `supabase.auth.getUser()` and issues `redirect('/login')` if no user. This per-layout pattern protects all dashboard routes. However:
- No global safety net exists
- Any new route added outside `app/dashboard/` without explicit auth check will be unprotected
- Supabase session refresh (required to keep auth tokens valid) relies on middleware calling `updateSession()` — this is NOT being called. Sessions may expire without renewal on long sessions.

**`lib/supabase/middleware.ts`** contains the correct `updateSession()` implementation. It exists. It is never called.

---

## 8. Dependency Graph

**Path alias resolution — all aliases verified:**

| Alias | Status |
|---|---|
| `@/lib/admin/auth` | ✅ Exists |
| `@/lib/admin/audit` | ✅ Exists |
| `@/lib/prisma/client` | ✅ Exists |
| `@/lib/prisma/init-user` | ✅ Exists |
| `@/lib/research/*` (all) | ✅ All exist |
| `@/lib/supabase/*` (all) | ✅ All exist |
| `@/types/plan.types` | ✅ Exists |
| `@/types/supabase.types` | ✅ Exists (stale content) |
| `@/types/workspace.types` | ✅ Exists |

**Excluded from TypeScript (per tsconfig.json `exclude`):**  
- `services/` — intentional; `legacy-ai-engine` is dead code  
- `core/` — intentional; static data files not imported by live routes  
- `*.test.ts` / `*.test.tsx` — intentional  

**Critical dependency versions:**

| Package | Installed | Latest stable | Status |
|---|---|---|---|
| `next` | 16.2.10 | 16.2.11 | 🔴 UPGRADE REQUIRED (HIGH CVEs) |
| `@supabase/ssr` | 0.5.2 | — | OK |
| `@supabase/supabase-js` | 2.106.2 | — | OK |
| `vitest` | 4.1.9 | — | OK (pinned) |
| `prisma` | 6.19.3 | — | OK |
| `eslint-config-next` | 15.3.0 | — | ⚠️ Behind next version |

---

## 9. Route Verification

**All routes confirmed in build output and file system. No missing routes.**

| Group | Count | Status |
|---|---|---|
| Static pages | 7 | ✅ All present |
| Dashboard pages | 9 | ✅ All present |
| API routes | 16 | ✅ All present |
| Auth routes | 1 | ✅ Present |

**Route-level auth pattern:** All protected routes use `createClient()` + `supabase.auth.getUser()` inline. Layout (`app/dashboard/layout.tsx`) provides redirect for the entire dashboard tree.

**Dead route:** `/api/debug-env/route.ts` exists but has no handler. Returns 404. Not a security risk (no handler = no data exposed) but is tech debt.

---

## 10. Database Verification

### Prisma

**Status:** Schema compiles. Client generated (`lib/prisma/generated/`). Connection depends on `DATABASE_URL` which is empty locally.

**Issues identified:**
- `Workspace.plan` enum: `STARTER | PROFESSIONAL | ENTERPRISE` (3 values) — missing `AGENCY`
- Supabase `user_plans.plan`: `STARTER | PROFESSIONAL | AGENCY | ENTERPRISE` (4 values)
- The two plan models are out of sync. `AGENCY` plan customers cannot be assigned via Prisma.
- `Report` and `ApiUsage` models are LEGACY — no active writes; retained for historical data

### Supabase

**Local:** All credentials empty — cannot connect locally  
**Production:** Responding correctly (auth redirects working)

**SQL scripts status:**
- 6 SQL scripts exist in `supabase/` (flat, not versioned migrations)
- `audit-log.sql` may not be applied in production (no way to verify without Supabase dashboard access)
- No `decisions` table exists (required for DI integration — Sprint 4)
- `types/supabase.types.ts` is stale — was not regenerated after `research_requests`, `user_plans`, `audit_log` tables were created. All research routes use `as any` to bypass type checking.

---

## 11. Integration Verification

| Integration | Required | Local Status | Production Status |
|---|---|---|---|
| Supabase Auth | Required | ❌ Credentials empty | ✅ Working (redirects confirm) |
| Supabase DB (reports, research, plans) | Required | ❌ Credentials empty | ✅ Likely working |
| Prisma/PostgreSQL | Required | ❌ Credentials empty | ✅ Likely working |
| OpenAI GPT-4o-mini | Required for reports | ❌ Key empty | Unknown |
| Upstash Redis (rate limiting) | Optional | ❌ Credentials empty | Unknown (fails open) |
| SerpAPI (Lead Finder) | Optional* | ❌ Key empty | Unknown |
| Resend (email) | Optional | ❌ Key empty | Unknown |
| Apollo.io (enrichment) | Optional | ❌ Key empty | Unknown |
| Cloudflare Worker (demo) | Optional | ❌ URL not set | Unknown |
| Decision Intelligence Engine | Core product | Library only — NOT integrated | Library only |

**Fail-open behavior confirmed in code:**
- Redis rate limiter: fails open (allows request) if Redis is unavailable
- SerpAPI quota: fails open
- Plan enforcement: fails open on Supabase error
- Audit log writes: best-effort (`try/catch`)

---

## 12. External Service Verification

| Service | Test | Result |
|---|---|---|
| `https://intelligence.eunoiazones.com` | HTTP GET `/api/health` | ✅ HTTP 200 — `{"ok":true}` |
| `https://intelligence.eunoiazones.com/dashboard` | Auth redirect | ✅ HTTP 307 → `/login` → HTTP 200 |
| Supabase (local) | DNS/connection | ❌ `NEXT_PUBLIC_SUPABASE_URL` empty |

**Note:** `/api/health` does NOT check Supabase connectivity. It always returns `{"ok":true}`. It is not a true health check — it only confirms the Next.js runtime is responding.

---

## 13. Critical Security Findings

### SEC-01 — Hardcoded API Key — **CRITICAL**
**File:** `test.php` (root)  
**Key type:** Anthropic API key (`sk-ant-api03-...`)  
**Action required:** Revoke key immediately via Anthropic console. Remove `test.php`. Purge from git history.

### SEC-02 — Next.js 16.2.10 CVEs — **HIGH**
**Action:** `npm update next@latest` (to 16.2.11+). Backward compatible patch.

### SEC-03 — No Root Middleware — **HIGH**
**Action:** Rename `proxy.ts` → `middleware.ts`. Rename export `proxy` → `middleware`. Wire to `lib/supabase/middleware.ts`'s `updateSession()`. This is Sprint 3 in the execution roadmap.

### SEC-04 — Supabase Session Not Refreshed — **MEDIUM**
**Root cause:** `updateSession()` in `lib/supabase/middleware.ts` is never called (middleware not running). Auth tokens are not refreshed between requests. Users with long sessions may encounter silent auth failures.  
**Action:** Resolved by SEC-03 (implementing middleware).

---

## 14. P0 Classification

The following items block production stability or represent exploitable security vulnerabilities:

| ID | Item | Classification | Fix Available |
|---|---|---|---|
| P0-01 | Next.js 16.2.10 CVEs (4 HIGH including middleware bypass) | Security | `npm update next@latest` |
| P0-02 | Hardcoded Anthropic API key in `test.php` | Security | Revoke + delete file |
| P0-03 | `proxy.ts` not executing as middleware (session refresh not happening; no global auth guard) | Runtime | Rename file + export; wire updateSession() |

**P0-01 note:** The Next.js middleware bypass CVE (GHSA-6gpp-xcg3-4w24) is specifically for "Turbopack + single locale" apps. This repository uses Turbopack (`▲ Next.js 16.2.6 (Turbopack)` confirmed in build) and has next-intl installed with no locale routing (single-locale behavior). This CVE is directly applicable. Fix: upgrade to 16.2.11.

---

## 15. P1 Classification

The following items affect code quality, maintainability, or observability but do not block production:

| ID | Item |
|---|---|
| P1-01 | `eslint-config-next` version (15.3.0) behind `next` (16.2.10) |
| P1-02 | PostCSS, brace-expansion, sharp vulnerabilities (all have fixes) |
| P1-03 | `types/supabase.types.ts` stale — missing new tables; causes `as any` casts |
| P1-04 | `Workspace.plan` Prisma enum missing `AGENCY` value |
| P1-05 | `/api/health` does not check Supabase or DB connectivity |
| P1-06 | `CLOUDFLARE_WORKER_URL` missing from `.env.local` |
| P1-07 | `AI_PROXY_URL` not documented in `.env.example` or `.env.local` |
| P1-08 | `users.json` referenced in legacy `auth.php` (file itself not in repo — OK; but `auth.php` remains) |
| P1-09 | Legacy PHP files (`api.php`, `auth.php`, `config.example.php`) committed to repo |
| P1-10 | `database/` and `epos/` directories are empty |
| P1-11 | Scratch files at root (`text.txt` through `text 6.txt`, `.Documentation:.swp`, xlsx, jpeg files) |
| P1-12 | `/api/debug-env/route.ts` empty stub; returns 404 |

---

## 16. Current Version Numbers (verified)

```
next@16.2.10       (requires 16.2.11)
react@19.0.0
typescript@5.8.3
vitest@4.1.9       (pinned)
prisma@6.19.3
@supabase/ssr@0.5.2
@supabase/supabase-js@2.106.2
tailwindcss@4.1.4
```

---

## 17. Phase 1 Conclusion

**The repository is in a stable, releasable baseline state with specific P0 issues that must be fixed before the next sprint.**

| Dimension | Status |
|---|---|
| Code quality | ✅ GOOD — zero type errors, zero lint warnings, 194/194 tests passing |
| Production deployment | ✅ LIVE and responding correctly |
| Local development | ❌ Cannot run — all credentials empty in .env.local |
| Security posture | 🔴 REQUIRES IMMEDIATE P0 ACTION (Next.js CVEs, hardcoded key) |
| Middleware / auth | 🔴 No global middleware (P0-03); per-route auth works |
| Architecture | ✅ Sound — DI library exists; integration is planned work |

**Approved to proceed to Phase 2 — P0 Stabilization.**

**P0 execution order:**
1. P0-02 first — revoke and delete `test.php` (zero risk, zero dependencies)
2. P0-01 next — upgrade Next.js to 16.2.11 (patch update, run full test suite after)
3. P0-03 last — implement root middleware (depends on confirmed Supabase env; impacts all routes)

---

*Phase 1 complete. No code was modified. All findings are from live command execution.*
