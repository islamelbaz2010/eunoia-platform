# Technical Debt

## Technical Debt Overview

This document catalogs technical debt identified in the Eunoia Platform repository, categorized by severity and impact on scalability, maintainability, and investment readiness.

## Critical Technical Debt

### Debt 1: Dual Database Strategy

**Location:** Supabase (live) + Prisma (legacy)

**Description:** The platform uses two database systems simultaneously:
- Supabase PostgreSQL for production data (auth.users, reports, research_requests, user_plans, demo_leads)
- Prisma ORM for legacy workspace management (User, Workspace, Report, ApiUsage models)

**Impact:**
- Increased complexity in data access layer
- Confusion about which database to use for new features
- Maintenance burden of two systems
- Potential data inconsistency
- Slower development velocity

**Evidence:**
- `prisma/schema.prisma` defines User, Workspace, Report, ApiUsage models
- `supabase/*.sql` defines reports, research_requests, user_plans, demo_leads tables
- `/api/workspace` uses Prisma
- `/api/research/*` uses Supabase
- Comments in code acknowledge this as legacy

**Reconciliation Needed:**
- Prisma User model vs Supabase auth.users
- Prisma Workspace model vs Supabase user_plans
- Prisma Report model vs Supabase reports table
- Prisma plan limits vs Supabase user_plans table

**Recommended Resolution:**
1. Choose Supabase as single source of truth (recommended)
2. Migrate any needed Prisma data to Supabase
3. Remove Prisma models or mark as deprecated
4. Update all routes to use Supabase consistently
5. Remove Prisma dependency if not needed

**Estimated Effort:** 4-6 weeks

**Priority:** CRITICAL

---

### Debt 2: No Payment Processing Infrastructure

**Location:** Entire codebase

**Description:** No payment processing, billing, or revenue tracking infrastructure exists. Plan enforcement is implemented but cannot generate revenue.

**Impact:**
- Cannot generate revenue
- Cannot validate business model
- Cannot measure unit economics
- Blocks all commercial operations

**Evidence:**
- No Stripe/PayPal integration visible
- No billing webhooks
- No invoice generation
- No revenue tracking in database
- Plan assignment is manual (service role key only)
- Settings page shows "Contact hello@eunoia.eg to upgrade" (manual process)

**Recommended Resolution:**
1. Integrate payment processor (Stripe recommended)
2. Build checkout flow for plan upgrades
3. Implement recurring billing logic
4. Add invoice generation
5. Implement dunning management
6. Build revenue analytics dashboard

**Estimated Effort:** 4-6 weeks

**Priority:** CRITICAL

---

## High Technical Debt

### Debt 3: Legacy AI Engine Not Removed

**Location:** `services/legacy-ai-engine/`

**Description:** The legacy AI engine (30 report types) is retired but not removed from codebase, creating confusion and maintenance burden.

**Impact:**
- Codebase bloat
- Confusion about which AI engine to use
- Maintenance burden for unused code
- Potential accidental usage

**Evidence:**
- `services/legacy-ai-engine/README.md` states engine is "retired but preserved"
- 30 prompt templates exist in `services/legacy-ai-engine/prompts/`
- Prisma Report/ApiUsage models marked as LEGACY
- No routes currently use legacy engine
- Comments indicate preserved for "future reuse"

**Recommended Resolution:**
1. Decide: keep for future modules or remove entirely
2. If keeping: move to separate repository or clearly mark as archival
3. If removing: delete entire `services/legacy-ai-engine/` directory
4. Remove legacy Prisma models (Report, ApiUsage)
5. Update documentation

**Estimated Effort:** 1-2 weeks

**Priority:** HIGH

---

### Debt 4: Limited Monitoring and Observability

**Location:** Entire codebase

**Description:** No APM, structured logging, uptime monitoring, or alerting. Limited visibility into production issues.

**Impact:**
- Slower incident response
- Harder to debug issues
- No performance visibility
- No error tracking
- Cannot measure system health

