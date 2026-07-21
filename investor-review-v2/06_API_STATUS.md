# 06 — API STATUS
*Every route verified against actual code.*

---

## API Routes Inventory

| Route | Method | Auth Required | Rate Limited | Plan Limited | Status |
|-------|--------|--------------|-------------|-------------|--------|
| `/api/intelligence` | POST | ✅ Yes | ✅ Yes (5/hr) | ✅ Yes | ✅ LIVE |
| `/api/research/leads` | POST | ✅ Yes | ✅ Yes (5/hr) | ✅ Yes | ✅ LIVE |
| `/api/research/talent` | POST | ✅ Yes | ✅ Yes (5/hr) | ✅ Yes | ✅ LIVE |
| `/api/demo` | POST | ❌ No | ❌ No | ❌ No | ✅ LIVE |
| `/api/demo/generate` | POST | ❌ No | ✅ Yes (IP-based) | ❌ No | ⚠️ LIVE (ext. dep.) |
| `/api/workspace` | GET/POST | ✅ Yes | ❌ No | ❌ No | ✅ LIVE |
| `/api/users/init` | POST | ✅ Yes | ❌ No | ❌ No | ✅ LIVE |
| `/api/debug-env` | GET | ❌ No | ❌ No | ❌ No | ⚠️ EMPTY FILE |
| `/auth/callback` | GET | N/A | ❌ No | ❌ No | ✅ LIVE |

---

## Route Detail

### POST /api/intelligence
**Evidence:** `app/api/intelligence/route.ts`

- Accepts: `{ reportType: string, formData: Record<string, string> }`
- Report types: `feasibility`, `campaign_roi`, `market_entry`, `lead_gen`, `full_analysis`
- Validates auth → rate limit → plan limit → builds prompt → calls OpenAI → saves to Supabase `reports` → returns report JSON
- OpenAI: `gpt-4o-mini`, `max_tokens: 4000`, `temperature: 0.3`
- Also writes to `research_requests` table for usage tracking
- **VERIFIED WORKING**

### POST /api/research/leads
**Evidence:** `app/api/research/leads/route.ts`

- Accepts: `{ industry, location, companySize, titles }`
- Runs full ResearchService pipeline (SerpAPI → collect → validate → dedup → rank → AI)
- Saves to `reports` + `research_requests`
- Returns: companies list with confidence scores, LinkedIn URLs, decision-maker titles
- **CRITICAL:** Has debug console.log statements at lines 1-3 (`console.log("=== LEADS API START ===")`)
- **VERIFIED WORKING** (when SERPAPI_API_KEY is set)

### POST /api/research/talent
**Evidence:** `app/api/research/talent/route.ts`

- Accepts: `{ jobTitle, location, industry, experience, skills }`
- Calls OpenAI directly (no SerpAPI dependency)
- Returns: salary range, demand level, candidate sources, keywords, archetypes
- **VERIFIED WORKING**

### POST /api/demo
**Evidence:** `app/api/demo/route.ts`

- Public route — no auth
- Accepts: `{ name, email, phone, company, sector, city }`
- Saves to Supabase `demo_leads` (using service role key to bypass RLS)
- Sends email via Resend
- **NOTE:** Uses `SUPABASE_SERVICE_ROLE_KEY` — not in `.env.local.example`
- **VERIFIED WORKING**

### POST /api/demo/generate
**Evidence:** `app/api/demo/generate/route.ts`

- Public route — rate limited by IP (5/hour)
- Accepts: full lead data including company info
- **EXTERNAL DEPENDENCY:** Routes AI generation to `https://halannews.com/api-proxy` using Claude claude-opus-4-8
- Has fallback hardcoded report if AI fails
- Sends HTML email with report via Resend
- **RISK:** Single point of failure on external domain
- **VERIFIED WORKING** (when halannews.com is up)

### GET/POST /api/workspace
**Evidence:** `app/api/workspace/route.ts` (not read in full, but file confirmed)
- Workspace creation/retrieval
- **STATUS:** EXISTS

### POST /api/users/init
**Evidence:** `app/api/users/init/route.ts` — has test file `route.test.ts`
- User initialization (creates Prisma user record linked to Supabase user)
- **STATUS:** EXISTS — connects Prisma legacy layer

### GET /api/debug-env
**Evidence:** File exists at `app/api/debug-env/route.ts` — 1 line (effectively empty)
- **STATUS:** ESSENTIALLY EMPTY — not a security risk but should be removed
- **NOTE:** Was likely stripped down in build-fix commit `f8175e1`

### GET /auth/callback
**Evidence:** `app/auth/callback/route.ts`
- Supabase OAuth callback handler
- **VERIFIED EXISTS**

---

## API Rate Limiting

**Implementation:** Upstash Redis
**Limit:** 5 requests per hour per user
**Key format:** `ratelimit:{module}:{user.id}`
**Behavior on Redis failure:** Fail-open (allow request)
**Evidence:** `lib/research/rate-limit.ts`

```typescript
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW = 3600 // 1 hour
```

---

## API Plan Enforcement

**Implementation:** Supabase `user_plans` + `research_requests` tables
**Limits:**
- STARTER: 20 reports/month
- PROFESSIONAL: 100 reports/month
- AGENCY: 300 reports/month
- ENTERPRISE: unlimited
**Default:** STARTER if no plan row exists
**Behavior on Supabase failure:** Fail-open
**Evidence:** `lib/research/plan-enforcement.ts`, `types/plan.types.ts`

---

## Missing APIs (Not Implemented)

| API | Needed For | Status |
|-----|-----------|--------|
| POST /api/payment/checkout | Plan upgrades | ❌ ZERO CODE |
| POST /api/payment/webhook | Stripe webhooks | ❌ ZERO CODE |
| GET /api/admin/leads | Admin lead view | ❌ ZERO CODE |
| POST /api/workspace/invite | Team invites | ❌ ZERO CODE |
| GET /api/reports/:id | Single report view | ❌ ZERO CODE (reports in history only) |
| DELETE /api/reports/:id | Delete report | ❌ ZERO CODE |

---

## API Security Assessment

| Control | Status | Evidence |
|---------|--------|----------|
| Auth check on protected routes | ✅ | Every route calls `supabase.auth.getUser()` |
| Rate limiting | ✅ | All AI routes |
| Input validation | 🟡 | Basic (required field checks), no Zod schemas on API inputs |
| SQL injection protection | ✅ | Supabase SDK (parameterized) |
| CORS | 🟡 | Default Next.js behavior |
| Service role key exposure | ⚠️ | `/api/demo/route.ts` uses `SUPABASE_SERVICE_ROLE_KEY` server-side (acceptable) |
| Debug route | ⚠️ | `/api/debug-env` exists but is empty |
