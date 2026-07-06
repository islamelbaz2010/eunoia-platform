# API Inventory

> Evidence-based audit of every route in `app/api/`.

---

## Route Map

| Route | Method | Auth Required | Rate Limited | Production Ready | Status |
|---|---|---|---|---|---|
| `POST /api/demo` | POST | ❌ | ❌ | ⚠️ | Active — lead capture |
| `POST /api/demo/generate` | POST | ❌ | ✅ IP (5/hr) | ⚠️ | Active — unsanitized input |
| `POST /api/intelligence` | POST | ✅ | ✅ User + Plan | ⚠️ | Active — external AI proxy |
| `POST /api/research/leads` | POST | ✅ | ✅ User + Quota | ✅ | Active — best-implemented route |
| `POST /api/research/talent` | POST | ✅ | ✅ User + Plan | ⚠️ | Active — external AI proxy |
| `POST /api/users/init` | POST | ✅ | ✅ User (5/hr) | ✅ | Active |
| `GET /api/workspace` | GET | ✅ | ❌ | 🗑️ | **DEAD — zero callers** |
| `GET /auth/callback` | GET | N/A | N/A | ✅ | Active — OAuth code exchange |

---

## Detailed Route Audit

---

### `POST /api/demo`
**File:** `app/api/demo/route.ts`  
**Purpose:** Lead capture for demo funnel — saves contact info, sends confirmation email

| Property | Value |
|---|---|
| Authentication | ❌ None required |
| Input validation | ✅ Checks `name`, `email`, `phone` required |
| Input sanitization | ✅ `.trim()` + `.toLowerCase()` on all fields |
| Authorization | N/A |
| Rate limiting | ❌ None |
| Output validation | N/A |
| Error handling | ✅ Returns structured errors; DB failure doesn't block email |
| Logging | ✅ Console logs on Supabase and Resend errors |
| Security concern | ⚠️ No rate limit — can be called unlimited times to flood Resend/Supabase |
| Database | Supabase service-role insert to `demo_leads` |
| Email | Resend confirmation email in Arabic |
| **Assessment** | Functionally complete; add rate limiting |

---

### `POST /api/demo/generate`
**File:** `app/api/demo/generate/route.ts`  
**Purpose:** AI-generated demo intelligence report for anonymous users

| Property | Value |
|---|---|
| Authentication | ❌ None required |
| Input validation | ✅ Required fields checked (`company`, `sector`, `city`) |
| Input sanitization | ❌ **MISSING** — user input interpolated into AI prompt and HTML email verbatim |
| Authorization | N/A |
| Rate limiting | ✅ IP-based via Redis (5/hr — `checkRateLimit(ip)`) |
| AI provider | ❌ `halannews.com/api-proxy` — external third-party |
| Fallback | ✅ Falls back to `CLOUDFLARE_WORKER_URL` env var if set |
| Output | JSON parsed from AI response; HTML email via Resend |
| Error handling | ✅ Returns structured errors |
| Logging | ✅ Console logs errors |
| **Critical finding** | **SEC-06**: unsanitized `company`/`city`/`competitors`/`website` → AI prompt + HTML email |
| **Critical finding** | **SEC-02**: all AI inference routes through `halannews.com` |
| **Assessment** | Needs sanitization and AI proxy migration |

---

### `POST /api/intelligence`
**File:** `app/api/intelligence/route.ts` (1051 lines)  
**Purpose:** Real Estate Intelligence report generation (feasibility, launch, campaign)

| Property | Value |
|---|---|
| Authentication | ✅ `supabase.auth.getUser()` |
| Input validation | ✅ Report type and required fields validated |
| Input sanitization | ⚠️ Partial — numbers parsed, strings pass through |
| Authorization | ✅ Plan limit check via `checkPlanLimit()` |
| Rate limiting | ✅ Per-user 5/hr via `checkRateLimit()` |
| AI provider | ❌ `CLOUDFLARE_WORKER_URL` (`halannews.com/api-proxy`) |
| Pre-AI computation | ✅ Cashflow engine runs real math before AI prompt |
| Output | JSON parsed, saved to Supabase `reports` table |
| Error handling | ✅ Structured errors returned |
| Caching | ✅ Redis-based (24h) for identical inputs |
| Architecture concern | 1051-line monolith — all logic in single route handler |
| **Assessment** | Functionally complete; AI proxy migration required |

---

### `POST /api/research/leads`
**File:** `app/api/research/leads/route.ts`  
**Purpose:** B2B lead finder using SerpAPI + Research Core Engine

