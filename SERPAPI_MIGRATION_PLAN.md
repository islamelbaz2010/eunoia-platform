# SerpAPI Migration Plan

**Date:** 2026-06-18
**Status:** Planning only. No code has been changed to produce this document.
**Trigger:** Google Custom Search JSON API is confirmed non-functional (`403 PERMISSION_DENIED — "This project does not have the access to Custom Search JSON API"` on every endpoint, every query, across multiple days of retries). Per explicit decision, Google CSE is now **FAILED and ABANDONED** as a data source. SerpAPI has been purchased as its replacement.

**Guiding constraint:** minimal code change, maximum reuse, no architecture rewrite. The Research Core Engine (`SourceCollector → Normalizer → Ranker → AIAnalysis → ResearchResult`) is untouched by this migration. Only the search step changes.

---

## 1. Why This Is a Small, Safe Change

`SearchProvider` was already designed as a swappable interface (`lib/research/acquisition/search-provider.ts:27-30`):

```ts
export interface SearchProvider {
  name: string
  search(query: string, options?: SearchProviderOptions): Promise<SearchResult[]>
}
```

`ResearchService` consumes it through constructor injection with a default fallback (`research-service.ts:52-56`):

```ts
constructor(options: ResearchServiceOptions = {}) {
  this.searchProvider = options.searchProvider ?? new GoogleCustomSearchProvider()
  ...
}
```

This is exactly the seam the original design anticipated (see the comment at `search-provider.ts:22-26`: "swapping or adding a provider later... is a drop-in, not a redesign"). The migration is: write one new class that implements the same interface, and change one default. Nothing downstream — `SourceCollector`, `Normalizer`, `Ranker`, `AIAnalysis`, the Zod schemas, the Lead Finder route, the cache key strategy — needs to know a provider swap happened.

---

## 2. Files To Modify

