# 15 — Testing

**Evidence basis:** All `*.test.ts` files, `vitest.config.ts`, `package.json` test script.

---

## Testing Framework

**Framework:** Vitest 4.1.9  
**Test runner:** `vitest run` (one-time, no watch)  
**Environment:** Node  
**Coverage:** Not configured (no `coverage` script in package.json)

---

## Test File Inventory

| Test File | Tests | Category | Verified Status |
|---|---|---|---|
| `lib/research/acquisition/ranker.test.ts` | Source ranking logic | Unit | Unknown |
| `lib/research/acquisition/quota.test.ts` | Daily quota enforcement | Unit | Unknown |
| `lib/research/acquisition/apollo-adapter.test.ts` | Apollo.io adapter | Unit | Unknown |
| `lib/research/company-expansion.test.ts` | Company domain expansion | Unit | Unknown |
| `lib/research/company-size.test.ts` | Company size parsing | Unit | Unknown |
| `lib/research/company-validation.test.ts` | Source validation | Unit | Unknown |
| `lib/research/decision-makers.test.ts` | Decision maker recommendations | Unit | Unknown |
| `lib/research/dedup.test.ts` | Company deduplication | Unit | Unknown |
| `lib/research/source-quality.test.ts` | Parked domain + broken page detection | Unit | Unknown |
| `lib/prisma/init-user.test.ts` | Prisma user initialization | Integration-ish | Unknown |
| `app/api/users/init/route.test.ts` | User init API route | Unit/Integration | Unknown |

**Total:** 11 test files  
**Coverage estimate:** Research Core Engine pipeline is approximately 60% unit-tested. API routes, intelligence engine, talent route, and frontend are 0% tested.

---

## Testing Gaps

### No tests for:
| Gap | Risk |
|---|---|
| `/api/intelligence` route | Zero coverage on the primary revenue-generating endpoint |
| `/api/research/leads` route | Zero coverage on Lead Finder API layer |
| `/api/research/talent` route | Zero coverage |
| All 5 Real Estate report prompt builders | No validation that prompts produce valid JSON schema |
| Cashflow engine (`calculateCashflow`) | Deterministic financial engine has no regression tests |
| Campaign ROI calculator (`calculateCampaignROI`) | No tests |
| Auth flows | No E2E auth tests |
| Middleware route protection | No integration test |
| Frontend components | No component tests |

### Critical Untested Path: Cashflow Engine
`app/api/intelligence/route.ts:81–198` contains `calculateCashflow()` — a deterministic financial engine producing NPV, IRR, ROI, and cashflow projections for real estate projects. This is the core financial calculation that users trust for project go/no-go decisions. **There are zero tests for this function.**

A regression in `calculateCashflow` would produce incorrect financial advice to paying customers with no automated detection.

**Estimated effort to add tests:** 1 day.

---

## Test Infrastructure Quality

**`vitest.config.ts`** correctly defines path aliases matching `tsconfig`:
```typescript
resolve: {
  alias: {
    '@/': path.resolve(__dirname, './') + '/',
    '@core/': path.resolve(__dirname, './core/') + '/',
  }
}
```
This allows tests to use the same import aliases as production code. ✅

**No test database / mocking:** Tests in `lib/prisma/init-user.test.ts` and `lib/research/acquisition/quota.test.ts` may require live external services (Supabase, Redis). If they do, they are integration tests that cannot run in CI without credentials — and there is no CI to run them in.

---

## Testing Maturity Assessment

| Dimension | Score | Evidence |
|---|---|---|
| Unit test coverage (research pipeline) | 3/5 | 9 test files covering core pipeline modules |
| Unit test coverage (AI/report engine) | 0/5 | No tests for intelligence route or cashflow engine |
| Integration test coverage | 0/5 | No integration tests against real services |
| E2E test coverage | 0/5 | No Playwright, Cypress, or similar |
| CI test execution | 0/5 | No CI configured |
| **Overall** | **0.6/5** | |

---

## Recommendations

| Priority | Action | Effort |
|---|---|---|
| P0 | Add tests for `calculateCashflow()` | 1 day |
| P1 | Add `vitest run` to CI (GitHub Actions) | 1 day |
| P1 | Add `vitest --coverage` and set a minimum coverage threshold | 1 day |
| P2 | Mock external services (OpenAI, SerpAPI, Supabase) for route-level unit tests | 1 week |
| P2 | Add Playwright E2E tests for critical flows (login, generate report, export CSV) | 1 week |
| P3 | Add tests for campaign ROI, market entry, lead gen calculators | 3 days |
