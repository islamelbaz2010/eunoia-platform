# Eunoia Platform — Current System Map

Generated as the mandatory discovery step before the Product Improvement & Implementation Mission. Reflects the codebase as of commit `52d5208` on `claude/blissful-newton-Sdej0` (== `research-intelligence-v2-data-layer`). Everything below was verified by reading the actual files, not inferred.

## 1. Stack

- Next.js 16 App Router, deployed on Vercel (production: `ai.halannews.com`, Vercel Production Branch: `main`).
- Root middleware is `proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`).
- Auth/session: Supabase (`@supabase/ssr`), cookie-based.
- Two **separate, uncoordinated** persistence layers:
  - **Prisma → Postgres** (`prisma/schema.prisma`, superuser `DATABASE_URL`/`DIRECT_URL`, bypasses RLS structurally). Models: `User`, `Workspace`, plus `Report`/`ApiUsage` marked `LEGACY` in schema comments (no live route writes to them).
  - **Supabase client** (RLS-scoped via `auth.uid()`). Tables: `reports`, `research_requests`, `user_plans`, `demo_leads`. This is what Lead Finder/Talent Finder actually use.
- Redis: Upstash (`lib/redis/client.ts`, `lib/redis/cache.ts`) — used for rate limiting, the global search quota, and research-result caching. All consumers fail open on Redis errors.
- AI: OpenAI (`gpt-4o-mini` via the `openai` SDK) — used both by the legacy 30-report-type engine (`services/legacy-ai-engine/`) and by the Research Core Engine's AI Analysis stage.
- Search: SerpAPI (`serpapi.com`) — replaced an abandoned Google Custom Search integration (see `SERPAPI_MIGRATION_PLAN.md`).

## 2. Two tenancy models that don't talk to each other

| | Prisma `Workspace` | Supabase per-user |
|---|---|---|
| Used by | `app/api/workspace/route.ts`, `app/api/users/init/route.ts` | `app/api/research/leads`, `.../talent`, `reports`, `research_requests`, `user_plans` |
| Concept | Seats/teams, `Plan` enum (`STARTER/PROFESSIONAL/ENTERPRISE`) | Single user, `UserPlan` type (`STARTER/PROFESSIONAL/AGENCY/ENTERPRISE`) — different enum, different values |
| Wired into research routes? | **No** | Yes — this is the live path |

This split is called out in the codebase's own comments (`types/plan.types.ts:6-9`) as an unresolved "Priority 3 decision."

## 3. Auth/session flow

- `proxy.ts` (root middleware): only gates `/dashboard/*` — redirects unauthenticated users to `/login`. Wrapped in try/catch that silently falls through to `NextResponse.next()` on any error (including missing Supabase env vars).
- `lib/supabase/middleware.ts` exports `updateSession()` — a **second**, more complete implementation (treats almost everything as public except non-dashboard authenticated pages) that gates broadly — but it is **dead code**: nothing imports or calls it. `proxy.ts` does not use it.
- API routes self-check auth individually via `supabase.auth.getUser()` — inconsistently:
  - `app/api/research/leads/route.ts`, `app/api/research/talent/route.ts`, `app/api/workspace/route.ts`: check `user` and return 401 if absent. ✅
  - `app/api/users/init/route.ts`: **no auth check at all.** Accepts `{ email, name, supabaseId, workspaceName, branchKey }` straight from the request body and either returns an existing user's `userId`/`workspaceId` by email, or creates a new Prisma `User`+`Workspace`, using attacker-supplied `email`/`supabaseId` with no verification against the caller's actual Supabase session. This is the Phase 1 target.

## 4. Research Core Engine (Lead Finder / Talent Finder pipeline)

Pipeline, in `lib/research/acquisition/`, orchestrated by `research-service.ts`:

```
Search (SerpApiProvider) → Collect (FetchSourceCollector) → Normalize (normalizeSources)
   → Rank (rankSources) → AI Analysis (analyzeRankedSources) → cached ResearchResult
```

