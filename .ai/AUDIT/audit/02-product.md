# 02 — Product

**Evidence basis:** Source code, page files, API routes, Supabase SQL schemas.

---

## Product Identity

**Name:** Eunoia (also referred to as "Eunoia Zones" in UI strings)  
**Category:** B2B AI Intelligence SaaS  
**Primary market:** Egypt  
**Target buyer:** Real estate developers and brokers in Egypt  
**Language:** Arabic-primary, English bilingual  
**Deployment:** Web application (SaaS, hosted on Vercel)

---

## Core Value Proposition

Eunoia provides on-demand market intelligence reports to Egyptian real estate companies that previously had no scalable, affordable alternative to hiring consultants or relying on gut instinct. The platform has two distinct engines:

### Engine 1 — Real Estate Intelligence Engine (`/dashboard/real-estate`)

Five report types, all served from a single `/api/intelligence` POST endpoint:

| Report Type | Arabic | What It Does |
|---|---|---|
| `feasibility` | دراسة الجدوى العقارية | Full financial model (NPV, IRR, ROI, cashflow, 3 scenarios) for a real estate project |
| `campaign_roi` | تدقيق أداء الحملات | Campaign audit: CPL vs Egypt 2026 benchmarks, wasted budget, channel breakdown |
| `market_entry` | استخبارات دخول السوق | Market attractiveness, expected CPL, 90-day entry plan |
| `lead_gen` | استخبارات توليد العملاء | Lead qualification diagnosis, WhatsApp script, pipeline health |
| `full_analysis` | التحليل التسويقي الشامل | SWOT, digital presence, 90-day strategy, competitor positioning |

**Differentiator:** Numbers are pre-calculated by a deterministic cashflow engine (`calculateCashflow` in `app/api/intelligence/route.ts:81–198`) before the AI prompt is built. GPT-4o-mini receives the final numbers and writes interpretation only — it cannot change the figures. This prevents AI hallucination of financial data.

**Evidence:** `app/api/intelligence/route.ts`, instruction comment at line 462: *"You are Egypt's top real estate financial analyst. The cashflow has already been CALCULATED. Your job is to INTERPRET and EXPLAIN — do NOT recalculate numbers."*

### Engine 2 — Research Core Engine (`/dashboard/research`)

| Module | What It Does |
|---|---|
| Lead Finder | Web-searches (SerpAPI → Google) for real companies by industry + city + size, vets each URL, deduplicates, ranks, enriches via AI + Apollo, returns evidence-based company list with LinkedIn search links |
| Talent Finder | GPT-4o-mini–generated market overview + salary estimate + candidate archetypes (AI-only, clearly disclaimed) |

---

## User Journey

1. **Landing page** (`/`) — public marketing page
2. **Auth** — signup/login (Supabase magic link + password)
3. **Onboarding** (`/dashboard/onboarding`) — page exists but content is placeholder
4. **Dashboard** (`/dashboard`) — stats + module navigation + recent reports
5. **Real Estate** (`/dashboard/real-estate`) — select report type → fill form → view Arabic report
6. **Research** (`/dashboard/research`) → Lead Finder or Talent Finder → results inline
7. **Reports** (`/dashboard/reports`) — full history, search/filter, CSV/PDF export
8. **Settings** (`/dashboard/settings`) — page exists; no content implemented
9. **Analytics** (`/dashboard/analytics`) — page exists; no content implemented

---

## What Is Confirmed Working

| Feature | Evidence |
|---|---|
| Supabase auth (signup, login, session refresh) | `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `app/(auth)/` |
| Middleware-protected routes | `lib/supabase/middleware.ts:40–43` |
| Real Estate Intelligence reports (5 types) | `app/api/intelligence/route.ts`, `app/dashboard/real-estate/page.tsx` |
| Lead Finder (SerpAPI + GPT-4o-mini pipeline) | `app/api/research/leads/route.ts`, `lib/research/acquisition/` |
| Talent Finder (GPT-4o-mini) | `app/api/research/talent/route.ts` |
| Rate limiting (5/hr/user/route) | `lib/research/rate-limit.ts` |
| Plan limit enforcement (monthly credits) | `lib/research/plan-enforcement.ts`, `supabase/plan-enforcement.sql` |
| Report persistence (Supabase `reports` table) | All active API routes write to `reports` |
| Report history + filter + search | `app/dashboard/reports/reports-client.tsx` |
| CSV export | `lib/csv-export.ts`, used in leads, talent, real-estate pages |
| PDF print | `exportPDF()` in `app/dashboard/real-estate/page.tsx:484–506` |
| Redis caching of research results (24h) | `lib/redis/cache.ts`, `lib/research/acquisition/research-service.ts:162` |
| Daily search quota per user | `lib/research/acquisition/quota.ts` |

## What Is Not Working / Placeholder

| Feature | Status | Evidence |
|---|---|---|
| Billing / payment | Missing — plans assigned manually | `supabase/plan-enforcement.sql` comments |
| Plan upgrade UI | Missing — no user-facing upgrade flow | No route or component found |
| Email notifications | No-op — Resend declared in package.json but zero usages in source | `grep -r "resend" lib app services --include="*.ts"` returns 0 hits in active code |
| Onboarding flow | Placeholder page only | `app/dashboard/onboarding/page.tsx` |
| Settings page | Placeholder | `app/dashboard/settings/page.tsx` |
| Analytics page | Placeholder | `app/dashboard/analytics/page.tsx` |
| Market Intelligence page | Placeholder | `app/market-intelligence/page.tsx` |
| Talent Finder real data | AI-generated only | `app/api/research/talent/route.ts:166`: "Salary range and demand level are AI-generated estimates…" |

---

## Product Maturity Assessment

**Alpha-to-Beta.** The two core engines are functional and testable. The platform is demo-ready and can process real requests end-to-end. It is not production-ready for paying customers due to the absence of billing infrastructure and several incomplete UX flows.
