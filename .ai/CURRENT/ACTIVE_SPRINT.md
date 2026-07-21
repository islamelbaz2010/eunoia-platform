# Active Sprint

**Updated:** 2026-07-21

## Sprint Name

Commercial Readiness Visibility & Trust Sprint

## Sprint Objective

Convert existing server-side enforcement and operational hygiene into customer-visible, production-safe product behavior without requiring new third-party billing or monitoring secrets.

## Completed

- Usage meter on the main dashboard.
- Plan and monthly usage summary in Settings.
- Working `npm run lint` command for the current Next/ESLint stack.
- Unit tests for plan enforcement and rate limiting.
- Customer-safe dashboard error boundary.
- Unit tests for dashboard error references.
- Focused research-service, AI-analysis, and search-provider tests.
- Quota-blocked upgrade CTA in dashboard research flows.
- Failed-request recovery cards and retry links in report history.
- Baseline Privacy Policy and Terms pages.
- Public `/api/health` endpoint with regression coverage.

## In Progress

- Blocker resolution for billing, admin access, APM, notification policy, and legal review.

## Not Started

- None for the current unblocked commercial-readiness slice.

## Blocked

- Stripe or equivalent billing integration: requires provider decision and secrets.
- APM/structured monitoring integration: requires provider decision and project token/DSN.
- Admin/ops console: requires administrator role and access-control decision.
- Authenticated user notification emails: requires sender/domain and notification policy decision.
- Final Privacy Policy and Terms: requires legal review.
