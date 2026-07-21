# 15 — MISSING FEATURES
*What was claimed vs. what is built. Evidence-based only.*

---

## Critical Missing Features (No Code Exists)

### 1. Payment / Billing System
**What exists:** Plan types (STARTER/PROFESSIONAL/AGENCY/ENTERPRISE) with monthly limits defined in code
**What's missing:** Stripe (or any payment processor) integration, subscription management, plan upgrade UI, invoice generation, webhook handling
**Impact:** Cannot collect revenue from customers today
**Effort:** 1-2 weeks
**Evidence of absence:** `grep -r "stripe\|paddle\|payment\|billing\|checkout\|invoice" --include="*.ts" --include="*.tsx"` returns zero results in active routes

### 2. CRM
**What exists:** Nothing
**What's missing:** All of it — contact management, pipeline, follow-ups, deal tracking
**Impact:** Claimed as a feature in marketing but zero code
**Effort:** 4-6 weeks for basic version
**Evidence of absence:** No CRM-related files, routes, or database tables anywhere in the repository

### 3. Competitor Intelligence Module
**What exists:** A "Coming Soon" UI card in the research page
**What's missing:** Backend, search logic, competitor analysis prompts, data pipeline
**Impact:** Investors may count this as a feature — it isn't
**Effort:** 3-4 weeks
**Evidence:** `app/dashboard/research/page.tsx` — disabled card with `soon` badge

### 4. Supplier Intelligence Module
**What exists:** A "Coming Soon" UI card
**What's missing:** Everything
**Effort:** 3-4 weeks
**Evidence:** Same file as above

### 5. Recruitment Intelligence Module
**What exists:** A "Coming Soon" UI card (labeled "Market Intelligence Research" in one place)
**What's missing:** Everything
**Effort:** 2-3 weeks
**Evidence:** Same file

### 6. Admin Panel
**What exists:** Nothing
**What's missing:** Admin view of all leads, plan management, usage monitoring, user management
**Impact:** Currently manage everything through Supabase dashboard directly
**Effort:** 2-3 weeks

---

## Important Missing Features (Business-Critical)

### 7. Self-Serve Plan Upgrade
**What exists:** A settings page that says "Contact hello@eunoia.eg to upgrade"
**What's missing:** A plan upgrade button/flow with payment
**Impact:** Revenue blocker — every upgrade requires manual intervention
**Effort:** 1 week (after Stripe integration)

### 8. Team / Multi-User Workspace
**What exists:** A legacy Workspace model in Prisma (not used by live routes)
**What's missing:** Team invitation, multi-user access, shared reports, workspace billing
**Impact:** Cannot sell Agency tier to agencies with multiple users
**Effort:** 2-3 weeks

### 9. Live Market Data Feed
**What exists:** A static analytics page with 18 hardcoded insight cards and explicit disclaimer
**What's missing:** Real-time market data integration, dynamic insights, data freshness indicators
**Impact:** "Market Intelligence Analytics" feature is essentially a static brochure
**Effort:** 3-4 weeks (data provider integration required)

### 10. Report Collaboration / Sharing
**What exists:** Individual user report history with CSV/print export
**What's missing:** Share link, collaborative editing, client-facing report URL
**Impact:** Users can't share reports with clients without downloading and emailing
**Effort:** 1 week

---

## Missing Infrastructure (Not Features but Gaps)

### 11. Error Monitoring
**What's missing:** Sentry, Datadog, or similar
**Impact:** Zero visibility into production errors
**Effort:** 2 hours

### 12. AI Cost Monitoring
**What's missing:** Per-user token usage tracking for cost management
**Impact:** Cannot control AI costs if usage scales unexpectedly
**Effort:** 1 day

### 13. Customer Email Sequences
**What's missing:** Onboarding emails, engagement nudges, report-ready notifications
**Impact:** No automated customer engagement
**Effort:** 2-3 days (using Resend + sequence logic)

### 14. Apollo Contact Enrichment (Wired but Not Activated)
**What exists:** Full ApolloOrgEnrichAdapter built and integrated in the pipeline
**What's missing:** APOLLO_API_KEY in production environment
**Impact:** Lead Finder doesn't return actual contact email/phone data
**Effort:** 30 minutes to configure the key

### 15. Streaming AI Responses
**What's missing:** Server-Sent Events or streaming for long AI responses
**Impact:** Users wait silently for up to 30 seconds for some reports
**Effort:** 1-2 days

---

## Features Claimed Elsewhere vs. Reality

| Claimed Feature | Reality |
|----------------|---------|
| "6 Research Modules" | 2 live, 4 stubs |
| "CRM" | Zero code |
| "Market Intelligence" | Iframe of halannews.com (logged in) or static insights page (analytics) |
| "Team Workspace" | Prisma model only, no live code |
| "Agency Plan" (300 reports/month) | Defined but not purchasable |
| "Enterprise Plan" (unlimited) | Defined but not purchasable |

---

## Features That Are Impressively Complete

| Feature | Completeness |
|---------|-------------|
| Real Estate Intelligence Engine | 95% — flagship feature |
| Lead Finder Research Pipeline | 85% — genuine depth |
| Talent Finder | 90% — clean and working |
| Auth + Multi-tenant Isolation | 95% — security-audited |
| Rate Limiting + Plan Enforcement | 90% — robust infrastructure |
| Cashflow Engine (NPV/IRR) | 100% — deterministic, not AI |
| Report History + Export | 95% — professional UX |
