# Architecture

## System Architecture Overview

Eunoia Platform is a modern SaaS application built on Next.js 16 with a serverless architecture deployed on Vercel. The system follows a modular design with clear separation between frontend, backend, AI services, and data layers.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Next.js    │  │   React 19   │  │  TailwindCSS  │           │
│  │   App Router │  │  Components  │  │   Radix UI    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer (Vercel)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ /api/research│  │ /api/intel-  │  │ /api/workspace│           │
│  │   /leads     │  │   ligence    │  │   /users      │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Service Layer                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Research Core│  │  Legacy AI   │  │  Plan Enforce│           │
│  │    Engine    │  │    Engine    │  │     ment     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   External Services                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   OpenAI     │  │   SerpAPI    │  │  Apollo.io    │           │
│  │  (GPT-4o)    │  │  (Google)    │  │  (optional)  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Upstash     │  │   Resend     │  │   Supabase   │           │
│  │   Redis      │  │   Email      │  │   Auth/DB    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Directory Structure
```
app/
├── (auth)/              # Authentication routes
├── api/                 # API routes
│   ├── research/        # Research endpoints
│   ├── intelligence/    # Real estate intelligence
│   ├── users/           # User management
│   └── workspace/       # Workspace management
├── dashboard/           # Dashboard pages
│   ├── research/        # Research modules
│   ├── real-estate/     # Real estate module
│   ├── analytics/       # Market intelligence
│   ├── reports/         # Report history
│   └── settings/        # Settings
├── auth/                # Auth callback
└── page.tsx             # Landing page
```

### Component Architecture
- **Server Components** - Data fetching and server-side rendering
- **Client Components** - Interactive UI with useState/useEffect
- **Shared Components** - Reusable UI in components/
- **Layout Components** - Page layouts with Shell component

### State Management
- **React State** - Local component state
- **Server State** - Fetched via API routes
- **No Global State** - No Redux/Zustand (simpler architecture)

## Backend Architecture

### API Routes (Serverless Functions)

#### Research API
```
POST /api/research/leads
POST /api/research/talent
```
- Handles research module requests
- Validates plan limits and rate limits
- Orchestrates Research Core Engine
- Saves results to Supabase

#### Intelligence API
```
POST /api/intelligence
```
- Handles real estate intelligence requests
- Runs cashflow calculations
- AI analysis for feasibility/ROI
- Saves results to Supabase

#### User/Workspace API
```
GET /api/workspace
POST /api/users/init
```
- Workspace management
- User initialization
- Prisma-based (legacy)

#### Demo API
```
POST /api/demo
POST /api/demo/generate
```
- Demo lead capture
- Email notifications via Resend

### Service Layer Architecture

#### Research Core Engine
**Location:** `lib/research/acquisition/`

**Pipeline Stages:**
1. **Search** (search-provider.ts)
   - SerpAPI integration
   - Quota enforcement
   - Site restrictions

2. **Collect** (source-collector.ts)
   - HTTP fetch
   - Parked domain detection
   - Broken page detection

3. **Normalize** (normalizer.ts)
   - Domain extraction
   - Text cleaning
   - Sector/city matching

4. **Validate** (company-validation.ts)
   - Source classification
   - Validation scoring

5. **Deduplicate** (dedup.ts)
   - Domain-based deduplication
   - Fuzzy matching

6. **Rank** (ranker.ts)
   - Relevance scoring
   - Sector/city/size hints
   - Confidence calculation

7. **Enrich** (apollo-adapter.ts)
   - Apollo.io integration (optional)
   - Company size verification

8. **AI Analysis** (ai-analysis.ts)
   - OpenAI summarization
   - Closed-list approach (no invention)
   - Fallback to raw text

**Key Design Pattern:**
- Cache-first by input hash
- Graceful degradation
- Evidence-based only

#### Legacy AI Engine
**Location:** `services/legacy-ai-engine/`

**Status:** Retired but preserved

**Components:**
- Provider abstraction (OpenAI)
- Prompt templates (30 report types)
- Orchestrator for report generation

**Future Use:** Competitor Intelligence, Supplier Intelligence modules

#### Plan Enforcement
**Location:** `lib/research/plan-enforcement.ts`

**Functionality:**
- Monthly limit checking
- Per-user usage tracking
- Plan tier validation
- Fair-use enforcement for Enterprise

**Data Source:** Supabase user_plans table

#### Rate Limiting
**Location:** `lib/research/rate-limit.ts`

**Functionality:**
- Per-user rate limits
- Configurable windows
- Redis-based storage

**Data Source:** Upstash Redis

## Data Layer Architecture

### Dual Database Strategy (Technical Debt)

#### Supabase (Primary - Production)
**Purpose:** User auth, reports, research requests, plan enforcement

**Tables:**
- `auth.users` - User authentication (Supabase managed)
- `reports` - Report storage
- `research_requests` - Research request tracking
- `user_plans` - Plan assignment
- `demo_leads` - Demo lead capture

**Security:** Row Level Security (RLS) enabled

**Connection:** Direct via @supabase/supabase-js

#### Prisma (Legacy - Partial)
**Purpose:** Workspace and user management (legacy)

**Models:**
- User
- Workspace
- Report (legacy, marked as LEGACY in schema)
- ApiUsage (legacy, marked as LEGACY in schema)

**Status:** Partially implemented, not fully integrated with live routes

**Connection:** PostgreSQL via DATABASE_URL

**Technical Debt:** Reconciliation needed (see MASTER_EXECUTION_PLAN.md)

### Data Flow