**Evidence:**
- Only console.log statements visible
- No structured logging framework
- No APM integration (Datadog, New Relic, etc.)
- No uptime monitoring (Pingdom, UptimeRobot, etc.)
- No error tracking (Sentry, Rollbar, etc.)
- No performance monitoring

**Recommended Resolution:**
1. Add structured logging (Winston, Pino)
2. Implement APM (Datadog or New Relic)
3. Add error tracking (Sentry)
4. Implement uptime monitoring
5. Set up alerting for critical errors
6. Add performance metrics dashboard

**Estimated Effort:** 2-4 weeks

**Priority:** HIGH

---

### Debt 5: No Automated Testing

**Location:** Entire codebase

**Description:** Limited unit tests, no integration tests, no E2E tests. Quality assurance is manual.

**Impact:**
- Higher risk of regressions
- Slower deployment confidence
- Manual QA burden
- No test coverage metrics
- Risk of breaking changes

**Evidence:**
- Some unit tests in `lib/research/acquisition/*.test.ts`
- No integration tests visible
- No E2E tests visible
- No test coverage reporting
- Vitest configured but minimally used
- No CI/CD test automation

**Recommended Resolution:**
1. Increase unit test coverage to 70%+
2. Add integration tests for API routes
3. Add E2E tests with Playwright
4. Implement test coverage reporting
5. Add tests to CI/CD pipeline
6. Set up test data fixtures

**Estimated Effort:** 4-6 weeks

**Priority:** HIGH

---

### Debt 6: No CI/CD Pipeline

**Location:** Deployment configuration

**Description:** Basic Vercel integration only. No automated testing, no staging environment, no automated rollback.

**Impact:**
- Slower deployment cycle
- Higher deployment risk
- No automated quality gates
- Manual deployment process
- No staging environment for testing

**Evidence:**
- `vercel.json` has minimal configuration
- No GitHub Actions workflows
- No automated tests in deployment
- No staging environment configuration
- Manual deployment only
- No automated rollback capability

**Recommended Resolution:**
1. Implement GitHub Actions CI/CD
2. Add automated tests to pipeline
3. Set up staging environment
4. Implement automated rollback
5. Add deployment notifications
6. Configure environment-specific builds

**Estimated Effort:** 2-4 weeks

**Priority:** HIGH

---

### Debt 7: Missing Database Indexes

**Location:** Supabase database schema

**Description:** Critical database tables lack indexes on high-traffic columns, creating performance risk at scale.

**Impact:**
- Slow query performance at scale
- Database load issues
- Poor user experience
- Scaling limitations

**Evidence:**
- `reports` table: no index on `user_id` or `created_at`
- `research_requests` table: only has `user_id` index
- No composite indexes for common query patterns
- No query analysis or slow query log

**Recommended Resolution:**
1. Add index on `reports.user_id`
2. Add index on `reports.created_at`
3. Add composite index on `reports(user_id, created_at)`
4. Add index on `research_requests.created_at`
5. Set up slow query logging
6. Analyze query patterns for additional indexes

**Estimated Effort:** 1-2 weeks

**Priority:** HIGH

---

## Medium Technical Debt

### Debt 8: No API Documentation

**Location:** API routes

**Description:** No OpenAPI/Swagger documentation, no API reference for developers or partners.

**Impact:**
- Harder for developers to understand API
- Blocks potential integrations
- No contract for API changes
- Slower partner onboarding

**Evidence:**
- No OpenAPI/Swagger spec visible
- No API documentation in repository
- API reference must be reverse-engineered from code
- No API versioning strategy

**Recommended Resolution:**
1. Generate OpenAPI spec from code
2. Publish API documentation (Swagger UI)
3. Add API examples and use cases
4. Implement API versioning
5. Set up API change log
6. Consider public API for partners

**Estimated Effort:** 2-3 weeks

**Priority:** MEDIUM

---