### `lib/research/acquisition/search-provider.ts`
Add a new `SerpApiProvider` class alongside the existing one, implementing `SearchProvider`:

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

    const quota = await checkSearchQuota()
    if (!quota.ok) {
      throw new SearchProviderError(
        `Daily search quota exhausted (${quota.used}/${quota.limit} queries used today)`,
        this.name,
        429
      )
    }

    const num = Math.min(Math.max(options.num ?? 10, 1), 100) // SerpAPI supports far more than Google CSE's 10-result cap
    const q = options.siteRestrict ? `${query} ${options.siteRestrict}` : query

    const params = new URLSearchParams({
      engine: 'google',
      api_key: this.apiKey,
      q,
      num: String(num),
    })

    let res: Response
    try {
      res = await fetch(`https://serpapi.com/search.json?${params.toString()}`)
    } catch (err) {
      throw new SearchProviderError(`SerpAPI request failed: ${String(err)}`, this.name)
    }

    const json = await res.json() as { organic_results?: Array<{ title?: string; link?: string; snippet?: string }>; error?: string }

    // SerpAPI sometimes returns HTTP 200 with an `error` field instead of a non-2xx status.
    if (!res.ok || json.error) {
      throw new SearchProviderError(json.error ?? `SerpAPI failed: ${res.status}`, this.name, res.ok ? 502 : res.status)
    }

    return (json.organic_results ?? [])
      .filter((item): item is { title: string; link: string; snippet?: string } => Boolean(item.link && item.title))
      .map(item => ({ title: item.title, url: item.link, snippet: item.snippet ?? '' }))
  }
}
```

This mirrors `GoogleCustomSearchProvider` line-for-line in structure (same error type, same quota check, same shape of returned `SearchResult[]`) — the only real differences are the endpoint, the auth param name (`api_key` vs `key`+`cx`), and the response field names (`organic_results[].link` vs `items[].link`).

**Decision needed at implementation time:** keep `GoogleCustomSearchProvider` in the file (dead but harmless, useful if Google CSE is ever fixed and worth a second source later) or delete it now that it's officially abandoned. Recommendation: **delete it** — keeping known-broken, abandoned code around invites someone wiring it back in by accident. Git history preserves it if ever needed.

### `lib/research/acquisition/research-service.ts`
One-line change, line 53:
```ts
this.searchProvider = options.searchProvider ?? new SerpApiProvider()
```
And update the import on line 5 accordingly. Nothing else in this file changes — the lazy AI-provider construction, caching, and the `run()` pipeline are provider-agnostic already.

### `lib/research/acquisition/quota.ts`
Currently Google-CSE-specific by name and by its hardcoded `100/day` limit (which was Google CSE's specific free-tier cap). Minimal generalization:
- Rename the Redis key from `quota:google-cse:${date}` to `quota:search-provider:${date}` (or `quota:serpapi:${date}` if you want it provider-specific again later).
- Replace the hardcoded `DAILY_FREE_QUOTA = 100` with a value sized to your actual purchased SerpAPI plan (see §5 — pricing). Recommend pulling it from an env var (e.g. `SEARCH_DAILY_QUOTA`, defaulting conservatively) so ops can tune the budget guardrail without a code change/redeploy.
- Update the docstring (currently says "Google Custom Search's free tier is a shared 100/day budget") to describe the new provider's plan.

This file's *shape* (fail-open if Redis unavailable, shared app-wide daily counter) does not need to change — only the numbers and the name.

### `.env.example` and `.env.local.example`
Replace:
```
GOOGLE_CSE_API_KEY=your-google-cse-api-key
GOOGLE_CSE_ID=your-search-engine-id
```
with:
```
SERPAPI_API_KEY=your-serpapi-key
```
(SerpAPI doesn't have a CSE-style "search engine ID" concept — one API key is sufficient.)

---

## 3. Files To Keep (Unchanged)

Everything else in the Research Core Engine:
- `source-collector.ts` — fetch/HTML→text logic, no knowledge of which search provider found the URL.
- `normalizer.ts`, `ranker.ts`, `ai-analysis.ts`, `types.ts` — operate on `SearchResult[]`/`NormalizedSource[]`, provider-agnostic by design.
- `index.ts` — barrel already does `export * from './search-provider'`; no change needed, the new class is exported automatically.
- `app/api/research/leads/route.ts` — imports `getResearchService` and `SearchProviderError` from the barrel; both names are unchanged, so this file needs **zero edits**.
- The entire Lead Finder UI, the caching layer (`lib/redis/cache.ts`), the rate limiter (`lib/research/rate-limit.ts`) — none of these know or care which search provider is behind `ResearchService`.

## 4. Files To Remove

- `GoogleCustomSearchProvider` class from `search-provider.ts` (see recommendation above — delete, don't keep dead/broken code as an option).
- `GOOGLE_CSE_DIAGNOSTIC.json` and `GOOGLE_PROJECT_DIAGNOSTIC.json` at repo root — these were diagnostic artifacts of the now-closed investigation; clean up once this migration is confirmed working (not before, in case anything in them is useful for a postmortem note).
- `core/scoring/` empty directory — unrelated to this migration but trivial to delete in the same housekeeping pass (flagged in `FINAL_PLATFORM_AUDIT.md` §4).

Nothing else needs removal. There is no SerpAPI npm SDK dependency to add or remove — like the Google CSE implementation, this uses plain `fetch` against a REST endpoint, so `package.json` doesn't change.

---

## 5. Estimated Cost

**Caveat: SerpAPI's pricing tiers are based on general knowledge as of my last training update and were not re-verified against SerpAPI's live pricing page in this session (no information about the specific plan already purchased was provided). Confirm exact current figures and the purchased plan's monthly search allowance directly from the SerpAPI account dashboard before finalizing the quota constant in §2.**

Approximate historical SerpAPI tiers, for sizing purposes only:

| Tier | Approx. monthly cost | Approx. searches included | Approx. cost/search |
|---|---|---|---|
| Free trial | $0 | ~250 (one-time, not recurring) | — |
| Entry paid tier | ~$50-75/mo | ~5,000/mo | ~$0.01-0.015 |
| Mid tier | ~$130-150/mo | ~15,000/mo | ~$0.01 |
| Higher tiers | scales up | 30,000+/mo | ~$0.01 and trending down at volume |

For context: the platform's old Google CSE quota was a flat 100 searches/day (~3,000/month) shared app-wide. If SerpAPI usage stays in that range, it likely falls within an entry-to-mid paid tier (~$50-150/month) — but this is a rough order-of-magnitude estimate, not a quote. Two things make the real number different from Google CSE's old "free" framing:
1. SerpAPI is pay-per-search from the first request — there is no free daily allowance once the trial credit is used, so the quota guardrail in `quota.ts` (§2) is now an actual cost control, not just an abuse control.
2. Unlike Google CSE (capped at 10 results/request), SerpAPI bills per *request*, not per result returned — raising `num` per search (e.g., to 20-30) gets more sources per dollar spent, which is a free quality improvement worth considering once the migration is stable (not required for cut-over).

---

## 6. Risks

1. **Budget guardrail must be re-tuned, not just renamed.** The single highest-priority implementation risk: `quota.ts`'s old `100/day` constant was sized for Google's free tier, not for what's now a metered, billed resource. Shipping the rename without resizing the limit to the actual purchased plan risks an unbounded bill if traffic spikes or a bug causes retry storms. Size this against the real plan from SerpAPI's dashboard before deploying.
2. **Response field mapping is a new piece of code, however small.** `organic_results[].link/title/snippet` differs from Google CSE's `items[].link/title/snippet`. Low risk (straightforward mapping, shown in §2) but worth a quick manual smoke test against at least one real query before trusting it in front of the 4-query validation suite from Phase 3.
3. **SerpAPI may return HTTP 200 with an in-body `error` field** for some failure modes (e.g., invalid key) rather than a non-2xx status — the implementation above explicitly checks for `json.error` in addition to `res.ok` to avoid silently treating an error response as zero results.
4. **No free local/test mode.** Every `SerpApiProvider.search()` call costs money from request one. Recommend not exercising it in automated tests/CI; rely on the existing 24h result cache during manual QA to avoid re-spending on repeated identical queries during development.
5. **Concurrency/rate limits on the purchased plan are unknown** at the time of writing. `ResearchService` only ever calls `searchProvider.search()` once per incoming research request (not in a tight loop), so this is low risk at current traffic, but worth confirming against the plan's stated concurrency cap if traffic grows.

---

## 7. Rollback Plan

Because `SearchProvider` is a clean interface with constructor-injected defaults, rollback is structurally trivial: revert the one-line default in `research-service.ts` and restore `GoogleCustomSearchProvider` from git history. In practice, "rollback to Google CSE" is not a meaningful safety net right now since that provider is confirmed broken (403, abandoned) — the real rollback posture is:
- If `SerpApiProvider` also fails (bad key, quota exhausted, API outage), `SearchProviderError` propagates exactly as it did for Google CSE, and the Lead Finder route already maps it to a clean HTTP 502 — no crash, no invented results, an honest "search temporarily unavailable" failure mode. This fail-closed behavior is already in place and requires no new code as part of this migration.
- If a deployed cut-over needs to be reverted for any other reason (e.g., cost runaway), the fix is the same one-line constructor default plus restoring the old env vars — no data migration, no schema change, nothing stateful to unwind, since no result has ever been persisted with a "provider" tag that would need reconciling.

---

## 8. Estimated Implementation Time

- `SerpApiProvider` class: ~30-45 min (write + manual smoke test against one real query).
- `research-service.ts` default swap: ~5 min.
- `quota.ts` rename/resize: ~15 min, plus the time to look up the actual purchased plan's monthly allowance.
- Env var doc updates (`.env.example`, `.env.local.example`): ~5 min.
- Re-run the 4-query Phase 3 real-world validation suite end-to-end against the live `ResearchService`: ~30-45 min (this was already planned and blocked only by the Google CSE outage — it becomes unblocked immediately after this migration lands).
- Cleanup (delete `GoogleCustomSearchProvider`, diagnostic JSON files, `core/scoring/`): ~10 min.

**Total: roughly 2-2.5 hours of focused work**, most of it the validation re-run rather than the migration itself — consistent with this being a genuinely small, contained change to one interface implementation, not an architecture rewrite.

This plan makes no code changes itself. Implementation should only begin once this plan, `FINAL_PLATFORM_AUDIT.md`, and `MASTER_EXECUTION_PLAN.md` have been reviewed and explicitly approved.
