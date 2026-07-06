# Architecture Audit

**Score: 58 / 100**

---

## System Map

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel Edge                              │
│  proxy.ts (Next.js 16 Middleware)                                │
│  - Session refresh via @supabase/ssr                             │
│  - /dashboard protection (FAIL-OPEN on error)                    │
└───────────────────┬─────────────────────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
  ┌────────────────┐    ┌──────────────────────────────────────┐
  │  Static/Auth   │    │  Dashboard (App Router Server Components)│
  │  /login        │    │  app/dashboard/layout.tsx             │
  │  /signup       │    │  ├── auth re-check (supabase.getUser) │
  │  /forgot-pwd   │    │  └── Prisma user existence check      │
  │  /demo         │    └──────────────┬───────────────────────┘
  │  /market-intel │                   │
  └────────────────┘         ┌─────────┴─────────┐
                             │   Product Pages    │
                             │  - /real-estate    │ (1111 lines)
                             │  - /research/*     │
                             │  - /reports        │
                             │  - /analytics      │ (static content)
                             │  - /settings       │ (read-only)
                             └─────────┬──────────┘
                                       │
              ┌────────────────────────┼───────────────────────┐
              ▼                        ▼                        ▼
    ┌──────────────────┐  ┌──────────────────────┐  ┌─────────────────┐
    │  Prisma/Postgres │  │  Supabase Direct SDK  │  │ External APIs   │
    │  (onboarding     │  │  (ALL product data)   │  │                 │
    │   only today)    │  │  - reports            │  │ halannews.com   │
    │                  │  │  - research_requests  │  │  /api-proxy     │
    │  User            │  │  - user_plans         │  │  (AI proxy)     │
    │  Workspace       │  │  - demo_leads         │  │                 │
    │  [LEGACY Report] │  │                       │  │ SerpAPI         │
    │  [LEGACY Usage]  │  │                       │  │  (search)       │
    └──────────────────┘  └──────────────────────┘  │                 │
                                                     │ Resend (email)  │
                                                     │ Upstash Redis   │
                                                     │ Apollo.io (opt) │
                                                     └─────────────────┘
```

---

## Framework & Runtime

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16.2.6 | App Router, server components |
| Language | TypeScript | 5.9.3 (strict) | `baseUrl` deprecated, TS 7.0 break coming |
| Runtime | Node.js (Vercel) | Not pinned in `package.json` | Should specify `engines.node` |
| React | React 19 | 19.0.0 | Concurrent features available, not yet used |
| CSS | Tailwind CSS 4 | 4.1.4 | PostCSS-based, no traditional config file |
| i18n | next-intl | 4.1.0 | Configured but scope unclear |

---

## Layer Analysis

### 1. Middleware Layer (`proxy.ts`)

**Correctly renamed** to `proxy.ts` per Next.js 16 convention (confirmed via build output `ƒ Proxy (Middleware)`).

**What it does:**
- Refreshes Supabase session cookies (always runs for all routes)
- Redirects `/dashboard*` to `/login` if no authenticated user
- Redirects authenticated users away from auth pages to `/dashboard`

**Issues:**
- Fail-open: missing env vars → `NextResponse.next()` (allows unauthenticated access to protected paths)
- Fail-open: caught exceptions → `NextResponse.next()` (same risk)
- Calls `supabase.auth.getUser()` twice per request to `/dashboard` — once at line 28 (unconditional session refresh), once at line 35 (for redirect logic). This is one redundant network call per protected-page visit.

### 2. Server Component Layer (App Router)

The project correctly uses React Server Components for data fetching in dashboard pages, reducing client-side JavaScript.

**Correctly SSR'd pages:**
- `app/dashboard/page.tsx` — reads from Supabase, passes data down
- `app/market-intelligence/page.tsx` — auth check before render
- `app/dashboard/reports/page.tsx` (server wrapper) + `reports-client.tsx` (client island) — correct split pattern

**Incorrectly marked `'use client'` (no interactive state at top level):**
- `app/dashboard/analytics/page.tsx` — entire page is `'use client'` but contains only static content; should be a server component
- `app/market-intelligence/page.tsx` — actually a server component (no `'use client'`) with iframe — correct, but the iframe itself is the architectural problem

### 3. API Layer (`app/api/`)

| Route | Method | Auth | Validation | Rate limit | Notes |
|---|---|---|---|---|---|
| `/api/demo` | POST | ❌ Public | Basic required-fields | ❌ None | Lead capture; service-role Supabase insert |
| `/api/demo/generate` | POST | ❌ Public | Minimal | ✅ IP-based (5/hr) | AI report gen via external proxy; unsanitized input |
| `/api/intelligence` | POST | ✅ Required | ✅ Good | ✅ User 5/hr + plan limit | 1051-line monolith; all logic in route handler |
| `/api/research/leads` | POST | ✅ Required | ✅ Good | ✅ User 5/hr + plan limit | Imports `@core/` — unchecked by TS |
| `/api/research/talent` | POST | ✅ Required | ✅ Good | ✅ User 5/hr + plan limit | AI via external proxy |
| `/api/users/init` | POST | ✅ Required | N/A (uses session) | ✅ User 5/hr | Correct auth pattern |
| `/api/workspace` | GET | ✅ Required | N/A | ❌ None | **DEAD — zero callers** |
| `/auth/callback` | GET | N/A (OAuth flow) | Validates `code` param | N/A | Correct |

### 4. Library Layer

**`lib/prisma/`** — Singleton client, transaction-wrapped init, correct. Blocked from type-checking by custom generator `output` path not resolving without `prisma generate` first.

**`lib/supabase/`** — Three clients: `server.ts` (SSR server), `client.ts` (browser), `middleware.ts` (session update — NOT imported by middleware directly). Note: `lib/supabase/middleware.ts` exports `updateSession()` which is never called — the actual middleware (`proxy.ts`) reimplements session update logic inline. This is a dead file.

**`lib/research/`** — Well-structured pipeline with clear single-responsibility modules. The acquisition sub-pipeline (`acquisition/`) is the most architecturally coherent part of the codebase.

**`lib/redis/`** — Correct lazy-singleton pattern. `cache.ts`'s `cacheDel` and `cacheGetOrSet` are unused exports.

### 5. `core/` and `services/` — Untyped Boundary [PROVEN]

```json
// tsconfig.json:
"exclude": ["node_modules", "services", "core", "vitest.config.ts", "**/*.test.ts", "**/*.test.tsx"]
```

These directories are **excluded from the TypeScript program** but imported by production code:

**`core/` imports found in production routes:**
- `app/api/research/leads/route.ts`: `import { SECTORS, getSector } from '@core/data/sectors.data'`
- `app/api/research/leads/route.ts`: `import { getCity } from '@core/data/cities.data'`
- `app/api/research/talent/route.ts`: Same imports

**`services/` — legacy-ai-engine:**
- No live route imports it (correctly dead)
- But it's imported by `lib/research/acquisition/research-service.ts` and `ai-analysis.ts` via `@services/legacy-ai-engine/providers/openai.provider`

**Risk:** Any type error introduced in `core/` or `services/` code will not be caught by `tsc --noEmit` until runtime.

**Fix:** Remove `"services"` and `"core"` from `tsconfig.json` `exclude` and resolve the resulting type errors.

### 6. External Dependency Architecture Risk [PROVEN — CRITICAL]

**`halannews.com` dependency:**

The platform depends on `halannews.com` for:
1. **AI inference** (`halannews.com/api-proxy`) — demo/generate route, intelligence route (via `CLOUDFLARE_WORKER_URL` env var)
2. **Market Intelligence UI** — the entire `app/market-intelligence/` page is an iframe to `halannews.com`

This means:
- If `halannews.com` is down, the AI report generation and entire Market Intelligence module fail.
- The platform has no fallback for its primary AI inference path.
- All user intelligence queries pass through this third-party server.
- No SLA, no uptime guarantees, no contractual data protection.

The research engine (`lib/research/acquisition/`) correctly uses direct OpenAI API calls (`services/legacy-ai-engine/providers/openai.provider.ts` + `OPENAI_API_KEY`). This is the correct pattern — extend it to eliminate the `halannews.com` dependency.

---

## Architectural Risks Summary

| Risk | Severity | Classification |
|---|---|---|
| Two disconnected data layers with no shared migration tooling | HIGH | PROVEN |
| All AI inference via external third-party proxy | CRITICAL | PROVEN |
| `core/`/`services/` excluded from TypeScript | HIGH | PROVEN |
| Split-brain plan/subscription model (2 incompatible type representations) | HIGH | PROVEN |
| Single monolith route handler (`/api/intelligence`, 1051 lines) | MEDIUM | PROVEN |
| `lib/supabase/middleware.ts` dead file (never imported) | LOW | PROVEN |
| No `engines.node` in `package.json` | LOW | PROVEN |
| `app/dashboard/analytics/page.tsx` named "Analytics" but contains static market content | LOW | PROVEN |
| i18n (`next-intl`) configured but scope of bilingual content unclear | POSSIBLE | UNKNOWN |
