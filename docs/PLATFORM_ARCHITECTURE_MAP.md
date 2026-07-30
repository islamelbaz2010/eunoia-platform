# Platform Architecture Map

**Date:** 2026-07-21  
**Framework:** Next.js 16.2.6 (App Router, React 19, TypeScript 5.8)  
**Deployment:** Vercel — `intelligence.eunoiazones.com`

---

## 1. High-Level Component Map

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL EDGE                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Next.js App Router                        │ │
│  │                                                             │ │
│  │  PUBLIC ROUTES          AUTH ROUTES       DASHBOARD         │ │
│  │  /                      /login            /dashboard        │ │
│  │  /demo                  /signup           /dashboard/*      │ │
│  │  /market-intelligence   /forgot-password  /dashboard/admin  │ │
│  │  /privacy                                                   │ │
│  │  /terms                                                     │ │
│  │  /api/health                                                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │   Supabase   │  │  Prisma ORM  │  │ Upstash Redis│
   │  (primary)   │  │  (legacy)    │  │  (caching)   │
   │              │  │              │  │              │
   │ auth.users   │  │ User         │  │ Rate limits  │
   │ reports      │  │ Workspace    │  │ 24h cache    │
   │ research_req │  │ Report       │  │              │
   │ user_plans   │  │ ApiUsage     │  └──────────────┘
   │ demo_leads   │  │              │
   │ audit_log    │  └──────────────┘
   └──────────────┘
              │
   ┌──────────┴──────────┐
   ▼                     ▼
┌──────────┐      ┌──────────────────┐
│  OpenAI  │      │     SerpAPI      │
│ GPT-4o   │      │ (web search)     │
│  mini    │      └──────────────────┘
└──────────┘              │
                   ┌──────┴──────┐
                   ▼             ▼
            ┌──────────┐  ┌──────────┐
            │ Lead     │  │ Talent   │
            │ Finder   │  │ Finder   │
            └──────────┘  └──────────┘
```

---

## 2. Application Layer Architecture

### 2.1 Route Groups

```
app/
├── (auth)/                  # Auth group — public, no sidebar
│   ├── layout.tsx           # Auth layout (centered card)
│   ├── login/page.tsx       # Supabase signInWithPassword
│   ├── signup/page.tsx      # Supabase signUp
│   └── forgot-password/     # Supabase resetPasswordForEmail
│
├── dashboard/               # Protected — requires Supabase session + Prisma user
│   ├── layout.tsx           # Server component: auth check + Prisma check + sidebar
│   ├── page.tsx             # Home: usage + quota banner
│   ├── onboarding/page.tsx  # 2-step: workspace setup → product tour
│   ├── real-estate/page.tsx # Real estate feasibility form + results
│   ├── research/            # Research hub
│   │   ├── page.tsx         # Research hub home
│   │   ├── leads/page.tsx   # Lead Finder (SerpAPI)
│   │   └── talent/page.tsx  # Talent Finder (SerpAPI)
│   ├── reports/             # Report history
│   │   ├── page.tsx         # Server component wrapper
│   │   └── reports-client.tsx # Client: table with retry links
│   ├── analytics/           # Research activity stats
│   │   ├── page.tsx         # Server component
│   │   └── analytics-client.tsx
│   ├── settings/            # Account settings
│   │   ├── page.tsx         # Plan + usage + account actions
│   │   └── account-actions.tsx # Download My Data + Delete Account
│   ├── admin/               # Admin console (admin users only)
│   │   ├── page.tsx         # Server component wrapper
│   │   └── admin-console-client.tsx # User list + plan management
│   ├── error.tsx            # Error boundary (sanitized, no raw messages)
│   └── loading.tsx          # Loading state
│
├── demo/page.tsx            # Public demo landing with email form
├── market-intelligence/     # Public market intelligence landing
├── privacy/page.tsx         # Privacy policy (static)
├── terms/page.tsx           # Terms of service (static)
├── layout.tsx               # Root layout
└── page.tsx                 # Marketing landing page
```

### 2.2 API Routes

```
app/api/
├── health/route.ts              # GET — liveness check (no auth)
├── intelligence/route.ts        # POST — legacy AI engine (auth required)
├── workspace/route.ts           # GET — workspace info (auth required)
├── users/
│   └── init/route.ts            # POST — bootstrap Prisma user+workspace
├── auth/
│   └── callback/route.ts        # GET — Supabase OAuth callback handler
├── reports/
│   └── route.ts                 # GET/POST — report CRUD
├── research/
│   ├── route.ts                 # POST — research engine entry point
│   ├── leads/route.ts           # POST — SerpAPI lead search
│   └── talent/route.ts          # POST — SerpAPI talent search
├── account/
│   ├── export/route.ts          # GET — JSON data export
│   └── delete/route.ts          # DELETE — cascade account deletion
└── admin/
    ├── check/route.ts           # GET — admin identity check
    ├── users/route.ts           # GET — user list (admin only)
    └── users/[id]/plan/route.ts # PATCH — plan change (admin only)
```

---

## 3. Library Architecture

```
lib/
├── supabase/
│   ├── client.ts        # Browser Supabase client
│   ├── server.ts        # Server Supabase client (cookie-based)
│   ├── middleware.ts     # updateSession() helper (called from dashboard layout)
│   └── admin.ts         # Service-role admin client
│
├── prisma/
│   ├── client.ts        # Singleton Prisma client
│   ├── init-user.ts     # findOrCreate User+Workspace
│   └── generated/       # Prisma-generated types and client
│
├── admin/
│   ├── auth.ts          # isAdminUser() — checks ADMIN_EMAILS env var
│   └── audit.ts         # writeAuditLog() — best-effort audit log writer
│
├── research/
│   ├── rate-limit.ts    # checkRateLimit() — Upstash Redis 5 req/hr
│   ├── plan-enforcement.ts # checkPlanLimit() — monthly report limits
│   ├── acquisition/
│   │   ├── research-service.ts   # ResearchService orchestrator
│   │   ├── search-provider.ts    # SerpAPI adapter
│   │   └── ai-analysis.ts        # OpenAI analysis wrapper
│   └── types.ts
│
├── decision-intelligence/   # Complete library — NOT yet integrated
│   ├── types/               # 7 type definition files
│   ├── evidence/            # Collector + weighter
│   ├── engine/              # 5 engine files
│   ├── __tests__/           # 6 test files, 61 tests
│   └── index.ts             # Public barrel export
│
├── csv-export.ts          # Client-side blob download utility
└── utils.ts               # Shared utilities
```

---

## 4. Data Flow: Research Request

```
User → /dashboard/research/leads
         │
         ▼
[Client] POST /api/research/leads
         │
         ▼
[Server] checkRateLimit(userId)  ─── Redis ──► 5 req/hr window
         │
         ▼
[Server] checkPlanLimit(userId)  ─── Supabase user_plans ──► PLAN_LIMITS
         │
         ▼
[Server] SerpAPI search()  ─── SerpAPI web ──► raw results
         │
         ▼
[Server] AI analysis  ─── OpenAI GPT-4o-mini ──► enriched results
         │
         ▼
[Server] Save to Supabase research_requests table
         │
         ▼
[Client] Display results
```

---

## 5. Data Flow: Real Estate Analysis (Legacy Engine)

```
User → /dashboard/real-estate
         │
         ▼
[Client] POST /api/intelligence
         │
         ▼
[Server] checkRateLimit(userId)  ─── Redis
         │
         ▼
[Server] Check Redis cache (24h TTL)
         │ cache miss
         ▼
[Server] Legacy AI Orchestrator  ─── OpenAI GPT-4o-mini ──► analysis
         │
         ▼
[Server] Save report to Prisma (Report table)
         │
         ▼
[Client] Display structured report
```

---

## 6. Authentication Flow

```
User → /login
         │
         ▼
[Client] supabase.auth.signInWithPassword(email, password)
         │ success
         ▼
Supabase issues session cookie (httpOnly)
         │
         ▼
Redirect → /dashboard
         │
         ▼
[Server] dashboard/layout.tsx
         ├── createClient().auth.getUser()  ─── no user ──► /login
         │
         └── prisma.user.findUnique(id)
               ├── no user ──► /dashboard/onboarding
               └── user found ──► render dashboard
```

---

## 7. Plan Enforcement Architecture

```
PLAN_LIMITS (types/plan.types.ts)
  STARTER=20, PROFESSIONAL=100, AGENCY=300, ENTERPRISE=-1

                    ┌─────────────────────────────┐
                    │  Supabase: user_plans table  │
                    │  (RLS: auth.uid() = user_id) │
                    └──────────────┬──────────────┘
                                   │ read via server client
                                   ▼
                           checkPlanLimit(userId)
                           lib/research/plan-enforcement.ts
                                   │
                           compare usage vs PLAN_LIMITS
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
              ALLOW request               REJECT (402)
              continue pipeline           Upgrade CTA shown
```

---

## 8. Decision Intelligence Architecture (Library Only — Not Integrated)

```
DecisionEngineInput
        │
        ▼
┌───────────────────────────────────────────────────────┐
│                   decision-engine.ts                   │
│                                                        │
│  1. evaluateRules(rules, facts) per option             │
│     └─► rules-engine.ts                               │
│                                                        │
│  2. weightEvidence(items)                              │
│     └─► evidence-weighter.ts                          │
│                                                        │
│  3. computeConfidenceScore(input)                      │
│     └─► confidence-engine.ts                          │
│                                                        │
│  4. runValidationPipeline(args)                        │
│     └─► validation-engine.ts                          │
│                                                        │
│  5. generateExplainability(args)                       │
│     └─► explainability-engine.ts                      │
│                                                        │
│  6. Assemble Decision + UniversalDecisionReport        │
└───────────────────────────────────────────────────────┘
        │
        ▼
DecisionEngineResult {
  decision: Decision
  confidence: ConfidenceScore
  ruleResults: RuleEvaluationResult[]
  explainability: DecisionExplainability
  report: UniversalDecisionReport
}
```

---

## 9. External Service Dependencies

```
Service         | Env Var(s)                              | Required? | Fallback
----------------|-----------------------------------------|-----------|---------
Supabase        | NEXT_PUBLIC_SUPABASE_URL                | Yes       | Hard fail
                | NEXT_PUBLIC_SUPABASE_ANON_KEY           |           |
                | SUPABASE_SERVICE_ROLE_KEY               | Admin only|
PostgreSQL      | DATABASE_URL, DIRECT_URL                | Yes       | Hard fail
OpenAI          | OPENAI_API_KEY                          | Yes       | Hard fail
SerpAPI         | SERPAPI_API_KEY                         | Yes       | Hard fail
Upstash Redis   | UPSTASH_REDIS_REST_URL                  | Yes       | Hard fail
                | UPSTASH_REDIS_REST_TOKEN                |           |
Resend          | RESEND_API_KEY                          | No        | No-op
Apollo.io       | APOLLO_API_KEY                          | No        | No-op
```

---

*Architecture map produced 2026-07-21. Read-only assessment.*
