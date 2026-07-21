# Tech Stack

## Frontend Stack

### Core Framework
- **Next.js** v16.2.6 - React framework with App Router
- **React** v19.0.0 - UI library
- **TypeScript** v5.8.3 - Type safety

### UI Components
- **Radix UI** - Headless UI components
  - @radix-ui/react-dialog v1.1.6
  - @radix-ui/react-dropdown-menu v2.1.6
  - @radix-ui/react-label v2.1.2
  - @radix-ui/react-progress v1.1.2
  - @radix-ui/react-scroll-area v1.2.3
  - @radix-ui/react-select v2.1.6
  - @radix-ui/react-separator v1.1.2
  - @radix-ui/react-slot v1.2.0
  - @radix-ui/react-switch v1.2.6
  - @radix-ui/react-tabs v1.1.3
  - @radix-ui/react-tooltip v1.2.3

### Styling
- **TailwindCSS** v4.1.4 - Utility-first CSS
- **@tailwindcss/postcss** v4.3.0 - PostCSS integration
- **tailwind-merge** v3.2.0 - Tailwind class merging
- **clsx** v2.1.1 - Conditional class names
- **class-variance-authority** v0.7.1 - Component variant management
- **tw-animate-css** v1.4.0 - Animation utilities

### Icons
- **Lucide React** v0.488.0 - Icon library

### Animations
- **Framer Motion** v12.40.0 - Animation library

### Internationalization
- **next-intl** v4.1.0 - i18n for Next.js

### Notifications
- **Sonner** v2.0.1 - Toast notifications

## Backend Stack

### Runtime
- **Node.js** (via Next.js serverless)
- **Next.js API Routes** - Serverless functions

### Database
- **Supabase** v2.49.4 - Primary database and auth
  - @supabase/supabase-js
  - @supabase/ssr v0.5.2
- **PostgreSQL** - Database engine (via Supabase)
- **Prisma** v6.19.3 - ORM (legacy, partially used)
  - @prisma/client v6.6.0

### Caching & Rate Limiting
- **Upstash Redis** v1.34.9 - Redis-compatible cache
  - @upstash/ratelimit v2.0.5

### Email
- **Resend** v6.12.4 - Email delivery

## AI/ML Stack

### AI Models
- **OpenAI** v4.96.2 - AI model provider
  - Primary model: GPT-4o-mini
  - Fallback: GPT-4o (configurable)

### AI SDK
- **Vercel AI SDK** v4.3.16 - AI integration utilities

### Custom AI Infrastructure
- **Legacy AI Engine** (services/legacy-ai-engine/)
  - Provider abstraction layer
  - Prompt templates (30 report types)
  - Orchestrator for report generation
  - Currently retired but preserved for future use

- **Research Core Engine** (lib/research/acquisition/)
  - Multi-stage research pipeline
  - Search → Collect → Normalize → Rank → AI Analysis
  - Evidence-based approach

## Search & Data Sources

### Search Provider
- **SerpAPI** - Google search results API
  - Replaces abandoned Google Custom Search
  - Daily quota management
  - Per-user fair-share enforcement

### Enrichment (Optional)
- **Apollo.io** - Company data enrichment
  - Optional integration
  - No-op when API key not configured
  - Used for company size verification

## Infrastructure

### Hosting
- **Vercel** - Deployment platform
  - Serverless functions
  - Edge network
  - Automatic builds
  - Environment variable management

### Build Tools
- **TypeScript Compiler** (tsc)
- **ESLint** v9.24.0 - Linting
  - eslint-config-next v15.3.0
- **PostCSS** - CSS processing

### Testing
- **Vitest** v4.1.9 - Unit testing framework
- Limited test coverage visible in repository

## Development Tools

### Package Management
- **npm** - Package manager
- **package-lock.json** - Dependency lock file

### Version Control
- **Git** - Version control
- **GitHub** - Repository hosting

### Code Quality
- **TypeScript** - Static typing
- **ESLint** - Code linting
- **Prettier** (implied by config) - Code formatting

## Environment Configuration

### Required Environment Variables
```
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database (required)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# AI (required)
OPENAI_API_KEY=sk-...
```

