# PROJECT CONTEXT — EUNOIA PLATFORM

## Identity

| Field       | Value                                          |
|-------------|------------------------------------------------|
| Name        | Eunoia Platform                                |
| Repo        | eunoia-platform                                |
| GitHub      | https://github.com/islamelbaz2010/eunoia-platform |
| Production  | https://ai.halannews.com                       |
| Status      | ACTIVE — Production SaaS                       |
| Investor Demo | YES                                          |
| Branch      | main                                           |

---

## What It Is

AI-powered marketing intelligence and research platform targeting MENA businesses — primarily Egyptian real estate developers, brokers, and marketing agencies.

**Three core capabilities:**
1. **Real Estate Intelligence Engine** — 5 AI report types for the Egyptian real estate market (Feasibility Study, Campaign ROI Audit, Market Entry, Lead Generation, Full Analysis). Pre-computed financial models, AI for commentary only.
2. **Research Intelligence Hub** — Lead Finder (real company discovery via SerpAPI + scraping) and Talent Finder (AI salary/demand estimates) for B2B sales and hiring teams.
3. **Market Intelligence Hub** — Static curated Egypt/MENA market insights (no live API cost).

---

## Technology Stack

| Layer          | Technology                                                  |
|----------------|-------------------------------------------------------------|
| Framework      | Next.js 16.2.6, App Router, React 19                        |
| Language       | TypeScript 5.8 (strict mode)                                |
| Auth           | Supabase Auth (email + password + email verification)       |
| Primary DB     | Supabase (PostgreSQL) — reports, research, plans            |
| Secondary DB   | Prisma ORM (same Supabase DB) — workspace/user metadata     |
| AI             | OpenAI GPT-4o-mini (direct API)                             |
| AI (Demo)      | Cloudflare Worker proxy → Claude Opus 4.8                   |
| Search         | SerpAPI (Google organic results)                            |
| Cache/Rate     | Upstash Redis                                               |
| Enrichment     | Apollo.io (optional, zero-impact when absent)               |
| Styling        | Tailwind CSS 4 + Radix UI + inline CSS (mixed)              |
| i18n           | next-intl 4.1                                               |
| Email          | Resend                                                      |
| Deployment     | Vercel (serverless)                                         |
| Tests          | Vitest (unit tests only)                                    |

---

## Live Features (confirmed in code)

### 1. Real Estate Intelligence Engine `/dashboard/real-estate`
- 5 report types: Feasibility, Campaign ROI Audit, Market Entry, Lead Gen, Full Analysis
- Pre-computed financial engine (server-side math before AI call)
- Egypt 2026 market benchmarks hardcoded
- Arabic/English bilingual (RTL/LTR toggle)
- Export: CSV/Excel + Print/PDF
- API: `POST /api/intelligence`

### 2. Lead Finder `/dashboard/research/leads`
- Input: Industry, Location, Company Size, Decision Maker Titles
- Pipeline: SerpAPI → HTTP collection → normalization → dedup → ranking → (optional Apollo enrichment) → AI analysis
- Output: Company list, confidence scores, LinkedIn search links
- Export: CSV
- API: `POST /api/research/leads`

### 3. Talent Finder `/dashboard/research/talent`
- Input: Job Title, Location, Industry, Experience, Skills
- Output: Salary range, hiring demand, candidate sources, suggested profiles
- Pure AI (GPT-4o-mini) — clearly disclaimered
- Export: CSV
- API: `POST /api/research/talent`

### 4. Market Intelligence Hub `/dashboard/analytics`
- Static curated insights: Egypt Economy, Real Estate, Marketing, Business, Growth
- No AI cost, no external API

### 5. Report History `/dashboard/reports`
- All reports (7 types) stored in Supabase `reports` table
- Search, filter by type, expandable cards, CSV export, print

### 6. Auth System
- Login, Signup (email verification), Forgot Password
- Auth callback handler
- Onboarding flow (creates Prisma workspace on first login)

### 7. Dashboard `/dashboard`
- Stats: total reports, this month, last report date
- Module navigation (4 cards)
- Recent reports list (live from Supabase)

### 8. Demo Lead Capture `/api/demo` + `/api/demo/generate`
- Public unauthenticated lead form
- Generates AI report via Cloudflare Worker proxy
- Sends branded email via Resend
- Saves to `demo_leads` Supabase table (uses service role key)

---

