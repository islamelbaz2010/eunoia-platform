# Deployment Audit

**Score: 32 / 100**

---

## Build Pipeline Analysis

### Proven Double-Install, Triple-Codegen

**`vercel.json`:**
```json
{ "buildCommand": "npm install && npx prisma generate && npm run build" }
```

**`package.json` `postinstall`:**
```json
{ "postinstall": "prisma generate" }
```

**Actual Vercel deploy sequence:**

| Step | Who runs it | What happens |
|---|---|---|
| 1 | Vercel platform implicit Install step | `npm install` → triggers `postinstall` → **prisma generate (run #1)** |
| 2 | `vercel.json` buildCommand begins | `npm install` again → triggers `postinstall` → **prisma generate (run #2)** |
| 3 | `vercel.json` buildCommand continues | `npx prisma generate` explicit → **prisma generate (run #3)** |
| 4 | `vercel.json` buildCommand continues | `npm run build` → actual Next.js build |

**Impact:** 2× full dependency resolution, 3× Prisma client codegen, on every deploy. Pure waste — no correctness risk (idempotent), but doubles build time and Vercel compute cost.

**Fix:**
```json
// vercel.json — simplified
{
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```
Let Vercel's default Install Command (`npm install`) run once (triggering `postinstall` → `prisma generate`), then let Next.js's default build command (`npm run build`) run. Zero manual overrides needed.

---

## TypeScript Build Status

### Current `tsc --noEmit` Output (with `node_modules` present)

```
lib/prisma/client.ts(1,30): error TS2307: Cannot find module './generated' or its corresponding type declarations.
lib/prisma/init-user.ts(1,24): error TS2307: Cannot find module './generated' or its corresponding type declarations.
EXIT: 2
```

**Root cause:** `prisma generate` must run before `tsc --noEmit`. The generated client at `lib/prisma/generated/` is `.gitignore`'d (correct) but must be produced at build time.

**In production:** `npm install` → `postinstall` → `prisma generate` → `lib/prisma/generated/` is produced → then `next build` calls its own `tsc` → succeeds. This ordering is correct and the Vercel build confirms it works.

**Local dev issue:** Running `npm install --ignore-scripts` (as this audit did to avoid network-dependent scripts) skips `postinstall`, leaving the generated client absent. Developers must run `npx prisma generate` manually after a fresh clone. This is undocumented.

### TypeScript Deprecation Warning

```
tsconfig.json(47,5): error TS5101: Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0.
```

`baseUrl: "."` is deprecated in TypeScript 5.9+. The correct replacement is to use `paths` without `baseUrl`, or switch to TypeScript's `bundler` module resolution (already set) with `paths` only. This will become a hard error in TypeScript 7.0. **Fix before the next major TypeScript upgrade.**

---

## Test Pipeline Status

```
vitest run — 11 files, 109 tests, 0 failures, 1.22s
```

**Tests pass.** But they are never automatically invoked:
- No GitHub Actions workflow file exists (`find . -name "*.yml" -path "*/.github/*"` → 0 results)
- No pre-commit hook runs tests
- No Vercel check runs tests
- Tests can only be run manually via `npm test`

**Fix:** Add `.github/workflows/ci.yml`:
```yaml
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx prisma generate
      - run: npm run typecheck
      - run: npm test
```

---

## ESLint / Lint Status

### Current state: completely broken

```bash
npm run lint
# → next lint: not found (Next.js 16 removed the CLI subcommand)
# EXIT: 127
```

**Root cause chain:**
1. `package.json` `"lint": "next lint"` calls a CLI that doesn't exist in Next.js 16
2. `eslint-config-next@15.3.0` exports only legacy `.eslintrc`-style config (no `flat.js`)
3. ESLint 9.24.0 requires flat config (`eslint.config.mjs`) by default
4. No `eslint.config.mjs` or `.eslintrc.*` file exists at repo root

**Fix (effort: S):**
1. `npm install --save-dev eslint-config-next@^16.2.9`
2. Create `eslint.config.mjs`:
   ```js
   import { FlatCompat } from '@eslint/eslintrc'
   import nextPlugin from 'eslint-config-next/flat'
   export default [...nextPlugin]
   ```
3. Change `"lint"` in `package.json` to `"eslint ."` or `"next lint"` if Next 16.2.9 re-introduces it

---

## npm Vulnerability Status

```
npm audit
10 vulnerabilities (3 low, 6 moderate, 1 high)
```

| Package | Severity | Vulnerability |
|---|---|---|
| `form-data` | HIGH | CRLF injection via unescaped multipart field names |
| `postcss` | MODERATE | XSS via unescaped `</style>` in CSS Stringify output |
| `next` | MODERATE | Via postcss |
| `next-intl` | MODERATE | Via next |
| `js-yaml` | MODERATE | Quadratic-complexity DoS via repeated aliases |
| `jsondiffpatch` | MODERATE | XSS via HtmlFormatter |
| `@ai-sdk/provider-utils` | LOW | Uncontrolled resource consumption |
| `@ai-sdk/react`, `@ai-sdk/ui-utils`, `ai` | LOW | Via provider-utils |

**Immediate action:** `npm audit fix` addresses the patchable subset. The `ai` package is unused — removing it eliminates 4 of 10 vulnerabilities.

---

## Environment Variables

### Referenced in code vs. documented

| Variable | Referenced in code | In `.env.example` | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | Required |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ Code | ❌ `.env.example` uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **MISMATCH — `.env.example` is wrong** |
| `DATABASE_URL` | Prisma schema | ✅ | Required; port 5432 shown but pooler needs 6543 |
| `DIRECT_URL` | Prisma schema | ✅ | Required for migrations |
| `OPENAI_API_KEY` | ✅ | ✅ | Required for research AI analysis |
| `RESEND_API_KEY` | ✅ | ✅ | Required for email |
| `UPSTASH_REDIS_REST_URL` | ✅ | ✅ | Optional (fail-open) |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | ✅ | Optional (fail-open) |
| `CLOUDFLARE_WORKER_URL` | ✅ | ✅ | Points to halannews.com — see security audit |
| `SERPAPI_API_KEY` | ✅ | ✅ | Optional (research engine degrades without it) |
| `SEARCH_DAILY_QUOTA` | ✅ | ✅ | Optional (defaults to 150) |
| `SEARCH_DAILY_QUOTA_PER_USER` | ✅ | ✅ | Optional (defaults to 30) |
| `APOLLO_API_KEY` | ✅ | ✅ | Optional (enrichment only) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Code | ❌ Missing from `.env.example` | **MISSING — `app/api/demo/route.ts` requires it** |
| `NEXT_PUBLIC_SITE_URL` | ✅ Code | ❌ Missing from `.env.example` | Used in auth redirect |
| `NODE_ENV` | ✅ | N/A (Vercel sets automatically) | Verified not causing devDep pruning (fix from prior session) |

**Critical missing items from `.env.example`:** `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, and the `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` name mismatch.

---

## Vercel Configuration

**`vercel.json`:**
```json
{
  "buildCommand": "npm install && npx prisma generate && npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

**Issues:**
- `buildCommand` override causes double-install (detailed above)
- No `installCommand` — Vercel will still run its default install before the `buildCommand`
- No Node.js version pinned (`package.json` has no `engines` field)
- No environment variable groups configured — relies on Vercel project settings being manually correct

---

## GitHub / CI Status

| Check | Status |
|---|---|
| GitHub Actions workflows | ❌ None (`.github/` directory does not exist) |
| Pre-commit hooks | ❌ None |
| PR checks before merge | ❌ None (PR #9 merged with only Vercel's build check) |
| Branch protection rules | UNKNOWN (not inspectable from this repo) |
| Automatic test runs | ❌ None |
| Automatic lint runs | ❌ Lint is also broken |

---

## Prisma Deployment

**Current:** `npx prisma generate` (codegen only — never touches the database)  
**Missing:** `prisma migrate deploy` — the command that actually applies pending schema changes to production.

**Risk:** Any schema change to `schema.prisma` committed today would be compiled into the Prisma client (via `generate`) and the app would attempt to query columns/tables that don't exist in the live database. This would cause a runtime crash, not a build failure.

**Fix:** After establishing migration baseline (see database.md), add to `vercel.json`:
```json
{ "buildCommand": "prisma migrate deploy && next build" }
```
And remove the redundant `npm install` and `npx prisma generate` calls.