### Optional Environment Variables
```
# Redis (optional — rate limiting and caching)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Cloudflare Worker fallback (optional)
CLOUDFLARE_WORKER_URL=https://halannews.com/api-proxy

# SerpAPI (optional — required for Research Core Engine)
SERPAPI_API_KEY=your-serpapi-key
SEARCH_DAILY_QUOTA=150
SEARCH_DAILY_QUOTA_PER_USER=30

# Apollo.io (optional — enrichment)
APOLLO_API_KEY=your-apollo-key

# Email (optional)
RESEND_API_KEY=your-resend-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Architecture Patterns

### Frontend Architecture
- **App Router** - Next.js 13+ routing
- **Server Components** - React Server Components where applicable
- **Client Components** - Interactive UI components
- **API Routes** - Serverless backend functions

### Backend Architecture
- **Serverless** - Vercel serverless functions
- **REST API** - Standard REST endpoints
- **Service Layer** - Business logic separation
- **Repository Pattern** - Data access abstraction

### Data Layer
- **Dual Database Strategy** (Technical Debt)
  - Supabase: Primary production database
  - Prisma: Legacy workspace management
- **Row Level Security (RLS)** - Supabase security
- **Connection Pooling** - PgBouncer via Supabase

### AI Architecture
- **Provider Pattern** - Swappable AI providers
- **Pipeline Pattern** - Multi-stage research pipeline
- **Cache-First** - Result caching to reduce API costs
- **Fallback Pattern** - Graceful degradation on AI failures

## Security Stack

### Authentication
- **Supabase Auth** - User authentication
- **JWT Tokens** - Session management
- **Row Level Security (RLS)** - Database-level security

### API Security
- **Rate Limiting** - Upstash Redis-based rate limiting
- **Plan Enforcement** - Usage-based limits
- **Environment Variables** - Secret management
- **Service Role Keys** - Admin operations bypass RLS

### Data Security
- **Encryption in Transit** - HTTPS/TLS
- **Encryption at Rest** - Supabase managed
- **User Isolation** - Per-user data segregation via RLS

## Performance Optimization

### Caching Strategy
- **Redis Caching** - Research result caching
- **Input Hash Caching** - Cache by query parameters
- **TTL-based Expiration** - Configurable cache lifetime

### API Optimization
- **Request Deduplication** - Cache hits avoid API calls
- **Batch Operations** - Where applicable
- **Lazy Loading** - AI provider initialized only when needed

### Frontend Optimization
- **Code Splitting** - Next.js automatic
- **Image Optimization** - Next.js Image component
- **Font Optimization** - Next.js font optimization

## Monitoring & Observability

### Current State
- **Console Logging** - Basic error logging
- **Error Tracking** - Try-catch blocks with logging

### Missing (Technical Debt)
- **Application Performance Monitoring (APM)** - Not implemented
- **Uptime Monitoring** - Not implemented
- **Structured Logging** - Not implemented
- **Error Tracking Service** (e.g., Sentry) - Not implemented
- **Analytics** - Not implemented

## Deployment Pipeline

### Build Process
```bash
npm install
npx prisma generate
npm run build
```

### Deployment
- **Vercel** - Automatic deployment on git push
- **Environment Variables** - Managed in Vercel dashboard
- **Build Command** - Specified in vercel.json

### CI/CD
- **GitHub Integration** - Vercel connected to GitHub
- **Automatic Builds** - On push to main branch
- **Preview Deployments** - On pull requests (implied)

## Tech Stack Maturity Assessment

### Production-Ready Components
- Next.js 16 + React 19 ✅
- TypeScript ✅
- Supabase (auth + database) ✅
- TailwindCSS + Radix UI ✅
- OpenAI integration ✅
- SerpAPI integration ✅
- Upstash Redis ✅
- Vercel deployment ✅

### Areas Requiring Attention
- Prisma legacy (dual database complexity) ⚠️
- Testing coverage (limited) ⚠️
- Monitoring/observability (missing) ⚠️
- CI/CD pipeline (basic only) ⚠️
- Documentation (partial) ⚠️

## Tech Stack Summary

The Eunoia platform uses a modern, production-ready tech stack with Next.js 16, React 19, TypeScript, and Supabase as the foundation. The AI integration uses OpenAI GPT-4o-mini, and search is powered by SerpAPI. The architecture follows modern patterns with serverless deployment on Vercel.

The primary technical debt is the dual database strategy (Supabase + Prisma legacy) and limited monitoring/observability. Overall, the tech stack is solid for a production SaaS application.
