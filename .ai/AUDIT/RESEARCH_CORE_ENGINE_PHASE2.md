# Research Core Engine — Phase 2: Lead Finder Integration

**Branch:** `research-intelligence-v2-data-layer`. `research-intelligence-v1` and `main` untouched. Local commit only — no push, no merge, no deploy.

**Status: implemented, with one finding that could not be verified live (see §7 — read before trusting §3's "Sample outputs").**

---

## 1. Files modified

| File | Change |
|---|---|
| `app/api/research/leads/route.ts` | Replaced the AI-invents-companies block with a real call to `getResearchService().run()`. Everything else (auth check, body validation, rate limiting, `research_requests` lifecycle, `reports` insert) is unchanged. |
| `app/dashboard/research/leads/page.tsx` | Updated `Company`/`LeadReport` interfaces, the result-rendering JSX, and `exportCSV()` to show/export the new evidence-based fields (Source URL, Confidence Score, Source Type, Summary) instead of the old `lead_score`/`description`/`why_fit`/`estimated_size`/`public_sources`. Same page, same form, same CSS — no new module. |
| `lib/research/acquisition/research-service.ts` | Bug fix found during this phase's validation (see §7): `OpenAIProvider` is now constructed lazily on first use inside `run()` instead of eagerly in the constructor. |
| `tsconfig.tsbuildinfo` | Auto-updated build cache. |

**Nothing else.** No new route, no new page, no database/schema change, no `research_requests`/`reports` lifecycle change, no Talent Finder/Competitor/Supplier code touched.

## 2. Files created

None. Phase 2 is integration-only — it wires the existing Phase 1 engine (`lib/research/acquisition/`) into the existing Lead Finder route and page.

## 3. What changed, concretely

### `app/api/research/leads/route.ts`
- Removed: `buildPrompt()`, the `AICompany`/`AIResponse` interfaces, the OpenAI chat-completion call that asked the model to invent "6-10 companies/archetypes."
- Added: `buildLeadQuery(industry, sectorLabel, cityLabel)` — builds the search query from the curated sector/city labels, falling back to the raw user-typed industry string when it isn't a curated `SECTORS` key (e.g. "Call Center" isn't a taxonomy entry, so the query stays `"Call Center companies in <city>"` instead of degrading to `"Other companies in <city>"`).
- Added: `aggregateConfidence(items)` — replaces `computeConfidence()` for this route. Averages the engine's per-item `confidenceScore` (itself deterministic, from `rankSources()`) rather than estimating from form-field completeness. Returns `{ pct: 0, label: 'Low' }` with an explicit "nothing is shown rather than inventing a result" reason when zero items are found.
- The route now calls:
  ```ts
  result = await getResearchService().run({
    query,
    sectorHint: sector === SECTORS.other ? undefined : industry,
    cityHint: city.key,
    maxResults: 10,
  })
  ```
  wrapped in a try/catch that maps a `SearchProviderError` (or any other thrown error) to a `502` JSON error response and marks the `research_requests` row `failed` — it never falls through to a fabricated company list.
- `companies` is now a direct map of `result.items`: `name` ← `item.title`, `sourceUrl` ← `item.sourceUrl`, `sourceType` ← `item.sourceType`, `confidenceScore` ← `item.confidenceScore`, `summary` ← `item.summary`. `linkedin_company_search_url` and `decision_makers[].linkedin_search_url` are still constructed deterministically from the real discovered company name and the user-typed titles (same non-fabricating pattern as before — these are search-page links, never an invented contact).
- `executive_summary`/`research_summary` are now built from real counts (`result.totalSourcesFound`, `result.totalSourcesCollected`, `companies.length`) instead of an AI-written paragraph.

