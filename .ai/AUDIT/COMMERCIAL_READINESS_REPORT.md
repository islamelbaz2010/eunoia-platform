# Commercial Readiness Report

**Phase 11 of the platform improvement mission — final phase.** Scope: assess what
it takes to move this platform from "working software" to "something a paying
customer trusts and renews," after Phases 1-10 rebuilt the Research Core Engine
(Lead Finder: validation, dedup, ranking, source-quality, company-size, decision
makers, Apollo enrichment) and closed 3 CRITICAL + 2 HIGH multi-tenant/security
gaps (missing usage tracking on `/api/intelligence`, a global-not-per-tenant
search quota, a dead/dangerous duplicate Prisma schema, an unrate-limited public
lead-capture endpoint, and two secret-leaking debug endpoints).

This is the one phase in the mission whose deliverable is a document, not a
diff — everything below is the backlog the next engineering cycles should work
from, ROI-ranked.

## Readiness scores (1-10)

| Area | Score | Why |
|---|---|---|
| **Security** | 7/10 | Phases 1 and 10 closed the real critical holes (identity spoofing, missing rate-limit/plan-check, leaky debug endpoints, a dead schema that risked production corruption). What's left is lower-severity: raw error messages reaching the dashboard error boundary, and no admin/audit trail. |
| **Reliability / error-handling** | 6/10 | Rate-limit and plan-check fail open by design (correct default — an infra hiccup shouldn't block paying customers), and the leads/talent pages do surface structured errors inline. But there's no retry path for a failed report and no dead-letter handling — a failed async job is just a dead end for the user. |
| **Onboarding / UX** | 5/10 | A real onboarding flow exists (workspace creation via `/api/users/init`), but there's no usage/quota visibility anywhere in the UI and Settings tells customers to email support for plan changes — self-serve stops at signup. |
| **Billing / monetization** | 2/10 | Zero payment integration. `PLAN_LIMITS` is real and actively enforced server-side (not cosmetic), but plan assignment is 100% manual — there is no way for a customer to pay or upgrade today. This is the single biggest gap between "working software" and "SaaS business." |
| **Observability / ops** | 3/10 | Logging is `console.log`/`console.error` only, no APM anywhere in the app. No admin/ops console exists — supporting a customer today requires an engineer with direct Supabase SQL access. |
| **Data / privacy compliance** | 3/10 | No privacy policy, no Terms of Service, no account-deletion or data-export flow anywhere in the repo. RLS correctly enforces tenant isolation at the database layer, but there's no documented retention or deletion story on top of it. |
| **Product completeness** | 6/10 | Lead Finder and Talent Finder now deliver on their promise (Phases 2-9 made them evidence-based, not AI-invented). Market Intelligence does not: `/dashboard/analytics` is static hardcoded content with its own on-page disclaimer that it isn't a live data feed, sold as a peer product to the other two. |

## Top 20 backlog, ROI-ranked

1. **Stripe (or equivalent) billing integration** — wire real checkout + webhook to write `user_plans`. *(L)* Without this, nothing else here is monetizable — `PLAN_LIMITS` enforcement is inert infrastructure until payment exists.
2. **Self-serve plan upgrade flow** (pricing → checkout → instant activation). *(M, depends on #1)* Settings currently routes paying customers to email support — a conversion killer and a support-ticket generator at any real scale.
3. **In-dashboard usage meter** ("14/20 reports used this month," reset date). *(S)* `checkPlanLimit` already computes `used`/`limit` server-side — surfacing it is cheap and directly cuts "why was I blocked" tickets.
4. **Make Market Intelligence real, or stop selling it as a peer product** — *(M/L)* A static page with an on-page "not a live data feed" disclaimer, sold alongside two evidence-based products, is a renewal risk the moment a customer notices.
5. **Admin/ops console for support** (view a user's plan, usage, recent reports/errors; adjust plan). *(M)* Today "admin" means SQL access — support can't help a customer without pulling in engineering.
6. **Structured logging + APM (Sentry/Datadog/etc.)** *(M)* Zero real error monitoring exists; production incidents are invisible until a customer reports them.
7. **Email notifications: report-ready, quota-warning, plan-upgraded.** *(M)* Resend is already a dependency (used for the public demo form) but never fires for authenticated users — "report ready" email is table stakes for async-generation SaaS.
8. **Sanitize the dashboard error boundary** (`app/dashboard/error.tsx` renders raw `error.message`). *(S)* Cheap fix, real trust/security hygiene.
9. **Privacy Policy + Terms of Service pages.** *(S)* None exist; a baseline requirement before any serious B2B customer signs.
10. **Account deletion / data export flow.** *(M)* No mechanism exists; blocks EU/enterprise procurement and is real legal exposure as the customer base grows.
11. **Test coverage for `plan-enforcement.ts` and `rate-limit.ts`.** *(S)* These two modules directly gate revenue and quota enforcement and have zero tests — a silent regression here either leaks free usage or wrongly blocks paying customers.
12. **Test coverage for `research-service.ts`, `ai-analysis.ts`, `search-provider.ts`.** *(M)* The orchestration of the flagship paid product is untested.
13. **Reconcile the two plan models** (`types/plan.types.ts` per-user plans vs. `types/workspace.types.ts` Prisma workspace seats) — already flagged in code comments as an unresolved decision. *(M)* Building billing on an ambiguous data model risks expensive rework later.
14. **Failed-report retry/recovery UX.** *(S/M)* Async AI/SerpAPI calls will fail sometimes; right now that's a dead end with no retry or "we'll notify you" path.
15. **Audit log for plan/account changes.** *(S)* Once plan assignment is admin- or billing-driven, there's no record of who changed what — needed for support disputes.
16. **Onboarding product tour / guided first search.** *(S)* First-run stops at naming a workspace; no guidance into the first real search increases time-to-value.
17. **Quota-warning email/banner at 80%/100% usage.** *(S, pairs with #7)* Prevents the jarring "blocked mid-task" moment.
18. **Quota error → upgrade CTA in the UI.** *(S)* The 429/403 JSON already carries plan/used/limit — the frontend just doesn't turn it into an actionable button yet.
19. **Documented data-retention policy for `research_requests`/`reports`.** *(S)* No TTL or anonymization policy exists; matters for compliance and for SerpAPI/Apollo storage cost discipline.
20. **Health-check endpoint + uptime monitoring.** *(S)* No `/health` route or uptime monitoring found; paying customers expect at least a heartbeat before they'll trust renewal.

## Carried-forward findings from the Phase 10 audit (confirmed still present)

- **Logging is `console.*`-only** — no Sentry/Datadog/structured logging anywhere in app code (folded into #6 above).
- **`plan-enforcement.ts` has no tests** despite gating revenue (folded into #11).
- **No usage/quota widget on any dashboard page** (`reports`, `analytics`, `settings`) — folded into #3.
- `supabase/plan-enforcement.sql`'s RLS intentionally blocks self-service plan writes (correct design, not a bug) — it's the wall #1/#2 above need a real billing webhook to get past.

## Bottom line

The platform's *product* foundation is now solid — Lead Finder is evidence-based
and multi-tenant-safe, and the worst security/fairness gaps are closed. The gap
between this and a renewable SaaS business is almost entirely **billing and
operational visibility** (#1-#8 above), not the research engine itself. That's
where the next phase of work should start.
