# 07 — Architecture

**Evidence basis:** All source files, config files, SQL schemas, dependency graph.

---

## System Architecture

```
Browser
  │
  ├─ Next.js App Router (Vercel Fluid Compute)
  │    ├─ /app/(auth)/*          — Login, Signup, Forgot Password
  │    ├─ /app/dashboard/*       — Protected dashboard pages
  │    ├─ /app/api/*             — API routes (serverless functions)
  │    └─ /app/page.tsx          — Public landing page
  │
  ├─ Middleware (lib/supabase/middleware.ts)
  │    └─ Session refresh + route protection
  │
  └─ Static assets via Vercel CDN
  
API Routes
  ├─ /api/intelligence           — Real Estate Intelligence Engine (GPT-4o-mini)
  ├─ /api/research/leads         — Lead Finder (SerpAPI + GPT-4o-mini + Apollo)
  ├─ /api/research/talent        — Talent Finder (GPT-4o-mini)
  ├─ /api/workspace              — Workspace info (Prisma)
  ├─ /api/users/init             — Prisma user bootstrap (called post-signup)
  ├─ /api/demo                   — Demo mode (no auth required)
  └─ /api/debug-env              — [SHOULD BE DELETED]

External Services
  ├─ Supabase (PostgreSQL + Auth + RLS)
  │    Tables: auth.users, reports, research_requests, user_plans, demo_leads
  ├─ Prisma (schema management + Workspace/User read)
  │    Tables: User, Workspace, Report (LEGACY), ApiUsage (LEGACY)
  ├─ Upstash Redis (rate limiting + 24h research cache)
  ├─ OpenAI GPT-4o-mini (AI narrative generation)
  ├─ SerpAPI (Google Search for Lead Finder)
  └─ Apollo.io (optional company enrichment)
```

---

## Key Architectural Decisions

### Decision 1 — Dual Database Reality

The platform has two parallel data stores that are **not connected**:

**Prisma (PostgreSQL via Supabase):**
- Schema: `User`, `Workspace`, `Report` (LEGACY), `ApiUsage` (LEGACY)
- Used by: `/api/workspace`, `/api/users/init`
- Status: The `Report` and `ApiUsage` models are explicitly marked LEGACY in schema comments. They are never written to by any active route.

**Supabase Client (same PostgreSQL, different tables, direct SQL):**
- Tables: `reports`, `research_requests`, `user_plans`, `demo_leads`
- Used by: all active research API routes
- Access method: `@supabase/ssr` with RLS-enforcing cookies

**Implication:** The platform has two separate concepts of a "report" (`prisma.Report` vs Supabase `reports` table) and two separate concepts of a "user" (Prisma `User` vs `auth.users`). The Prisma `User.workspaceId` and workspace membership are not synchronized with the Supabase `user_plans` plan enforcement. A user can have a `PROFESSIONAL` plan in Supabase but a `STARTER` workspace in Prisma.

**Evidence:** `prisma/schema.prisma:37–42` comments confirm LEGACY status of Prisma Report model.

---

### Decision 2 — Deterministic Numbers, AI Narrative

The Real Estate Intelligence Engine pre-calculates all financial numbers with a local TypeScript cashflow engine, then injects those numbers into the GPT-4o-mini prompt with explicit instructions not to recalculate. This prevents hallucination of financial data while still using AI for Arabic narrative generation.

**Evidence:** `app/api/intelligence/route.ts:462–465` (feasibility prompt): *"The cashflow has already been CALCULATED. Your job is to INTERPRET and EXPLAIN — do NOT recalculate numbers."*

**Assessment:** Excellent architectural decision. Correctly separates deterministic computation from natural language generation.

---

### Decision 3 — Research Pipeline Architecture

The Lead Finder uses a multi-stage pipeline:

```
SerpAPI Search
     │
     ▼
Source Collector (HTTP GET each URL)
     │
     ▼
Normalizer (extract company name, domain, description)
     │
     ▼
Company Validation (filter noise)
     │
     ▼
Deduplication (domain-level)
     │
     ▼
Company Expansion (mine directory pages for additional domains)
     │
     ▼
Source Quality (parked domain, broken page detection)
     │
     ▼
Ranker (sector/city/size hint scoring)
     │
     ▼
Apollo Enrichment (optional, headcount, LinkedIn)
     │
     ▼
AI Analysis (GPT-4o-mini summarizes each source)
     │
     ▼
Redis Cache (24h, keyed by query hash)
```

**Evidence:** `lib/research/acquisition/research-service.ts:158–223`

**Assessment:** Mature pipeline design. The stage separation allows individual components to be unit-tested (and they are — 9 test files). The cache correctly excludes `userId` from the hash so cross-user caching works correctly.

---

### Decision 4 — Module Aliases

Three TypeScript path aliases are defined in `next.config.ts` (implicitly via tsconfig) and `vitest.config.ts`:

| Alias | Resolves to |
|---|---|
| `@/` | Repository root |
| `@core/` | `./core/` |
| `@services/` | `./services/` |

**Finding:** The `@core/` and `@services/` aliases are defined only in `vitest.config.ts`. They need to be in `tsconfig.json` as `paths` entries for the production build to resolve them. If they work in production, it is either because `next.config.ts` handles them (not verified in the file) or because Next.js resolves them at build time differently. This is a potential build fragility.

**Verification needed:** Check `tsconfig.json` for `compilerOptions.paths`.

---

### Decision 5 — Legacy AI Engine (Not Wired)

`services/legacy-ai-engine/` contains:
- `orchestrator.ts` — the original AI report engine
- `providers/openai.provider.ts` — OpenAI wrapper
- `prompts/` — 30+ specialized prompt files (competitor, pricing, campaign, CLV, etc.)

**None of these files are imported by any active API route.** The legacy engine was the original product architecture and has been superseded by the new inline prompt builders in `app/api/intelligence/route.ts`.

**Evidence:** The `OpenAIProvider` from `services/legacy-ai-engine/providers/openai.provider.ts` IS imported by `lib/research/acquisition/research-service.ts` for the AI Analysis step in the Lead Finder pipeline. So the provider class is reused; the orchestrator and all prompt files are dead code.

---

## Architecture Risks

| Risk | Severity |
|---|---|
| Dual schema divergence (Prisma vs Supabase) | HIGH |
| `@core/` alias may not be in tsconfig paths | MEDIUM |
| Legacy engine (~40 files) never reachable by production routes | LOW (cleanup debt) |
| No queue/worker for long-running operations | MEDIUM (Lead Finder can time out on slow sources) |
| All research runs synchronously in serverless function | MEDIUM (Vercel function timeout applies) |
