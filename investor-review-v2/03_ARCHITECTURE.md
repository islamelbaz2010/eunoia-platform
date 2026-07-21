# 03 — ARCHITECTURE
*Evidence-based. Every claim maps to a file.*

---

## System Architecture Overview

```
User Browser
     │
     ▼
Vercel (CDN + Functions)
     │
     ├── Next.js 16 App Router (SSR + API Routes)
     │       ├── /app/(auth)/*         — Supabase Auth pages
     │       ├── /app/dashboard/*      — Protected dashboard pages
     │       ├── /app/demo/*           — Public demo lead capture
     │       ├── /app/market-intelligence — Iframe wrapper (halannews.com)
     │       └── /app/api/*            — API Routes
     │
     ├── Supabase (Primary Data Store + Auth)
     │       ├── Auth (JWT + session cookies via @supabase/ssr)
     │       ├── reports table (report output)
     │       ├── research_requests table (usage tracking)
     │       ├── user_plans table (plan enforcement)
     │       └── demo_leads table (exhibition capture)
     │
     ├── OpenAI GPT-4o-mini (AI Engine)
     │       ├── /api/intelligence — Real estate reports
     │       ├── /api/research/leads — Lead analysis
     │       └── /api/research/talent — Talent analysis
     │
     ├── SerpAPI (Search Engine)
     │       └── /api/research/leads → Research Core Engine
     │
     ├── Upstash Redis
     │       ├── Rate limiting (5 req/hour per user)
     │       └── Query caching (CACHE_TTL.REPORT)
     │
     ├── Resend (Transactional Email)
     │       └── /api/demo/route.ts, /api/demo/generate/route.ts
     │
     ├── Prisma (LEGACY — build-time only)
     │       └── PostgreSQL schema for historical data (never written to by live routes)
     │
     └── halannews.com (EXTERNAL DEPENDENCY — see risk)
             ├── /api/demo/generate → halannews.com/api-proxy (AI generation)
             └── /app/market-intelligence → iframe embed
```

---

## Data Flow: Real Estate Report Generation

```
User fills form → POST /api/intelligence
  → Supabase auth check
  → Upstash rate limit check (5/hour)
  → Supabase plan limit check (20/month STARTER)
  → CASHFLOW ENGINE: calculateCashflow() — pure JavaScript math
  → Build AI prompt (numbers pre-calculated, AI interprets)
  → OpenAI GPT-4o-mini (gpt-4o-mini, max_tokens: 4000, temp: 0.3)
  → Parse JSON response
  → Save to Supabase `reports` table
  → Return to client → render ReportView component
```

Evidence: `app/api/intelligence/route.ts` lines 927–1051

---

## Data Flow: Lead Finder

```
User submits criteria → POST /api/research/leads
  → Supabase auth check
  → Upstash rate limit check
  → Supabase plan limit check
  → Build search query (industry + size + city)
  → ResearchService.run()
      ├── SerpAPI search (Google results)
      ├── FetchSourceCollector (HTTP fetch each URL)
      ├── classifySourceType (company_website / business_directory / public_listing)
      ├── isParkedDomainProvider check
      ├── getSourceReputation check (Redis-backed)
      ├── detectBrokenPage (soft-404 detection)
      ├── normalizeSources
      ├── filterValidSources (company-validation.ts)
      ├── dedupeCompanies (dedup.ts)
      ├── extractMentionedDomains (company-expansion.ts)
      ├── rankSources (with sector/city/size hints)
      ├── ApolloOrgEnrichAdapter (optional, no-op without key)
      └── analyzeRankedSources (OpenAI GPT-4o-mini)
  → Add LinkedIn search URLs + decision-maker titles
  → Save to Supabase `reports` table
  → Return to client
```

Evidence: `lib/research/acquisition/research-service.ts`

---

## Database Architecture

### Primary (Supabase PostgreSQL)

| Table | Purpose | Status |
|-------|---------|--------|
| `reports` | All report output (JSON) | Active — all live routes write here |
| `research_requests` | Per-request tracking (credits_used, status) | Active |
| `user_plans` | Per-user plan assignment | Active (defaults to STARTER) |
| `demo_leads` | Exhibition lead capture | Active |

Schema files: `supabase/*.sql` (5 files)

### Legacy (Prisma PostgreSQL)

| Model | Purpose | Status |
|-------|---------|--------|
| `User` | User records | LEGACY — no route writes here |
| `Workspace` | Workspace model | LEGACY |
| `Report` | Old report model (28 types) | LEGACY — historical data only |
| `ApiUsage` | Old token tracking | LEGACY |

Evidence: `prisma/schema.prisma` — every model has `/// LEGACY:` comment

**Architectural Debt:** Prisma is still generated at build time (`postinstall: prisma generate` in `package.json` line 8), adding build complexity for an entirely legacy system.

---

## Authentication Architecture

- **Provider:** Supabase Auth (email/password)
- **Session:** Cookie-based via `@supabase/ssr`
- **Middleware:** `lib/supabase/middleware.ts` — refreshes session on every request, redirects unauthenticated users to `/login`
- **Public routes:** `/` (root), `/login`, `/signup`, `/api/*`, `/demo/*`
- **Protected routes:** All `/dashboard/*` routes
- **Server-side auth:** All API routes call `supabase.auth.getUser()` before processing

---

## Plan Enforcement Architecture

```
UserPlan: 'STARTER' | 'PROFESSIONAL' | 'AGENCY' | 'ENTERPRISE'

PLAN_LIMITS:
  STARTER:      20 reports/month
  PROFESSIONAL: 100 reports/month
  AGENCY:       300 reports/month
  ENTERPRISE:   unlimited

Source of truth: Supabase `user_plans` table
Default: STARTER (if no row exists)
Enforcement: lib/research/plan-enforcement.ts (fail-open on infra error)
```

Evidence: `types/plan.types.ts`, `lib/research/plan-enforcement.ts`

**Gap:** No payment flow exists to upgrade plans. Plans are manually assigned. There is no self-serve upgrade path for users.

---

## Key Architectural Decisions

| Decision | Why | Trade-off |
|----------|-----|-----------|
| Pre-calculate numbers, AI interprets | Prevents hallucinated financial figures | AI can still misinterpret |
| Fail-open rate limit/plan check | Redis down = allow requests | Potential abuse on Redis failure |
| SerpAPI over Google CSE | Google CSE returned PERMISSION_DENIED | External cost dependency |
| Supabase over Prisma for live data | Speed of iteration | Two DB layers create confusion |
| GPT-4o-mini over GPT-4o | Cost efficiency | Lower reasoning capability |
| Redis caching for research queries | Avoid repeat SerpAPI quota spend | Cache invalidation complexity |

---

## Technology Versions

| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | 16.2.6 | App Router |
| React | 19.0.0 | Latest |
| TypeScript | 5.8.3 | Strict |
| @prisma/client | 6.6.0 | LEGACY use |
| @supabase/ssr | 0.5.2 | SSR auth |
| openai | 4.96.2 | Direct SDK |
| next-intl | 4.1.0 | i18n (partially used) |
| tailwindcss | 4.1.4 | Styling |
| framer-motion | 12.40.0 | Animations |
| vitest | 4.1.9 | Testing |
