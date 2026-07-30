# MVP Definition

**Date:** 2026-07-21  
**Owner:** Founder  
**Canonical reference:** `docs/NORTH_STAR.md`, `docs/CRITICAL_PATH.md`

---

## What MVP Means for This Platform

MVP is the minimum configuration in which a paying customer can use at least one module, receive an evidence-backed decision (not just AI text), pay for it without manual operator intervention, and have their data protected.

MVP is NOT feature parity with the full roadmap. It is the minimum that proves the product identity: evidence-based, explainable, auditable decisions.

---

## MVP = TRUE (Required for MVP)

### Infrastructure

| Requirement | Current State | Source |
|---|---|---|
| Supabase project active (auth + data) | DELETED — must be restored | `docs/PLATFORM_STATE_ASSESSMENT.md` |
| All env vars set in Vercel (Production) | MISSING — most empty | `docs/CONSISTENCY_AUDIT.md` SIG-05 |
| 6 SQL migrations applied in Supabase | NOT APPLIED (project deleted) | `docs/INTEGRATION_MATRIX.md` |
| Root `middleware.ts` executing as Next.js middleware | MISSING | `docs/CONSISTENCY_AUDIT.md` SIG-01 |
| Upstash Redis connected | UNKNOWN | `docs/PLATFORM_STATE_ASSESSMENT.md` |

### Authentication

| Requirement | Current State |
|---|---|
| Login / signup / forgot password functional | Ready (code correct; blocked on Supabase) |
| Session refresh on every request | Blocked on root middleware fix |
| Onboarding flow creates Prisma user + workspace | Ready (code correct; blocked on Supabase) |

### At Least One Module with Decision Intelligence

At MVP, at least ONE module must produce a Decision Intelligence output (not just legacy AI text).

**Chosen module for MVP:** Real Estate Intelligence — highest-value existing module; sector data already in `core/data/`.

| Requirement | Current State |
|---|---|
| `runDecisionEngine()` wired into at least one API route | NOT STARTED |
| Business rules defined for that module | NOT DEFINED |
| `supabase/decisions-table.sql` written and applied | NOT WRITTEN |
| Data adapter: legacy engine output → `DecisionEngineInput` | NOT WRITTEN |
| `DecisionReportCard` UI component | NOT BUILT |
| AI narration layer (GPT-4o-mini enriches option.aiAnalysis post-scoring) | NOT WRITTEN |

**The Decision Intelligence Engine library itself is complete.** See `docs/DECISION_INTELLIGENCE_READINESS.md`.

### Billing

| Requirement | Current State |
|---|---|
| Stripe (or equivalent) checkout session | NOT STARTED |
| Webhook to write `user_plans` on payment | NOT STARTED |
| Pricing page | NOT BUILT |
| Self-serve plan upgrade UI | NOT BUILT |

**Note:** MVP billing must allow a customer to pay for a PROFESSIONAL or AGENCY plan without emailing support. Admin-only plan change is not MVP billing.

### Plan Enforcement

| Requirement | Current State |
|---|---|
| Monthly report limit enforced via `checkPlanLimit()` | LIVE (works when Supabase is up) |
| Rate limiting (5 req/hr) | LIVE (works when Redis is up) |
| Plan limit enforced on `/api/intelligence` (Real Estate) | NOT ENFORCED — only research routes enforce it |

### Legal

| Requirement | Current State |
|---|---|
| Privacy Policy (reviewed content, not placeholder) | PLACEHOLDER |
| Terms of Service (reviewed content, not placeholder) | PLACEHOLDER |

---

## MVP = FALSE (Not Required for MVP)

These are important but do not block the first paying customer:

