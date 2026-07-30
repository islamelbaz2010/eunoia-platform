# ROUTES
**Audit Date:** 2026-07-30  
**Source:** Direct file-system scan of `app/` directory

---

## Page Routes

| Route | File | Auth Required | Notes |
|---|---|---|---|
| `/` | `app/page.tsx` | — | Redirect: auth → `/dashboard`; no auth → `/market-intelligence` |
| `/market-intelligence` | `app/market-intelligence/page.tsx` | Yes | Redirect: auth → `/dashboard/analytics`; no auth → `/login` |
| `/login` | `app/(auth)/login/page.tsx` | No | Auth page |
| `/signup` | `app/(auth)/signup/page.tsx` | No | Auth page |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | No | Password reset trigger |
| `/demo` | `app/demo/page.tsx` | No | Public lead-capture demo page |
| `/privacy` | `app/privacy/page.tsx` | No | Privacy Policy (placeholder — needs legal review) |
| `/terms` | `app/terms/page.tsx` | No | Terms of Service (placeholder — needs legal review) |

### Dashboard Routes

| Route | File | Auth Required | Notes |
|---|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` | Yes | Stats + recent reports + quota warning banner |
| `/dashboard/real-estate` | `app/dashboard/real-estate/page.tsx` | Yes | Real Estate Intelligence Engine (5 report types) |
| `/dashboard/research` | `app/dashboard/research/page.tsx` | Yes | Research hub index page |
| `/dashboard/research/leads` | `app/dashboard/research/leads/page.tsx` | Yes | Lead Finder |
| `/dashboard/research/talent` | `app/dashboard/research/talent/page.tsx` | Yes | Talent Finder |
| `/dashboard/analytics` | `app/dashboard/analytics/page.tsx` | Yes | Market Intelligence (static content) — server component with live stats |
| `/dashboard/reports` | `app/dashboard/reports/page.tsx` | Yes | Report history (all 7 types) |
| `/dashboard/settings` | `app/dashboard/settings/page.tsx` | Yes | Account settings (plan, usage, data export, delete) |
| `/dashboard/onboarding` | `app/dashboard/onboarding/page.tsx` | Yes | 2-step onboarding flow |

### Admin Routes

| Route | File | Auth Required | Admin Only? | Notes |
|---|---|---|---|---|
| `/dashboard/admin` | `app/dashboard/admin/page.tsx` | Yes | Yes (enforced in client via `/api/admin/check`) | Admin console — user list, plan management |

---

## API Routes

### Core API

| Route | Method | Auth | File | Purpose |
|---|---|---|---|---|
| `/api/intelligence` | POST | Yes | `app/api/intelligence/route.ts` | Real Estate AI report generator (~1000 lines, includes cashflow engine + plan check) |
| `/api/research/leads` | POST | Yes | `app/api/research/leads/route.ts` | Lead Finder (SerpAPI → normalize → rank → AI) |
| `/api/research/talent` | POST | Yes | `app/api/research/talent/route.ts` | Talent Finder (pure AI, GPT-4o-mini) |
| `/api/workspace` | GET | Yes | `app/api/workspace/route.ts` | Workspace info (Prisma) |
| `/api/users/init` | POST | Yes | `app/api/users/init/route.ts` | User + Workspace init on first login |

### Auth

| Route | Method | Auth | File | Purpose |
|---|---|---|---|---|
| `/auth/callback` | GET | No | `app/auth/callback/route.ts` | Supabase OAuth/magic-link callback handler |

### Account Management

| Route | Method | Auth | File | Purpose |
|---|---|---|---|---|
| `/api/account/export` | GET | Yes | `app/api/account/export/route.ts` | Full data export (reports + research + plan) as JSON download |
| `/api/account/delete` | DELETE | Yes | `app/api/account/delete/route.ts` | Account deletion (cascade via Supabase admin API) |

### Admin API

| Route | Method | Auth | Admin Only | File | Purpose |
|---|---|---|---|---|---|
| `/api/admin/check` | GET | Yes | Yes | `app/api/admin/check/route.ts` | Lightweight admin identity check |
| `/api/admin/users` | GET | Yes | Yes | `app/api/admin/users/route.ts` | User list with plan + usage |
| `/api/admin/users/[id]/plan` | PATCH | Yes | Yes | `app/api/admin/users/[id]/plan/route.ts` | Change user plan (writes audit log) |

### Public / Demo

| Route | Method | Auth | File | Purpose |
|---|---|---|---|---|
| `/api/demo` | POST | No | `app/api/demo/route.ts` | Demo lead capture (save to DB + send email) |
| `/api/demo/generate` | POST | No | `app/api/demo/generate/route.ts` | Demo AI report (via Cloudflare Worker proxy) |
| `/api/health` | GET | No | `app/api/health/route.ts` | Uptime health check (returns status, env presence, timestamp) |

### Debug / Stub

| Route | Method | File | Notes |
|---|---|---|---|
| `/api/debug-env` | — | `app/api/debug-env/route.ts` | File exists, no handler — empty stub |

---

## Dynamic Routes

| Route Pattern | File | Notes |
|---|---|---|
| `/api/admin/users/[id]/plan` | `app/api/admin/users/[id]/plan/route.ts` | `[id]` = Supabase auth user UUID |

---

## Route Auth Pattern

**Important:** There is NO active root `middleware.ts`. The file `proxy.ts` at repo root exports a function named `proxy` — Next.js only executes files named `middleware.ts` or `middleware.js`, so this is NOT intercepting any requests.

Auth is enforced per-route by calling `createClient()` from `lib/supabase/server.ts` and checking `supabase.auth.getUser()`. This pattern is correct but must be maintained manually in every new protected route — there is no global safety net.

`lib/supabase/middleware.ts` exports `updateSession()` (the correct pattern) but is never called from a root `middleware.ts` because that file does not exist.
