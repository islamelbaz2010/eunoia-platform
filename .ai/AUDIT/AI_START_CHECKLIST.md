# AI START CHECKLIST — EUNOIA PLATFORM

This checklist is for any AI (Claude, GPT, etc.) starting a new session on this repository.
Read this BEFORE writing any code or making any recommendations.

---

## 1. WHO IS THIS FOR

- Founder/CTO: AI Marketing Intelligence SaaS — MENA focus
- Target customers: Egyptian real estate developers, brokers, marketing agencies
- Stage: Production MVP, deployed at https://ai.halannews.com
- Investor demo: YES — this product is being shown to investors

---

## 2. WHAT THE PRODUCT DOES (3-sentence version)

Eunoia Platform is an AI-powered research and intelligence platform for MENA businesses. It generates real estate feasibility studies, campaign ROI audits, and market intelligence reports for the Egyptian market, plus a B2B Lead Finder (real company discovery via web search) and a Talent Finder (AI salary/demand estimates). All output is saved to a per-user report history with CSV/PDF export.

---

## 3. REPOSITORY ISOLATION

**THIS REPOSITORY IS COMPLETELY INDEPENDENT.**

There are other repositories on this machine. IGNORE THEM ALL:
- `02-Eunoia-AI-OS/` — different product, different codebase
- `03-Eunoia-Media-OS/` — different product, different codebase

Never reference, compare, copy from, or suggest merging with any other repository.

---

## 4. CURRENT STATE (verified 2026-07-07)

### What's Working (live on production)
- ✅ Auth (login, signup, email verify, forgot password)
- ✅ Dashboard with report stats and navigation
- ✅ Real Estate Intelligence Engine (5 report types, Arabic/English)
- ✅ Lead Finder (SerpAPI search → scraping → AI analysis pipeline)
- ✅ Talent Finder (AI salary/demand estimates)
- ✅ Market Intelligence Hub (static curated insights)
- ✅ Report History (all 7 report types, search, filter, export)
- ✅ Onboarding flow (workspace creation)
- ✅ Demo lead capture form + email flow
- ✅ Rate limiting (5/hr Redis) + plan limits (STARTER=20/month)
- ✅ Upstash Redis caching (24h report cache)
- ✅ Apollo.io enrichment (optional, no-ops when absent)
- ✅ Vercel deployment (CI from GitHub)

### Known Gaps (not implemented)
- 🔴 No payment/billing — plans manually assigned
- 🔴 No in-app plan upgrade flow
- 🔴 No admin panel / user management UI
- 🔴 No usage analytics / dashboards
- 🔴 No error monitoring (Sentry)
- 🔴 No SSO / OAuth login
- 🔴 No team/multi-user workspace management
- 🔴 No API key management for customers
- 🔴 Settings page is a placeholder only

---

## 5. TECH STACK (quick reference)

```
Framework:    Next.js 16 (App Router, React 19)
Language:     TypeScript 5.8 strict
Auth:         Supabase Auth (email+password)
Primary DB:   Supabase (PostgreSQL) — reports, research, plans
Secondary DB: Prisma ORM (same DB) — user/workspace metadata only
AI:           OpenAI GPT-4o-mini (direct API)
AI (demo):    Cloudflare Worker proxy → Claude Opus 4.8
Search:       SerpAPI (Google organic)
Cache:        Upstash Redis
Enrichment:   Apollo.io (optional)
Email:        Resend
Deployment:   Vercel
Tests:        Vitest (unit only)
```

---

## 6. DATABASE ARCHITECTURE (important — dual DB)

There are TWO active database clients in this codebase:

**Supabase Client** (`lib/supabase/`)
- Used in: all API routes for actual data (reports, research, plans)
- Tables: `reports`, `research_requests`, `user_plans`, `demo_leads`
- Auth: standard Supabase row-level security
- TypeScript: partially typed — `@typescript-eslint/no-explicit-any` casts used in routes

**Prisma Client** (`lib/prisma/`)
- Used in: dashboard layout (user check), workspace API, onboarding
- Models: User, Workspace (active) | Report, ApiUsage (LEGACY — not written to)
- Env: DATABASE_URL + DIRECT_URL required

If adding a new feature, use **Supabase client** for data. Use Prisma only when working with workspace/user metadata.

---

## 7. KEY FILES TO KNOW