- **Search** (`search-provider.ts`): `SerpApiProvider.search()` hits `serpapi.com/search.json`, gated by a **global, app-wide** daily quota (`quota.ts`, `checkSearchQuota()`, default 150/day, single Redis key `quota:search-provider:<date>`, fail-open).
- **Collect** (`source-collector.ts`): `FetchSourceCollector` does a plain `fetch` + regex HTML-to-text (no headless browser). Skips fetching `NO_FETCH_DOMAINS` (`linkedin.com`, `facebook.com`, `instagram.com`, `twitter.com`, `x.com`) — for those, only the search snippet is used.
- **Source classification** (`classifySourceType()` in `source-collector.ts`) — **this is the root cause of most product-quality findings in the real-CSV audit**:
  ```ts
  if (NO_FETCH_DOMAINS.some(d => host.includes(d))) return 'public_listing'
  if (DIRECTORY_DOMAINS.some(d => host.includes(d))) return 'business_directory'
  return 'company_website'   // <-- default fallback for EVERYTHING else
  ```
  `DIRECTORY_DOMAINS` is a hardcoded 8-item list (`yellowpages`, `kompass.com`, `europages`, `opencorporates.com`, `tradeford.com`, `egyptyp.com`, `yelp.com`, `crunchbase.com`). Wikipedia, government domains (e.g. `dubailand.gov.ae`), job boards (Indeed), embassy PDFs, and competitor sites (Lusha, Dakota) are **not** in either list, so they silently fall through to `company_website` — the same classification as a real company's homepage. This single fallback explains the audit's "directories/government/job-boards scored as companies" finding.