## API Routes

| Route                        | Auth | Purpose                              |
|------------------------------|------|--------------------------------------|
| `POST /api/intelligence`     | Yes  | Real estate AI reports               |
| `POST /api/research/leads`   | Yes  | Lead Finder research                 |
| `POST /api/research/talent`  | Yes  | Talent Finder research               |
| `GET  /api/workspace`        | Yes  | Workspace info (Prisma)              |
| `POST /api/users/init`       | Yes  | User/workspace init (onboarding)     |
| `POST /api/demo`             | No   | Demo lead capture (DB + email)       |
| `POST /api/demo/generate`    | No   | Demo AI report (Cloudflare proxy)    |
| `GET  /api/debug-env`        | —    | Empty file, no handler               |

---

## Database Schema

### Supabase Tables (live data)
| Table               | Purpose                                              |
|---------------------|------------------------------------------------------|
| `reports`           | All AI-generated reports (7 types, user-scoped)      |
| `research_requests` | Request lifecycle tracking (submitted → completed)   |
| `user_plans`        | Plan assignment (STARTER/PROFESSIONAL/AGENCY/ENTERPRISE) |
| `demo_leads`        | Demo form lead captures                              |
| Auth users          | Managed by Supabase Auth                             |

### Prisma Models (workspace metadata only)
| Model      | Status   | Purpose                              |
|------------|----------|--------------------------------------|
| User       | Active   | Email, role, workspace reference      |
| Workspace  | Active   | Name, plan, owner                    |
| Report     | LEGACY   | Old report model — no longer written  |
| ApiUsage   | LEGACY   | Old usage tracking — no longer written|

---

## Environment Variables

| Variable                    | Required  | Purpose                        |
|-----------------------------|-----------|--------------------------------|
| NEXT_PUBLIC_SUPABASE_URL    | Required  | Supabase project URL           |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Required | Supabase anon key            |
| DATABASE_URL                | Required  | Prisma pooled connection       |
| DIRECT_URL                  | Required  | Prisma direct connection       |
| OPENAI_API_KEY              | Required  | GPT-4o-mini for reports        |
| RESEND_API_KEY              | Optional  | Email (demo flow)              |
| SUPABASE_SERVICE_ROLE_KEY   | Optional  | Demo lead capture (bypasses RLS)|
| UPSTASH_REDIS_REST_URL      | Optional  | Rate limiting + caching        |
| UPSTASH_REDIS_REST_TOKEN    | Optional  | Rate limiting + caching        |
| SERPAPI_API_KEY             | Optional* | Lead Finder (required for it)  |
| SEARCH_DAILY_QUOTA          | Optional  | SerpAPI daily budget (def. 150)|
| APOLLO_API_KEY              | Optional  | Domain enrichment              |
| CLOUDFLARE_WORKER_URL       | Optional  | AI proxy for demo flow         |
| NEXT_PUBLIC_SITE_URL        | Required  | Email redirect URLs            |

---

## Plan Limits

| Plan         | Reports/Month | Notes                    |
|--------------|---------------|--------------------------|
| STARTER      | 20            | Default for all users    |
| PROFESSIONAL | 100           |                          |
| AGENCY       | 300           |                          |
| ENTERPRISE   | Unlimited     | Fair-use, not guaranteed |

Rate limit: 5 requests/hour per user (Redis-based, fail-open).

---

## Known Issues (as of 2026-07-07)

1. **`users.json` committed to git** — contains bcrypt password hash. Severity: HIGH.
2. **Dual DB architecture** — Prisma + Supabase both active, TypeScript `any` casts everywhere.
3. **No payment/billing integration** — plans are manually assigned via Supabase SQL.
4. **Signup is fully open** — no invite gate, no access control.
5. **`/market-intelligence` route** — auth-required page that iframes `halannews.com` (confusing UX).
6. **Debug `console.log` at leads API start** — prints env key presence to production logs.
7. **Talent Finder is pure AI** — no real data, only estimation.
8. **`services/legacy-ai-engine/`** — excluded from tsconfig, contains 30+ legacy prompt files.
9. **No error monitoring** — no Sentry or equivalent.
10. **Settings page is a placeholder** — no actual settings functionality.

---

## Rules

- This repository is completely independent from AI OS, Media OS, and all other repos.
- Never reference, compare, or copy from another repository.
- Never move files between repositories.
- All work stays inside this repository only.
