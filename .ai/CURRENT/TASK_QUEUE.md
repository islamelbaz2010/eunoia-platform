# Task Queue

**Updated:** 2026-07-21

## Done

- Show monthly plan usage on `/dashboard`.
- Show current plan and monthly usage on `/dashboard/settings`.
- Add tests for `checkPlanLimit`.
- Add tests for `checkRateLimit`.
- Restore lint command compatibility with Next 16 / ESLint 9.
- Hide raw dashboard error messages from customers.
- Add dashboard error reference tests.
- Add tests for `research-service.ts`, `ai-analysis.ts`, and `search-provider.ts`.
- Add quota-blocked upgrade CTA in dashboard research flows.
- Add failed-request recovery cards and retry links in report history.
- Add baseline Privacy Policy and Terms pages with legal-review placeholders.
- Add lightweight health-check endpoint for uptime monitoring.

## Current

- Blocked pending product/legal/ops decisions for the remaining high-ROI commercial-readiness backlog.

## Next

1. Choose billing provider and provide checkout/webhook secrets.
2. Choose APM/logging provider and provide project credentials.
3. Define admin role/access-control model.
4. Confirm sender/domain and notification policy for authenticated-user emails.
5. Send Privacy Policy and Terms for legal review.

## Blocked

- Billing integration and self-serve plan upgrades require payment-provider selection and secrets.
- Admin/ops console depends on an access-control decision for admin users.
- Structured logging/APM depends on provider selection and credentials.
- Authenticated user email notifications depend on sender/domain and notification policy decisions.
- Final Privacy Policy and Terms require legal review.
