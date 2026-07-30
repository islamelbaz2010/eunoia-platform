# Dependency Graph

**Date:** 2026-07-21  
**Source:** Direct repository inspection — all dependencies verified against actual imports and file contents.

---

## 1. Top-Level Stack Dependencies

```
Browser / Vercel Edge
        │
        ▼
Next.js 16.2.6 (App Router, React 19, TypeScript 5.8)
        │
        ├── Tailwind CSS 4 + Radix UI (UI primitives)
        ├── Framer Motion (animation)
        ├── next-intl 4.1 (i18n — installed, not used)
        ├── Supabase SSR (@supabase/ssr 0.5.2)
        │       └── Supabase JS (@supabase/supabase-js 2.49.4)
        │               └── Supabase (hosted PostgreSQL + Auth)
        ├── Prisma 6.6 (ORM)
        │       └── Supabase PostgreSQL (same database, different access layer)
        ├── OpenAI SDK 4.96.2
        │       └── OpenAI API (GPT-4o-mini)
        ├── @upstash/redis 1.34.9 (raw Redis client — legacy engine cache)
        ├── @upstash/ratelimit 2.0.5 (sliding window — rate limiting)
        │       └── Upstash Redis (hosted Redis)
        ├── Resend 6.12.4 (email)
        │       └── Resend API (key empty in production)
        ├── Zod 3.24.1 (schema validation — installed; API boundary usage unconfirmed)
        ├── Vercel AI SDK 4.3.16 (usage in codebase unconfirmed from static listing)
        └── Sonner 2.0.1 (toast notifications)
```

---

## 2. External Service Dependency Graph

```
External Services
        │
        ├── Supabase (CRITICAL)
        │       ├── auth.users — authentication identity
        │       ├── reports — legacy AI engine outputs
        │       ├── research_requests — research request lifecycle
        │       ├── user_plans — plan enforcement (AUTHORITATIVE)
        │       ├── demo_leads — public demo lead capture
        │       ├── audit_log — admin action history
        │       └── usage_tracking — SQL-trigger-based (not read in app code)
        │
        ├── Supabase PostgreSQL via Prisma (SIGNIFICANT)
        │       ├── User model — identity bootstrap
        │       ├── Workspace model — workspace name/plan (legacy plan field)
        │       ├── Report model — LEGACY (not written)
        │       └── ApiUsage model — LEGACY (not written)
        │
        ├── Upstash Redis (REQUIRED for rate limiting)
        │       ├── ratelimit:research:leads:{userId} — Lead Finder 5 req/hr
        │       ├── ratelimit:research:talent:{userId} — Talent Finder 5 req/hr
        │       ├── ratelimit:users:init:{userId} — onboarding init limit
        │       ├── quota:search-provider:{date} — global SerpAPI daily budget
        │       ├── quota:search-provider:user:{userId}:{date} — per-user SerpAPI sub-quota
        │       └── analysis:{sha256} — 24h legacy AI engine cache
        │
        ├── OpenAI API (REQUIRED for intelligence features)
        │       ├── services/legacy-ai-engine/ — 35 analysis types
        │       ├── lib/research/acquisition/ai-analysis.ts — research enrichment
        │       └── app/api/demo/generate — demo AI report (via proxy)
        │
        ├── SerpAPI (REQUIRED for Lead Finder)
        │       └── lib/research/acquisition/search-provider.ts
        │
        ├── Apollo.io (OPTIONAL)
        │       └── lib/research/acquisition/apollo-adapter.ts
        │
        ├── Resend (OPTIONAL — demo email only)
        │       ├── app/api/demo/route.ts — lead capture confirmation email
        │       └── app/api/demo/generate/route.ts — demo report email
        │
        ├── AI Proxy (OPTIONAL — fallback/demo)
        │       ├── CLOUDFLARE_WORKER_URL → services/legacy-ai-engine/orchestrator.ts
        │       └── AI_PROXY_URL → app/api/demo/generate/route.ts
        │
        └── Vercel (DEPLOYMENT)
                └── intelligence.eunoiazones.com
```

---

## 3. Module Dependency Graph (Internal)

### 3.1 API Routes → Libraries

