# SerpAPI "SERPAPI_API_KEY missing" — Root Cause Analysis

**Status:** Code-level investigation complete via direct trace. Operational (Vercel dashboard/deployment) confirmation is **not possible from this environment** — no Vercel API/dashboard access exists here. Task 5's debug endpoint is the mechanism to get that confirmation; see "What To Do Next."

---

## 1. Exact Source Of The Error

`lib/research/acquisition/search-provider.ts:60`, inside `SerpApiProvider.search()`:

```ts
if (!this.apiKey) {
  throw new SearchProviderError('SerpAPI is not configured (SERPAPI_API_KEY missing)', this.name)
}
```

`this.apiKey` is set once, in the constructor, `search-provider.ts:55`:

```ts
constructor(apiKey?: string) {
  this.apiKey = apiKey ?? process.env.SERPAPI_API_KEY
}
```

This throw is reached **only if both** are falsy at construction time: the explicit `apiKey` constructor argument, and `process.env.SERPAPI_API_KEY`.

### Call stack, `/dashboard/research/leads` → provider

1. `app/dashboard/research/leads/page.tsx` (client form) → `POST /api/research/leads`
2. `app/api/research/leads/route.ts:88` → `getResearchService().run({ query, ... })`
3. `lib/research/acquisition/research-service.ts:126-131`:
   ```ts
   let _researchService: ResearchService | null = null
   export function getResearchService(): ResearchService {
     if (!_researchService) {
       _researchService = new ResearchService()
     }
     return _researchService
   }
   ```
4. `ResearchService` constructor, `research-service.ts:53`:
   ```ts
   this.searchProvider = options.searchProvider ?? new SerpApiProvider()
   ```
   — called with **no arguments**, every time, the only call site in the codebase.
5. `SerpApiProvider` constructor, `search-provider.ts:54-56` — reads `process.env.SERPAPI_API_KEY`.
6. `research-service.ts:88` → `this.searchProvider.search(input.query, ...)` → `search-provider.ts:58-61` → throws if `this.apiKey` is falsy.

**This confirms the error message can only originate from one place, with one possible cause: `process.env.SERPAPI_API_KEY` was falsy at the moment `new SerpApiProvider()` was first constructed in that server process.**

---

## 2. Every Occurrence Of `SERPAPI_API_KEY` In The Codebase

| File | Line | Snippet |
|---|---|---|
| `lib/research/acquisition/search-provider.ts` | 55 | `this.apiKey = apiKey ?? process.env.SERPAPI_API_KEY` |
| `lib/research/acquisition/search-provider.ts` | 60 | `throw new SearchProviderError('SerpAPI is not configured (SERPAPI_API_KEY missing)', this.name)` |
| `.env.example` | 20 | `SERPAPI_API_KEY=your-serpapi-key` |
| `.env.local.example` | 27 | `SERPAPI_API_KEY=your-serpapi-key` |
| `.env.local` (gitignored, not in repo history) | — | placeholder only, confirmed empty this session |

That is **the entire set** — verified via a repo-wide grep (excluding `node_modules`) for `SERPAPI_API_KEY`, `SerpApiProvider`, `process.env[`, and any destructured-env pattern. Findings:

- **`process.env.SERPAPI_API_KEY`** — exactly one read site (`search-provider.ts:55`). No second, conflicting read site exists anywhere.
- **`process.env["SERPAPI_API_KEY"]`** — zero occurrences.
- **Destructured env usage** (`const { SERPAPI_API_KEY } = process.env`) — zero occurrences.
- **Env validation/config layer** (e.g. a `lib/env.ts`, zod-validated env schema, T3 Env) — **does not exist in this codebase**. There is no layer between Vercel's runtime and `process.env` that could be silently dropping or renaming the variable.
- **`next.config.ts`** — no `env:` key, no webpack `DefinePlugin` override, no allowlist that would restrict which `process.env.*` keys are visible to server code.
- **`vercel.json`** — only `buildCommand`/`outputDirectory`/`framework`; no env-related configuration.

**Conclusion of Task 2:** the variable name itself is spelled and referenced consistently everywhere in the codebase. There is no naming mismatch, no shadow definition, and no filtering layer in the code that could explain the variable being unavailable if it were genuinely present in the process's environment.

---

## 3. Server vs. Client

`process.env.SERPAPI_API_KEY` is read in exactly one file: `lib/research/acquisition/search-provider.ts`. This file:

- Is never imported by any file under `app/**/page.tsx`, any file with a `'use client'` directive, any React hook, or any `useEffect`. Verified by checking every importer of `search-provider.ts` — the only importers are `research-service.ts` and the barrel `index.ts`, both server-only modules consumed exclusively from `app/api/research/*/route.ts` (Next.js Route Handlers, which only ever run server-side).
- Is not prefixed `NEXT_PUBLIC_`, so even if it were referenced from client code, Next.js would not inline it into the browser bundle — it would simply read as `undefined` client-side. That's not what's happening here (the error is thrown from server-executed route-handler code, not browser code), but it's worth noting there is no `NEXT_PUBLIC_SERPAPI_API_KEY` anywhere either, so this isn't a "wrong env-var flavor" issue.
- No route under `app/api/research/` or `app/api/debug/` declares `export const runtime = 'edge'`. All research routes run on the default Node.js serverless runtime, where `process.env` reflects whatever Vercel injected for that specific deployment/environment at function-invocation time.

