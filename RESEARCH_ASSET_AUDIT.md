# Research Asset Audit — Eunoia Research Intelligence V2

**Phase A of the V2 Data-Driven Research Engine directive.**
Scope: audit only. No code, routes, or database were modified to produce this document.

---

## 0. Mandatory input file: `MASTER_SKILLS_PLUGINS_CONNECTORS.xlsx`

**Status: NOT FOUND. Could not be audited.**

Search performed:
- `find / -iname "*MASTER_SKILLS*"` (whole filesystem) — no match.
- `Glob **/*.xlsx` (repository) — only one xlsx exists in the repo, and it is not this file (see §0.1 below).
- Google Drive connector `search_files` with `fullText contains 'MASTER_SKILLS' or title contains 'MASTER_SKILLS'` — one result returned, an unrelated children's-education PDF owned by a third-party domain (`als-schools.org`). Not the target file; discarded as a false positive.

**This file does not exist anywhere accessible from this session.** If it exists on your machine, Drive account, or elsewhere, it needs to be shared into this environment (uploaded to the repo, or made visible to the connected Drive account) before its contents can be folded into this audit. Everything below is therefore based on the **repository only** — the second mandated source.

### 0.1 What *does* exist: `Eunoia_Platform_Analysis_Final.xlsx`

One spreadsheet exists at the repo root (25,986 bytes, last modified May 22). It is **not** the requested file — different name, different purpose. For completeness, its contents were extracted (it is a standard `.xlsx`; opened via zip extraction since no xlsx-parsing library exists in this project) and reviewed:

| Sheet | Content |
|---|---|
| `link and auth` | Login link + plaintext admin credentials for `halannews.com` (the legacy AI-proxy domain referenced in `services/legacy-ai-engine/orchestrator.ts`). **Security note:** credentials are stored in plaintext in this spreadsheet — recommend rotating them and not storing future credentials this way. |
| `📊 الوضع الحالي` (Current status) | Status tracker for the **legacy 26-report AI engine**: 29 completed zero-cost improvements (sector benchmarks, city CPL multipliers, reality-check layer, LTV/CAC auto-calc, etc.). |
| `📋 التقارير (26)` | Per-report-type breakdown: data sources used, current accuracy %, and what would raise accuracy. |
| `📈 دراسات الجدوى (9)` | Same breakdown for the 9 feasibility-study sectors. |
| `🚀 Phase 2 & 3` | A **paid-API roadmap** for the legacy engine, with real cost figures: Facebook Ads Library API (~$200/mo), competitor screenshot/Puppeteer API (~$50/mo), branded PDF export (~$30/mo), Meta Ads Manager API direct (~$500/mo), GA4 API (~$300/mo), plus business-model ideas (SaaS subscription, white-label). |

This is a useful **cost-benchmark reference** (real third-party API pricing for adjacent data problems) and is cited in §6 (Cost Analysis) below, but it is **not** a skills/plugins/connectors inventory and does not satisfy the directive's mandatory-input requirement. Treat the gap in §0 as open until the actual file is located.

---

## 1. Repository Asset Inventory

Audited: `app/`, `lib/`, `core/`, `services/`, `prisma/`, `supabase/`, `package.json`. Scored 1 (low) – 5 (high) on reusability for the V2 evidence-based pipeline.

