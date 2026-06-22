# Build Failure Root Cause Report

**Scope:** Vercel deployment build failure only. No code was modified or committed to produce this report — every fact below comes from reading existing files and running read-only commands (`git`, `npm run build` locally, `grep`). Evidence only; hypotheses are explicitly labeled and ranked by confidence, not asserted as fact.

**What's confirmed failing:** Both Vercel projects connected to this repo — `eunoia-platform` (`dpl_4TW3LF9MUHnJG7RcSJnL5d2egMLu`) and `eunoianew` (`dpl_CkUGd6WMdxBA4MiksG7R5bLbUKou`), team `islam-elbaz-s-projects` — return GitHub commit status `"failure"` with description `"Deployment has failed — run this Vercel CLI command: npx vercel inspect <id> --logs"` for `claude/blissful-newton-Sdej0` HEAD (PR #9). This report cannot read Vercel's actual build logs — `vercel.com` is blocked by this sandbox's network egress allowlist (same restriction documented in `DEPLOYMENT_REALITY_REPORT.md`). Everything below is built from static inspection of the repo, not from the logs themselves.

**Critical unresolved gap, stated up front:** I cannot determine whether `main`'s own current HEAD (`89b9892`) builds successfully on these same two Vercel projects. No tool available in this session exposes commit-status data for a ref that isn't part of an open pull request (`pull_request_read get_status` is PR-scoped; `get_commit` does not return status checks). This matters because several hypotheses below would fail **any** branch identically (Hypothesis 1 and 3), while others would only plausibly explain a **new, PR #9-specific** failure (Hypothesis 4). Without main's build status, I cannot fully separate "this has always been broken" from "this PR broke it." Both framings are presented below.

---

## 1. Local build vs. Vercel build — what's identical, what's different

| | Local (this sandbox) | Vercel (both projects) |
|---|---|---|
| `npm run build` | **Succeeds** — 25 routes, clean | **Fails** — both projects, same commit |
| `npx tsc --noEmit` | Clean, exit 0 | Unknown (logs inaccessible) |
| `npx vitest run` | 109/109 passing | Not part of `buildCommand`, shouldn't run |
| Node.js version | v22.22.2 (confirmed via `node -v`) | **Unknown** — not pinned in repo, set only in Vercel's per-project dashboard |
| npm version | 10.9.7 | Unknown |
| Environment variables present | All of `.env.example`'s vars are configured in this sandbox's `.env` (build succeeds, so whatever is required is present) | **Unknown which scope (Production/Preview/Development) has which vars** — this is a per-project Vercel dashboard setting invisible to this sandbox |
| `lib/prisma/generated/` query engine binary | `libquery_engine-debian-openssl-3.0.x.so.node` (generated fresh by this sandbox's own `prisma generate`, matches this sandbox's platform) | Generated fresh on Vercel's own build machine at build time (same `buildCommand` step) — **platform match with Vercel's runtime container is not guaranteed**, see Hypothesis 3 |
| `vercel.json`, `next.config.ts`, `prisma/schema.prisma` | Identical content to what's in PR #9 (confirmed: none of these 3 files appear in the `main`→PR#9 diff) | Same files used by both Vercel projects |

The fact that `next build` succeeds cleanly in this sandbox but fails on **both** independently-configured Vercel projects for the exact same commit means the cause is either (a) something Vercel's build environment provides differently from this sandbox (Node version, env var scope, build container platform) — most likely — or (b) a transient/infra issue affecting both projects simultaneously (less likely, since failures persisted across multiple pushes to this branch).

---

## 2. Inspection findings, by requested area