### Debt 9: No Architecture Documentation

**Location:** Repository documentation

**Description:** Limited architecture documentation beyond code comments. No system design docs.

**Impact:**
- Harder for new developers to onboard
- Unclear system boundaries
- Risk of architectural drift
- Slower development velocity

**Evidence:**
- Some audit reports exist in repository
- No architecture decision records (ADRs)
- No system design diagrams
- No data flow documentation
- No service boundary documentation

**Recommended Resolution:**
1. Create architecture decision records (ADRs)
2. Document system design with diagrams
3. Document data flows
4. Document service boundaries
5. Create onboarding guide for developers
6. Document deployment architecture

**Estimated Effort:** 2-3 weeks

**Priority:** MEDIUM

---

### Debt 10: Manual Database Migrations

**Location:** Supabase SQL files

**Description:** Database migrations are manual SQL files executed via Supabase SQL Editor. No automated migration system.

**Impact:**
- Risk of human error
- No migration history tracking
- No rollback automation
- Slower deployment process
- Risk of schema drift

**Evidence:**
- `supabase/*.sql` files are manual
- No migration tool (Prisma Migrate, Flyway, etc.)
- No migration versioning
- Manual execution via Supabase dashboard
- No automated rollback

**Recommended Resolution:**
1. Implement migration tool (Prisma Migrate recommended)
2. Version all migrations
3. Automate migration in CI/CD
4. Implement rollback capability
5. Add migration testing
6. Document migration process

**Estimated Effort:** 2-3 weeks

**Priority:** MEDIUM

---

### Debt 11: No Environment Configuration Management

**Location:** Environment variables

**Description:** Environment variables are managed manually in Vercel dashboard. No configuration management system.

**Impact:**
- Risk of configuration drift
- No environment parity
- Manual configuration updates
- Risk of secrets exposure

**Evidence:**
- `.env.example` exists but minimal
- No configuration validation
- No environment-specific configs
- Manual Vercel dashboard management
- No secrets rotation strategy

**Recommended Resolution:**
1. Implement configuration validation
2. Add environment-specific configs
3. Use secrets manager (Vercel env or external)
4. Implement secrets rotation
5. Add configuration documentation
6. Automate environment setup

**Estimated Effort:** 1-2 weeks

**Priority:** MEDIUM

---

### Debt 12: Limited Error Handling

**Location:** API routes and services

**Description:** Error handling is inconsistent. Some endpoints have detailed errors, others have generic messages.

**Impact:**
- Poor user experience
- Harder debugging
- Inconsistent error responses
- No error classification

**Evidence:**
- Some routes return detailed errors
- Some routes return generic "Internal server error"
- No error classification system
- No error tracking integration
- No user-friendly error messages

**Recommended Resolution:**
1. Implement consistent error handling middleware
2. Classify error types (validation, auth, system, etc.)
3. Add user-friendly error messages
4. Integrate with error tracking (Sentry)
5. Add error logging
6. Document error handling strategy

**Estimated Effort:** 2-3 weeks

**Priority:** MEDIUM

---

## Low Technical Debt

### Debt 13: No Code Formatting Standard

**Location:** Codebase

**Description:** Prettier may be configured but not consistently enforced. Code style may vary.

**Impact:**
- Inconsistent code style
- Code review friction
- Minor maintainability issue

**Evidence:**
- ESLint configured but Prettier not visible
- No pre-commit hooks visible
- Code style appears consistent but not enforced

**Recommended Resolution:**
1. Configure Prettier
2. Add pre-commit hooks (Husky)
3. Add lint-staged
4. Enforce in CI/CD
5. Document code style guide

**Estimated Effort:** 1 week

**Priority:** LOW

---

### Debt 14: No Dependency Vulnerability Scanning

**Location:** package.json

**Description:** No automated dependency vulnerability scanning in CI/CD.

**Impact:**
- Security risk from vulnerable dependencies
- Manual dependency updates
- Risk of supply chain attacks