| # | Category | Description | Current State | Reusability | Est. Value | Recommended Usage |
|---|---|---|---|---|---|---|
| 1 | **Skills** (prompt templates) | `services/legacy-ai-engine/prompts/*.prompt.ts` — 26 report-type prompt builders (`competitor.prompt.ts`, `lead-quality.prompt.ts`, `market-entry.prompt.ts`, etc.), each a pure function `(ctx) => JSON-instruction string`. | Live, working, used only by the legacy engine today. | 4/5 | High | Reuse the *pattern* (typed `PromptContext` in → strict-JSON-schema prompt out) for the new "AI Analysis" stage of the pipeline — write evidence-grounded prompts the same way, not new ones from scratch. |
| 2 | **Plugins** | None found. No plugin/extension system exists in this codebase. | N/A | N/A | N/A | Nothing to reuse; not needed for V2 either. |
| 3 | **Connectors — DB** | `lib/supabase/client.ts`, `server.ts`, `middleware.ts` — Supabase JS client wrappers (browser + server + middleware session refresh). | Live, used by every route. | 5/5 | High | Reuse as-is for all new tables (e.g. discovered-company cache). |
| 4 | **Connectors — Cache** | `lib/redis/client.ts`, `lib/redis/cache.ts` — Upstash Redis client + `cacheGet/cacheSet/cacheGetOrSet`, TTL presets. | Live, used by rate limiting. | 5/5 | **Critical** | This is the cost-control lever for V2: cache search/extraction results by query hash (same pattern as `orchestrator.ts`'s `buildInputHash`) so repeat lead-finder queries don't re-hit paid search APIs. |
| 5 | **Connectors — AI** | `services/legacy-ai-engine/providers/openai.provider.ts` + `base.provider.ts` (`AIProvider` interface: `generate/stream/estimateCost`) + Cloudflare Worker fallback proxy (`halannews.com/api-proxy`) in `orchestrator.ts`. | Live. | 5/5 | High | Reuse the `AIProvider` interface pattern for the "AI Analysis" stage; the existing fallback-on-failure + cache-by-hash + rate-limit logic in `orchestrator.ts` is a template for the whole Data Acquisition Layer, not just AI calls. |
| 6 | **Connectors — Email** | `resend` package + usage in `app/api/demo/generate/route.ts`. | Live. | 2/5 | Low (for research pipeline) | Not relevant to data acquisition; irrelevant to V2 scope. |
| 7 | **Connectors — external MCP tools (this coding environment only)** | `WebSearch`, `WebFetch` (native), Meta Ads MCP `ads_library_search` (public, ToS-compliant Ad Library search), Google-Drive MCP. | Available to me right now, in this Claude Code session. | **0/5 for production reuse** | None as a runtime dependency | **Critical architectural finding:** these are tools available to the coding *agent*, not libraries the deployed Next.js app can import or call at request time. They cannot be wired into `app/api/research/leads/route.ts` and run for end users in production. They are useful only for one-off manual research/curation work done by a human or by me in a session — not as part of the live product pipeline. |
| 8 | **Agents** (Claude Code subagents: Explore, Plan, etc.) | Development-time only. | N/A for product | 0/5 | None | Same caveat as #7 — not deployable into the product. |
| 9 | **Research workflows** | `app/dashboard/research/{leads,talent}/page.tsx` + `app/api/research/{leads,talent}/route.ts` — full request → AI generate → Supabase write → CSV export flow, with rate limiting and a disclaimer banner. | Live, but the "data" stage is 100% AI-generated, not evidence-based (confirmed in the Phase 2 verification audit). | 4/5 for the *shell* (UI, auth, rate limit, export, DB write); 1/5 for the *data* stage | High (shell) / None (data) | Keep the entire shell (form, results UI, CSV export, rate limiting, Supabase write). Replace only the data-generation internals with the new pipeline described in Phase B. |
| 10 | **Automations / queue scaffold** | `research_requests` table (`supabase/research-tables.sql`) — `draft → submitted → processing → completed/failed` lifecycle, FK to `reports`, designed for an async worker but currently unused synchronously (insert errors aren't even checked by the routes). | Schema exists; not load-bearing today. | 4/5 | Medium | Reuse this table as the backbone for an async Data Acquisition job (search → extract → score can take several seconds per company; a queue avoids request timeouts). No schema change needed — confirms the original design intent. |
| 11 | **Data pipelines** | None. No scraping, parsing, or multi-step extraction pipeline exists anywhere in the repo. | N/A | N/A | N/A | Must be built net-new (Phase B). This is the actual gap the V2 directive is trying to close. |
| 12 | **Search capabilities** | `lib/research/sources.ts` — `linkedInCompanySearchUrl`, `linkedInPeopleSearchUrl`, `buildCandidateSources(country, title, location)` (per-country job-board URL builder: Wuzzuf/Forasna for Egypt, Bayt/Indeed elsewhere), `computeConfidence()`. | Live. **Builds search-engine URLs; does not call any search API or fetch any results.** | 3/5 | Medium | Keep as the "click to verify yourself" fallback link generator (still useful even in V2 — it's free and instant). Cannot serve as the actual evidence-collection mechanism; a real search call (Phase B) is still required to find companies automatically. |
| 13 | **Rate limiting** | `lib/research/rate-limit.ts` — 5 req/hour/user via Redis, fail-open. | Live. | 5/5 | High | Reuse as-is; also the right place to add a *second*, stricter limit on outbound search-API calls specifically, since those (unlike OpenAI calls already metered by the existing limiter) may have hard daily quotas (see §6). |
| 14 | **CSV/"Excel" export** | `lib/csv-export.ts` — UTF-8-BOM CSV blob download. No real `.xlsx` library in `package.json`. | Live. | 5/5 | High | Reuse as-is. Cosmetic note (already flagged in the Phase 2 audit, unchanged): UI labels this "Export CSV / Excel" but it is a `.csv` file, not a true `.xlsx`. |
| 15 | **Cost-benchmark data** | `Eunoia_Platform_Analysis_Final.xlsx` Phase 2/3 sheet (see §0.1). | Static reference doc. | 3/5 | Medium | Use only as comparative pricing context in §6; it prices a *different* engine's roadmap (ads/analytics APIs for the legacy report types), not lead/talent search APIs directly. |

### 1.1 Dead/irrelevant matches (ruled out, listed for transparency)

- `services/legacy-ai-engine/prompts/customer-journey.prompt.ts` — flagged by an earlier "search"-keyword grep. Inspected in full: it is a report-prompt template whose only "search" mention is the literal string `"Google Search"` inside a list of marketing channels. Not a search capability. Discard.
- `core/scoring/` — empty directory, zero files. Dead.
- `app/api/ai/stream/` — empty directory, zero files. Dead.
- `app/api/intelligence/route.ts` — orphaned API route (UI deleted in Phase 1, route left behind). Unrelated to V2; already flagged in the Phase 2 verification audit as a separate cleanup item.
- `database/schema.prisma`, `database/migrations/001_initial.sql` — stale, drifted, unreferenced duplicate of `prisma/schema.prisma`. Unrelated to V2; pre-existing.

### 1.2 What's confirmed absent (checked `package.json` directly)

No xlsx-writer, no scraping library (`cheerio`/`puppeteer`/`playwright`), no search-API SDK (`serpapi`/`tavily`/`exa`/Google API client). Confirms §11/§12 above: **the actual evidence-collection mechanism for Lead Finder V2 has zero existing implementation in this repo and must be designed from scratch in Phase B** — there is no shortcut hiding in an unused dependency.

---

## Summary verdict for Phase A

- **Repository**: thoroughly audited. Strong reusable shell (UI, auth, rate limiting, caching, AI-provider abstraction, CSV export, queue-table scaffold) — weak/absent core (no real search or extraction capability exists today).
- **MASTER_SKILLS_PLUGINS_CONNECTORS.xlsx**: not found anywhere accessible. Proceeding to Phase B/C/D on repository assets only. If you can supply this file, I'll re-run this audit section against it before anything is built.

Phase B (Architecture), Phase C (Reuse Strategy), Phase D (Implementation Plan), cost analysis, revenue model recommendation, and the final go/no-go are provided in the chat response accompanying this file — **no implementation, route changes, or database changes have been made.**
