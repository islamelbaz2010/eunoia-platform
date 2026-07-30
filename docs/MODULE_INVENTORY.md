# Module Inventory

**Date:** 2026-07-21  
**Total source files:** ~200+ (TypeScript, SQL, config)

---

## Legend

| Status | Meaning |
|---|---|
| ACTIVE | Used in production path; tested and functional |
| ACTIVE-UNTESTED | Used in production path; no unit tests |
| COMPLETE-UNINTEGRATED | Fully implemented; not connected to any route or page |
| LEGACY | Still active; scheduled for migration or removal |
| STUB | File exists but contains placeholder/incomplete content |
| BLOCKED | Depends on unresolved external decision |

---

## 1. Authentication Module

| File | Status | Description |
|---|---|---|
| `app/(auth)/login/page.tsx` | ACTIVE-UNTESTED | Email/password login via `supabase.auth.signInWithPassword()` |
| `app/(auth)/signup/page.tsx` | ACTIVE-UNTESTED | New user registration via `supabase.auth.signUp()` |
| `app/(auth)/forgot-password/page.tsx` | ACTIVE-UNTESTED | Password reset via `supabase.auth.resetPasswordForEmail()` |
| `app/(auth)/layout.tsx` | ACTIVE-UNTESTED | Centered auth card layout |
| `app/api/auth/callback/route.ts` | ACTIVE-UNTESTED | Supabase OAuth callback handler; exchanges code for session |
| `lib/supabase/client.ts` | ACTIVE | Browser Supabase client factory |
| `lib/supabase/server.ts` | ACTIVE | Server Supabase client factory (cookie-based, async) |
| `lib/supabase/middleware.ts` | ACTIVE | `updateSession()` helper — called from dashboard layout, **not** from a root middleware |
| `lib/supabase/admin.ts` | ACTIVE-UNTESTED | Admin client using `SUPABASE_SERVICE_ROLE_KEY` |

**Gap:** No root `middleware.ts` exists. Session tokens are refreshed only when the dashboard layout runs, not on every request. Idle navigation without hitting the dashboard layout will not refresh expiring sessions.

---

## 2. Dashboard Module

| File | Status | Description |
|---|---|---|
| `app/dashboard/layout.tsx` | ACTIVE-UNTESTED | Server component: Supabase auth check → Prisma user check → sidebar render |
| `app/dashboard/page.tsx` | ACTIVE-UNTESTED | Home: monthly usage counter, quota warning banner (80%/100%) |
| `app/dashboard/error.tsx` | ACTIVE-UNTESTED | Error boundary — sanitized output (reference code, no raw messages) |
| `app/dashboard/loading.tsx` | ACTIVE-UNTESTED | Loading skeleton |
| `app/dashboard/onboarding/page.tsx` | ACTIVE-UNTESTED | 2-step onboarding: workspace name → product tour (3 module cards) |
| `app/dashboard/analytics/page.tsx` | ACTIVE-UNTESTED | Server component wrapper for analytics |
| `app/dashboard/analytics/analytics-client.tsx` | ACTIVE-UNTESTED | Live research activity stats + curated market insights |
| `app/dashboard/settings/page.tsx` | ACTIVE-UNTESTED | Plan display, usage display, account actions |
| `app/dashboard/settings/account-actions.tsx` | ACTIVE-UNTESTED | Download My Data + Delete Account with confirmation dialog |
| `components/sidebar.tsx` | ACTIVE-UNTESTED | Navigation sidebar; conditionally shows Admin Console link |

---

## 3. Market Research Module (Legacy AI Engine)