### `package.json`
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "postinstall": "prisma generate",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run"
},
"dependencies": { "next": "^16.2.6", "@prisma/client": "^6.6.0", "prisma": "^6.19.3", ... },
"devDependencies": { "typescript": "^5.8.3", "vitest": "4.1.9", ... }
```
- **No `engines` field at all.** Nothing in this file tells Vercel (or npm) the minimum supported Node.js version.
- `vitest` is pinned without a `^`/`~` range prefix (`"4.1.9"` exact), unlike every other dependency in the file. Not a build-breaking issue by itself (vitest isn't imported by `next build`), but stylistically inconsistent and worth normalizing — flagged for completeness, not ranked as a cause.
- `typescript`, `vitest`, `eslint`, `eslint-config-next` are all `devDependencies`. Modern npm (≥7) installs `devDependencies` regardless of `NODE_ENV`, so this is very unlikely to explain a missing-package build failure — see Hypothesis 5.

### `next.config.ts`
```ts
const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma'],
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
}
export default withNextIntl(nextConfig)
```
- `serverExternalPackages` lists the **npm package names** `@prisma/client` and `prisma`. This tells Next.js's bundler not to bundle code resolved from `node_modules/@prisma/client` or `node_modules/prisma`. It does **not** reference the project's actual custom Prisma client output path (`lib/prisma/generated`, a local relative directory, not a `node_modules` package) — see Hypothesis 1/3, this is the key gap.
- `images.remotePatterns` wildcards all HTTPS hostnames — permissive but not build-breaking (runtime image-optimization config only).
- Wraps config with `next-intl`'s plugin pointing at `./i18n/request.ts`, which exists and is trivial (hardcoded `locale: 'en'`, empty `messages: {}`) — confirmed no risk here.
- **Unchanged between `main` and PR #9** (not in the diff) — any issue rooted purely in this file would be branch-independent.

### `vercel.json`
```json
{
  "buildCommand": "npm install && npx prisma generate && npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```
- The `buildCommand` explicitly runs `npm install` itself. Vercel's own platform already runs an install step (driven by its detected/configured "Install Command", default `npm install`) **before** executing the custom `buildCommand`. Including `npm install` again inside `buildCommand` is redundant — it re-runs install a second time, which re-triggers `postinstall` (`prisma generate`) a second time, immediately followed by the explicit `npx prisma generate` a third time. This is wasteful but Prisma's `generate` is idempotent, so on its own this is very unlikely to be a hard failure cause (Hypothesis 5, low confidence).
- No `framework`-overriding install/dev command, no explicit Node version pin, no `regions`, no `functions` config.
- **Unchanged between `main` and PR #9.**

### `tsconfig.json`
- Only change vs. `main`: removed `"database"` from the `exclude` array (because the `database/` directory itself was deleted by PR #9). `npx tsc --noEmit` passes clean locally against the current `tsconfig.json`. No evidence this is implicated.

### Prisma configuration (`prisma/schema.prisma`, `lib/prisma/client.ts`)
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../lib/prisma/generated"
}
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```
```ts
// lib/prisma/client.ts
import { PrismaClient } from './generated'
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()   // <- runs at module load, not lazily
```
- **Custom Prisma Client output path** (`lib/prisma/generated` instead of the default `node_modules/.prisma/client`). Confirmed present, gitignored, regenerated by `prisma generate` on every install.
- **No `binaryTargets` specified** in the `generator` block — defaults to `["native"]`, i.e. whatever platform `prisma generate` runs on. Locally this produced `libquery_engine-debian-openssl-3.0.x.so.node`. Whether Vercel's *build* container and its *serverless runtime* container use the same platform/OpenSSL version is unverifiable from here — this is a well-documented Prisma+Vercel class of issue (see Hypothesis 3).
- **`new PrismaClient()` is constructed at module scope** (top-level, executes on import, not inside a function or request handler). Prisma's client constructor validates `env("DATABASE_URL")` **synchronously and eagerly** — if that env var is undefined at the moment this module is imported, the constructor throws immediately.
- This exact module is imported at the top of `app/dashboard/layout.tsx` (`import { prisma } from '@/lib/prisma/client'`, confirmed at line 3, used at line 15), which is the shared layout for every `/dashboard/*` route. `next build`'s "Collecting page data" phase loads every route's module graph, including layouts, so this import — and the `new PrismaClient()` it triggers — executes **during the build itself**, not just at request time. This import chain is **not new to PR #9**; it already exists on `main` too (confirmed via `git grep` on both branches).

### Environment variable requirements
`.env.example` marks these `# required`:
```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY   (required)
DATABASE_URL, DIRECT_URL                                   (required)
OPENAI_API_KEY                                              (required)
```
- `DATABASE_URL`/`DIRECT_URL` being both (a) marked required and (b) consumed by an eagerly-constructed `PrismaClient` imported from a build-time-loaded layout file is the most concrete, mechanically-precise risk found in this audit (Hypothesis 1).
- This repo has **already documented one confirmed real incident of exactly this class of bug** — `SERPAPI_ROOT_CAUSE_ANALYSIS.md` (present on `main`, commits `08d1795`/`e025b33`/`8e35321`) investigates `SERPAPI_API_KEY` reading as missing at runtime in production despite being set in the Vercel dashboard, with "environment-scope mismatch (Production-only var vs. Preview deployment)" listed as one of three hypotheses. I have not re-read that document's conclusion in full (per this session's "stop historical-document digestion" instruction from the prior task), but its mere existence is direct, repo-native evidence that Production-vs-Preview environment-variable scoping has already bitten this exact project once. The two Vercel deployments now failing are **Preview deployments** (triggered by a non-`main` branch / open PR), which is exactly the scope where such a mismatch would surface.
- New env vars introduced by PR #9 (`SEARCH_DAILY_QUOTA_PER_USER`, `APOLLO_API_KEY`) are both explicitly optional with in-code fallback defaults (`Number(process.env.X) || default`, confirmed via `grep` — no eager throw). These are **ruled out** as a cause.

### Build scripts / postinstall scripts
- `postinstall: prisma generate` — standard, correct pattern for ensuring the Prisma Client exists after `npm install`. Runs automatically, and redundantly again via `vercel.json`'s explicit `buildCommand` (see above).
- No other lifecycle scripts (`prebuild`, `vercel-build`) are defined.

### Node version assumptions
- Confirmed by reading the **installed** packages' own `engines` fields (not assumed):
  - `next@16.2.6` → `"engines": { "node": ">=20.9.0" }`
  - `vitest@4.1.9` → `"engines": { "node": "^20.0.0 || ^22.0.0 || >=24.0.0" }` (excludes Node 21.x and 23.x entirely)
- This sandbox runs Node v22.22.2, which satisfies both. **Nothing in this repo (`package.json` `engines`, `.nvmrc`) communicates a minimum Node version to Vercel.** Vercel's Node.js version for a project is a dashboard-only setting (Project Settings → General → Node.js Version), invisible to this sandbox, and **historically defaults differently depending on when each project was first created** — `eunoia-platform` and `eunoianew` may have been created at different times and have different defaults.
- Next.js is known to hard-fail at build/startup with an explicit "Node.js version is not supported" error when run under an unsupported version — this would manifest as exactly the kind of generic "Deployment has failed" status observed.

---

## 3. Ranked root causes

| Rank | Hypothesis | Evidence | Branch-specific or pre-existing? | Confidence |
|---|---|---|---|---|
| **1** | **`DATABASE_URL`/`DIRECT_URL` not available in the Preview environment scope on one or both Vercel projects**, causing the eagerly-constructed `PrismaClient` (imported transitively by `app/dashboard/layout.tsx`, loaded by `next build`'s page-data-collection phase) to throw during the build | `.env.example` marks both vars "required"; `lib/prisma/client.ts:7` constructs `PrismaClient` at module scope; this import is reachable from every `/dashboard/*` route via the shared layout; this repo has an **already-documented, real, confirmed prior incident of the identical failure class** (`SERPAPI_API_KEY` Production-vs-Preview scope mismatch, `SERPAPI_ROOT_CAUSE_ANALYSIS.md` on `main`) | **Pre-existing** — `lib/prisma/client.ts` and `app/dashboard/layout.tsx`'s import of it are unchanged by PR #9; if true, this would affect any Preview build of any branch, not something this PR introduced | **Medium-High** — mechanically precise and corroborated by repo's own incident history, but unconfirmed without actual build logs |
| **2** | **Vercel project Node.js version setting is below Next.js 16's hard minimum (`>=20.9.0`)** | Verified via installed `next/package.json` `engines` field; no `engines`/`.nvmrc` in repo to force Vercel's hand; Vercel's per-project Node version default varies by project creation date and isn't visible from this sandbox | **Pre-existing / branch-independent** — would affect any commit on either project if the dashboard setting is stale | **Medium-High** — extremely common real-world "works locally, fails on Vercel" cause after a Next.js major-version bump, but entirely unconfirmable without dashboard access |
| **3** | **Custom Prisma Client `output` path (`lib/prisma/generated`) with no explicit `binaryTargets`**, combined with `serverExternalPackages` naming only the npm package (not the custom path) — Next's/Vercel's automatic serverless function tracing may not correctly bundle the native query-engine binary for the runtime container, or the "native" binary generated during the *build* step may not match the *runtime* container's platform | Confirmed via `prisma/schema.prisma` (no `binaryTargets` key at all) and `next.config.ts` (`serverExternalPackages` lists `@prisma/client`/`prisma`, not the relative output path) — this exact combination is a well-documented Prisma+Next.js+Vercel failure class | Pre-existing, unchanged by PR #9 | **Medium** — plausible and well-documented as a *class* of issue, but more classically causes a post-build **runtime** 500 ("query engine not found") than a hard build-step failure; included because Vercel's generic "Deployment has failed" status does not distinguish build-phase from deploy-phase failures |
| **4** | **Something specific to PR #9's 53-file diff** (new `vitest`/`tw-animate-css`/`@tailwindcss/postcss` ordering changes in `package.json`, new test files, `tsconfig.json`'s `exclude` change, or the new `lib/research/*` / `lib/prisma/init-user.ts` modules) breaks only this branch's build | The diff is fully enumerated in `DEPLOYMENT_REALITY_REPORT.md` §2; none of the new files contain eager top-level `process.env` throws (confirmed via `grep`); locally, `next build` succeeds against this exact diff | **Branch-specific by definition** | **Low** — nothing inspected in the diff stands out as build-breaking, and the local build (against this same diff) succeeds; this hypothesis is the *weakest* supported one despite being the most intuitive given "it's PR #9 that's failing" |
| **5** | Redundant `npm install` / triple `prisma generate` in `buildCommand`, or `devDependencies` skipped due to legacy `NODE_ENV=production` npm behavior | `vercel.json`'s `buildCommand` re-runs `npm install` after Vercel's own install step; modern npm (≥7) does not skip `devDependencies` based on `NODE_ENV` by default | Pre-existing | **Low** — redundant but not typically failure-inducing; included for completeness, effectively ruled out |
| 6 | Vercel project misconfiguration unrelated to this repo's files (wrong Root Directory, stale Framework Preset, `eunoianew` pointing at a different/legacy checkout) | No in-repo evidence either way — purely a dashboard-only setting | Unknown | **Unrankable** — cannot be assessed without dashboard access, listed only as a manual-check item below |

**Most likely single answer, if forced to pick one:** Hypothesis 1 (Preview-scope environment variable gap for `DATABASE_URL`/`DIRECT_URL`), because it is the only hypothesis directly corroborated by this exact codebase's own prior, already-documented incident of the same failure class, and because it cleanly explains why historical manual `vercel --prod` deploys of `main` (Production scope, likely correctly configured) could have succeeded while today's automatic Preview builds (a different, possibly-never-configured scope) fail.

---

## 4. Exact manual checks to perform in the Vercel dashboard

For **both** projects (`eunoia-platform` and `eunoianew`, team `islam-elbaz-s-projects`):

1. **Settings → Environment Variables** — for each of `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`: confirm the **Preview** checkbox is ticked, not just Production. (Tests Hypothesis 1 directly.)
2. **Settings → General → Node.js Version** — confirm it reads `20.x` or newer. If it shows `18.x` or `16.x`, that is very likely Hypothesis 2 confirmed. (Tests Hypothesis 2 directly.)
3. **Settings → General → Root Directory** — confirm it's blank/`.` (repo root), especially for `eunoianew`, which has no documented purpose in this repo and may be stale/misconfigured. (Tests Hypothesis 6.)
4. **Settings → General → Framework Preset** — confirm it reads `Next.js`.
5. **Settings → Domains** — record, for each project, which custom domain(s) (if any) are attached. This single screen also resolves the open question from `DEPLOYMENT_REALITY_REPORT.md` about which project serves `ai.halannews.com` vs. `intelligence.eunoiazones.com`.
6. **Deployments tab → click the failed deployment for commit `814e0b1` or `5a7bd2e` → "Building" section of the log** — read the actual error. This single piece of evidence resolves every hypothesis above definitively and should be done before acting on any ranked guess in Section 3.
7. **Settings → Git → Production Branch** — record the exact value (resolves the open question from `DEPLOYMENT_REALITY_REPORT.md` §1).

---

## 5. Exact CLI commands to reproduce the Vercel build locally

These must be run from a machine with network access to `vercel.com` and Vercel account credentials — **not from this sandbox**, which is network-restricted to GitHub only.

**A. Closest possible reproduction — actual Vercel CLI, using the real project config and real env vars:**
```bash
npm install -g vercel
vercel login
vercel link            # select team "islam-elbaz-s-projects", then the project (run once per project: eunoia-platform, then eunoianew)
vercel pull --yes --environment=preview   # pulls the *actual* Preview-scoped env vars + project settings (Node version, etc.) into .vercel/
vercel build           # runs the real build using Vercel's own build image and the pulled Preview env vars
```
Run `vercel pull --yes --environment=production` and `vercel build` again separately to compare Preview vs. Production behavior directly — if Production succeeds where Preview fails, that confirms Hypothesis 1 outright.

**B. Inspect the actual failed deployment logs directly (fastest, most authoritative):**
```bash
npx vercel inspect dpl_4TW3LF9MUHnJG7RcSJnL5d2egMLu --logs
npx vercel inspect dpl_CkUGd6WMdxBA4MiksG7R5bLbUKou --logs
```

**C. Test the Node-version hypothesis (Hypothesis 2) without Vercel CLI, using only local tooling:**
```bash
nvm install 18 && nvm use 18
rm -rf node_modules .next lib/prisma/generated
npm install && npx prisma generate && npm run build
# If this reproduces a "Node.js version X is not supported" failure, Hypothesis 2 is confirmed as at least sufficient to break a build.
```

**D. Test the Preview-env-var hypothesis (Hypothesis 1) locally by simulating a missing `DATABASE_URL`:**
```bash
rm -rf node_modules .next lib/prisma/generated
env -u DATABASE_URL -u DIRECT_URL bash -c "npm install && npx prisma generate && npm run build"
# If this reproduces the build failing during 'Collecting page data' with a PrismaClientInitializationError,
# Hypothesis 1's mechanism is confirmed locally (though it doesn't prove Vercel's actual Preview scope is missing the var — only that the mechanism is real).
```

**E. Plain replication of `vercel.json`'s exact `buildCommand` in a clean tree (rules out local-machine drift, not Vercel-specific):**
```bash
rm -rf node_modules .next lib/prisma/generated
npm install && npx prisma generate && npm run build
```

---

## 6. Constraints honored

No source code was modified. No code was committed. This report is the only file written this session.