**Evidence:**
- No Snyk or Dependabot visible
- No vulnerability scanning in CI/CD
- Manual dependency management

**Recommended Resolution:**
1. Add Dependabot for GitHub
2. Implement Snyk or similar
3. Add vulnerability scanning to CI/CD
4. Automate dependency updates
5. Document dependency policy

**Estimated Effort:** 1 week

**Priority:** LOW

---

### Debt 15: No Performance Budgeting

**Location:** Frontend build

**Description:** No performance budgets or bundle size limits configured.

**Impact:**
- Potential bundle bloat
- Slow page loads
- Poor user experience

**Evidence:**
- No webpack-bundle-analyzer visible
- No performance budgets in Next.js config
- No bundle size limits

**Recommended Resolution:**
1. Add bundle size monitoring
2. Set performance budgets
3. Add webpack-bundle-analyzer
4. Monitor Core Web Vitals
5. Optimize bundle size

**Estimated Effort:** 1-2 weeks

**Priority:** LOW

---

## Technical Debt Summary

### Critical Debt (Immediate Action)
1. Dual database strategy - 4-6 weeks
2. No payment processing - 4-6 weeks

### High Debt (Near-Term Action)
3. Legacy AI engine not removed - 1-2 weeks
4. Limited monitoring - 2-4 weeks
5. No automated testing - 4-6 weeks
6. No CI/CD pipeline - 2-4 weeks
7. Missing database indexes - 1-2 weeks

### Medium Debt (Short-Term Action)
8. No API documentation - 2-3 weeks
9. No architecture documentation - 2-3 weeks
10. Manual database migrations - 2-3 weeks
11. No environment configuration - 1-2 weeks
12. Limited error handling - 2-3 weeks

### Low Debt (Monitor)
13. No code formatting - 1 week
14. No vulnerability scanning - 1 week
15. No performance budgeting - 1-2 weeks

## Total Technical Debt Effort

**Critical:** 8-12 weeks
**High:** 10-18 weeks
**Medium:** 8-13 weeks
**Low:** 3-5 weeks

**Total:** 29-48 weeks (7-12 months) to resolve all identified technical debt

## Recommended Technical Debt Resolution Plan

### Phase 1 (Months 1-2): Critical Debt
- Resolve dual database strategy
- Implement payment processing
- Add database indexes

### Phase 2 (Months 3-4): High Debt
- Remove legacy AI engine
- Implement monitoring and observability
- Add automated testing
- Build CI/CD pipeline

### Phase 3 (Months 5-6): Medium Debt
- Add API documentation
- Create architecture documentation
- Automate database migrations
- Improve error handling

### Phase 4 (Months 7-12): Low Debt
- Code formatting enforcement
- Dependency vulnerability scanning
- Performance budgeting

## Technical Debt Impact on Investment

**Investment Readiness Impact:** HIGH

The technical debt, particularly the dual database strategy and missing commercial infrastructure, significantly impacts investment readiness. The codebase is functional and production-ready, but the technical debt creates:
- Execution risk (dual database complexity)
- Commercial risk (no payment processing)
- Scalability risk (missing indexes, no monitoring)
- Maintainability risk (no testing, no CI/CD)

**Recommendation:** Address critical technical debt (dual database, payment processing) before investment due diligence. High and medium debt can be addressed post-investment with dedicated resources.

## Technical Debt Summary

Eunoia Platform has significant technical debt, primarily in commercial infrastructure (payment processing) and database complexity (dual database strategy). The codebase is functional and production-ready, but technical debt creates execution and scalability risks. Critical debt requires 8-12 weeks to resolve. Total technical debt resolution would take 7-12 months with dedicated resources. The technical debt is manageable but must be addressed for long-term scalability and investment readiness.

**Investment Readiness:** MEDIUM - Technical debt is significant but solvable with dedicated resources.

**Priority:** HIGH - Critical technical debt (payment processing, dual database) must be resolved before investment.