| File | Status | Description |
|---|---|---|
| `app/dashboard/research/page.tsx` | ACTIVE-UNTESTED | Research hub home page |
| `app/api/intelligence/route.ts` | ACTIVE-UNTESTED | POST handler: rate limit → cache check → legacy orchestrator → save report |
| `services/legacy-ai-engine/orchestrator.ts` | LEGACY | Dispatches 35 analysis types; manages Redis cache (24h TTL) |
| `services/legacy-ai-engine/prompt-builder.ts` | LEGACY | Assembles prompts from module type + user data |
| `services/legacy-ai-engine/providers/openai.provider.ts` | LEGACY | GPT-4o-mini provider; `response_format: json_object`; 8000 max tokens |
| `services/legacy-ai-engine/providers/base.provider.ts` | LEGACY | Provider interface |
| `services/legacy-ai-engine/prompts/*.prompt.ts` | LEGACY | 35 domain-specific system prompts |
| `services/legacy-ai-engine/prompts/types.ts` | LEGACY | `AnalysisType` enum with 35 values |

**Note:** This engine remains active because Real Estate Analysis depends on it. Migration to the Decision Intelligence Engine is the intended path but has not been implemented.

---

## 4. Real Estate Module

| File | Status | Description |
|---|---|---|
| `app/dashboard/real-estate/page.tsx` | ACTIVE-UNTESTED | Feasibility form; calls `/api/intelligence` with `real_estate_*` analysis types |
| `core/data/sectors.data.ts` | ACTIVE | Egypt/MENA sector benchmarks (rental yields, vacancy rates, price ranges by city+type) |
| `core/data/cities.data.ts` | ACTIVE | 10-country city data with CPL multipliers |
| `services/legacy-ai-engine/prompts/real-estate-feasibility.prompt.ts` | LEGACY | Feasibility analysis system prompt |
| `services/legacy-ai-engine/prompts/real-estate-launch.prompt.ts` | LEGACY | Launch strategy system prompt |
| `services/legacy-ai-engine/prompts/real-estate-leads.prompt.ts` | LEGACY | Lead generation system prompt |

---

## 5. Research Engine Module (New Engine)

| File | Status | Description |
|---|---|---|
| `app/api/research/route.ts` | ACTIVE-UNTESTED | POST: rate limit → plan check → ResearchService |
| `app/api/research/leads/route.ts` | ACTIVE-UNTESTED | POST: SerpAPI lead search with plan enforcement |
| `app/api/research/talent/route.ts` | ACTIVE-UNTESTED | POST: SerpAPI talent search with plan enforcement |
| `app/dashboard/research/leads/page.tsx` | ACTIVE-UNTESTED | Lead Finder form; upgrade CTA on quota block |
| `app/dashboard/research/talent/page.tsx` | ACTIVE-UNTESTED | Talent Finder form; upgrade CTA on quota block |
| `lib/research/acquisition/research-service.ts` | ACTIVE | ResearchService: Search→Collect→Normalize→Rank→ApolloEnrich→AIAnalyze |
| `lib/research/acquisition/search-provider.ts` | ACTIVE | SerpAPI HTTP adapter; maps results to internal format |
| `lib/research/acquisition/ai-analysis.ts` | ACTIVE | OpenAI GPT-4o-mini analysis step; closed-list output keys |
| `lib/research/rate-limit.ts` | ACTIVE | `checkRateLimit()` via Upstash Redis — 5 req/hr per user |
| `lib/research/plan-enforcement.ts` | ACTIVE | `checkPlanLimit()` — reads `user_plans` table; compares against `PLAN_LIMITS` |

---

## 6. Decision Intelligence Module