```
/api/intelligence
    ├── lib/supabase/server.ts (auth)
    ├── lib/research/rate-limit.ts
    │       └── @upstash/ratelimit → Upstash Redis
    └── services/legacy-ai-engine/orchestrator.ts
            ├── services/legacy-ai-engine/prompt-builder.ts
            ├── services/legacy-ai-engine/providers/openai.provider.ts
            │       └── openai SDK → OpenAI API
            └── lib/redis/client.ts
                    └── @upstash/redis → Upstash Redis

/api/research/leads  AND  /api/research/talent
    ├── lib/supabase/server.ts (auth)
    ├── lib/research/rate-limit.ts
    │       └── @upstash/ratelimit → Upstash Redis
    ├── lib/research/plan-enforcement.ts
    │       └── lib/supabase/server.ts → Supabase: user_plans
    └── lib/research/acquisition/research-service.ts
            ├── lib/research/acquisition/search-provider.ts → SerpAPI
            ├── lib/research/acquisition/quota.ts → @upstash/redis
            ├── lib/research/acquisition/source-collector.ts
            ├── lib/research/company-validation.ts
            ├── lib/research/acquisition/normalizer.ts
            ├── lib/research/dedup.ts
            ├── lib/research/acquisition/ranker.ts
            ├── lib/research/source-quality.ts
            ├── lib/research/company-size.ts
            ├── lib/research/company-expansion.ts
            ├── lib/research/decision-makers.ts
            ├── lib/research/acquisition/apollo-adapter.ts → Apollo.io (optional)
            └── lib/research/acquisition/ai-analysis.ts → openai SDK → OpenAI API

/api/users/init
    ├── lib/supabase/server.ts (auth)
    ├── lib/research/rate-limit.ts
    └── lib/prisma/init-user.ts
            └── lib/prisma/client.ts → Prisma → Supabase PostgreSQL

/api/account/export  AND  /api/account/delete
    ├── lib/supabase/server.ts (auth)
    └── lib/supabase/admin.ts (delete only)
            └── @supabase/supabase-js (service role) → Supabase Admin API

/api/admin/*
    ├── lib/supabase/server.ts (auth)
    ├── lib/admin/auth.ts (ADMIN_EMAILS check)
    ├── lib/supabase/admin.ts
    └── lib/admin/audit.ts
            └── lib/supabase/admin.ts → Supabase: audit_log

/api/demo
    └── @supabase/supabase-js (service role) + resend → Resend API

/api/demo/generate
    ├── lib/research/rate-limit.ts
    └── fetch(AI_PROXY_URL) → External proxy → OpenAI GPT-4o-mini
```

### 3.2 Decision Intelligence (Unintegrated)

```
lib/decision-intelligence/index.ts
    ├── lib/decision-intelligence/engine/decision-engine.ts
    │       ├── lib/decision-intelligence/engine/rules-engine.ts
    │       ├── lib/decision-intelligence/evidence/evidence-weighter.ts
    │       ├── lib/decision-intelligence/engine/confidence-engine.ts
    │       ├── lib/decision-intelligence/engine/validation-engine.ts
    │       ├── lib/decision-intelligence/engine/explainability-engine.ts
    │       └── lib/decision-intelligence/evidence/evidence-collector.ts
    └── lib/decision-intelligence/types/index.ts
            └── (7 type files)
```

### 3.3 Dashboard Layout → Auth

```
app/dashboard/layout.tsx
    ├── lib/supabase/server.ts → supabase.auth.getUser()
    │       → redirect /login if no user
    ├── lib/prisma/client.ts → prisma.user.findUnique()
    │       → redirect /dashboard/onboarding if no Prisma user
    └── lib/supabase/middleware.ts (updateSession called inline)
```

---

## 4. Reverse Dependency Analysis

"What breaks if this module disappears?"

### lib/supabase/server.ts

**Breaks:**
- All authenticated API routes (intelligence, research, account, admin, users)
- Dashboard layout (auth check)
- Plan enforcement (reads user_plans via Supabase client)
- Account export, account delete
- Admin console

**Severity:** CRITICAL — removes authentication from the entire platform.

---

### lib/research/rate-limit.ts

