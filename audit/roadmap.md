# Prioritized Roadmap

---

## P0 — Stop-Ship: Must complete before any production users

### P0-1: Remove `users.json` from git history and rotate credentials
- **Why:** Real bcrypt password hashes committed to git. ANY repo access (current or historical) exposes them. The hashes also end up inside NFT-bundled serverless functions.
- **Risk:** CRITICAL — if any of the 3 passwords were reused on live services, those are currently exposed
- **Expected impact:** Closes the highest-severity security finding; eliminates credential stuffing risk
- **Implementation cost:** S (BFG/filter-repo) + variable (credential rotation — depends on reuse extent)
- **Files affected:** `users.json`, `.gitignore`, git history
- **Steps:**
  1. Check each account (`islam.admin`, `eunoia.sales`, `eunoia.viewer`) against all live services (Supabase, OpenAI, Resend, Upstash, Vercel, hosting provider)
  2. Rotate/revoke any matching passwords
  3. `npx @git-filter-repo/cli --path users.json --invert-paths`
  4. Add `users.json` to `.gitignore`
  5. Force-push rewritten history; notify all collaborators to re-clone

---

### P0-2: Migrate AI inference off `halannews.com/api-proxy`
- **Why:** All user business intelligence queries are transmitted to an external server with no data processing agreement. The platform is unavailable if `halannews.com` is down.
- **Risk:** CRITICAL — data protection, availability, legal
- **Expected impact:** User data stays within Vercel ↔ OpenAI/Anthropic boundary; eliminates external single point of failure
- **Implementation cost:** M (3-5 days)
- **Files affected:** `app/api/demo/generate/route.ts`, `app/api/intelligence/route.ts`, `app/api/research/talent/route.ts`, `.env.example`
- **Steps:**
  1. `app/api/research/talent/route.ts` currently proxies to `halannews.com`. Replace with direct `openai.chat.completions.create()` call — same pattern already used in `lib/research/acquisition/ai-analysis.ts`
  2. `app/api/intelligence/route.ts` — same replacement
  3. `app/api/demo/generate/route.ts` — same replacement
  4. Remove `CLOUDFLARE_WORKER_URL` from `.env.example` and code
  5. Test all three routes with direct OpenAI calls

---

### P0-3: Replace `app/market-intelligence/page.tsx` iframe with real content
- **Why:** Entire "feature" is an iframe to `halannews.com` inside the authenticated dashboard. The user's email is rendered in the same DOM. Clipboard access is granted to the embedded site.
- **Risk:** HIGH — security trust boundary; not a real product feature
- **Expected impact:** Removes embedded external site from authenticated shell; eliminates clipboard access grant
- **Implementation cost:** M (depends on what the market intelligence content should be)
- **Files affected:** `app/market-intelligence/page.tsx`
- **Minimum fix:** Remove the iframe; show a "Coming Soon" placeholder or move the static market trend content from `app/dashboard/analytics/page.tsx` here

---