| File | Status | Description |
|---|---|---|
| `lib/decision-intelligence/types/decision.types.ts` | COMPLETE-UNINTEGRATED | Branded IDs, DecisionStatus lifecycle, DecisionStatusEvent, DecisionOption, Decision, DecisionInput |
| `lib/decision-intelligence/types/evidence.types.ts` | COMPLETE-UNINTEGRATED | EvidenceSourceType, authority weights, EvidenceItem, EvidenceCollection |
| `lib/decision-intelligence/types/confidence.types.ts` | COMPLETE-UNINTEGRATED | 5 ConfidenceDimensions, CONFIDENCE_DIMENSION_WEIGHTS, ConfidenceScore, ConfidenceBand |
| `lib/decision-intelligence/types/rules.types.ts` | COMPLETE-UNINTEGRATED | RuleAction (4), ConditionOperator (11), BusinessRule, RuleEvaluationResult |
| `lib/decision-intelligence/types/validation.types.ts` | COMPLETE-UNINTEGRATED | 5-stage pipeline types, ValidationResult, DEFAULT_VALIDATION_THRESHOLDS |
| `lib/decision-intelligence/types/explainability.types.ts` | COMPLETE-UNINTEGRATED | ExplainWhy, ExplainWhyNot, ExplainEvidenceUsed, ExplainRulesTriggered, DecisionExplainability |
| `lib/decision-intelligence/types/report.types.ts` | COMPLETE-UNINTEGRATED | UniversalDecisionReport v1.0.0, ReportMetadata, ReportExecutiveSummary |
| `lib/decision-intelligence/types/index.ts` | COMPLETE-UNINTEGRATED | Barrel re-export of all 7 type files |
| `lib/decision-intelligence/evidence/evidence-collector.ts` | COMPLETE-UNINTEGRATED | Validates items, exponential freshness decay, contradiction detection |
| `lib/decision-intelligence/evidence/evidence-weighter.ts` | COMPLETE-UNINTEGRATED | Normalizes item weights (sourceAuthority×freshness×confidence); sums to 1.0 |
| `lib/decision-intelligence/engine/confidence-engine.ts` | COMPLETE-UNINTEGRATED | 5-dimension confidence scoring; band classification |
| `lib/decision-intelligence/engine/rules-engine.ts` | COMPLETE-UNINTEGRATED | Priority-ordered evaluation; AND within groups; OR between groups; 11 operators |
| `lib/decision-intelligence/engine/validation-engine.ts` | COMPLETE-UNINTEGRATED | 5-stage pipeline; halt-on-blocking-fail; skip remaining stages |
| `lib/decision-intelligence/engine/explainability-engine.ts` | COMPLETE-UNINTEGRATED | Deterministic WHY/WHY_NOT/EVIDENCE/RULES explanations; zero AI calls |
| `lib/decision-intelligence/engine/decision-engine.ts` | COMPLETE-UNINTEGRATED | Top-level orchestrator; produces full DecisionEngineResult |
| `lib/decision-intelligence/index.ts` | COMPLETE-UNINTEGRATED | Public API barrel export |
| `lib/decision-intelligence/__tests__/evidence-collector.test.ts` | ACTIVE | 10 tests |
| `lib/decision-intelligence/__tests__/evidence-weighter.test.ts` | ACTIVE | 8 tests |
| `lib/decision-intelligence/__tests__/confidence-engine.test.ts` | ACTIVE | 10 tests |
| `lib/decision-intelligence/__tests__/rules-engine.test.ts` | ACTIVE | 12 tests |
| `lib/decision-intelligence/__tests__/validation-engine.test.ts` | ACTIVE | 8 tests |
| `lib/decision-intelligence/__tests__/decision-engine.test.ts` | ACTIVE | 13 tests |

---

## 7. Report Module

| File | Status | Description |
|---|---|---|
| `app/dashboard/reports/page.tsx` | ACTIVE-UNTESTED | Server component: loads reports + research requests |
| `app/dashboard/reports/reports-client.tsx` | ACTIVE-UNTESTED | Report history table; failed-request cards; retry prefill links |
| `app/api/reports/route.ts` | ACTIVE-UNTESTED | GET (list user reports), POST (save report) |

---

## 8. Admin Module

| File | Status | Description |
|---|---|---|
| `app/dashboard/admin/page.tsx` | ACTIVE-UNTESTED | Server component wrapper for admin console |
| `app/dashboard/admin/admin-console-client.tsx` | ACTIVE-UNTESTED | User list, search, plan filter, plan change dropdown, stats |
| `app/api/admin/check/route.ts` | ACTIVE-UNTESTED | GET — lightweight admin identity check (for sidebar) |
| `app/api/admin/users/route.ts` | ACTIVE-UNTESTED | GET — user list with plan + this-month usage (service role) |
| `app/api/admin/users/[id]/plan/route.ts` | ACTIVE-UNTESTED | PATCH — change user plan with audit log write |
| `lib/admin/auth.ts` | ACTIVE-UNTESTED | `isAdminUser()` — checks caller email against `ADMIN_EMAILS` env var |
| `lib/admin/audit.ts` | ACTIVE-UNTESTED | `writeAuditLog()` — best-effort write to `audit_log` Supabase table |

