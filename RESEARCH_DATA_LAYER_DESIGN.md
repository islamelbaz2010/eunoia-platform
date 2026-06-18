# Research Data Acquisition Layer — Design

**Branch:** `research-intelligence-v2-data-layer` (created from the frozen `research-intelligence-v1` tip, commit `16175e5`). `research-intelligence-v1` has not been touched.

**Status: design only.** No code, routes, or database have been modified to produce this document.

---

## 0. MASTER_SKILLS_PLUGINS_CONNECTORS.xlsx — re-checked, still not found

A second, broader search was run before writing this document:
- Filesystem-wide `find` for `*master*skill*`, `*plugin*connector*`, `*skills*plugins*` — no match.
- Drive `search_files` with `title contains 'skills' or 'plugins' or 'connectors' or 'MASTER'` — no match (matches were all unrelated: generic "Claude Skills" tutorial docs, kindergarten worksheets, vocabulary-building PDFs, owned by other people's accounts).
- Drive `list_recent_files` (most recent 20 across the connected account) — confirms this Drive is the user's personal/shared account, mostly AI-marketing tutorials and unrelated folders (`AI Insider`, `Videos`, `Scripts`). Nothing resembling a skills/plugins/connectors inventory for this project.

**Conclusion: this file is not reachable from this session by any search strategy tried.** Everything below is repository-only. If you have this file, share it directly (upload into the repo or message it) and I'll re-run this audit against it before any implementation starts.

---

## 1. Reusable Asset Inventory (cross-reference)

Full detail with reusability scores already exists in `RESEARCH_ASSET_AUDIT.md` (committed on `research-intelligence-v1`, carried into this branch). Headline reusable items, carried forward and not re-audited here:

| Asset | Reusability | Role in the new layer |
|---|---|---|
| `lib/redis/{client,cache}.ts` | 5/5 | Cache search/extraction results by query hash — the primary cost-control lever |
| `lib/research/rate-limit.ts` | 5/5 | Per-user request throttling; pattern reused for a separate search-API quota limiter |
| `services/legacy-ai-engine/providers/{base,openai}.provider.ts` | 5/5 | `AIProvider` interface is the template for a new `SearchProvider` interface |
| `services/legacy-ai-engine/orchestrator.ts` | 4/5 | Cache-by-input-hash + rate-limit + provider-fallback pattern — template for the whole acquisition pipeline, not just AI calls |
| `lib/research/sources.ts` | 3/5 | Per-country job-board/LinkedIn-search URL builder — kept as the "verify yourself" fallback link generator |
| `supabase/research-tables.sql` (`research_requests`) | 4/5 | Queue scaffold for making acquisition async (search/extract can take seconds per company) |
| `lib/csv-export.ts`, rate limiting, Supabase write in `app/api/research/{leads,talent}/route.ts` | 5/5 | Entire request shell kept as-is; only the data-generation internals change |

## 2. Existing Connectors Inventory

| Connector | Type | Reusable in production app? |
|---|---|---|
| Supabase (`lib/supabase/*`) | DB | Yes — as-is |
| Upstash Redis (`lib/redis/*`) | Cache | Yes — as-is |
| OpenAI (`services/legacy-ai-engine/providers/openai.provider.ts`) | AI | Yes — as-is |
| Cloudflare Worker proxy (`halannews.com/api-proxy`) | AI fallback | Yes — as-is |
| Resend (email) | Email | Not relevant to acquisition |
| MCP: Google Drive, Meta Ads Library (`ads_library_search`), GitHub, native `WebSearch`/`WebFetch` | Agent-session tools | **No** — these run in this coding-agent environment only. They cannot be called from `app/api/research/leads/route.ts` at request time in production. Useful for this audit, not for the shipped product. |

No production-callable search connector exists today. This is the actual gap Phase B closes.

## 3. Existing Research Workflows Inventory

- `app/dashboard/research/{leads,talent}/page.tsx` + `app/api/research/{leads,talent}/route.ts` — full submit → generate → write → export flow. Today the "generate" step is pure AI invention (confirmed in the Phase 2 verification audit). Kept as the shell; only the generate step is replaced.
- `research_requests` lifecycle table — designed for `draft → submitted → processing → completed/failed`, currently driven synchronously. Reusable unmodified as the async backbone for the new pipeline.
- Legacy 26-report engine (`services/legacy-ai-engine`) — a *report-formatting* workflow, not a research/discovery workflow. Its prompt-template pattern is reused for the "AI Analysis" stage only.

## 4. Existing Search Capabilities Inventory

- `lib/research/sources.ts` builds search-engine **URLs** (LinkedIn people/company search, Wuzzuf/Forasna/Bayt/Indeed job search) — it does not call any search API or return results. It produces a link for a human to click.
- No Google/Bing/SerpAPI/Tavily/Exa SDK or API key exists anywhere in `package.json` or `.env.local`.
- The only entities in this whole environment that can actually execute a live web search and get results back are the coding-agent tools (`WebSearch`) — not callable from the deployed app.

**Net: zero production search capability exists today.** This must be built (Phase B/D), and it is the single largest piece of net-new work in this plan.

## 5. Existing Automation Inventory

- Rate limiting (`checkRateLimit`, fail-open on Redis errors) — reusable.
- Cache-or-fetch pattern (`cacheGetOrSet`, input-hash caching in `orchestrator.ts`) — reusable, directly applicable to caching search results.
- `research_requests` status machine — reusable as an async job scaffold, currently inert.
- No scraping/crawling/scheduled-job automation exists (no cron, no queue worker, no Puppeteer/Playwright).

## 6. Existing Intelligence Assets Inventory

- `core/data/{sectors,cities,branches}.data.ts` — canonical SECTORS/CITIES taxonomies, already used by both Lead Finder and Talent Finder forms. Reusable for normalizing discovered companies into the same taxonomy (e.g. mapping a found company's self-described industry into one of the existing `SECTORS` keys).
- `Eunoia_Platform_Analysis_Final.xlsx` (not the requested file, see §0) — cost benchmarks for adjacent paid APIs (Facebook Ads Library ~$200/mo, GA4 ~$300/mo, Meta Ads Manager ~$500/mo), useful only as comparison pricing in §11.
- `core/scoring/` — empty, dead. Nothing to reuse.

---

## 7. Lead Finder V2 Architecture

```
User submits: industry + location + company size + titles
        │
        ▼
[1] Query Builder           reuse SECTORS/CITIES labels → build a Google CSE query
        │                   e.g. site:*.eg "real estate" "New Cairo" company
        ▼
[2] SearchProvider.search() NEW — Google Custom Search JSON API call, cached by
        │                   query hash in Redis (reuse lib/redis/cache.ts)
        ▼
[3] SourceCollector          NEW — fetch() each candidate URL (company site / directory
        │                   listing page). No headless browser, no JS execution.
        ▼
[4] Extractor                NEW — pull company name, about-text, location/sector hints
        │                   from page text (lightweight HTML→text, no DOM scraping lib)
        ▼
[5] Normalizer                NEW — dedupe by domain, map sector/location hints onto
        │                   core/data/{sectors,cities}.data.ts keys
        ▼
[6] Scorer                    extend computeConfidence()-style logic → opportunity_score
        │                   per company, deterministic, not AI-invented
        ▼
[7] AI Analysis (OpenAIProvider) AI receives ONLY the fixed list from step 5/6 and
        │                   may summarize/explain fit — it cannot add a company that
        │                   isn't already in that list (structural guarantee, not a
        │                   prompt instruction)
        ▼
[8] Report writer → Supabase `reports` (unchanged) + UI shows Source URL per company
```

Hard rule "if evidence cannot be found, do not include the company" is enforced by construction: step 7 is fed a closed list, not an open-ended generation prompt.

## 8. Talent Finder V2 Architecture

Talent Finder already points users at real job boards (`lib/research/sources.ts`'s `buildCandidateSources`), so it needs less new acquisition work than Lead Finder — the gap here is **labeling**, not data collection:

```
[1] SearchProvider.search() reuse — query public job boards (Wuzzuf/Forasna/Bayt/Indeed)
        │                   for live postings matching the title/location
        ▼
[2] Extractor                 NEW (small) — pull job title, employer, posting date,
        │                   source URL from job-board search-result pages
        ▼
[3] verified_postings[]        → these fields are tagged "Verified" with a source URL
        ▼
[4] AI Analysis                AI estimates salary range / hiring-demand commentary from
        │                   sector benchmarks — tagged "AI estimate", never merged into
        │                   the verified fields
        ▼
[5] Report                    UI renders two visually distinct sections: Verified postings
                            (with source links) vs AI Market Estimate (clearly labeled)
```

## 9. Data Acquisition Layer Architecture (shared module)

`lib/research/acquisition/` — one module, used identically by Lead Finder and Talent Finder today, and by Competitor/Supplier/Market Intelligence later:

```ts
interface SearchProvider {
  search(query: string, opts?: { num?: number }): Promise<SearchResult[]>
}
interface SourceCollector {
  collect(url: string): Promise<{ text: string; finalUrl: string } | null>
}
// extract/normalize/score are plain functions, not classes — each module
// (leads, talent, competitor, supplier, market) supplies its own extraction
// rules but calls the same search → collect → score pipeline.
```

This directly mirrors the existing `AIProvider` interface in `services/legacy-ai-engine/providers/base.provider.ts` — same shape, same place in the codebase's mental model, so it's not a new pattern to learn.

---

## 10. Estimated Implementation Effort

(Single engineer, focused work, no context-switching — calendar time will run longer.)

| Component | Effort |
|---|---|
| `SearchProvider` (Google CSE wrapper + Redis cache + dedicated rate limiter) | 0.5–1 day |
| `SourceCollector` (fetch + HTML→text) | 0.5–1 day |
| `Extractor` (heuristic field-pulling for company pages) | 1–1.5 days |
| `Normalizer` (dedupe + taxonomy mapping) | 0.5 day |
| `Scorer` (opportunity score, extends existing confidence pattern) | 0.5 day |
| Lead Finder route + UI wiring (source URL column, evidence badge, drop the "fully AI" path) | 1 day |
| Talent Finder verified/estimate split (schema + UI) | 1 day |
| Manual QA against real queries across a few sectors/cities | 1 day |
| **Total for Lead Finder V2 + Talent Finder V2** | **~6–8 dev-days** |

Generalizing the module cleanly enough for Competitor/Supplier/Market Intelligence to reuse later (rather than just hardcoding it for Lead Finder) adds roughly **+1–2 days** up front — and is what makes those future modules near-zero incremental effort, per the "design for reuse" directive.

## 11. Estimated Operating Cost

| Item | Cost |
|---|---|
| Google Custom Search JSON API | Free to 100 queries/day; $5 per 1,000 after |
| Page fetch/extract | $0 — native `fetch`, no Puppeteer/headless browser, no screenshot API (avoids the $50/mo line item seen in the legacy roadmap xlsx) |
| Redis cache | $0 incremental — already provisioned |
| OpenAI calls | $0 incremental — same calls as today, slightly shorter prompts |
| **Estimated total at ≤100 lead/talent searches per day** | **$0–~$15/mo** |

This stays far below every comparable paid-API line item in the legacy roadmap spreadsheet ($200–500/mo), because none of those solve company-discovery — they solve ad-spend/analytics visibility, a different problem.

## 12. Highest ROI Implementation Order

1. **Build the generic acquisition module** (`lib/research/acquisition/`), sized for Lead Finder's need first. Foundation everything else reuses — do this once, well.
2. **Lead Finder V2** — wire the module into `app/api/research/leads/route.ts`; this is the module the verification audit flagged hardest ("AI-simulated, not real research"), so it has the most credibility/revenue upside per unit of effort.
3. **Talent Finder V2 verified/estimate split** — cheapest remaining item (no new acquisition needed, just labeling + a small extractor), ship right after Lead Finder.
4. **Competitor Intelligence** (reuses the same module; only viable once a real Meta Ads API integration exists — treat as a paid-tier addition, not part of the near-zero-cost phase).
5. **Supplier Intelligence / Market Intelligence Hub** — defer until 1–3 are validated with real usage; building these first would be speculative infrastructure with no demand signal yet (this is the "lowest ROI path" already flagged in the V2 architecture discussion).

---

Waiting for approval before any implementation, route change, or database change.
