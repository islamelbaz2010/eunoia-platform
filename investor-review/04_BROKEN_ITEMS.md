# Eunoia Platform - Broken Items and Issues

**Generated:** July 7, 2026  
**Repository:** eunoia-platform

## Summary

**Total Issues Identified:** 10  
**Critical Issues:** 0  
**High Priority Issues:** 3  
**Medium Priority Issues:** 4  
**Low Priority Issues:** 3  

**Note:** All identified issues are non-critical. The platform is production-ready and live at https://ai.halannews.com. These items represent technical debt, missing features, or architectural inconsistencies that should be addressed for long-term maintainability.

---

## Critical Issues

**None identified.** The platform is fully functional in production.

---

## High Priority Issues

### 1. Dual Database System Not Reconciled

**Location:** prisma/schema.prisma vs supabase/*.sql  
**Severity:** High  
**Status:** UNKNOWN (requires investigation)  

**Description:**
The platform maintains two separate database systems:
- Supabase PostgreSQL (primary database for auth, reports, research_requests, user_plans, demo_leads)
- Prisma PostgreSQL (legacy User, Workspace, Report, ApiUsage models marked as legacy)

The Prisma models are marked as "LEGACY" in schema.prisma but are still used:
- User model used in lib/prisma/init-user.ts
- Workspace model used in app/api/workspace/route.ts
- Report and ApiUsage models kept for historical data

**Impact:**
- Two separate plan systems (Workspace.plan vs user_plans.plan)
- Potential data inconsistency
- Confusing for developers
- Maintenance burden

**Evidence:**
```prisma
// prisma/schema.prisma lines 37-39
/// LEGACY: powered the retired /dashboard/intelligence + /dashboard/feasibility pages.
/// No longer written to by any route. Kept for historical data — do not drop.
model Report {
```

```typescript
// types/plan.types.ts lines 4-9
/**
 * Per-user plan enforcement (research_requests/reports are user_id-scoped in
 * the live Supabase data model — see FINAL_PLATFORM_AUDIT.md). Deliberately
 * separate from types/workspace.types.ts's Workspace-level Plan/PLAN_LIMITS,
 * which is a Prisma-backed concept never wired into the live research
 * routes. Reconciling the two (workspace seats vs. per-user usage) is a
 * Priority 3 decision in MASTER_EXECUTION_PLAN.md, not resolved here.
 */