### `app/dashboard/research/leads/page.tsx`
- `Company` interface is now `{ name, sourceUrl, sourceType, confidenceScore, summary, linkedin_company_search_url, decision_makers }` — the old `description`/`why_fit`/`estimated_size`/`public_sources`/`lead_score` fields are gone (the engine doesn't produce them; showing them would mean inventing them).
- Each company card now shows: name, **confidence score** (`{confidenceScore}% confidence`), **source type** as a chip (`Company Website` / `Business Directory` / `Public Listing`), the AI-written **summary** of the real collected page text, and the **source URL itself as visible, clickable text** (not just a button label) so the evidence is plainly shown, not hidden behind a generic "view" link.
- Added an explicit empty state (`No real companies were found for this search...`) instead of silently rendering a blank list when `companies.length === 0`.
- `exportCSV()` columns: `Company, Confidence Score, Source Type, Source URL, Summary, LinkedIn Search, Decision Maker Titles` — every column is either a literal field from the engine's output or a deterministically-constructed link, never an invented value.

## 4. Sample outputs

**None fabricated.** Per the engine's own "no fabricated sources, no invented research records" requirement — which this exact phase is integrating — I will not hand-write a plausible-looking `ResearchResult` to fill this section. See §6 for why, and §7/§8 for what to do next.

What I can show truthfully is the **shape** of what the route now returns on a real success (types are enforced by `ResearchResultItemSchema`, so this is exactly the structure, not an approximation):

```json
{
  "search_criteria": { "industry": "Marketing Agency", "location": "Cairo", "company_size": "11-50", "titles": "CEO, Marketing Director" },
  "executive_summary": "Found 7 real companies for \"Marketing Agency companies in Cairo\" from 10 search results (8 unique sources after dedup).",
  "research_summary": "Every company below was discovered through Google Custom Search and a public source...",
  "companies": [
    {
      "name": "<exact <title> tag or search-result title of a real page>",
      "sourceUrl": "<exact URL returned by Google Custom Search or the fetched page's final URL>",
      "sourceType": "company_website",
      "confidenceScore": 80,
      "summary": "<AI summary of that one page's real text, or the raw excerpt if the AI call fails>",
      "linkedin_company_search_url": "https://www.linkedin.com/search/results/companies/?keywords=...",
      "decision_makers": [{ "title": "CEO", "linkedin_search_url": "https://www.linkedin.com/search/results/people/?keywords=CEO%20..." }]
    }
  ],
  "outreach_disclaimer": "...",
  "confidence_score": { "pct": 71, "label": "High", "reason": "Evidence-based score from the Research Core Engine..." },
  "total_sources_found": 10,
  "total_sources_collected": 8
}
```

## 5. Test results (test matrix)

Required queries: **Digital Marketing Agencies in Cairo**, **Real Estate Developers in Egypt**, **HR Companies in Cairo**, **Call Center Companies in Egypt**.

| Query | Number of companies | Source URLs | Confidence scores | Output quality |
|---|---|---|---|---|
| Digital Marketing Agencies in Cairo | **Not run live** — see below | — | — | — |
| Real Estate Developers in Egypt | **Not run live** | — | — | — |
| HR Companies in Cairo | **Not run live** | — | — | — |
| Call Center Companies in Egypt | **Not run live** | — | — | — |

**Why these are blank instead of numbers, and what I verified instead:**

This sandbox has no real `GOOGLE_CSE_API_KEY` / `GOOGLE_CSE_ID` / `OPENAI_API_KEY` (confirmed via `process.env` directly, not just the `.env.local.example` placeholders — only an unrelated `RESEND_API_KEY` exists in `.env.local`). Running the four required queries through the real pipeline is therefore not possible here. Filling this table with invented company names/URLs/scores would be exactly the "fabricated research record" this engine exists to prevent — so instead I ran the actual code, unmodified, against the four exact queries to verify the **failure behavior** is correct:

1. **Wrote a throwaway script** (`tsx`, not committed) that calls `getResearchService().run({ query, maxResults: 10 })` for each of the four required queries.
2. **Result, before my fix:** all four crashed with a raw `OpenAI` SDK error (`The OPENAI_API_KEY environment variable is missing or empty...`) thrown from `ResearchService`'s constructor — *before* the search step ever ran. This was a real bug: it meant a deployment missing only the AI key would get a confusing OpenAI-specific stack trace instead of a clear engine error, and it happened even when Google CSE *was* configured, because the AI provider was built eagerly. Fixed in `research-service.ts` (now lazy — see §1).
3. **Result, after my fix, with no `OPENAI_API_KEY` at all:** all four queries now throw a clean `SearchProviderError: Google Custom Search is not configured (GOOGLE_CSE_API_KEY / GOOGLE_CSE_ID missing)` — exactly the intended "fail closed, explain why, invent nothing" behavior, and `companies: []` is what the route would return to the UI (via the 502 path, which the page surfaces as an error banner, not an empty success).
4. **Verified the route's catch path matches:** `app/api/research/leads/route.ts` classifies this exact error as `SearchProviderError` and returns `502` with the message — never falls through to building a `companies` array from anything else.
5. **Verified network egress separately is not the blocker:** `fetch('https://www.googleapis.com/customsearch/v1?...')` and `fetch('https://api.openai.com/v1/models')` both reached the real APIs from this sandbox (got `400`/`403` auth-rejection responses, not connection errors) — so if real credentials are supplied, the Search Provider and AI Analysis calls themselves should be reachable from an environment configured like this one.
6. **Verified the Source Collector layer's own fail-closed behavior** against several genuinely real public URLs (Wikipedia, IANA, example.com, httpbin.org): `FetchSourceCollector.collect()` returned `null` for all of them — not because the collector is broken, but because this sandbox's network egress is an **allowlist** (`fetch` to those domains returned `403 Host not in allowlist: ... Add this host to your network egress settings to allow access`, a proxy-level message, not a code error). This is a sandbox configuration fact, not a defect in the collector — see §7.

**Output quality assessment:** cannot be honestly scored without at least one real run. The structural guarantee (closed-list AI analysis, schema validation dropping malformed items, deterministic ranking) is unchanged from Phase 1 and was verified there; this phase didn't touch that logic.

## 6. Why I didn't simulate the test matrix

Every prior deliverable in this engagement (`RESEARCH_ASSET_AUDIT.md`, `RESEARCH_DATA_LAYER_DESIGN.md`, `MASTER_SKILLS_CROSS_REFERENCE.md`, `COMPOSIO_AUDIT.md`, and Phase 1's own "no fabricated sources" requirement) was built on the same rule: report exactly what was verified, flag exactly what wasn't, never invent something plausible to fill a gap. The four-query test matrix needs a real Google Custom Search key and a real OpenAI key, neither of which exists in this sandbox's actual process environment. Inventing four lists of "discovered companies" to make this table look complete would be the single thing this entire project has been built to prevent.

## 7. Risks

1. **Untested-with-real-credentials (highest risk):** the integration code is correct TypeScript that builds and type-checks, and the failure path is verified, but the success path (`searchProvider.search()` returning real results → collection → normalization → ranking → AI summary → schema-valid `ResearchResultItem[]`) has only been verified in Phase 1 with unit-level reasoning, not a live end-to-end run with real data, because no real credentials exist here. **Action for the user:** add real `GOOGLE_CSE_API_KEY`/`GOOGLE_CSE_ID`/`OPENAI_API_KEY` to `.env.local` and run the four test-matrix queries through the actual UI (`/dashboard/research/leads`) once, before treating this as production-validated.
2. **Found-and-fixed bug, but only caught because I tested it:** the eager `OpenAIProvider` construction in `ResearchService`'s constructor (pre-existing since Phase 1, not introduced by this route change) would have produced a confusing raw OpenAI SDK error for any deployment with an incomplete credential set, masking the real problem if Google CSE was *also* missing. Fixed now; flagging in case other Phase-1-built code has similar eager-construction assumptions not yet exercised.
3. **Network egress allowlisting (sandbox-specific, not a code defect):** this sandbox's outbound network access goes through an allowlist proxy that explicitly rejects arbitrary domains (`403 Host not in allowlist`). Google's and OpenAI's API hosts are reachable; ordinary company websites (Wikipedia, example.com, etc.) are not, in *this* sandbox. The `FetchSourceCollector`'s job is specifically to fetch arbitrary company websites discovered by search — if a real deployment (e.g. Vercel) has unrestricted egress, this isn't a concern; if any future hosting environment uses a similar allowlist, the Source Collector layer would need those destinations allowlisted or it will silently (and correctly, per its `null`-on-failure design) skip every site it can't reach, lowering `totalSourcesCollected` and confidence scores without ever erroring.
4. **`decision_makers` are not from the Research Core Engine:** they're deterministic LinkedIn-search-URL constructions from the user-typed titles and the real discovered company name — never a specific invented person, same pattern as Phase-1-era code (`lib/research/sources.ts`). Carried over unchanged, but worth restating since the directive's "every displayed company must originate from Research Core Engine" should be read as the *company* record, not this link-construction convenience.
5. **Google Custom Search's shared 100/day quota** (tracked by `checkSearchQuota()`) is per-deployment, not per-user — a few test-matrix runs plus any other research module sharing the same key will exhaust it quickly on the free tier. Not a Phase 2 regression (same quota logic since Phase 1), just worth the user's awareness before running the real test matrix.

## 8. Recommended next phase

1. **Run the real test matrix once real credentials exist** — this is the one gap Phase 2 could not close in this sandbox, and it's a prerequisite for calling Lead Finder "verified," not just "correctly wired."
2. **Talent Finder integration** (per the Phase 1 doc's plan, still unchanged): lowest-effort next target, since `buildCandidateSources()` is already real; only needs one `ResearchService.run()` call scoped to job-board domains.
3. **Audit other Phase-1 singletons for the same eager-construction pattern** found in §7.2 (a five-minute grep, not a redesign) before building Competitor/Supplier Intelligence on top of the same `ResearchService`.

---

Do not push. Do not deploy. Do not merge.