| File/Directory | What it is |
|---|---|
| `app/dashboard/real-estate/page.tsx` | Largest file — complete Real Estate Intelligence UI (1100+ lines) |
| `app/api/intelligence/route.ts` | Real estate AI API — contains cashflow calculator + 5 prompt builders |
| `app/api/research/leads/route.ts` | Lead Finder API — orchestrates Research Core Engine |
| `lib/research/acquisition/research-service.ts` | Research Core Engine orchestrator |
| `lib/research/acquisition/search-provider.ts` | SerpAPI provider |
| `lib/research/plan-enforcement.ts` | Monthly report quota logic |
| `lib/research/rate-limit.ts` | Per-user hourly rate limit (Redis) |
| `types/plan.types.ts` | Plan definitions and limits |
| `prisma/schema.prisma` | Prisma schema (Workspace, User, LEGACY Report) |
| `supabase/reports-table.sql` | Supabase reports table DDL |
| `supabase/research-tables.sql` | Supabase research_requests table DDL |
| `supabase/plan-enforcement.sql` | Supabase user_plans table DDL |
| `core/data/sectors.data.ts` | Industry sectors (used in Lead/Talent forms) |
| `core/data/cities.data.ts` | MENA cities with country/key (used in all forms) |
| `services/legacy-ai-engine/` | EXCLUDED from tsconfig — legacy, do not modify |
| `vercel.json` | Vercel config (buildCommand includes prisma generate) |

---

## 8. CRITICAL SECURITY ISSUES (do NOT ignore)

### ISSUE 1: `users.json` committed to git
- **File**: `/users.json` in repository root
- **Content**: bcrypt password hashes for internal accounts
- **Status**: Tracked by git (git ls-files shows it)
- **Action needed**: Remove from git history + rotate credentials

### ISSUE 2: `console.log` debug in production API
- **File**: `app/api/research/leads/route.ts` lines 1-3
- **Content**: Logs SERPAPI and OPENAI key presence to production stdout
- **Action needed**: Remove before any public-facing launch

### ISSUE 3: `SUPABASE_SERVICE_ROLE_KEY` in demo route
- **File**: `app/api/demo/route.ts`
- **Risk**: Service role key bypasses all RLS — ensure it's set server-side only

---

## 9. ENVIRONMENT VARIABLES REQUIRED TO RUN

Minimum to start dev locally:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
DIRECT_URL=
OPENAI_API_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

To enable Lead Finder:
```
SERPAPI_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## 10. RULES FOR THIS REPOSITORY

1. **No code changes without user approval** — propose first, implement after confirmation
2. **No commits, pushes, or PRs without explicit request**
3. **Never touch `services/legacy-ai-engine/`** — excluded from build, legacy only
4. **No new dependencies without discussion** — each npm package is a build/security surface
5. **Dual DB awareness** — Supabase for data, Prisma for workspace metadata only
6. **No hallucinated features** — only describe what's in the code, not what could be
7. **TypeScript first** — never use `any` unless it's the same pattern as existing code
8. **Verify before claiming** — check if a file/function actually exists before recommending it

---

## 11. CURRENT TECHNICAL DEBT (top 5)

1. **Dual DB architecture** — Prisma workspace model and Supabase reports model use different types/IDs, creating confusion. Long-term: consolidate to one.
2. **TypeScript `any` casts** — Research API routes use `supabase as any` because `types/supabase.types.ts` doesn't cover research/plan tables yet.
3. **Inline CSS everywhere** — pages use `style={{}}` objects instead of Tailwind classes, inconsistent with the design system.
4. **`services/legacy-ai-engine/` dead weight** — 30+ prompt files, excluded from tsconfig, not used by any production route. Candidate for deletion.
5. **No TypeScript types for Supabase tables** — `research_requests`, `user_plans`, `demo_leads` tables have no generated types.

---

## 12. INVESTOR DEMO READINESS

**Show:**
- Real Estate Intelligence → Feasibility Study (most impressive, pre-calculated numbers + AI commentary)
- Real Estate Intelligence → Campaign ROI Audit (fastest, most directly useful)
- Lead Finder (demonstrates real data, not AI hallucination)
- Report History (shows persistence, multiple report types)

**Do NOT show:**
- Talent Finder (pure AI estimation, less impressive)
- Market Intelligence Hub (static content, looks like a prototype)
- Settings page (placeholder, nothing works)
- `/market-intelligence` route (iframes halannews.com, confusing)
- Signup flow (open registration with no access control may concern investors)

---

*Last verified: 2026-07-07 — verified against actual source code, not assumptions.*