```

**Recommended Action:**
Migrate all Prisma-based functionality to Supabase or clearly separate the systems. This is documented as a Priority 3 decision in MASTER_EXECUTION_PLAN.md.

---

### 2. Manual Plan Assignment Only

**Location:** supabase/plan-enforcement.sql, lib/research/plan-enforcement.ts  
**Severity:** High  
**Status:** By Design (roadmap item)  

**Description:**
Plan assignment is manual only. There is no billing webhook integration to automatically upgrade/downgrade user plans based on payment. The plan-enforcement.sql file states:

```sql
-- No insert/update policy for authenticated users: plan assignment is
-- intentionally not self-service in this phase. Writes go through the
-- service-role key (manual admin action today, a billing webhook later),
-- which bypasses RLS by default in Supabase.
```

**Impact:**
- Manual overhead for plan changes
- No self-service upgrade flow
- Scalability limitation for large user base
- Poor user experience for plan changes

**Evidence:**
```sql
-- supabase/plan-enforcement.sql lines 19-22
-- No insert/update policy for authenticated users: plan assignment is
-- intentionally not self-service in this phase. Writes go through the
-- service-role key (manual admin action today, a billing webhook later),
-- which bypasses RLS by default in Supabase.
```

**Recommended Action:**
Implement billing webhook integration (Stripe, Paddle, or local payment gateway) to automate plan assignment.

---

### 3. Legacy PHP Security Model

**Location:** api.php, auth.php  
**Severity:** High  
**Status:** Isolated (not integrated with Next.js)  

**Description:**
Legacy PHP files use a different security model than the Next.js app:
- File-based user storage (users.json)
- Session-based authentication without Supabase integration
- SSL verification disabled in stream context
- No Row-Level Security equivalent

**Impact:**
- Security inconsistency if PHP files are ever integrated
- Potential security vulnerability if exposed
- Maintenance burden
- Confusing security model

**Evidence:**
```php
// api.php lines 71-74
'ssl' => [
  'verify_peer'      => false,
  'verify_peer_name' => false,
]
```

```php
// auth.php lines 6-12
$usersFile = __DIR__ . '/users.json';
if (!file_exists($usersFile)) {
  echo json_encode(['success' => false, 'message' => 'Auth system not configured']);
  exit;
}
```

**Recommended Action:**
Either remove legacy PHP files or integrate them with Supabase authentication. If keeping, enable SSL verification and migrate to database-backed user storage.

---

## Medium Priority Issues

### 4. Four Research Modules Marked "Coming Soon"

**Location:** app/dashboard/research/page.tsx  
**Severity:** Medium  
**Status:** By Design (roadmap)  

**Description:**
Research Hub shows 4 modules as "Coming Soon" with no timeline:
- Competitor Intelligence
- Market Intelligence Research (custom)
- Supplier Intelligence
- Recruitment Intelligence

**Impact:**
- Incomplete feature set
- User expectations not managed
- Competitive disadvantage
- Revenue opportunity cost

**Evidence:**
```typescript
// app/dashboard/research/page.tsx lines 39-44
const SOON_MODULES = [
  { icon: '🏢', title: 'Competitor Intelligence', desc: 'Deep-dive competitor positioning, pricing, and campaign analysis.' },
  { icon: '📈', title: 'Market Intelligence Research', desc: 'Custom market-sizing and opportunity research on demand.' },
  { icon: '📦', title: 'Supplier Intelligence', desc: 'Vendor and supplier discovery for procurement teams.' },
  { icon: '🧭', title: 'Recruitment Intelligence', desc: 'Full-cycle hiring pipeline research and market mapping.' },
]
```

**Recommended Action:**
Define and communicate roadmap timeline for these modules, or remove placeholders if not planned.

---

### 5. No Visible Migration System for Supabase

**Location:** supabase/*.sql files  
**Severity:** Medium  
**Status:** UNKNOWN (may exist but not visible)  

**Description:**
Supabase schema changes are managed via SQL files that must be manually run in Supabase SQL Editor. No visible migration system (like Supabase Migrations or a custom migration runner) was found in the repository.

**Impact:**
- Manual process for schema changes
- Risk of schema drift between environments
- No version control for database schema
- Difficult to rollback changes

**Evidence:**
```sql
-- supabase/research-tables.sql lines 1-2
-- Run this in Supabase SQL Editor
-- Research Intelligence Hub — request/queue/status pipeline
```

**Recommended Action:**
Implement Supabase Migrations or a custom migration system to track and version database schema changes.

---

### 6. No Visible Backup Strategy Documentation

**Location:** UNKNOWN (not found in repository)  
**Severity:** Medium  
**Status:** UNKNOWN (may exist but not documented in code)  

**Description:**
No documentation found regarding backup strategy, disaster recovery, or data retention policies for Supabase or Prisma databases.

**Impact:**
- Risk of data loss
- No documented recovery procedures
- Compliance risk
- Business continuity risk

**Evidence:**
No backup-related files found in repository root or documentation.

**Recommended Action:**
Document backup strategy, retention policies, and disaster recovery procedures. Consider automated backup solutions.

---

### 7. Type Assertions in API Routes

**Location:** app/api/research/leads/route.ts, app/api/research/talent/route.ts  
**Severity:** Medium  
**Status:** Technical debt  

**Description:**
Several API routes use `as any` type assertions for Supabase client because types/supabase.types.ts doesn't cover research_requests/user_plans tables.

**Impact:**
- Loss of type safety
- Potential runtime errors
- Maintenance burden
- Poor developer experience

**Evidence:**
```typescript
// app/api/research/leads/route.ts lines 70-71
// `research_requests`/`reports`/`user_plans` aren't in the generated Supabase types yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any
```

**Recommended Action:**
Generate complete Supabase types or create manual type definitions for all tables.

---

## Low Priority Issues

### 8. Optional Dependencies Required for Full Functionality

**Location:** .env.example, lib/research/acquisition/  
**Severity:** Low  
**Status:** By Design  

**Description:**
Some features require optional environment variables:
- SERPAPI_API_KEY (optional but Lead Finder has limited functionality without it)
- UPSTASH_REDIS_REST_URL (optional but rate limiting fails open without it)
- APOLLO_API_KEY (optional enrichment only)

**Impact:**
- Degraded functionality without optional dependencies
- Graceful degradation may confuse users
- Documentation may not clearly communicate requirements

**Evidence:**
```bash
# .env.example lines 12-14
# Redis (optional — required for rate limiting and caching)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

**Recommended Action:**
Improve documentation to clearly communicate which features require which optional dependencies.

---

### 9. Demo Page Hardcoded Exhibition Date

