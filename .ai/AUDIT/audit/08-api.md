# 08 — API

**Evidence basis:** All API route files inspected individually.

---

## API Route Inventory

| Route | Method | Auth Required | Rate Limited | Plan Limited |
|---|---|---|---|---|
| `/api/intelligence` | POST | ✅ | ✅ | ✅ |
| `/api/research/leads` | POST | ✅ | ✅ | ✅ |
| `/api/research/talent` | POST | ✅ | ✅ | ✅ |
| `/api/workspace` | GET | ✅ | ❌ | ❌ |
| `/api/users/init` | POST | ✅ | ✅ | ❌ |
| `/api/demo` | POST | ❌ | ❌ | ❌ |
| `/api/demo/generate` | POST | ❌ | ❌ | ❌ |
| `/api/debug-env` | ANY | ❌ | ❌ | ❌ |
| `/auth/callback` | GET | N/A | ❌ | ❌ |

---

## Route-by-Route Analysis

### `/api/intelligence` (POST)

**File:** `app/api/intelligence/route.ts`  
**Purpose:** Generate all 5 real estate intelligence reports via GPT-4o-mini.

**Input validation:**
- Checks `reportType` and `formData` are present — returns 400 if missing ✅
- Validates `reportType` against known values (switch statement with default → 400) ✅
- No input sanitization on `formData` values before interpolation into prompt strings ⚠️

**Auth flow:** Supabase session → rate limit → plan check → research_requests row → OpenAI → reports row → response

**Error handling:**
- JSON parse failure → 500 with `raw` field showing first 500 chars of bad AI response ⚠️ (raw AI output in error response could leak prompt fragments)
- OpenAI call wrapped in try/catch → 500

**Response shape:** `{ success: true, report: <parsed JSON from GPT-4o-mini> }`

**Issues:**
1. Raw AI output exposed in error response: `{ error: 'Failed to parse AI response', raw: rawText.slice(0, 500) }` — removes 500 chars of the AI response to the client. While GPT-4o-mini doesn't typically expose sensitive data, this is unnecessary.
2. No input length validation on `formData` fields — a very long `companyName` could bloat the prompt and drive up token costs.

---

### `/api/research/leads` (POST)

**File:** `app/api/research/leads/route.ts`  
**Purpose:** Lead Finder — search SerpAPI, vet, rank, and return real company list.

**Input validation:**
- Requires `industry`, `location`, `companySize`, `titles` — returns 400 if any missing ✅
- Trims all inputs ✅
- `titles` split by comma, max 3 taken — ✅

**Auth flow:** Same as intelligence route.

**Error handling:**
- `SearchProviderError` caught and returned as 502 ✅
- General errors catch → 500 ✅
- SerpAPI quota exhausted → returns the quota error message ✅

**Notable issues:**
- Debug `console.log` statements at top of file (lines 1–3) — HIGH severity

---

### `/api/research/talent` (POST)

**File:** `app/api/research/talent/route.ts`  
**Purpose:** AI-generated talent market report.

**Input validation:** All required fields checked, trimmed ✅  
**Auth:** Correct ✅  
**Error handling:** AI JSON parse failure → 500, not exposed to client ✅

**Issues:** None critical. Salary and demand data are AI-generated with appropriate disclaimer in response payload.

---

### `/api/workspace` (GET)

**File:** `app/api/workspace/route.ts`  
**Purpose:** Returns current user's workspace and member list.

**Auth:** Supabase session ✅  
**Rate limiting:** None — low risk (read-only, low frequency call)  
**Authorization:** Looks up user by session email, returns their workspace — correct ✅

**Issues:**
- The response includes ALL workspace members with `email` and `role` fields. This means any workspace member can see all other members' emails. Intentional for team feature, but team management UI doesn't exist yet — so no use case for this data.

---

### `/api/users/init` (POST)

**File:** `app/api/users/init/route.ts`  
**Purpose:** Bootstrap Prisma User + Workspace for a newly signed-up Supabase user.

**Auth:** Session-derived identity (fixed from a prior version that accepted client-supplied IDs) ✅  
**Rate limiting:** ✅ (5/hr)

**Issues:** None. This is the most security-hardened route in the codebase (the audit comment in the file references the prior vulnerability).

---

### `/api/demo` and `/api/demo/generate`

**Files:** `app/api/demo/route.ts`, `app/api/demo/generate/route.ts`  
**Auth:** None required — public endpoints

**Risk assessment:** Demo routes appear to serve demo functionality without requiring auth. If they call OpenAI or SerpAPI without auth, this could be exploited to drain API quotas. **Content of these routes not fully reviewed in this audit** — requires separate verification.

**Recommendation:** Verify demo routes have internal rate limiting or are connected to dummy data only.

---

### `/api/debug-env`

**File:** `app/api/debug-env/route.ts`  
**Auth:** None  
**Status:** File is 1 line (effectively empty). Still registers as a Next.js route. Must be deleted.

---

### `/auth/callback`

**File:** `app/auth/callback/route.ts`  
**Purpose:** Supabase OAuth callback handler  
**Standard Supabase pattern — low risk.**

---

## API Design Issues

| Issue | Severity | File |
|---|---|---|
| Raw AI output in error response | MEDIUM | `app/api/intelligence/route.ts:1026` |
| No input length validation on prompt interpolation | MEDIUM | `app/api/intelligence/route.ts` (all prompt builders) |
| Debug console.log in production route | HIGH | `app/api/research/leads/route.ts:1–3` |
| No Content-Type validation | LOW | All routes |
| Demo routes unreviewed for auth/quota protection | MEDIUM | `app/api/demo/` |
| `supabase as any` bypasses type checking | MEDIUM | Leads, talent, intelligence routes |

---

## Missing API Capabilities

| Capability | Impact |
|---|---|
| No `/api/reports` GET endpoint | Reports fetched directly from Supabase client-side; bypasses server-layer authorization |
| No `/api/reports/:id/delete` | Users cannot delete reports |
| No `/api/billing` or `/api/subscription` | No revenue path |
| No `/api/admin/*` | No admin management plane |
| No pagination on reports | All reports loaded at once |
