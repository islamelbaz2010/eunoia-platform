# Executive Summary — Eunoia Platform Forensic Audit

**Date:** 2026-07-06  
**Branch audited:** `claude/blissful-newton-Sdej0` (merged to `main` via PR #9)  
**Audited by:** Claude Code — CTO / Principal Architect / Staff Backend+Frontend / DevOps / DB / Security / QA / PM / TPM

---

## 1. Project Health Score: 47 / 100

| Dimension | Score | Verdict |
|---|---|---|
| Architecture | 58/100 | Functional but fragmented — two data layers, external AI proxy |
| Performance | 62/100 | No algorithmic bugs; NFT bloat, dead client boundaries |
| Security | 28/100 | Committed secrets; external AI proxy leak; no security headers |
| Code Quality | 61/100 | Strict TS, good tests; unchecked `core/`/`services/` boundary |
| Maintainability | 44/100 | Split types, 26 stale docs, broken lint, no CI gate |
| Scalability | 55/100 | Rate limiting & quotas correct; missing indexes; no migration history |
| DevOps | 32/100 | No migrations, no CI, double-install, broken lint pipeline |
| Observability | 15/100 | No error tracking, no structured logging |
| Testing | 52/100 | 109 tests, all passing; zero integration/e2e; not run in CI |
| Documentation | 30/100 | 26 conflicting audit docs, no single source of truth |

---

## 2. Production Readiness Score: 29 / 100

**NOT production ready.** Multiple stop-ship blockers exist.

### Stop-Ship (P0) Blockers

1. **`users.json` committed to git with real bcrypt password hashes** — Three named accounts with active credentials. Treat as already-compromised. Requires git history rewrite, not just file deletion.

2. **All AI calls routed through `halannews.com/api-proxy`** — Every prompt from authenticated users (demo generation, market intelligence) is transmitted to an external, third-party server with no documented SLA, privacy policy, or data-processing agreement. This is a data leak by architecture, not just a risk.

3. **`app/market-intelligence/page.tsx` embeds `halannews.com` in an authenticated iframe** — An authenticated user's session context is exposed to a third-party site inside the authenticated shell. The user's email is rendered in the same DOM. This is a trust boundary violation with phishing and credential-harvesting risk.

4. **No Prisma migration history** — Zero `prisma/migrations/` directory. Live schema has never been version-controlled. Any production database edit is an undetectable, unrecoverable divergence from `schema.prisma`.

5. **NFT bloat: 24.66MB of unrelated content in 4 serverless bundles** — Root cause: custom Prisma generator `output` path triggers `process.cwd()`-based runtime fallback. Confirmed via `.nft.json` inspection.

6. **Build pipeline redundancy** — Vercel runs `npm install` + `postinstall` (prisma generate) before executing `vercel.json`'s `buildCommand`, which runs `npm install` again → `postinstall` again → explicit `npx prisma generate`. 2× installs, 3× codegen per deploy.

7. **`next lint` removed in Next.js 16; no working lint step exists** — `eslint-config-next@15.3.0` exports legacy `.eslintrc`-style config only; ESLint 9 requires flat config. No `eslint.config.mjs` exists. Zero static analysis gate on any PR.

8. **`tsconfig.json` `baseUrl` deprecated** — Will stop functioning in TypeScript 7.0 (current: 5.9.3). Production path aliases will silently break on next major TS upgrade.

---

## 3. What Is Complete

| Feature | Status | Evidence |
|---|---|---|
| Auth (login, signup, forgot-password, email-confirm callback) | ✅ Complete | `app/(auth)/`, `app/auth/callback/route.ts` |
| Supabase auth integration (`@supabase/ssr`) | ✅ Complete | `lib/supabase/server.ts`, `proxy.ts` |
| Prisma user/workspace bootstrap | ✅ Complete | `lib/prisma/init-user.ts`, transaction-wrapped |
| Onboarding flow | ✅ Complete | `app/dashboard/onboarding/page.tsx` |
| Dashboard home | ✅ Complete | `app/dashboard/page.tsx` with real Supabase queries |
| Real Estate Intelligence (feasibility/launch/campaign) | ✅ Complete | `app/api/intelligence/route.ts` (1051 lines), `app/dashboard/real-estate/page.tsx` (1111 lines) |
| Research Intelligence Hub — Lead Finder | ✅ Complete | `app/api/research/leads/route.ts`, Research Core Engine |
| Research Intelligence Hub — Talent Finder | ✅ Complete | `app/api/research/talent/route.ts` |
| Research Core Engine (Search→Collect→Validate→Dedup→Rank→Enrich→AI) | ✅ Complete | `lib/research/acquisition/` |
| Report history | ✅ Complete | `app/dashboard/reports/page.tsx` |
| Demo / free trial | ✅ Complete | `app/demo/page.tsx`, `app/api/demo/route.ts`, `app/api/demo/generate/route.ts` |
| Rate limiting (per-user hourly + daily search quota) | ✅ Complete | `lib/research/rate-limit.ts`, `lib/research/acquisition/quota.ts` |
| Plan enforcement (monthly report limits) | ✅ Complete | `lib/research/plan-enforcement.ts`, `supabase/plan-enforcement.sql` |
| Redis caching (24h for research results) | ✅ Complete | `lib/redis/cache.ts` |
| Apollo.io optional enrichment | ✅ Complete | `lib/research/acquisition/apollo-adapter.ts` |
| 11 unit test files (109 tests, all passing) | ✅ Passing | `vitest run` — 1.22s |

---

## 4. What Is Partially Complete

| Feature | Status | Gap |
|---|---|---|
| Settings page | ⚠️ 20% | Read-only display of email/user ID. No workspace management, no plan UI, no API key management, no invite flow |
| Plan/subscription | ⚠️ 30% | Infrastructure exists (user_plans table, PLAN_LIMITS, enforcement checks) but no payment processor, no self-service upgrade, no billing webhook |
| Analytics page (`app/dashboard/analytics/page.tsx`) | ⚠️ Static | Renders as `'use client'` with static market trend content. No real analytics data. Name is misleading — it's a market context guide, not usage analytics |
| Market Intelligence (`app/market-intelligence/page.tsx`) | ⚠️ External | Iframe to `halannews.com` only. No real product functionality — it embeds an external site |
| Security headers | ⚠️ 0% | Identified as missing; not yet implemented |
| Type safety (`core/`/`services/`) | ⚠️ 0% | Excluded from `tsconfig.json` `exclude`; imported live by production routes |

---

## 5. What Is Broken

| Item | Evidence | Severity |
|---|---|---|
| `npm run lint` | `next lint` command removed in Next.js 16; exits code 127 | HIGH |
| Prisma client type declarations | `tsc --noEmit` errors on `Cannot find module './generated'` when Prisma client not generated | HIGH (build-order dependency) |
| `baseUrl` deprecation | `tsconfig.json(47,5): error TS5101` | MEDIUM (future break) |
| No migration system | Zero `prisma/migrations/` dir | CRITICAL |
| `use-workspace.ts` hook calling dead `/api/workspace` endpoint | Hook exists, endpoint confirmed zero frontend consumers except this hook — circular dead dependency | MEDIUM |

---

## 6. What Is Dead Code

| Item | Evidence |
|---|---|
| `services/legacy-ai-engine/` (orchestrator, prompt-builder, 30 prompts, providers) | README confirms retired; no route imports it |
| `app/api/workspace/route.ts` | Confirmed zero frontend callers (grep for `/api/workspace`); only caller is dead `use-workspace.ts` hook |
| `hooks/use-workspace.ts` | Only calls the dead `/api/workspace` endpoint |
| `components/motion/fade-in.tsx` + `framer-motion` dep | Zero usages under `app/` |
| `Prisma Report` model + `ApiUsage` model + `ReportStatus`/`ReportType` enums | Schema comments confirm LEGACY; no live code writes to them |
| `lib/redis/cache.ts` exports `cacheDel`, `cacheGetOrSet` | Unused exports confirmed |
| `lib/research/source-quality.ts` exports `BrokenPageCheck`, `detectBrokenPage` | Unused named exports |
| `api.php`, `auth.php`, `config.example.php`, `eunoia-worker.js`, `feasibility.html`, `index.html`, `test.php` | Legacy PHP stack; never wired to Next.js |
| `text.txt`, `text 2.txt` through `text 6.txt` | Stray debug files |
| 26 root-level `*.md` audit/report files | All tracked in git; content superseded; contributing to NFT bundle bloat |
| `Eunoia_Platform_Analysis_Final.xlsx`, `IMG_0070.jpeg`–`IMG_0073.jpeg` | Binary clutter tracked in git |
| `ai` package (Vercel AI SDK) | Installed; zero imports (`openai` SDK used directly) |
| `@upstash/ratelimit` package | Installed; zero imports |
| `sonner` package | Installed; zero imports |
| `framer-motion` package | Installed; only dead `fade-in.tsx` consumer |
| 8 Radix UI packages (`-dialog`, `-dropdown-menu`, `-label`, `-progress`, `-scroll-area`, `-select`, `-tabs`, `-tooltip`) | `components/ui/` contains only `badge`, `button`, `card`, `switch` |

---

## 7. What Is Missing (Blocks Production/Scale/Monetization)

| Missing Item | Category | Impact |
|---|---|---|
| Payment processor (Stripe/Paddle) | Monetization | Cannot charge users |
| Self-service plan upgrade | Monetization | Manual admin action required |
| Billing webhook handler | Monetization | Plan assignment stuck as manual |
| Email for `hello@eunoia.eg` to exist | Monetization | Settings page points to it |
| Prisma migration history | Database | Schema drift undetectable |
| Working ESLint config | DevOps | Zero static analysis gate |
| CI/CD pipeline (GitHub Actions) | DevOps | Tests never run automatically |
| Security headers (CSP, HSTS, X-Frame-Options) | Security | Browser-level protections absent |
| Error tracking (Sentry/equivalent) | Observability | Zero production error visibility |
| Structured logging | Observability | Only `console.*` |
| User/workspace management UI | Product | No invite, no role management |
| Admin panel | Product | Plan assignment requires DB access |
| Password reset flow (forgot-password page exists but what backend?) | Auth | Page exists but endpoint unclear |
| `supabase/` SQL files executed in production | Database | Applied manually? No migration tooling |
| E2E tests (Playwright) | QA | Zero browser-level test coverage |

---

## 8. Immediate Next Actions (Ordered)

See `/audit/roadmap.md` for the full P0–P3 roadmap with effort, impact, and risk ratings.

**Day 1:** Rotate and revoke the 3 accounts in `users.json` → remove from git history (BFG/filter-repo) → verify `halannews.com` data-sharing terms and build an internal AI proxy or switch to direct OpenAI calls → restrict `images.remotePatterns`.

**Day 2:** Baseline Prisma migrations → fix `vercel.json` build pipeline → add `eslint.config.mjs` and fix `npm run lint` → add security headers to `next.config.ts`.

**Day 3:** Wire up a payment processor (Stripe) → add GitHub Actions CI → delete dead code and packages → delete/archive 26 root-level audit docs.