**Location:** app/demo/page.tsx  
**Severity:** Low  
**Status:** Maintenance issue  

**Description:**
Demo page has hardcoded exhibition date "June 5, 2026" which will become outdated.

**Impact:**
- Outdated information
- Poor user experience
- Requires manual update for each exhibition

**Evidence:**
```typescript
// app/demo/page.tsx line 67
<div className="text-xs text-gray-400">🏢 Real Estate Developer Exhibition — June 5, 2026</div>
```

**Recommended Action:**
Make exhibition date configurable via environment variable or CMS.

---

### 10. No Visible Staging Environment

**Location:** vercel.json, deployment configuration  
**Severity:** Low  
**Status:** UNKNOWN (may exist but not visible in code)  

**Description:**
No visible staging environment configuration found. Repository appears to deploy directly to production.

**Impact:**
- Risk of deploying untested code to production
- No testing environment for new features
- Difficult to test with production-like data

**Evidence:**
```json
// vercel.json
{
  "buildCommand": "npm install && npx prisma generate && npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

**Recommended Action:**
Configure staging environment in Vercel or separate deployment pipeline.

---

## Non-Issues (Documented as Intentional)

### Fail-Open Design for Rate Limiting and Plan Enforcement

**Location:** lib/research/rate-limit.ts, lib/research/plan-enforcement.ts  
**Status:** By Design  

**Description:**
Both rate limiting and plan enforcement fail open (allow requests) if infrastructure fails (Redis unavailable, Supabase error). This is intentional to avoid blocking paying customers during infrastructure hiccups.

**Evidence:**
```typescript
// lib/research/rate-limit.ts lines 29-31
} catch {
  return { ok: true, resetIn: 0 }
}
```

```typescript
// lib/research/plan-enforcement.ts lines 56-58
} catch {
  return { ok: true, used: 0, limit: PLAN_LIMITS.STARTER.reportsPerMonth, plan: 'STARTER' }
}
```

**Assessment:** This is a reasonable design choice for a SaaS product. Not considered an issue.

---

### Legacy AI Engine Kept for Future Reuse

**Location:** services/legacy-ai-engine/  
**Status:** By Design  

**Description:**
Legacy AI Engine (30 report types) is kept but not wired to any routes. Documented as kept for future reuse in Competitor Intelligence and Supplier Intelligence modules.

**Evidence:**
```markdown
// services/legacy-ai-engine/README.md lines 5-9
This is the generic, multi-provider report orchestration engine that powered the
retired `/dashboard/intelligence` and `/dashboard/feasibility` pages (30 report
types: COMPETITOR, PRICING, CAMPAIGN, CLV_RETENTION, market entry, content/SEO,
crisis, sentiment, etc.). It is no longer wired to any route, but it is kept —
not deleted — for future reuse
```

**Assessment:** Reasonable technical decision to preserve code assets. Not considered an issue.

---

## Summary Table

| Issue | Severity | Status | Action Required |
|-------|----------|--------|-----------------|
| Dual Database System | High | UNKNOWN | Reconcile or separate systems |
| Manual Plan Assignment | High | Roadmap | Implement billing webhook |
| Legacy PHP Security | High | Isolated | Remove or integrate with Supabase |
| Coming Soon Modules | Medium | Roadmap | Define timeline or remove |
| No Migration System | Medium | UNKNOWN | Implement Supabase Migrations |
| No Backup Documentation | Medium | UNKNOWN | Document backup strategy |
| Type Assertions | Medium | Technical Debt | Generate complete types |
| Optional Dependencies | Low | By Design | Improve documentation |
| Hardcoded Demo Date | Low | Maintenance | Make configurable |
| No Staging Environment | Low | UNKNOWN | Configure staging |

---

## Recommendations

**Immediate (Next 30 days):**
1. Generate complete Supabase types to remove `as any` assertions
2. Document backup strategy and disaster recovery procedures
3. Make demo page exhibition date configurable

**Short-term (Next 90 days):**
1. Implement Supabase Migrations for schema versioning
2. Define roadmap timeline for coming soon modules
3. Configure staging environment

**Long-term (Next 6 months):**
1. Reconcile dual database system (Supabase vs Prisma)
2. Implement billing webhook for automated plan assignment
3. Remove or integrate legacy PHP files with Supabase auth
4. Improve documentation for optional dependencies

---

## Conclusion

The Eunoia Platform is production-ready with no critical issues. All identified items are either intentional design choices, roadmap items, or technical debt that can be addressed incrementally without impacting current operations. The platform is live and functional at https://ai.halannews.com.
