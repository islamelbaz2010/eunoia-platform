# 18 — EVIDENCE REPORT
*Direct code citations for every major finding.*

---

## Evidence 1: Real Estate Cashflow Engine

**Claim:** Financial calculations are deterministic, not AI-generated
**File:** `app/api/intelligence/route.ts`

```typescript
// Lines 81-100 (calculateCashflow function)
function calculateCashflow(data: Record<string, string>) {
  const investment = parseNum(data.investment, 5000000)
  const price_per_sqm = parseNum(data.price_per_sqm, 15000)
  // ... 120 lines of pure TypeScript math
  const npv = cashflows.reduce((acc, cf, i) => {
    return acc + cf / Math.pow(1 + discountRate, i)
  }, -investment)
  return { npv, irr: calculateIRR(cashflows, investment), ... }
}

// Line 935 — calculateCashflow runs BEFORE the OpenAI call
const financialCalcs = reportType === 'feasibility'
  ? calculateCashflow(formData)
  : null
```

---

## Evidence 2: Egypt Market Benchmarks (Pre-Researched)

**Claim:** Egypt 2026 market data is domain expertise, not AI-generated
**File:** `app/api/intelligence/route.ts`

```typescript
const RE_BENCHMARKS = {
  developer: {
    cpl_meta: '300-800 EGP',
    cpl_google: '500-1200 EGP',
    cpl_tiktok: '150-400 EGP',
    avg_margin: '20-35%',
    net_margin: '10-20%',
    decision_cycle: '60-365 days',
    avg_ticket: '2M-20M EGP',
    cac: '5000-20000 EGP',
    market_size: 'EGP 600B Egypt real estate 2026',
    market_growth: '18% annually',
    city_multipliers: {
      'العاصمة الإدارية': 1.3,
      'الساحل الشمالي': 1.4,
      'الشيخ زايد': 1.1,
      // ...
    }
  }
}
```

---

## Evidence 3: halannews.com External Proxy

**Claim:** Demo AI generation routes through an external domain
**File:** `app/api/demo/generate/route.ts`, line 54

```typescript
const res = await fetch('https://halannews.com/api-proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'claude-opus-4-8',
    // ... lead data sent to external domain
  }),
})
```

---

## Evidence 4: Market Intelligence Is halannews.com Iframe

**Claim:** Market Intelligence page shows an iframe of a news website
**File:** `app/market-intelligence/page.tsx`

```typescript
if (!user) {
  redirect('/login')
}
// After auth check:
return (
  <iframe
    src="https://halannews.com/"
    style={{ width: '100%', height: '100vh', border: 'none' }}
  />
)
```

---

## Evidence 5: All Prisma Models Marked Legacy

**Claim:** Prisma is entirely legacy infrastructure
**File:** `prisma/schema.prisma`

```prisma
/// LEGACY: This User model is NOT used by the new Supabase-based routes.
/// Kept for historical data — do not drop.
model User {
  id          String   @id @default(cuid())
  // ...
}

/// LEGACY: This Workspace model is NOT the active plan system.
model Workspace {
  // ...
}

/// LEGACY: These Report types are all from the old AI engine.
/// The new Research Core Engine writes to Supabase `reports` table.
model Report {
  type        ReportType
  // ...
}
```

---

## Evidence 6: Debug Console Logs in Production

**Claim:** Last commit added debug logs to the leads API route
**File:** `app/api/research/leads/route.ts`, lines 1-3
**Git commit:** `31638d4 debug leads api`

```typescript
console.log("=== LEADS API START ===")
console.log("SERPAPI:", !!process.env.SERPAPI_API_KEY)
console.log("OPENAI:", !!process.env.OPENAI_API_KEY)
```

---

## Evidence 7: No Payment Code Anywhere

**Claim:** Zero Stripe/payment code exists
**Verification method:** File search across entire codebase
**Result:** No `stripe`, `paddle`, `payment`, `billing`, `checkout`, or `invoice` imports found in any active TypeScript/TSX file

The only billing-related code is plan definitions:
```typescript
// types/plan.types.ts
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  STARTER: { monthly: 20, label: 'STARTER', price_monthly: 0 },
  PROFESSIONAL: { monthly: 100, label: 'PROFESSIONAL', price_monthly: 0 },
  AGENCY: { monthly: 300, label: 'AGENCY', price_monthly: 0 },
  ENTERPRISE: { monthly: -1, label: 'ENTERPRISE', price_monthly: 0 },
}
```

Note: `price_monthly: 0` for all tiers — prices not set in code.

---

## Evidence 8: Rate Limiting Implementation

**Claim:** 5 requests/hour per user enforced in all AI routes
**File:** `lib/research/rate-limit.ts`

```typescript
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW = 3600 // 1 hour

export async function checkRateLimit(userId: string, module: string) {
  const key = `ratelimit:${module}:${userId}`
  const result = await ratelimit.limit(key)
  if (!result.success) {
    return { ok: false, message: 'Rate limit exceeded' }
  }
  return { ok: true }
}
```

---

## Evidence 9: Multi-Tenant Isolation

**Claim:** All data queries are scoped to the authenticated user
**File:** `app/api/intelligence/route.ts` (representative sample)

```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser()
if (authError || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// All subsequent DB operations use user.id
await supabase.from('reports').insert({
  user_id: user.id,  // ← always scoped to authenticated user
  report_type: reportType,
  report_data: report,
})
```

---

## Evidence 10: Security Fix Commits in Git History

**Claim:** Multi-tenant security was audited and fixed
**Git log:**

```
84995c2 fix(security): close the two HIGH findings from the multi-tenant audit
f25aab8 fix(security): close three multi-tenant gaps in the Research Core Engine
```

These commits explicitly reference security audit findings and their resolution.

---

## Evidence 11: Plan Enforcement Fail-Open

**Claim:** System allows requests if Supabase/Redis is unavailable
**File:** `lib/research/plan-enforcement.ts`

```typescript
} catch (error) {
  // Fail open on infrastructure errors — don't block users
  // if plan check infrastructure is unavailable
  return { ok: true, plan: 'STARTER', used: 0, limit: 20 }
}
```

**File:** `lib/research/rate-limit.ts`

```typescript
} catch {
  // Fail open — if Redis is down, don't block requests
  return { ok: true }
}
```

---

## Evidence 12: Coming Soon Stubs (No Backend Code)

**Claim:** 4 of 6 research modules are UI stubs only
**File:** `app/dashboard/research/page.tsx`

```typescript
const SOON_MODULES = [
  {
    id: 'competitor',
    title: 'Competitor Intelligence',
    description: '...',
    soon: true,
  },
  {
    id: 'market',
    title: 'Market Intelligence Research',
    soon: true,
  },
  {
    id: 'supplier',
    title: 'Supplier Intelligence',
    soon: true,
  },
  {
    id: 'recruitment',
    title: 'Recruitment Intelligence',
    soon: true,
  },
]
```

No backend routes exist for any of these. Confirmed by file listing of `app/api/research/` — only `leads/` and `talent/` subdirectories exist.