**Breaks:**
- `/api/intelligence` — no rate limiting
- `/api/research/leads` — no rate limiting
- `/api/research/talent` — no rate limiting
- `/api/users/init` — no rate limiting
- `/api/demo/generate` — no rate limiting

**Severity:** HIGH — platform is open to abuse if removed. However, fail-open behavior means requests proceed rather than fail.

---

### lib/research/plan-enforcement.ts

**Breaks:**
- `/api/research/leads` — plan limits not enforced → free tier users get unlimited access
- `/api/research/talent` — same

**Severity:** HIGH — revenue and fair-usage enforcement disappears.

---

### lib/research/acquisition/research-service.ts

**Breaks:**
- Lead Finder (`/api/research/leads`)
- Talent Finder (`/api/research/talent`)

**Severity:** HIGH — both active research features stop working.

---

### lib/research/acquisition/search-provider.ts

**Breaks:**
- `research-service.ts` — pipeline cannot start without search results
- Lead Finder entirely

**Severity:** HIGH for Lead Finder. Talent Finder is unaffected (uses pure AI).

---

### services/legacy-ai-engine/orchestrator.ts

**Breaks:**
- `/api/intelligence` — Real Estate module stops working
- All 35 legacy report types

**Severity:** HIGH — Real Estate is the primary business module.

---

### lib/prisma/client.ts

**Breaks:**
- Dashboard layout (Prisma user check → all users are redirected to onboarding)
- `/api/users/init` (onboarding bootstrap fails)
- `/api/workspace` (workspace info unavailable)

**Severity:** HIGH — new users cannot onboard; all dashboard access blocked.

---

### lib/admin/auth.ts

**Breaks:**
- All `/api/admin/*` routes — admin check fails → all admin routes return 403
- Admin Console UI — non-functional

**Severity:** MEDIUM — only affects admin users.

---

### lib/decision-intelligence/engine/decision-engine.ts

**Breaks:**
- Currently nothing (engine is unintegrated)
- Future: all Decision Intelligence integration points

**Severity:** Currently NONE. After integration: CRITICAL.

---

### lib/supabase/admin.ts

**Breaks:**
- `/api/account/delete` — cannot cascade-delete via admin API
- All `/api/admin/*` routes — service role reads fail

**Severity:** MEDIUM — account deletion and admin console.

---

### Upstash Redis (infrastructure)

**Breaks (with fail-open behavior):**
- Rate limiting silently removed — all limits disabled
- Legacy AI engine cache disabled (still works; just slower)
- SerpAPI quota controls removed — all quota controls disabled

**Severity:** HIGH — security and cost controls silently disabled. No user-visible error.

---

### Supabase Auth (infrastructure)

**Breaks:**
- All authenticated routes
- Dashboard access
- Session management

**Severity:** CRITICAL — platform entirely offline for authenticated users.

---

### OpenAI API (infrastructure)

**Breaks:**
- Real Estate AI analysis
- Lead Finder AI analysis step
- Talent Finder (entirely)
- Demo AI report generation

**Severity:** HIGH — most intelligence features offline.

---

### SerpAPI (infrastructure)

**Breaks:**
- Lead Finder search step (hard fail)
- Talent Finder unaffected (pure AI)

**Severity:** HIGH for Lead Finder.

---

## 5. Dependency Health Summary

| Dependency | Type | Status | Fallback |
|---|---|---|---|
| Supabase project | Infrastructure | DELETED | None |
| Supabase auth | Auth | OFFLINE | None |
| Upstash Redis | Cache/Rate | Unknown | Fail-open |
| OpenAI API | AI | Unknown (key unset) | Cloudflare proxy (partial) |
| SerpAPI | Search | Unknown (key unset) | None |
| Prisma/PostgreSQL | ORM | OFFLINE (Supabase deleted) | None |
| Apollo.io | Enrichment | Unknown | No-op gracefully |
| Resend | Email | Key is empty string | No-op gracefully |
| AI Proxy (legacy engine) | Fallback | `halannews.com/api-proxy` (hardcoded) | None |
| AI Proxy (demo) | Fallback | `AI_PROXY_URL` (undocumented) | None |
| Vercel deployment | Hosting | Unknown — last deploy pre-deletion | Redeploy needed |

---

*Dependency graph produced 2026-07-21. Read-only assessment.*
