# Feature Inventory

> Status codes: ✅ Complete | ⚠️ Partial | ❌ Not Started | 🔴 Broken | 🗑️ Dead/Retired

---

## 1. Authentication

| Sub-feature | Status | % | Notes |
|---|---|---|---|
| Email/password login | ✅ | 100% | `app/(auth)/login/page.tsx` via Supabase |
| Signup | ✅ | 100% | `app/(auth)/signup/page.tsx` |
| Email confirmation callback | ✅ | 100% | `app/auth/callback/route.ts` — also bootstraps Prisma user |
| Forgot password page | ⚠️ | 50% | Page exists (`app/(auth)/forgot-password/page.tsx`); backend endpoint not confirmed |
| OAuth login (Google, etc.) | ❌ | 0% | Not configured |
| Session management (cookie refresh) | ✅ | 100% | `proxy.ts` + `@supabase/ssr` |
| Logout | ✅ | 100% | Via Supabase client-side `signOut()` (confirmed in sidebar) |
| **Auth overall** | ✅ | **85%** | Forgot-password backend unclear |

---

## 2. User Onboarding

| Sub-feature | Status | % | Notes |
|---|---|---|---|
| Workspace creation UI | ✅ | 100% | `app/dashboard/onboarding/page.tsx` |
| Workspace creation API | ✅ | 100% | `app/api/users/init/route.ts` → `lib/prisma/init-user.ts` |
| Idempotent (won't duplicate on re-visit) | ✅ | 100% | `findUnique` before `$transaction` |
| Re-onboarding protection | ✅ | 100% | Layout redirects already-onboarded users to `/dashboard` |
| Email verification → auto-onboard | ✅ | 100% | `auth/callback` calls `initUserFromSupabase` directly |

---

## 3. Dashboard Home

| Sub-feature | Status | % | Notes |
|---|---|---|---|
| Greeting + date | ✅ | 100% | Dynamic, server-side |
| Report stats (total, this month, last report) | ✅ | 100% | Real Supabase queries with `Promise.all` |
| Recent reports list | ✅ | 100% | Last 5 from Supabase |
| Module navigation grid | ✅ | 100% | Links to all 4 modules |
| Empty state | ✅ | 100% | Handled |

---

## 4. Real Estate Intelligence

**File:** `app/api/intelligence/route.ts` (1051 lines), `app/dashboard/real-estate/page.tsx` (1111 lines)

| Sub-feature | Status | % | Notes |
|---|---|---|---|
| Feasibility study report | ✅ | 100% | Full cashflow engine (NPV, ROI, payback), AI synthesis |
| Developer launch campaign report | ✅ | 100% | Egypt benchmarks, audience targeting, budget |
| Broker campaign report | ✅ | 100% | Commission-based business model logic |
| Cashflow engine (pre-AI calculations) | ✅ | 100% | `calculateCashflow()` in route — NPV, IRR, ROI |
| Egypt market benchmarks (hardcoded) | ✅ | 100% | CPL ranges, margins, decision cycles per sector |
| City-specific multipliers | ✅ | 100% | 7 Egyptian cities hardcoded |
| AI generation via `halannews.com` proxy | ⚠️ | 100% functionality / 0% security | **CRITICAL: data leaks to external proxy** |
| Bilingual output (AR/EN) | ✅ | 100% | Response includes both |
| PDF print | ✅ | 100% | CSS `@media print` based |
| Report persistence to Supabase | ✅ | 100% | Saved to `reports` table |
| Rate limiting (5/hr per user) | ✅ | 100% | |
| Plan enforcement (monthly limits) | ✅ | 100% | |
| **Real Estate overall** | ⚠️ | **95%** | Functionally complete; AI proxy is security risk |

---

## 5. Research Intelligence Hub — Lead Finder

**File:** `app/api/research/leads/route.ts`, `app/dashboard/research/leads/page.tsx`

| Sub-feature | Status | % | Notes |
|---|---|---|---|
| Industry + location + company-size + titles search | ✅ | 100% | |
| SerpAPI search integration | ✅ | 100% | Via `ResearchService` |
| Source collection + content fetching | ✅ | 100% | `FetchSourceCollector` |
| Company validation | ✅ | 100% | `lib/research/company-validation.ts` |
| Cross-domain deduplication | ✅ | 100% | `lib/research/dedup.ts` |
| Source quality scoring | ✅ | 100% | `lib/research/source-quality.ts` |
| Company expansion (directory mining) | ✅ | 100% | `lib/research/company-expansion.ts` |
| Confidence scoring | ✅ | 100% | Per-result + aggregate |
| AI analysis (OpenAI direct) | ✅ | 100% | `lib/research/acquisition/ai-analysis.ts` |
| Apollo.io enrichment (optional) | ✅ | 100% | Graceful no-op without API key |
| Result caching (24h Redis) | ✅ | 100% | Query-hash keyed |
| LinkedIn search links | ✅ | 100% | `lib/research/sources.ts` |
| Rate limiting + quota | ✅ | 100% | Per-user 5/hr + global 150/day SerpAPI budget |
| Result persistence | ✅ | 100% | Saved to Supabase `reports` + `research_requests` |
| **Lead Finder overall** | ✅ | **98%** | |

---

## 6. Research Intelligence Hub — Talent Finder

**File:** `app/api/research/talent/route.ts`, `app/dashboard/research/talent/page.tsx`

| Sub-feature | Status | % | Notes |
|---|---|---|---|
| Job title + location + industry + experience + skills | ✅ | 100% | |
| Salary range estimation | ✅ | 100% | AI-generated with explicit "estimate" caveat |
| Hiring demand analysis | ✅ | 100% | Level + trend |
| Candidate archetypes (not real PII) | ✅ | 100% | Explicitly designed to avoid generating fake individuals |
| Suggested search keywords | ✅ | 100% | |
| Rate limiting + quota | ✅ | 100% | |
| AI generation via external proxy | ⚠️ | 100% functional | Talent search prompts sent to `halannews.com` proxy |
| **Talent Finder overall** | ⚠️ | **95%** | AI proxy security concern |

---

## 7. Market Intelligence

**File:** `app/market-intelligence/page.tsx`

| Sub-feature | Status | % | Notes |
|---|---|---|---|
| Authentication guard | ✅ | 100% | Server-side `getUser()` redirect |
| Content | 🔴 | 0% | Entire page is an iframe to `halannews.com` — no internal functionality |
| **Market Intelligence overall** | 🔴 | **5%** | Placeholder; not a real product feature |

---

## 8. Analytics Page

**File:** `app/dashboard/analytics/page.tsx`

| Sub-feature | Status | % | Notes |
|---|---|---|---|
| Egypt market trend content | ✅ | 100% | Static, well-written |
| Real usage analytics | ❌ | 0% | Not implemented |
| User-specific data | ❌ | 0% | Page shows generic market content only |
| Charts/visualizations | ❌ | 0% | Text-only |
| **Analytics overall** | ⚠️ | **20%** | Misnomer — it's static market context, not usage analytics |

---

## 9. Reports History

**File:** `app/dashboard/reports/page.tsx`, `reports-client.tsx`

| Sub-feature | Status | % | Notes |
|---|---|---|---|
| List all reports (paginated) | ✅ | 100% | Supabase query |
| Filter by type | ✅ | 100% | |
| Report detail expansion | ✅ | 100% | Inline JSON data rendering |
| Report deletion | ❌ | 0% | Not implemented |
| Report sharing | ❌ | 0% | Not implemented |
| PDF download from history | ❌ | 0% | Only available at generation time |
| **Reports History overall** | ⚠️ | **60%** | Core list works; no CRUD beyond read |

---

## 10. Free Demo

**Files:** `app/demo/page.tsx`, `app/api/demo/route.ts`, `app/api/demo/generate/route.ts`

| Sub-feature | Status | % | Notes |
|---|---|---|---|
| Multi-step form (bilingual AR/EN) | ✅ | 100% | |
| Lead capture to Supabase `demo_leads` | ✅ | 100% | Service-role insert |
| Confirmation email via Resend | ✅ | 100% | Arabic email template |
| AI report generation preview | ✅ | 100% | Via external proxy |
| Input validation | ⚠️ | 60% | Required fields checked; no sanitization |
| Rate limiting | ✅ | 100% | IP-based via Redis |
| **Demo overall** | ⚠️ | **85%** | Unsanitized input to AI + email (SEC-06) |

---

## 11. Settings

**File:** `app/dashboard/settings/page.tsx`

| Sub-feature | Status | % | Notes |
|---|---|---|---|
| Email display | ✅ | 100% | Read-only |
| User ID display | ✅ | 100% | Read-only |
| Plan display | ❌ | 0% | Says "Contact hello@eunoia.eg" |
| Workspace management | ❌ | 0% | Not implemented |
| Team member management (invite/remove) | ❌ | 0% | Not implemented |
| API key management | ❌ | 0% | Not implemented |
| Password change | ❌ | 0% | Not implemented |
| Account deletion | ❌ | 0% | Not implemented |
| **Settings overall** | ❌ | **10%** | Effectively read-only shell |

---

## 12. Billing / Payments / Subscriptions

| Sub-feature | Status | % | Notes |
|---|---|---|---|
| Payment processor integration | ❌ | 0% | No Stripe/Paddle/etc. |
| Subscription management | ❌ | 0% | Not implemented |
| Self-service plan upgrade | ❌ | 0% | Manual admin action only |
| Invoice generation | ❌ | 0% | Not implemented |
| Billing webhook handler | ❌ | 0% | Not implemented |
| Plan enforcement (technical) | ✅ | 100% | `user_plans` table + `checkPlanLimit()` |
| Usage tracking | ✅ | 100% | `research_requests.credits_used` |
| **Billing overall** | ❌ | **5%** | Infrastructure layer exists; no payment processing |

---

## 13. Admin / User Management

| Sub-feature | Status | % | Notes |
|---|---|---|---|
| Admin panel | ❌ | 0% | Not implemented |
| User role management | ❌ | 0% | Prisma has roles; no UI |
| User invitation | ❌ | 0% | Not implemented |
| Plan assignment UI | ❌ | 0% | Manual SQL editor only |
| Usage dashboard | ❌ | 0% | Not implemented |
| **Admin overall** | ❌ | **0%** | |

---

## 14. Dead / Retired Features

| Feature | Status | Evidence |
|---|---|---|
| Legacy Intelligence (30 report types: COMPETITOR, PRICING, etc.) | 🗑️ Retired | `services/legacy-ai-engine/` README; routes removed |
| Legacy Feasibility `/dashboard/feasibility` | 🗑️ Retired | Route deleted per audit history |
| PHP-based auth + API (`api.php`, `auth.php`) | 🗑️ Dead | Files tracked in git, not wired to Next.js |
| Debug `/api/debug-env` endpoint | 🗑️ Deleted | Confirmed removed per SERPAPI_ROOT_CAUSE_ANALYSIS.md |
| Workspace API (`/api/workspace`) | 🗑️ Dead | Zero frontend callers confirmed |
| `use-workspace.ts` hook | 🗑️ Dead | Only calls the dead workspace API |
| `components/motion/fade-in.tsx` | 🗑️ Dead | Zero usages in app |

---

## Feature Completion Summary

| Category | Implemented % |
|---|---|
| Authentication | 85% |
| Onboarding | 100% |
| Real Estate Intelligence | 95% |
| Lead Finder | 98% |
| Talent Finder | 95% |
| Market Intelligence | 5% |
| Analytics | 20% |
| Reports History | 60% |
| Free Demo | 85% |
| Settings | 10% |
| Billing/Payments | 5% |
| Admin | 0% |
| **Overall platform** | **~55%** |

**Remaining work to MVP:** ~45% (primarily billing, settings, admin, market intelligence as real feature)
**Remaining work to production-grade:** +security fixes, migration tooling, CI/CD, observability