**Conclusion of Task 3:** this is not a server/client boundary bug. The variable is read in the right place, the right way, at the right runtime.

---

## 4. Provider Construction — Exact Throw Condition

```ts
export class SerpApiProvider implements SearchProvider {
  readonly name = 'serpapi'
  private apiKey?: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.SERPAPI_API_KEY
  }

  async search(query: string, options: SearchProviderOptions = {}): Promise<SearchResult[]> {
    if (!this.apiKey) {
      throw new SearchProviderError('SerpAPI is not configured (SERPAPI_API_KEY missing)', this.name)
    }
    ...
```

The throw fires if and only if, **at construction time**: `apiKey` argument is `undefined` (always true — see Task 6) **and** `process.env.SERPAPI_API_KEY` is `undefined` or `''` (empty string also fails the truthiness check).

No call site anywhere passes `undefined`, `''`, or `process.env.SOMETHING_ELSE` explicitly — there is exactly one constructor call, `new SerpApiProvider()`, with zero arguments (`research-service.ts:53`). So the only variable in this equation is what `process.env.SERPAPI_API_KEY` actually evaluated to **at the moment that line executed**.

---

## 5. Provider Instantiation Lifecycle — The Actual Mechanism

This is the part that explains *why* the symptom can persist even though "the variable is in Vercel" and "deployment happened after adding it":

```ts
// research-service.ts:124-131
let _researchService: ResearchService | null = null

export function getResearchService(): ResearchService {
  if (!_researchService) {
    _researchService = new ResearchService()
  }
  return _researchService
}
```

- **Not instantiated at module load time.** `_researchService` starts `null`; `new ResearchService()` (which constructs `new SerpApiProvider()` inside it) runs lazily, on the **first** call to `getResearchService()` in a given server process.
- **Instantiated at request time** — specifically, the first request handled by a given warm Node.js process/serverless function instance.
- **Cached for the lifetime of that process.** Every subsequent request reuses the same `ResearchService` instance, and therefore the same `SerpApiProvider` instance with whatever `apiKey` was captured on that first call. There is no re-read of `process.env.SERPAPI_API_KEY` after construction — `this.apiKey` is set once and never refreshed.
- Confirmed via `git grep`/direct read: there is no second instantiation path, no `new SerpApiProvider(undefined)`, no `new SerpApiProvider("")`, and no `new SerpApiProvider(process.env.SOMETHING_ELSE)` anywhere in the codebase. The only non-default construction path is `options.searchProvider` in `ResearchServiceOptions`, which is never supplied by any production code path (`getResearchService()` always calls `new ResearchService()` with no options).

**Why this matters:** on Vercel's Node.js serverless runtime, a *fresh* deployment normally provisions fresh function instances, so this singleton would normally pick up the current env on the first request after a deploy. The singleton becomes a problem only if a process that already constructed `_researchService` (with a missing key) keeps being reused **without** a new deployment/cold start in between — e.g., if env vars were edited in the Vercel dashboard but the existing deployment was *not* redeployed, or if Vercel's "Fluid Compute" keeps an instance warm across an edit. Per the stated facts, a deployment *did* happen after adding the variable, which should rule this out — **but it is the only code-level mechanism that could make a once-correct config look broken again later without a code change, so it's documented here as a real, separate risk even though it doesn't fully explain the current symptom by itself.**

---

## 6. Why Build Succeeds, Why Deployment Succeeds, Why Runtime Fails