| Property | Value |
|---|---|
| Authentication | ✅ `supabase.auth.getUser()` |
| Input validation | ✅ All 4 fields required; `?.trim()` pattern |
| Input sanitization | ✅ Trimmed; passed to query builder (not interpolated into SQL/HTML) |
| Authorization | ✅ Plan limit check; user ID derived from session |
| Rate limiting | ✅ Per-user 5/hr + global SerpAPI budget + per-user daily quota |
| AI provider | ✅ OpenAI direct (`OPENAI_API_KEY`) |
| Output validation | ✅ `ResearchResultSchema.safeParse()` on cache hits |
| Error handling | ✅ `SearchProviderError` typed; structured responses |
| Logging | ✅ Errors logged |
| Caching | ✅ 24h Redis by query hash |
| Result persistence | ✅ Saved to `research_requests` + `reports` tables |
| Type safety | ⚠️ `supabase as any` cast — stale types |
| Untyped import | ⚠️ `@core/data/sectors.data` excluded from tsconfig |
| **Assessment** | Best-implemented API route in the codebase |

---

### `POST /api/research/talent`
**File:** `app/api/research/talent/route.ts`  
**Purpose:** Talent market analysis (salary, hiring demand, candidate archetypes)

| Property | Value |
|---|---|
| Authentication | ✅ `supabase.auth.getUser()` |
| Input validation | ✅ All 5 fields required; `?.trim()` |
| Input sanitization | ✅ Trimmed; passed to prompt builder |
| Authorization | ✅ Plan limit check |
| Rate limiting | ✅ Per-user 5/hr |
| AI provider | ❌ `CLOUDFLARE_WORKER_URL` (halannews.com proxy) |
| Prompt quality | ✅ Explicit prohibition on generating fake individuals |
| Output | JSON parsed from AI response; saved to Supabase |
| Error handling | ✅ |
| Type safety | ⚠️ `supabase as any` cast |
| **Assessment** | Functionally complete; AI proxy migration required |

---

### `POST /api/users/init`
**File:** `app/api/users/init/route.ts`  
**Purpose:** Bootstrap Prisma User + Workspace for authenticated user

| Property | Value |
|---|---|
| Authentication | ✅ `supabase.auth.getUser()` — identity from session only |
| Input validation | N/A — optional `workspaceName` from body |
| Authorization | ✅ User can only create their own record |
| Rate limiting | ✅ Per-user 5/hr |
| IDOR risk | ✅ None — ID/email derived from session, not request body |
| Idempotency | ✅ `findUnique` before create |
| Atomicity | ✅ `prisma.$transaction` |
| Error handling | ✅ |
| **Assessment** | Well-implemented |

---

### `GET /api/workspace`
**File:** `app/api/workspace/route.ts`  
**Purpose:** Fetch workspace + members for the authenticated user

| Property | Value |
|---|---|
| Authentication | ✅ `supabase.auth.getUser()` |
| Callers | ❌ **ZERO — `hooks/use-workspace.ts` is the only caller, and it is dead code** |
| Rate limiting | ❌ None |
| Security concern | `user.email!` non-null assertion (email may be absent for OAuth users) |
| Over-fetching | Fetches full member list with all fields for an endpoint nothing uses |
| NFT impact | One of the 4 routes with 24MB bundle bloat |
| **Assessment** | **Delete this route** |

---

### `GET /auth/callback`
**File:** `app/auth/callback/route.ts`  
**Purpose:** OAuth/email-confirmation code exchange

| Property | Value |
|---|---|
| Authentication | N/A (OAuth flow) |
| Input validation | ✅ Checks `code` param present |
| PKCE security | ✅ `supabase.auth.exchangeCodeForSession(code)` handles securely |
| Post-auth action | ✅ Calls `initUserFromSupabase()` directly (no self-fetch) |
| Error handling | ✅ Redirects to `/login?error=auth_callback_failed` on failure |
| **Assessment** | Correctly implemented |

---

## Missing APIs (Blocked Features)

| Missing Endpoint | Blocks |
|---|---|
| `POST /api/billing/create-checkout` | Stripe checkout session |
| `POST /api/billing/webhook` | Supabase plan assignment from Stripe events |
| `GET /api/user/plan` | Settings page plan display |
| `POST /api/workspace/invite` | Team member invitation |
| `DELETE /api/reports/[id]` | Report deletion from history |
| `GET /api/admin/users` | Admin user management |
| `POST /api/auth/password-change` | Password change from settings |
