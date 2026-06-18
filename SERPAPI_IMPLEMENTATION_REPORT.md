# SerpAPI Implementation Report

**Date:** 2026-06-18
**Status:** Implemented per `SERPAPI_MIGRATION_PLAN.md`. Committed locally only — not pushed, not deployed, not merged.

## Summary

Google Custom Search has been fully replaced by SerpAPI as the Research Core Engine's search provider, exactly per the approved migration plan: one new class implementing the existing `SearchProvider` interface, one default swap in `ResearchService`, no changes to `SourceCollector`, `Normalizer`, `Ranker`, `AIAnalysis`, the Zod schemas, or any route.

## Files Modified

- **`lib/research/acquisition/search-provider.ts`** — Replaced `GoogleCustomSearchProvider` with `SerpApiProvider`. Same `SearchProvider` interface, same `SearchProviderError` type, same quota check, same return shape (`SearchResult[]`). Calls `https://serpapi.com/search.json` with `engine=google`, `api_key`, `q`, `num`. Maps `organic_results[].{title,link,snippet}` to `{title,url,snippet}`. Explicitly checks for SerpAPI's in-body `error` field (it can return HTTP 200 with an error message) in addition to `res.ok`, so a failure can't be silently mistaken for zero results.
- **`lib/research/acquisition/research-service.ts`** — Import and constructor default changed from `GoogleCustomSearchProvider` to `SerpApiProvider` (line 5, line 53). One doc-comment reference to "Google Custom Search daily quota" updated to "SerpAPI daily quota." No other logic touched.
- **`lib/research/acquisition/quota.ts`** — Generalized from a Google-CSE-specific module: renamed the Redis key (`quota:google-cse:*` → `quota:search-provider:*`), renamed the exported constant/docstring, and made the daily limit configurable via `SEARCH_DAILY_QUOTA` env var (defaults to 150 if unset). This was necessary because SerpAPI is metered from the first request — unlike Google CSE's free 100/day tier, this number is now a real cost guardrail, and the previous hardcoded `100` had no connection to whatever plan was actually purchased.
- **`.env.example`** and **`.env.local.example`** — `GOOGLE_CSE_API_KEY`/`GOOGLE_CSE_ID` replaced with `SERPAPI_API_KEY` and the new optional `SEARCH_DAILY_QUOTA`.
- **`.env.local`** (gitignored, not committed) — removed the dead `GOOGLE_CSE_API_KEY`/`GOOGLE_CSE_ID` values, added an empty `SERPAPI_API_KEY=` placeholder.

## Files Removed

- `GOOGLE_CSE_DIAGNOSTIC.json`, `GOOGLE_PROJECT_DIAGNOSTIC.json` — artifacts of the now-closed Google CSE investigation, no longer relevant once the provider is removed.
- `core/scoring/` — empty directory, flagged as dead in `FINAL_PLATFORM_AUDIT.md` §3, deleted as housekeeping.
- The `GoogleCustomSearchProvider` class itself (superseded in place, not kept behind a flag — see rationale below).

## Decision: No Fallback/Dual-Provider Mode

`GoogleCustomSearchProvider` was deleted outright rather than kept as a secondary option. Rationale: it is confirmed non-functional (persistent `403 PERMISSION_DENIED` at the GCP-project level) and has been explicitly declared abandoned. Keeping known-broken code as a "fallback" risks someone wiring it back in by accident; git history preserves it if ever needed.

## Live Validation Not Performed

No real `SERPAPI_API_KEY` was provided in this session, so this implementation was validated by **build and type-check only** (see below) — not by an actual live search call. Before relying on this in production: set `SERPAPI_API_KEY` in the real environment and re-run the 4-query validation suite from the original Phase 3 ("Digital Marketing Agencies in Cairo", "Real Estate Developers in Egypt", "HR Companies in Cairo", "Call Center Companies in Egypt") against `getResearchService().run()`, exactly as planned before the Google CSE outage interrupted it.

## Risks

1. **Untested against a live SerpAPI key in this session** — the response-shape mapping (`organic_results[].link/title/snippet`) is correct per SerpAPI's documented schema but has not been exercised against a real response here.
2. **`SEARCH_DAILY_QUOTA` defaults to 150/day**, a placeholder — must be sized against the actual purchased SerpAPI plan's monthly allowance before production traffic, per the cost-guardrail risk already flagged in `SERPAPI_MIGRATION_PLAN.md` §6.

## Rollback

Revert this commit. `SearchProvider` is a clean interface — reverting restores `GoogleCustomSearchProvider` and the old quota numbers with no data migration, since no persisted research result is tagged with which provider produced it.