- **Build succeeds** because `SERPAPI_API_KEY` is never referenced at build/compile time. Next.js only inlines env vars at build time for `NEXT_PUBLIC_*` variables; this is a server-only var read dynamically via `process.env` inside a Route Handler, which is never executed during `next build` (no static generation touches this code path — it's a `POST` handler with no prerendering). TypeScript has no opinion on whether an env var exists at runtime; `process.env.SERPAPI_API_KEY` types as `string | undefined`, which is exactly what the `?? process.env.SERPAPI_API_KEY` fallback already handles. There is nothing for `tsc` or `next build` to catch here.
- **Deployment succeeds** because Vercel deployment validates that the build artifact compiles and the function bundles correctly — it does not execute application logic or validate that referenced environment variables exist. A deployment can succeed 100% of the time regardless of whether `SERPAPI_API_KEY` is set anywhere.
- **Runtime fails** because the one and only thing that determines `this.apiKey` — `process.env.SERPAPI_API_KEY` as seen by the actual running Node.js process handling the request — was falsy at the moment that process's `SerpApiProvider` singleton was constructed. Given the code itself is provably correct and singular (Tasks 1-4), the variable being unavailable to that specific running process is necessarily an **environment/deployment-configuration fact about that specific Vercel deployment**, not a code defect.

**This is the key finding: there is no bug in the code's env-reading logic.** The read site is singular, correctly written, server-only, unshadowed, and unfiltered. Given that, "set in Vercel but still reads as missing" reduces to a small, specific set of Vercel-configuration possibilities that **only Vercel's own runtime can confirm** — which is exactly what Task 5's debug endpoint is for, since this sandbox has no Vercel API/dashboard access to check directly. In order of likelihood given the stated facts:

1. **Environment-scope mismatch.** Vercel env vars are scoped per target (Production / Preview / Development) when added. The phrasing "Vercel **Production** environment contains `SERPAPI_API_KEY`" is consistent with the variable having been added with only the Production checkbox ticked. If the URL actually being tested is a **Preview** deployment (e.g. the auto-deploy Vercel creates for the `research-intelligence-v2-data-layer` branch, which was pushed to `origin` this session) rather than the Production domain, that Preview function's `process.env.SERPAPI_API_KEY` would be `undefined` even though the dashboard correctly shows the var present under "Production." This is the single most common cause of this exact symptom pattern in Next.js/Vercel projects and is fully consistent with every fact given.
2. **Trailing whitespace/newline in the dashboard value's *name*.** If the variable was typed into Vercel's "Key" field with a trailing space or invisible character, the dashboard would display something that looks like `SERPAPI_API_KEY` but Node would expose it under a different literal key, leaving `process.env.SERPAPI_API_KEY` undefined. (A trailing space in the *value* would not produce this error — it would produce a falsy-passing-truthy key that fails later with a SerpAPI auth error instead, which is a different symptom than what's reported.)
3. **Warm-instance staleness** (Section 5) — possible but only relevant if the post-redeploy traffic is still partly served by a pre-redeploy warm instance, which contradicts "deployment happened after adding the variable" unless that redeploy didn't fully cycle every instance.

---

## 7. Fix

No code fix is required for the env-reading logic itself — it is already correct. The fix is operational, confirmed via the debug endpoint below:

1. Hit `https://<the-actual-domain-being-tested>/api/debug/env` and read `hasSerpApiKey` / `runtime`.
   - If `runtime` is `"preview"` and `hasSerpApiKey` is `false`: the variable needs to be added to Vercel for the **Preview** environment too (Project Settings → Environment Variables → check "Preview" alongside "Production"), then redeploy.
   - If `runtime` is `"production"` and `hasSerpApiKey` is `false`: re-check the exact key name in the Vercel dashboard for stray whitespace/case differences, re-save it, and trigger a fresh deployment (not "redeploy with existing build cache" — use a full rebuild to be certain).
2. Once `hasSerpApiKey` reads `true` on the deployment actually being tested, Lead Finder/Talent Finder will work with no further code changes.

### Diff preview (only the temporary diagnostic; no other files touched)

```diff
+ app/api/debug/env/route.ts (new file)
+ import { NextResponse } from 'next/server'
+
+ export async function GET() {
+   const key = process.env.SERPAPI_API_KEY
+   return NextResponse.json({
+     hasSerpApiKey: Boolean(key && key.trim().length > 0),
+     keyLength: key?.length ?? 0,
+     runtime: process.env.VERCEL_ENV ?? null,
+     nodeEnv: process.env.NODE_ENV ?? null,
+   })
+ }
```

No changes were made to `search-provider.ts`, `research-service.ts`, Supabase, billing, or plan enforcement, per the task's explicit constraints.

---

## 8. Risk Assessment

- **`app/api/debug/env/route.ts` is unauthenticated.** It returns no secret values (only a boolean and a length), but it does reveal `NODE_ENV`/`VERCEL_ENV` and the fact that a key is or isn't configured, to anyone who can reach the deployment. Low sensitivity, but it should be **deleted** once the root cause is confirmed and resolved — it is explicitly a temporary diagnostic, not infrastructure to keep.
- **The singleton pattern in `getResearchService()` (Section 5) is a latent operational risk independent of this incident**: any future env var edit in the Vercel dashboard without a full redeploy will not take effect until the next cold start. Worth knowing, not urgent to fix, and explicitly out of scope here ("DO NOT REFACTOR").
- No changes were made to `SerpApiProvider`, `ResearchService`, Supabase tables, plan enforcement, or billing — confirmed via `git status`/`git diff` before writing this report.

---

## 9. What To Do Next

This sandbox cannot query Vercel's API or dashboard, so the environment-scope hypothesis (Section 6, #1) — the most likely root cause — cannot be confirmed from here. Hit `/api/debug/env` on the exact URL/domain that shows the error, and report back `hasSerpApiKey` and `runtime`; that single response will confirm which of the three hypotheses in Section 6 is the actual cause, after which the fix is a Vercel dashboard change (add the var to the right environment scope, or fix a stray character in the key name) and a fresh deployment — no further code change needed.
