# 13 — Deployment

**Evidence basis:** `vercel.json`, `.vercel/repo.json`, `next.config.ts`, `package.json`, git history.

---

## Deployment Platform

**Platform:** Vercel  
**Project:** Linked to `islamelbaz2010/eunoia-platform` GitHub repository  
**Framework:** Next.js (auto-detected)  
**Build output:** `.next/`  

---

## Vercel Configuration

**File:** `vercel.json`
```json
{
  "buildCommand": "npm install && npx prisma generate && npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

**Assessment:** The `buildCommand` override is necessary because:
1. Prisma generates the client at build time (`prisma generate`)
2. The standard Vercel Next.js preset doesn't run `prisma generate` automatically
3. `package.json` has a `postinstall` script that also runs `prisma generate` — so Prisma generation runs twice. This is redundant but harmless.

**Evidence:** `package.json:8` — `"postinstall": "prisma generate"` + `vercel.json` buildCommand override.

---

## Environment Variables

**Required for production:**

| Variable | Purpose | Set in Vercel? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key | **Unknown — may not match env name in Vercel** |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Likely ✅ |
| `DATABASE_URL` | Postgres connection (pgBouncer) | Likely ✅ |
| `DIRECT_URL` | Postgres direct connection | Likely ✅ |
| `OPENAI_API_KEY` | OpenAI GPT-4o-mini | Required |
| `UPSTASH_REDIS_REST_URL` | Rate limiting + caching | Optional (fail-open if missing) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash auth | Optional (fail-open if missing) |
| `SERPAPI_API_KEY` | Lead Finder search | Required for Lead Finder |
| `APOLLO_API_KEY` | Contact enrichment | Optional |
| `CLOUDFLARE_WORKER_URL` | OpenAI failover | Optional |
| `SEARCH_DAILY_QUOTA` | SerpAPI daily budget | Optional (defaults to 150) |
| `SEARCH_DAILY_QUOTA_PER_USER` | Per-user fair share | Optional (defaults to 30) |
| `NEXT_PUBLIC_SITE_URL` | Email redirect URL | Needed for password reset |

**Critical concern:** `lib/supabase/server.ts` reads `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` but `.env.example` documents `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If Vercel has the anon key name, authentication is broken in production.

---

## Build Process

```
npm install
  → runs postinstall → prisma generate (1st time)
npx prisma generate (2nd time, redundant)
npm run build
  → next build
  → TypeScript compilation
  → Route bundling
  → Static page generation
```

**Evidence of prior build failures:** `BUILD_FAILURE_ROOT_CAUSE_REPORT.md` exists in root (multiple prior incidents). The fix was excluding test/vitest files from `tsconfig.json` (`f8175e1 fix: exclude test/vitest-config files from the production tsconfig`).

---

## Deployment Pipeline

**Current setup:**
- GitHub push → Vercel auto-deploy
- No pre-deploy tests
- No staging environment
- No CI gates (no GitHub Actions, no CircleCI)
- Direct to production on every commit to `main`

**Risk:** A broken commit that passes TypeScript compilation (or doesn't) ships to production in ~2–4 minutes. There is no safety net between commit and live production.

---

## Production Environment Status

| Check | Status |
|---|---|
| Vercel project linked | ✅ (`.vercel/repo.json` present) |
| Next.js version | 16.2.6 ✅ |
| Node.js version | Not specified in `vercel.json` (Vercel defaults to 22 LTS) ✅ |
| Prisma generate in build | ✅ |
| Prisma generated output path | `lib/prisma/generated/` — custom output ✅ |
| WASM engine for Edge | `lib/prisma/generated/query_engine_bg.wasm` present ✅ |

---

## Branches & Deployment History

```
main                              — production
backup-before-research-module     — local backup branch
backup-clean                      — local backup branch
research-intelligence-v1          — merged feature
research-intelligence-v2-data-layer — merged feature
```

**Remote branches:**
- `origin/claude/blissful-newton-Sdej0` — Claude-generated branch (merged as PR #9)
- `origin/claude/ecstatic-cerf-LtKWq` — Claude-generated branch

**Assessment:** Feature branches exist but no active PR-based workflow. Development appears to go direct to `main` frequently.

---

## Deployment Recommendations

| Priority | Recommendation | Effort |
|---|---|---|
| P0 | Verify `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is set in Vercel OR fix the env var name | 30 min |
| P1 | Set up GitHub Actions CI (lint, typecheck, test) | 1 day |
| P1 | Create staging Supabase project + Vercel preview env | 1 day |
| P2 | Add `NODE_ENV=production` checks to prevent debug routes in prod | 1 hour |
| P2 | Remove `postinstall: prisma generate` (redundant with vercel.json buildCommand) | 5 min |
