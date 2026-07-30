# PROJECT OVERVIEW
**Audit Date:** 2026-07-30  
**Source:** Direct repository inspection — not derived from documentation

---

## Identity

| Field | Value |
|---|---|
| Project name | Eunoia Platform |
| Package name | `eunoia-intelligence-web` |
| Repository | `eunoia-platform` |
| GitHub | https://github.com/islamelbaz2010/eunoia-platform |
| Production URL | `https://intelligence.eunoiazones.com` *(README.md still shows stale URL — see DOCUMENTATION_STATUS.md)* |
| Development URL | `http://localhost:3000` |
| Branch | `main` |
| Platform status | **NON-OPERATIONAL** — Supabase project deleted; DNS returns NXDOMAIN |

---

## Framework & Runtime

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.6 |
| React | React | 19.0.0 |
| Language | TypeScript (strict mode) | 5.8.3 |
| Node.js | Node.js (Vercel Fluid Compute) | 22 LTS (Vercel default) |
| Package manager | npm | (package-lock.json present) |
| Build tool | Next.js compiler | — |
| CSS | Tailwind CSS | 4.1.4 |
| i18n | next-intl | 4.1.0 |

---

## Test Framework

| Tool | Version | Test count (last verified) |
|---|---|---|
| Vitest | 4.1.9 | 25 files / 194 tests (all passing as of 2026-07-21) |

---

## Database

| System | Role | Status |
|---|---|---|
| Supabase (PostgreSQL) | Primary — reports, research, plans, auth | **DELETED** — non-operational |
| Prisma ORM | Secondary — workspace/user metadata | Connected via DATABASE_URL / DIRECT_URL |
| Upstash Redis | Rate limiting + caching | Optional; fails open if absent |

---

## Hosting & Deployment

| Layer | Value |
|---|---|
| Hosting | Vercel (serverless / Fluid Compute) |
| Deployment trigger | `git push main` (Vercel git integration) |
| Build command (vercel.json) | `npm install && npx prisma generate && npm run build` |
| Output | `.next` |

---

## AI Providers

| Provider | Use | Route |
|---|---|---|
| OpenAI GPT-4o-mini | Real Estate reports, Lead Finder, Talent Finder | Direct via `openai` SDK |
| Cloudflare Worker (`eunoia-worker.js`) | Public demo proxy to AI | `/api/demo/generate` |
| Resend | Transactional email (demo flow) | `/api/demo` |

---

## Third-Party Integrations

| Service | Purpose | Required? |
|---|---|---|
| SerpAPI | Web search for Lead Finder | Optional (Lead Finder fails without it) |
| Apollo.io | Company enrichment | Optional (zero-impact if absent) |
| Upstash Redis | Rate limiting, caching | Optional (fails open) |

---

## High-Level Architecture

```
User Browser
    │
    ▼
Vercel Edge / CDN
    │
    ▼
Next.js App Router (Fluid Compute)
    │
    ├── app/(auth)/          Auth pages (login, signup, forgot-password)
    ├── app/dashboard/       Protected dashboard (all product features)
    │   ├── real-estate/     Real Estate Intelligence Engine (5 report types)
    │   ├── research/        Research Intelligence Hub (leads + talent)
    │   ├── analytics/       Market Intelligence Hub (static content)
    │   ├── reports/         Report history (all 7 types)
    │   ├── settings/        Account management (export, delete)
    │   ├── admin/           Admin console (plan management, user list)
    │   └── onboarding/      2-step onboarding flow
    ├── app/api/             API routes (auth-protected and public)
    └── app/demo/            Public lead-capture demo
         │
         ├── lib/decision-intelligence/   DI Engine library (NOT yet integrated into routes)
         ├── lib/research/                Research pipeline (SerpAPI → normalize → rank → AI)
         ├── lib/supabase/                Supabase client wrappers
         ├── lib/prisma/                  Prisma client + init-user
         ├── lib/redis/                   Redis client + cache helpers
         └── lib/admin/                   Admin auth + audit log
              │
              ├── Supabase (PostgreSQL)   — reports, research_requests, user_plans, demo_leads, audit_log
              ├── Prisma (same DB)        — User, Workspace (workspace/seat metadata only)
              └── Upstash Redis           — rate limiting + SerpAPI quota cache
```

**Auth pattern:** Per-route auth checks via `createClient()` from `lib/supabase/server.ts`.  
**No active root middleware** — `proxy.ts` exists at root but exports `proxy` (not `middleware`), so Next.js does not execute it. See TECH_DEBT.md.

---

## Environment Summary

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Required | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required | Supabase anon key |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Optional alias | Newer alias for anon key; falls back to ANON_KEY |
| `DATABASE_URL` | Required | Prisma pooled connection |
| `DIRECT_URL` | Required | Prisma direct connection |
| `OPENAI_API_KEY` | Required | GPT-4o-mini for reports |
| `SUPABASE_SERVICE_ROLE_KEY` | Required | Admin console, account deletion, demo leads |
| `ADMIN_EMAILS` | Required | Comma-separated admin email list |
| `RESEND_API_KEY` | Optional | Email (demo flow) |
| `UPSTASH_REDIS_REST_URL` | Optional | Rate limiting + caching |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Rate limiting + caching |
| `SERPAPI_API_KEY` | Optional* | Lead Finder (required for it to work) |
| `SEARCH_DAILY_QUOTA` | Optional | SerpAPI daily budget (default 150) |
| `SEARCH_DAILY_QUOTA_PER_USER` | Optional | Per-user sub-quota (default 30) |
| `APOLLO_API_KEY` | Optional | Domain enrichment |
| `CLOUDFLARE_WORKER_URL` | Optional | AI proxy for demo flow |
| `AI_PROXY_URL` | Optional | Second proxy var — undocumented in .env.example |
| `NEXT_PUBLIC_SITE_URL` | Required | Email redirect URLs |

**Note:** Most production env vars are unset in Vercel or point to the deleted Supabase project.
