# 09 — SECURITY STATUS
*Evidence-based security assessment. No invented vulnerabilities.*

---

## Security Summary

**Overall Rating: ADEQUATE for MVP**

The platform has authentication, rate limiting, and multi-tenant isolation implemented correctly. The main risks are the external halannews.com proxy dependency and the absence of input sanitization depth.

---

## Authentication & Authorization

| Control | Status | Evidence |
|---------|--------|----------|
| Supabase Auth on all dashboard routes | ✅ | `lib/supabase/middleware.ts` |
| Session refresh middleware | ✅ | `updateSession()` called on every request |
| Server-side auth check in all API routes | ✅ | `supabase.auth.getUser()` at top of each handler |
| Redirect unauthenticated to /login | ✅ | middleware line 40 |
| Redirect authenticated from auth pages | ✅ | middleware line 46 |
| JWT validation | ✅ | Handled by Supabase SDK |

---

## Multi-Tenant Isolation

| Control | Status | Evidence |
|---------|--------|----------|
| All Supabase queries scoped to `user_id` | ✅ | All routes filter by `user.id` |
| Rate limit key includes `user.id` | ✅ | `ratelimit:intelligence:${user.id}` |
| Research requests scoped to `user_id` | ✅ | `research_requests` insert includes `user_id` |
| Plan enforcement scoped to `user_id` | ✅ | `user_plans.user_id` lookup |
| Cache key does NOT include `user_id` | ⚠️ | By design — "identical queries from different users share one cached result" (acceptable trade-off) |

---

## API Security

| Control | Status | Evidence |
|---------|--------|----------|
| Rate limiting on all AI routes | ✅ | 5 req/hour per user |
| IP-based rate limit on public demo route | ✅ | `/api/demo/generate` |
| Input field validation (required checks) | ✅ | Basic — all routes check required fields |
| Input Zod schema validation | ❌ | No Zod on API inputs (type checking only) |
| SQL injection prevention | ✅ | Supabase SDK uses parameterized queries |
| XSS prevention | 🟡 | React escapes by default; some `dangerouslySetInnerHTML` in report views (limited, not user-controlled content) |
| CSRF protection | 🟡 | Next.js App Router has built-in CSRF mitigations |
| No API key exposure in client | ✅ | All keys server-side only |

---

## Environment Variable Security

| Variable | Used In | Risk Level |
|----------|---------|------------|
| `OPENAI_API_KEY` | Server-only API routes | LOW — server-side only |
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | LOW — public by design |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | LOW — public by design |
| `SUPABASE_SERVICE_ROLE_KEY` | `/api/demo/route.ts` only | MEDIUM — bypasses RLS, server-side only |
| `UPSTASH_REDIS_REST_URL/TOKEN` | Server-only | LOW — server-side only |
| `SERPAPI_API_KEY` | Server-only | LOW — server-side only |
| `RESEND_API_KEY` | Server-only | LOW — server-side only |
| `DATABASE_URL` | Server-only (Prisma) | LOW — server-side only |

**Note:** `SUPABASE_SERVICE_ROLE_KEY` is NOT listed in `.env.local.example` — could cause confusing failures on first setup.

---

## Known Security Risks

### RISK 1: External Proxy Dependency (halannews.com)
**Severity: MEDIUM-HIGH (Business Risk)**
- `/api/demo/generate` sends user-submitted data (company name, email, phone, sector) to `https://halannews.com/api-proxy`
- There is no validation that this proxy is behaving as expected
- The proxy could change its response format or behavior without notice
- If halannews.com is compromised, lead data could be exposed
- Evidence: `app/api/demo/generate/route.ts` line 54

### RISK 2: Debug Console Logs in Production
**Severity: LOW (Information Disclosure)**
- `app/api/research/leads/route.ts` lines 1-3:
```javascript
console.log("=== LEADS API START ===")
console.log("SERPAPI:", !!process.env.SERPAPI_API_KEY)
console.log("OPENAI:", !!process.env.OPENAI_API_KEY)
```
- These logs reveal whether API keys are configured
- Visible in Vercel function logs (not public-facing, but bad practice)

### RISK 3: Debug Route Exists
**Severity: LOW**
- `app/api/debug-env/route.ts` exists but is essentially empty (1 line)
- Not currently dangerous but the route URL exists
- Should be removed before production

### RISK 4: DangerouslySetInnerHTML
**Severity: LOW**
- `app/dashboard/real-estate/page.tsx` uses `dangerouslySetInnerHTML` for SWOT quad titles
- Content is hardcoded Arabic strings, not user-controlled
- Not a real XSS vector in current usage

### RISK 5: No Input Sanitization on Research Fields
**Severity: LOW-MEDIUM**
- Industry, location, companySize, titles fields go directly into SerpAPI query
- No sanitization beyond basic trim()
- SerpAPI handles this server-to-server, not in browser
- Could be abused for SerpAPI quota exhaustion by a determined attacker

---

## Security Posture for Previous Audit Findings

The git history shows two security fix commits:
- `84995c2 fix(security): close the two HIGH findings from the multi-tenant audit`
- `f25aab8 fix(security): close three multi-tenant gaps in the Research Core Engine`

**Implication:** Multi-tenant isolation was previously broken and has been fixed. The fixes appear to be in place based on code review.

---

## What's Missing for Production Security

| Gap | Priority | Effort |
|-----|----------|--------|
| Remove debug console.logs | HIGH (quick) | 5 minutes |
| Remove debug-env route | HIGH (quick) | 5 minutes |
| Add SUPABASE_SERVICE_ROLE_KEY to env examples | MEDIUM | 5 minutes |
| Zod schema validation on API inputs | MEDIUM | 2-3 days |
| GDPR/data retention policy | HIGH (if EU users) | 1 week |
| Security headers (CSP, HSTS, etc.) | MEDIUM | 1 day |
| Audit log for admin actions | LOW | 1 week |
| SOC 2 compliance | LOW (enterprise tier) | 6+ months |
