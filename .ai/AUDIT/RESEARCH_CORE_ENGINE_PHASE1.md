# Research Core Engine — Phase 1 Implementation

**Branch:** `research-intelligence-v2-data-layer`. `research-intelligence-v1` and `main` untouched. Local commit only — no push, no merge, no deploy.

**Status: implemented.** This is the first code (not audit/design) delivered in this branch chain, scoped exactly to the 6 layers requested — no business-module wiring, no UI changes, no Reports/Real Estate changes, no database changes.

---

## 1. Files created

All under one new, self-contained directory:

| File | Layer | Purpose |
|---|---|---|
| `lib/research/acquisition/types.ts` | Research Result Schema | `ResearchResultItem`/`ResearchResult` zod schemas (runtime-validated) + pipeline-internal types (`SearchResult`, `CollectedSource`, `NormalizedSource`, `RankedSource`) |
| `lib/research/acquisition/quota.ts` | (supporting) | Tracks Google CSE's shared 100-queries/day free budget in Redis, separate from the existing per-user limiter |
| `lib/research/acquisition/search-provider.ts` | Search Provider Layer | `SearchProvider` interface (mirrors `AIProvider`'s shape) + `GoogleCustomSearchProvider` implementation + `SearchProviderError` |
| `lib/research/acquisition/source-collector.ts` | Source Collector Layer | `SourceCollector` interface + `FetchSourceCollector` (plain `fetch` + hand-rolled HTML→text, no browser/DOM lib) + `classifySourceType`/`isNoFetchDomain` |
| `lib/research/acquisition/normalizer.ts` | Source Normalization Layer | `normalizeSources()` — dedupes by domain, maps page text onto `core/data/{sectors,cities}.data.ts` keys |
| `lib/research/acquisition/ranker.ts` | Source Ranking Layer | `rankSources()` — deterministic, input-only `confidenceScore` (same principle as the existing `computeConfidence()`) |
| `lib/research/acquisition/ai-analysis.ts` | AI Analysis stage | `analyzeRankedSources()` — summarizes a **closed list**, can't add/remove/invent an item |
| `lib/research/acquisition/research-service.ts` | Research Service Layer | `ResearchService` class — orchestrates all of the above + Redis caching by query hash (same pattern as `ReportOrchestrator`) |
| `lib/research/acquisition/index.ts` | — | Barrel export |
| `RESEARCH_CORE_ENGINE_PHASE1.md` | — | This document |

**9 source files, ~420 lines total.**

## 2. Files modified

| File | Change |
|---|---|
| `.env.example` | Added `GOOGLE_CSE_API_KEY` / `GOOGLE_CSE_ID` (documentation only, no real values) |
| `.env.local.example` | Same, with setup-instruction comments |
| `tsconfig.tsbuildinfo` | Auto-updated by `tsc --noEmit` (build cache, same as the prior `5532fc5` commit) |

**Nothing else.** No route under `app/api/research/*` touched, no UI under `app/dashboard/*` touched, no `reports`/Real Estate code touched, no `package.json` dependency added (zod was already installed).

## 3. Architecture diagram

```
                    ┌─────────────────────────┐
                    │      ResearchService      │  research-service.ts
                    │  (cache-by-query-hash,    │
                    │   same pattern as         │
                    │   ReportOrchestrator)     │
                    └────────────┬─────────────┘
                                 │ .run({ query, sectorHint, cityHint, ... })
                                 ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  SearchProvider    │→ │ SourceCollector   │→ │   Normalizer       │→ │     Ranker         │→ │  AI Analysis        │
│ search-provider.ts │  │ source-collector.ts│  │  normalizer.ts     │  │  ranker.ts          │  │  ai-analysis.ts     │
│                    │  │                    │  │                    │  │                     │  │                     │
│ GoogleCustomSearch  │  │ fetch + HTML→text  │  │ dedupe by domain   │  │ deterministic        │  │ summarizes a CLOSED  │
│ Provider — only     │  │ skips LinkedIn/    │  │ map sector/city    │  │ confidenceScore      │  │ list; cannot add,    │
│ approved Phase 1    │  │ Facebook/IG/X      │  │ onto core/data     │  │ (0-95, input-only)   │  │ remove, or invent     │
│ source              │  │ (search-snippet     │  │ taxonomy keys      │  │                       │  │ an item               │
│                    │  │ only for those)     │  │                    │  │                       │  │                       │
└──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
                                                                                                          │
                                                                                                          ▼
                                                                                          ┌──────────────────────┐
                                                                                          │   ResearchResult        │
                                                                                          │ (zod-validated)         │
                                                                                          │  types.ts                │
                                                                                          └──────────────────────┘
```

## 4. Source flow diagram

```
User Query (industry/location/title — built by the caller, e.g. Lead Finder)
        │
        ▼
GoogleCustomSearchProvider.search(query)
        │  → checkSearchQuota() first (100/day shared budget)
        │  → real Google CSE results only: { title, url, snippet }
        ▼
For each result:
  ├─ classifySourceType(url) → 'company_website' | 'business_directory' | 'public_listing'
  └─ if isNoFetchDomain(url) [linkedin/facebook/instagram/twitter/x]:
        skip fetch — keep only the search snippet as evidence
     else:
        FetchSourceCollector.collect(url) → { text, finalUrl, title } | null (timeout/non-HTML/error → null)
        │
        ▼
normalizeSources(): dedupe by domain, drop empty title/text, attach sectorKey/cityKey
        │
        ▼
rankSources(): deterministic confidenceScore + rankReason
        │
        ▼
analyzeRankedSources(): AI summarizes each of the (already real, already scored) items
        — on AI failure/malformed JSON, falls back to the raw collected excerpt,
          never to a blank or invented summary
        │
        ▼
ResearchResult { query, items: ResearchResultItem[], totalSourcesFound, totalSourcesCollected, cached, durationMs }
  each item: { title, sourceUrl, sourceType, confidenceScore, summary }
```

**Hard rule enforcement, concretely:** if `GoogleCustomSearchProvider.search()` returns zero results, every downstream stage receives an empty array and `items` in the final result is `[]` — there is no code path that fills it with AI-invented companies. The AI Analysis stage only ever receives indices `0..N-1` of sources that already passed through Search → Collect → Normalize → Rank, and the final mapping is built by iterating that same fixed array, not by trusting an AI-returned list.

## 5. Database impact

**Zero.** No migration, no new table, no schema change, no write path added. This phase is a pure library module — nothing calls it yet (see §8). `research_requests` and `reports` are untouched. Caching uses Redis only (`lib/redis/cache.ts`, already provisioned), keyed by a SHA-256 hash of the query input, 24h TTL — identical mechanism to the existing report cache, just a different key prefix (`research:acquisition:*`).

## 6. Build results

```
$ npm run build
✓ Compiled successfully in 7.6s
✓ Generating static pages using 3 workers (25/25)
```

One pre-existing warning (unrelated to this change, present before this branch): a Turbopack Node File Trace warning about `lib/prisma/generated/index.js` being pulled in via `app/api/workspace/route.ts`. No errors. All 23 existing routes built unchanged.

## 7. TypeScript results

```
$ npx tsc --noEmit
(no output — zero errors)
```

## 8. Integration plan (not implemented yet — plan only, per scope)

None of the routes below were modified. This is the recommended order and shape for a future phase:

### Lead Finder (`app/api/research/leads/route.ts`)
- Replace the current "ask AI to invent 6-10 companies/archetypes" block (lines 101-123 today) with: build a query from `industry`/`location`/`companySize` (reusing `getSector`/`getCity` exactly as today) → `getResearchService().run({ query, sectorHint: sector key, cityHint: city key, maxResults: 10 })`.
- `reportData.companies` becomes a direct map of `ResearchResult.items` (title→name, sourceUrl→evidence link, confidenceScore→lead_score, summary→description) instead of `ai.companies`.
- Drop the "archetype, not a real company" language from the prompt entirely — every returned item is now a real discovered source by construction.
- Keep everything else (`rate-limit`, `research_requests` lifecycle, Supabase `reports` insert, CSV export) exactly as-is — this confirms the Phase B/C design's "keep the shell, replace only the data stage" plan.
- Effort: ~1 day (matches `RESEARCH_DATA_LAYER_DESIGN.md` §10).

### Talent Finder (`app/api/research/talent/route.ts`)
- Lowest-effort integration: keep `buildCandidateSources()` (job-board links) exactly as today — that's already real, not AI-invented.
- Add one `ResearchService.run()` call scoped to job-posting pages (`siteRestrict` toward Wuzzuf/Bayt/Indeed domains) to populate a new `verified_postings[]` field with real, source-linked listings.
- Salary range / hiring demand stay AI estimates, but now explicitly labeled and visually separated from `verified_postings`, per the V2 directive's "Verified vs AI estimate" split.
- Effort: ~1 day.

### Competitor Intelligence (not yet built)
- Same `ResearchService`, query built from `"{competitor name} site:facebook.com/ads OR official site"`-style terms, `sectorHint`/`cityHint` from the same taxonomy.
- Genuinely new work is only the result-shaping layer (ad-creative-style fields), not a new acquisition pipeline — confirms `RESEARCH_DATA_LAYER_DESIGN.md` §12's sequencing (build after Lead/Talent, reuse this engine as-is).
- Real Meta Ads data specifically (not just competitor websites) still requires the paid Meta Ads API integration flagged as a separate, paid-tier item in that design doc — unchanged by this implementation.

### Supplier Intelligence (not yet built)
- Same `ResearchService`, query built from `"{material/service} supplier {city}"`-style terms.
- `business_directory` source type (Kompass/Europages/trade directories) becomes the dominant, highest-value source type for this module specifically — no new collector code needed, `classifySourceType()` already recognizes these domains.
- Lowest-effort of the four to integrate once Lead Finder validates the pattern end-to-end.

---

Waiting for approval before wiring this engine into any route, before any database change, and before any push/merge/deploy.