- **Normalize** (`normalizer.ts`): dedupes **only by exact domain**. Cross-domain duplicates of the same real-world company (e.g. a clinic's own website + its Instagram page — two different domains) are never merged. Also tags each source with a best-effort `sectorKey`/`cityKey` by substring-matching `core/data/sectors.data.ts` / `cities.data.ts` labels against the page text.
- **Rank** (`ranker.ts`): pure additive scoring, no validation step:
  ```
  base 40
  + 20 if company_website, +10 if business_directory, +5 if public_listing
  + 15 if sectorKey matches sectorHint
  + 15 if cityKey matches cityHint
  + 5 if collected text > 300 chars
  capped to [0, 95]
  ```
  Because the source-type bonus is keyed off the (broken) classification above, a long Wikipedia article that happens to match the sector/city text can outscore a real company's thin homepage — this is the exact "inverted confidence" pattern found in the real Bank/Dubai export (the one genuine bank scored lowest).
- **AI Analysis** (`ai-analysis.ts`): summarizes a **closed list** — the model can only write a 1-2 sentence summary per already-ranked item by index; it cannot add, remove, or reorder items, and a parse failure falls back to a raw text excerpt. This part is well-designed and not a target of the mission's phases.
- **`research-service.ts`**: orchestrates the above, caches by SHA-256 of the input (`cacheGet`/`cacheSet`, `CACHE_TTL.REPORT`), lazily constructs the `OpenAIProvider` only once search has already succeeded.

## 5. Lead Finder specifics (`app/api/research/leads/route.ts`, `app/dashboard/research/leads/page.tsx`)

- Inputs: `industry` (strict dropdown from `SECTORS` keys, ~70 MENA sectors), `location` (strict dropdown from `CITIES`, ~70 cities across 10 MENA countries), `companySize` (strict 5-bucket dropdown: `1-10/11-50/51-200/201-500/500+`), `titles` (free text).
- `buildLeadQuery(industry, sectorLabel, cityLabel)` builds the search query from industry+location only.
- **`companySize` is captured and stored in `search_criteria` but never passed into the query or into `getResearchService().run()`.** It has zero effect on search, ranking, or filtering — a non-functional filter (Phase 7 target).
- Decision makers: `titles.split(',')` (max 3) is mapped 1:1 onto every returned company with a generated LinkedIn search URL (`linkedInPeopleSearchUrl(`${title} ${item.title}`)`). **This is a 100% verbatim echo of user input — never a real discovered contact, role-inference, or company-specific suggestion** (confirmed both in code and in all 46 real-export rows: every row in a given search has identical decision-maker titles). Phase 8 target.
- Confidence shown to the user is `aggregateConfidence()` — the **mean** of the per-item `rankSources()` scores, labeled High/Medium/Low at 70/40 cutoffs.

## 6. Talent Finder specifics (`app/api/research/talent/route.ts`)

- Pure AI generation (no SerpAPI search) — `gpt-4o-mini` estimates a salary range, hiring-demand level, and candidate *archetypes* (explicitly prompted not to invent named individuals).
- `candidate_sources` come from `lib/research/sources.ts`'s `buildCandidateSources()` — static per-country job-board search-link builders (Wuzzuf/Forasna for Egypt, Bayt/Indeed for Gulf countries) + a LinkedIn people-search link. Not part of this mission's named phases (which target Lead Finder specifically) but shares `computeConfidence()` from `lib/research/sources.ts`.

## 7. Usage control — three independent mechanisms, three different scopes

1. **Per-user rate limit** (`lib/research/rate-limit.ts`): 5 requests/hour/user, Redis key `ratelimit:research:{leads|talent}:{userId}`, fail-open.
2. **Per-user monthly plan limit** (`lib/research/plan-enforcement.ts`): sums `research_requests.credits_used` since the start of the calendar month against `PLAN_LIMITS[plan].reportsPerMonth` (Starter 20 / Professional 100 / Agency 300 / Enterprise unlimited). Defaults every user to STARTER if no `user_plans` row exists. Fails open and **logs nothing** on Supabase error.
3. **Global SerpAPI daily quota** (`lib/research/acquisition/quota.ts`): single Redis key shared by **every user, every tenant** — `DAILY_SEARCH_QUOTA = Number(process.env.SEARCH_DAILY_QUOTA) || 150`. One user's heavy usage can exhaust the daily budget for all other users with no per-tenant fairness. Fail-open.

All three independently call Redis/Supabase and all three fail open — an infra hiccup silently removes every usage control at once, in the same direction, with no compensating control.

## 8. Database tables (Supabase, all in `supabase/*.sql`)

- `reports` (`reports-table.sql`): `id, user_id, report_type, company_name, city, report_data jsonb, created_at`. RLS: `auth.uid() = user_id`, `for all` (read+write).
- `research_requests` (`research-tables.sql` + `usage-tracking.sql`): request lifecycle (`draft→submitted→processing→completed/failed`), `module` (`lead_finder|talent_finder`), `credits_used` (flat default 1, not cost-weighted). RLS: `auth.uid() = user_id`, `for all`.
- `user_plans` (`plan-enforcement.sql`): `user_id PK, plan`. RLS: **select-only** policy for users; no insert/update policy for authenticated users — plan assignment is admin/service-role only (no billing webhook wired up yet).
- `demo_leads` (`leads-table.sql`): public demo-page capture, RLS policies allow `true` for both insert and select (intentionally open — anonymous demo data).
- None of these tables are referenced in `types/supabase.types.ts` — every route casts `supabase as any` to use them (explicit `eslint-disable` comments in both research routes).

## 9. Modules named in the mission that do not yet exist

Confirmed absent from `lib/research/`:
- `lib/research/company-validation.ts` (Phase 2)
- `lib/research/dedup.ts` (Phase 3)
- `lib/research/source-quality.ts` (Phase 5)
- `lib/research/company-expansion.ts` (Phase 6)
- Any `ApolloAdapter` (Phase 9)

## 10. Testing & build tooling

- `package.json` has **no test framework** (`npm test` script doesn't exist; no `jest`/`vitest`/`mocha` in `devDependencies`; no `*.test.ts`/`*.spec.ts` files anywhere outside `node_modules`).
- `npm run build` → `next build`; `npm run typecheck` → `tsc --noEmit`. Both must pass per the mission's validation gate. A test runner (`vitest`, chosen for speed/zero-config with this stack) will need to be added in Phase 1 to satisfy "add tests" for every phase.

## 11. Geographic/market scope

`core/data/cities.data.ts` / `sectors.data.ts`: 10 MENA countries (Egypt, UAE, Saudi, Kuwait, Qatar, Bahrain, Oman, Jordan, Morocco, Iraq), ~70 cities, ~70 sectors, Egypt-specific EGP benchmark data baked into sector definitions. No US/Europe/global coverage anywhere in the product — this bounds what "company expansion" (Phase 6) and "Apollo enrichment" (Phase 9) can realistically promise.