#### Research Request Flow
```
User Input
    ↓
API Route (/api/research/leads)
    ↓
Rate Limit Check (Redis)
    ↓
Plan Limit Check (Supabase)
    ↓
Create research_requests row (Supabase)
    ↓
Research Core Engine Pipeline
    ↓
Search (SerpAPI) → Collect → Normalize → Validate → Dedup → Rank → Enrich → AI Analysis
    ↓
Create reports row (Supabase)
    ↓
Update research_requests status (Supabase)
    ↓
Return results to client
```

#### Authentication Flow
```
User Sign/Login
    ↓
Supabase Auth
    ↓
JWT Token Issued
    ↓
Client stores token
    ↓
API routes validate token
    ↓
RLS enforces user isolation
```

## AI Architecture

### Provider Pattern
**Interface:** `services/legacy-ai-engine/providers/base.provider`

**Implementation:** `OpenAIProvider`

**Benefits:**
- Swappable AI providers
- Consistent interface
- Cost estimation
- Stream support

### Research Core Engine AI Integration
**Location:** `lib/research/acquisition/ai-analysis.ts`

**Approach:**
- **Closed-list summarization** - AI cannot add/remove items
- **Fallback to raw text** - If AI fails, use collected excerpt
- **Evidence-only** - AI summarizes, never invents
- **Cost optimization** - Cache hits avoid AI calls

### Legacy AI Engine Integration
**Location:** `services/legacy-ai-engine/`

**Components:**
- `orchestrator.ts` - Report generation pipeline
- `prompt-builder.ts` - Prompt assembly
- `prompts/*.prompt.ts` - 30 report type prompts

**Status:** Retired but preserved for future modules

## Caching Architecture

### Redis Caching
**Provider:** Upstash Redis

**Cache Keys:**
- `research:acquisition:{hash}` - Research results
- `ratelimit:research:{module}:{userId}` - Rate limits
- `quota:search:daily` - Daily search quota
- `quota:search:user:{userId}` - Per-user quota

**TTL Strategy:**
- Research results: 24 hours (configurable)
- Rate limits: Reset per window
- Quotas: Daily reset

**Cache Invalidation:**
- Time-based (TTL)
- No manual invalidation (technical debt)

## Security Architecture

### Authentication
- **Supabase Auth** - OAuth, email/password
- **JWT Tokens** - Session management
- **Middleware** - Route protection

### Authorization
- **Row Level Security (RLS)** - Database-level
- **Plan Enforcement** - Usage-based limits
- **Rate Limiting** - API protection

### Data Security
- **User Isolation** - RLS policies
- **Service Role Keys** - Admin operations
- **Environment Variables** - Secret management

## Deployment Architecture

### Hosting
- **Vercel** - Serverless platform
- **Edge Network** - Global CDN
- **Automatic Scaling** - Serverless functions

### Build Process
```bash
npm install
npx prisma generate
npm run build
```

### Environment Management
- **Vercel Environment Variables** - Secret management
- **.env.example** - Template
- **.env.local** - Local development

## Integration Architecture

### External APIs

#### OpenAI
- **Purpose:** AI analysis
- **Model:** GPT-4o-mini
- **Cost:** Per-token billing
- **Fallback:** Graceful degradation

#### SerpAPI
- **Purpose:** Google search results
- **Quota:** Daily limit (150 default)
- **Fair-share:** Per-user sub-quota (30 default)
- **Fallback:** Error on quota exhaustion

#### Apollo.io (Optional)
- **Purpose:** Company enrichment
- **Required:** No - graceful no-op
- **Usage:** Company size verification

#### Upstash Redis
- **Purpose:** Caching and rate limiting
- **Connection:** REST API
- **Reliability:** Managed service

#### Resend
- **Purpose:** Email notifications
- **Usage:** Demo lead capture
- **Required:** No - graceful degradation

## Architecture Strengths

1. **Modular Design** - Clear separation of concerns
2. **Serverless** - Automatic scaling, no server management
3. **Evidence-Based AI** - Closed-list approach prevents hallucinations
4. **Cache-First** - Cost optimization via Redis
5. **Graceful Degradation** - Fallbacks at every integration point
6. **RLS Security** - Database-level user isolation
7. **Provider Pattern** - Swappable AI/search providers

## Architecture Weaknesses (Technical Debt)

1. **Dual Database** - Supabase + Prisma complexity
2. **Limited Monitoring** - No APM, structured logging
3. **No CI/CD Pipeline** - Basic Vercel integration only
4. **Limited Testing** - Minimal test coverage
5. **Manual Plan Assignment** - No self-service upgrades
6. **No Billing Integration** - Commercial infrastructure missing
7. **Legacy Code** - Retired AI engine not removed

## Scalability Considerations

### Current Architecture Supports
- **Horizontal Scaling** - Vercel serverless auto-scales
- **Database Scaling** - Supabase managed PostgreSQL
- **Cache Scaling** - Upstash Redis managed
- **API Rate Limiting** - Protects against abuse

### Potential Bottlenecks
- **SerpAPI Quota** - Daily search limit (150 default)
- **OpenAI API** - Rate limits and costs
- **Database Connections** - Connection pooling via PgBouncer
- **Cold Starts** - Serverless function cold starts

### Enterprise Scaling Requirements
- **Higher Quotas** - Custom SerpAPI/OpenAI tiers
- **Dedicated Infrastructure** - Move off Vercel serverless
- **Advanced Caching** - CDN, database read replicas
- **Load Balancing** - Application-level load balancing
- **Monitoring** - APM, distributed tracing

## Architecture Summary

Eunoia Platform follows modern SaaS architecture patterns with Next.js, serverless functions, and managed services. The Research Core Engine demonstrates sophisticated pipeline design with evidence-based AI integration. The primary architectural debt is the dual database strategy and limited observability. The architecture is production-ready for current scale but would require enhancements for enterprise-level scaling.