### P0-4: Establish Prisma migration history
- **Why:** Zero `prisma/migrations/`. Any schema change will cause a production crash (client queries columns that don't exist).
- **Risk:** HIGH
- **Expected impact:** Schema changes become safe, reviewable, and CI-testable
- **Implementation cost:** M
- **Files affected:** New `prisma/migrations/`, `vercel.json`
- **Steps:**
  1. `npx prisma migrate dev --name init --create-only`
  2. Verify generated SQL matches live schema
  3. `npx prisma migrate resolve --applied <migration-name>` against production
  4. Commit `prisma/migrations/`
  5. Update `vercel.json`: `"buildCommand": "prisma migrate deploy && next build"`

---

### P0-5: Fix the build pipeline
- **Why:** 2× `npm install` + 3× `prisma generate` per deploy; wastes build minutes and Vercel compute cost
- **Risk:** Low (correctness is fine; waste is the issue)
- **Expected impact:** ~50% faster deploys; lower Vercel build cost
- **Implementation cost:** XS (< 30 minutes)
- **Files affected:** `vercel.json`
- **Fix:** Delete the custom `buildCommand` override entirely

---

### P0-6: Restrict `images.remotePatterns` from wildcard
- **Why:** `hostname: '**'` enables SSRF via `/_next/image` — any HTTPS URL is fetchable server-side
- **Risk:** Medium-High
- **Expected impact:** Closes `/_next/image` as a SSRF-capable endpoint
- **Implementation cost:** XS (< 15 minutes)
- **Files affected:** `next.config.ts`
- **Fix:** Either remove the `images` block (no external images used) or restrict to actual domains

---

### P0-7: Fix NFT bundle bloat (Prisma custom output path)
- **Why:** 24.66MB of unrelated project content (including `users.json` with secrets) bundled into serverless functions
- **Risk:** Security (secrets in bundle) + Performance (cold starts)
- **Expected impact:** ~24MB smaller serverless functions; secrets no longer bundled; NFT warning resolved
- **Implementation cost:** S (< 2 hours)
- **Files affected:** `prisma/schema.prisma`, `lib/prisma/client.ts`, `lib/prisma/init-user.ts`
- **Steps:**
  1. Remove `output = "../lib/prisma/generated"` from `schema.prisma`
  2. Update `lib/prisma/client.ts`: change `from './generated'` to `from '@prisma/client'`
  3. Update `lib/prisma/init-user.ts`: change `from './generated'` to `from '@prisma/client'`
  4. Run `npx prisma generate`
  5. `next build` — verify NFT warning is gone

---

### P0-8: Fix working ESLint setup
- **Why:** `npm run lint` exits with code 127 (command not found). Zero static analysis on any code.
- **Risk:** HIGH (bugs and security issues ship without linting)
- **Expected impact:** ESLint runs; catches hook dependency bugs, unused vars, accessibility issues
- **Implementation cost:** S
- **Files affected:** `package.json`, new `eslint.config.mjs`, `package.json` devDependencies
- **Steps:**
  1. `npm install --save-dev eslint-config-next@^16.2.9`
  2. Create `eslint.config.mjs` importing the flat config
  3. Change `"lint"` script to `"eslint ."`

---

### P0-9: Add security headers
- **Why:** No CSP, no `X-Frame-Options`, no HSTS, no `X-Content-Type-Options`
- **Risk:** HIGH (browser-level attack surface)
- **Expected impact:** Standard browser security protections enabled
- **Implementation cost:** S
- **Files affected:** `next.config.ts`
- **Fix:** Add `headers()` export returning standard security headers for all routes

---

## P1 — Pre-Launch: Fix before first paying users

### P1-1: Sanitize demo/generate route inputs
- **Why:** Unsanitized `company`/`city`/`competitors`/`website` → AI prompt + HTML email (SEC-06)
- **Files:** `app/api/demo/generate/route.ts`
- **Effort:** S

### P1-2: Harden `proxy.ts` fail-closed for `/dashboard`
- **Why:** Missing env vars → middleware allows all requests to `/dashboard`
- **Files:** `proxy.ts`
- **Effort:** S

### P1-3: Add rate limiting to `POST /api/demo`
- **Why:** No rate limit on the lead-capture endpoint — can be abused to flood Resend/Supabase
- **Files:** `app/api/demo/route.ts`
- **Effort:** XS

### P1-4: Fix `demo_leads` SELECT RLS policy
- **Why:** `USING (true)` allows any authenticated user to read all demo contact data
- **Files:** Supabase SQL migration
- **Effort:** XS

### P1-5: Add CI/CD pipeline (GitHub Actions)
- **Why:** 109 tests exist and pass but are never run automatically
- **Files:** New `.github/workflows/ci.yml`
- **Effort:** S

### P1-6: Regenerate Supabase types
- **Why:** `types/supabase.types.ts` missing `research_requests`, `user_plans`, `demo_leads` — causes `as any` in 4 routes
- **Files:** `types/supabase.types.ts`
- **Effort:** XS

### P1-7: Reconcile plan types
- **Why:** `plan.types.ts` (4-tier) vs `workspace.types.ts` (3-tier) split-brain
- **Files:** `types/workspace.types.ts`, `hooks/use-workspace.ts`, `prisma/schema.prisma`
- **Effort:** M

### P1-8: Remove `core/` and `services/` from `tsconfig.json` `exclude`
- **Why:** Production code in these directories has zero TypeScript coverage
- **Files:** `tsconfig.json`
- **Effort:** S (fix `exclude`; M to fix resulting type errors)

### P1-9: Add missing database indexes
- **Why:** `reports.user_id` full-table scan on every dashboard load
- **Files:** Supabase SQL migration, `prisma/schema.prisma`
- **Effort:** XS

### P1-10: Delete dead code
- **Why:** `app/api/workspace/route.ts`, `hooks/use-workspace.ts`, `lib/supabase/middleware.ts`, `components/motion/fade-in.tsx`
- **Effort:** XS

### P1-11: Remove unused packages
- **Why:** `ai`, `framer-motion`, `sonner`, `@upstash/ratelimit`, 8 Radix packages — dead weight, 4 npm vulnerabilities from `ai` alone
- **Effort:** XS (`npm uninstall <packages>`)

### P1-12: Fix `.env.example` variable name mismatch
- **Why:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` in example vs `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in code; `SUPABASE_SERVICE_ROLE_KEY` missing
- **Files:** `.env.example`
- **Effort:** XS

---

## P2 — Technical Debt (post-launch, within first month)

### P2-1: Implement billing (Stripe)
- Stripe Checkout + Customer Portal + webhook handler → update `user_plans`
- **Effort:** L (7-10 days)

### P2-2: Build Settings page
- Plan display, password change, workspace name edit
- **Effort:** M (3-5 days)

### P2-3: Build Admin panel
- User list, plan assignment UI, usage dashboard
- **Effort:** L

### P2-4: Add error tracking (Sentry)
- **Effort:** S

### P2-5: Add structured logging
- Replace `console.*` with a structured logger (pino or similar)
- **Effort:** S

### P2-6: Fix `analytics` page
- Remove `'use client'`, make server component, or replace with real usage analytics
- **Effort:** S-M

### P2-7: Add fetch timeout to `FetchSourceCollector`
- **Effort:** S

### P2-8: Archive or delete 26 root-level audit `.md` files
- **Effort:** XS

### P2-9: Delete legacy PHP files, images, text files from git
- **Effort:** XS (+ git history rewrite if you want them purged from history)

### P2-10: Fix `tsconfig.json` `baseUrl` deprecation
- **Effort:** XS

### P2-11: Drop legacy Prisma models (`Report`, `ApiUsage`) via migration
- After P0-4 migration baseline exists
- **Effort:** S

### P2-12: Pin Node.js version in `package.json` `engines`
- **Effort:** XS

---

## P3 — Future Optimization

### P3-1: Major package upgrades
- `zod` 3→4, `@prisma/client` 6→7, `openai` 4→6, `@supabase/ssr` 0.5→0.12
- **Effort:** L (breaking changes in each)

### P3-2: Add streaming to AI routes
- Replace synchronous AI responses with streaming to reduce perceived latency
- **Effort:** M

### P3-3: Background job queue for research requests
- Slot in a real queue (Inngest, Trigger.dev, or Vercel Cron) to handle long-running research without timeout risk
- **Effort:** L

### P3-4: Add e2e tests (Playwright)
- Zero browser-level test coverage today
- **Effort:** L

### P3-5: Accessibility audit and remediation
- WCAG 2.1 AA compliance pass
- **Effort:** M

### P3-6: SEO for public pages
- Add metadata, OG tags, sitemap for `/demo`, `/market-intelligence`
- **Effort:** S

### P3-7: Proper i18n implementation
- `next-intl` is installed but unused; activate or remove
- **Effort:** M-L

### P3-8: Supabase schema representation in Prisma or migration tooling
- Move the `reports`, `research_requests`, `user_plans` tables into a versioned migration system
- **Effort:** L

---

## Priority Matrix

```
                     HIGH IMPACT
                          │
         P0-1,2,3         │         P0-4,5,7,8,9
         (Security)       │         (Build/DB/Infra)
                          │
EASY ────────────────────────────────────────────── HARD
                          │
         P1-11,12         │         P2-1 (Billing)
         (Cleanup)        │         P3-3 (Queue)
                          │
                     LOW IMPACT
```

---

## Estimated Timeline

| Phase | Effort | Calendar time (1 developer) |
|---|---|---|
| P0 — Stop-ship | ~5-8 developer-days | Week 1 |
| P1 — Pre-launch | ~10-15 developer-days | Weeks 2-3 |
| P2 — Post-launch debt | ~20-30 developer-days | Month 2 |
| P3 — Optimization | ~30+ developer-days | Ongoing |

**Minimum viable production state: ~3 weeks from now.**