| Feature | Why It's Not MVP | When It Becomes Relevant |
|---|---|---|
| APM / error monitoring | No customers yet to monitor for | Sprint 7 — before marketing push |
| Email notifications (quota warnings, welcome) | Functional without them | Sprint after billing |
| Admin Console | Admin can use Supabase dashboard directly until scale | Sprint 2 (post-recovery) |
| Decision Intelligence in Lead Finder | Real Estate is MVP module | Sprint 4 |
| Decision Intelligence in Talent Finder | Lower priority | Sprint 4 |
| Legacy AI engine migration (35 types → DI) | Legacy engine still works | Sprint 5 |
| Supabase type generation | Code works with `any` casts | Sprint 2 (post-recovery) |
| Multi-tenancy (team seats) | Single-user first | Future |
| CRM integration | Not needed for MVP | Future |
| AI Agents (autonomous research) | Not needed for MVP | Future |
| Audit log viewer UI | Admin works without it | Future |
| PDF export (server-side) | Print-to-PDF is acceptable | Future |
| i18n (next-intl messages) | English-only is acceptable | Future |
| Apollo.io enrichment | Optional even at launch | Can be unlocked when API key obtained |
| Marketplace / Knowledge Engine | Requires DI in all modules first | Sprint 8+ |
| Overage credits system | Manual plan change acceptable at MVP | Sprint 6 (billing) |
| `SEARCH_DAILY_QUOTA_PER_USER` per-tenant fairness | At MVP volumes, global quota is sufficient | Sprint 4+ |

---

## Required Modules at MVP

| Module | MVP Scope | Notes |
|---|---|---|
| Authentication | Full | Login, signup, password reset, onboarding |
| Real Estate Intelligence | DECISION ENGINE INTEGRATED | Not just legacy AI text |
| Report History | Full | View, export, retry |
| Dashboard | Full | Usage, quota warning |
| Settings | Partial | Plan display, usage, data export, delete account |
| Billing | Stripe checkout + plan activation | Self-serve only |
| Legal Pages | Reviewed content | Not placeholder |
| Health Check | Full | Already live |

---

## Optional Modules at MVP

| Module | Scope | Notes |
|---|---|---|
| Lead Finder | LIVE (existing, no DI) | Works without DI; DI integration is post-MVP |
| Talent Finder | LIVE (existing, no DI) | Works without DI; DI integration is post-MVP |
| Market Intelligence | Static content acceptable | Clearly labelled as curated editorial |
| Admin Console | Operational (env vars set) | Manual plan management backup |
| Public Demo | Operational | `RESEND_API_KEY` set, email working |

---

## Deferred Modules

These are NOT built at MVP:

| Module | Deferred Until |
|---|---|
| Decision Intelligence in Lead Finder | Sprint 4 |
| Decision Intelligence in Talent Finder | Sprint 4 |
| Legacy AI engine migration | Sprint 5 |
| APM / structured logging | Sprint 7 |
| Email notifications | Sprint after billing |
| CRM integration | Sprint 9 |
| Multi-tenancy | Sprint 10 |
| Marketplace | Sprint 8 |
| AI Agents | Sprint 12 |

---

## Future Modules (Not Planned)

| Module | Notes |
|---|---|
| Mobile app | Not planned; platform is web-first |
| Public API (partner/developer) | Not planned at this stage |
| White-label | Not planned at this stage |
| Offline mode | Not applicable (serverless) |

---

## MVP Acceptance Criteria

A human tester must be able to:

1. Load `https://intelligence.eunoiazones.com/login` and see a login page
2. Create a new account, complete onboarding, reach the dashboard
3. Run a Real Estate feasibility analysis and receive a **Decision Report** (not just AI text) with: a recommendation, a confidence score with band label, evidence list, business rules that fired, and an explainability panel
4. View the report in Report History
5. Go to Settings, see current plan and monthly usage
6. Click "Upgrade Plan", complete Stripe checkout, receive confirmation that plan is now PROFESSIONAL
7. Run a Lead Finder search and receive results (legacy path; DI optional at MVP)
8. Export a report as CSV
9. Go to `/privacy` and read a reviewed (non-placeholder) Privacy Policy
10. Go to `/terms` and read reviewed Terms of Service
11. Delete their account from Settings — all data removed

Every step must succeed. If any step fails, MVP criteria are not met.

---

*MVP Definition is canonical. Changes require founder sign-off.*