---

## 9. Account Module

| File | Status | Description |
|---|---|---|
| `app/api/account/export/route.ts` | ACTIVE-UNTESTED | GET — authenticated JSON export of reports, research, plan |
| `app/api/account/delete/route.ts` | ACTIVE-UNTESTED | DELETE — cascade delete via Supabase admin API (auth cascade) |

---

## 10. Type Definitions

| File | Status | Description |
|---|---|---|
| `types/plan.types.ts` | ACTIVE | Authoritative: `PLAN_LIMITS`, `PLAN_LABELS`, `PLAN_NAMES`, `PlanTier` enum |
| `types/workspace.types.ts` | ACTIVE | `WorkspaceInfo` type; architecture comment documenting plan model split |
| `types/supabase.types.ts` | STUB | All table types are `Record<string, unknown>` — not generated from schema |
| `types/research.types.ts` | ACTIVE | Research request and result types |

---

## 11. Data Layer

| File | Status | Description |
|---|---|---|
| `prisma/schema.prisma` | ACTIVE | User, Workspace, Report, ApiUsage models |
| `lib/prisma/client.ts` | ACTIVE | Singleton Prisma client with global caching (dev HMR safe) |
| `lib/prisma/init-user.ts` | ACTIVE | `initUserFromSupabase()` — findOrCreate User+Workspace in a transaction |
| `lib/prisma/generated/` | ACTIVE | Prisma-generated client and types |
| `supabase/reports-table.sql` | ACTIVE | Creates `reports` table with RLS |
| `supabase/research-tables.sql` | ACTIVE | Creates `research_requests` and `research_results` tables with RLS |
| `supabase/plan-enforcement.sql` | ACTIVE | Creates `user_plans` table with RLS; enforces plan lookup |
| `supabase/leads-table.sql` | ACTIVE | Creates `demo_leads` table with RLS |
| `supabase/audit-log.sql` | ACTIVE | Creates `audit_log` table; admin writes via service role |
| `supabase/usage-tracking.sql` | ACTIVE | Creates `usage_tracking` table |

---

## 12. Configuration and Tooling

| File | Status | Description |
|---|---|---|
| `next.config.ts` | ACTIVE | Next.js config (minimal) |
| `package.json` | ACTIVE | Dependencies — see Technical Debt Register for version notes |
| `tsconfig.json` | ACTIVE | Strict TypeScript; path aliases (`@/`) |
| `eslint.config.mjs` | ACTIVE | Flat ESLint config for ESLint 9 / Next.js 16 |
| `vitest.config.ts` | ACTIVE | Vitest unit test runner config |
| `.env.local` | ACTIVE | Local env (gitignored); all values empty — Supabase project deleted |
| `i18n/request.ts` | STUB | next-intl configured; locale='en'; messages object is empty |

---

## 13. Public / Marketing

| File | Status | Description |
|---|---|---|
| `app/page.tsx` | ACTIVE-UNTESTED | Marketing landing page |
| `app/market-intelligence/page.tsx` | ACTIVE-UNTESTED | Market intelligence public landing |
| `app/demo/page.tsx` | ACTIVE-UNTESTED | Demo landing with email form (Resend — currently no-op) |
| `app/privacy/page.tsx` | ACTIVE-UNTESTED | Privacy policy — placeholder content |
| `app/terms/page.tsx` | ACTIVE-UNTESTED | Terms of service — placeholder content |
| `app/api/health/route.ts` | ACTIVE | `GET { ok: true }` — no auth, no env exposure |

---

## 14. Billing Module

| File | Status | Description |
|---|---|---|
| (none) | BLOCKED | No billing provider chosen. Upgrade CTAs exist in UI but link to placeholder. |

---

*Inventory produced 2026-07-21. Read-only assessment.*
