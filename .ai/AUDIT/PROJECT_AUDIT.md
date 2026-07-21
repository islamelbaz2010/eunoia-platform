# Eunoia Platform — Architecture Audit

Branch: `research-intelligence-v1`
Purpose: baseline understanding before transforming the platform from an "AI Reports Platform" into an "AI Research & Intelligence Platform."

---

## 1. Existing architecture (high level)

Two parallel report pipelines currently coexist:

| | **Legacy pipeline (Prisma)** | **Current pipeline (Supabase)** |
|---|---|---|
| Routes | `/dashboard/intelligence`, `/dashboard/feasibility`, `/dashboard/reports/[id]` | `/dashboard/real-estate`, `/dashboard/reports` |
| API | `/api/reports`, `/api/reports/generate`, `/api/reports/[id]` | `/api/intelligence` |
| Data store | `prisma.Report` / `prisma.ApiUsage` (Postgres via `DATABASE_URL`/`DIRECT_URL`) | Supabase `reports` table (`supabase/reports-table.sql`) |
| Engine | `services/ai-engine/` — orchestrator + 30 prompt files + provider abstraction | calculators + prompts written inline in `app/api/intelligence/route.ts` |
| Report types | 30 generic types (COMPETITOR, PRICING, CAMPAIGN, CLV_RETENTION, …) incl. 3 real-estate-flavored ones | 5 real-estate types (feasibility, campaign_roi, market_entry, lead_gen, full_analysis) |
| Caching/rate-limit | Upstash Redis (`lib/redis/`) | none |

Auth/access gate is shared and independent of both pipelines: `app/dashboard/layout.tsx` requires a Prisma `User` row to exist (created via `/api/users/init` during `/dashboard/onboarding`); Supabase Auth handles session/identity. This stays untouched regardless of report-pipeline changes.

`/dashboard/reports/[id]` reads from the **legacy** Prisma store — it is not linked from the current `/dashboard/reports` list (which renders an inline accordion, no detail route) and is effectively dead code today.

---

## 2. Existing modules

- **Real Estate Intelligence** (`/dashboard/real-estate`) — 5 report types, pre-calculated financial figures (NPV/ROI/payback/CPL gap) injected into AI prompts so the model interprets rather than invents numbers. Production asset. **Keep.**
- **Report History** (`/dashboard/reports`) — lists Supabase `reports` rows for the logged-in user, search/filter, expandable cards with type-specific key metrics, CSV/PDF/JSON export. Production asset. **Keep.**
- **Generic Intelligence Engine** (`/dashboard/intelligence` + `/dashboard/feasibility`) — form-driven UI over the 30-type Prisma pipeline. Scheduled for removal.
- **Demo funnel** (`/demo`, `/api/demo`, `/api/demo/generate`) — public lead-capture form, AI teaser report via direct fetch to an external proxy, Resend email. Fully independent of both pipelines above (writes to `demo_leads`, not `reports` or `Report`). **Untouched.**
- **Market Intelligence iframe** (`/market-intelligence`, top-level route outside `/dashboard`) — wraps `halannews.com` in an iframe. Distinct from `/dashboard/analytics`. Not in scope for this transformation; flagged as a naming collision risk with the new "Market Intelligence Hub."
- **Onboarding** (`/dashboard/onboarding`, `/api/users/init`, `/api/workspace`) — creates Prisma `User`/`Workspace` rows. Required for dashboard access. **Untouched.**

---

## 3. Existing report flow

**Legacy (Prisma):** form → `POST /api/reports/generate` → rate-limit check (Redis) → create `Report` row (`QUEUED`) → `getOrchestrator().generate()` → provider call → update row (`COMPLETED`/`FAILED`) → `ApiUsage` row for cost tracking → client polls `GET /api/reports/[id]` (Redis-cached) until done.

**Current (Supabase):** form → `POST /api/intelligence` → JS calculator pre-computes real numbers → prompt injects those numbers with "do not change" instruction → OpenAI call (`gpt-4o-mini`) → parse JSON → insert into Supabase `reports` (synchronous, no queue/status column) → return to client directly.

---

## 4. Existing dependencies

| Package | Used by |
|---|---|
| `@prisma/client`, `prisma` | legacy pipeline + onboarding/auth gate |
| `@upstash/redis`, `@upstash/ratelimit` | legacy pipeline only (rate limit + report cache) |
| `@supabase/supabase-js`, `@supabase/ssr` | auth (everywhere) + current pipeline + demo funnel |
| `openai` | current pipeline (`/api/intelligence`) |
| `resend` | demo funnel emails |
| No `xlsx`/spreadsheet library | "Excel" export everywhere is actually CSV with UTF-8 BOM, opened by Excel — established convention, not a gap |

---

## 5. Existing AI capabilities (reusable)

- **`services/ai-engine/orchestrator.ts` + `prompt-builder.ts`** — generic multi-provider report orchestration, 30 prompt templates (`services/ai-engine/prompts/*.prompt.ts`) covering competitor analysis, pricing, campaigns, CLV, market entry, content/SEO, crisis, sentiment, etc. Currently wired only to the legacy Prisma pipeline. **Per directive: not deleted — relocated to `services/legacy-ai-engine/` and retained for future reuse** (e.g., Competitor Intelligence / Supplier Intelligence placeholders could draw on `competitor.prompt.ts`, `pricing.prompt.ts` later).
- **`services/ai-engine/providers/`** — provider abstraction (currently OpenAI-backed). Reusable scaffold for adding other model providers later without touching call sites.
- **Calculator pattern in `/api/intelligence/route.ts`** — "pre-compute in JS, AI only interprets" pattern. This is the platform's strongest reusable IP and is the right template for any new module that needs numeric credibility (e.g., Talent Finder's salary-range estimates).

---

## 6. Existing reusable assets (data/UI)

- **`core/data/cities.data.ts`** — 70+ cities across 10 countries (Egypt, UAE, Saudi, Kuwait, Qatar, Bahrain, Oman, Jordan, Morocco, Iraq) with bilingual labels. **Reused** for Lead Finder / Talent Finder "Location" input instead of rebuilding a city list.
- **`core/data/sectors.data.ts`** — 50+ industry/sector keys with bilingual labels and marketing benchmarks. **Reused** for the "Industry" input on both new modules.
- **`core/data/branches.data.ts`** — Egypt/Dubai branch selector. Currently only consumed by code being removed; left in place (cleanup rule: keep when uncertain), not actively reused yet.
- **`lib/redis/client.ts`** (`getRedis`, `redis.*` helpers) — generic Upstash wrapper, provider-agnostic. **Reused** for rate-limiting the two new research endpoints (mirrors the legacy 5-requests/hour pattern) instead of building new infra.
- **CSS-in-JS design system** (`ei-`/`rh-` prefixed style strings already used in `real-estate/page.tsx` and `reports/reports-client.tsx`) — dark purple gradient topbar, warm beige background, bilingual AR/EN pattern. **Reused** as the visual baseline for the new Research Intelligence Hub and Market Intelligence Hub so the product feels like one platform, not three.
- **CSV export pattern** (UTF-8 BOM blob download) — reused verbatim for Lead Finder / Talent Finder exports instead of adding a spreadsheet dependency.

---

## 7. Risks

- **Scope of `/dashboard/intelligence` removal**: it's the only UI for all 27 non-real-estate report types, not just the 3 real-estate ones. Removing it retires that catalog entirely. Per business decision this is intended, but it's a larger feature cut than the "real estate" framing suggests.
- **Dashboard homepage coupling**: `/dashboard/page.tsx` queries `prisma.Report` directly for stats and links to `/dashboard/intelligence` in four places. Not explicitly named in scope but breaks immediately once `/dashboard/intelligence` is removed — included in this work.
- **Two same-named "reports" stores**: Prisma `Report` (legacy, untouched per directive) and Supabase `reports` (active). Anyone reading the codebase cold needs the legacy model clearly marked to avoid confusion — addressed via schema comments, not deletion.
- **`/market-intelligence` vs. new Market Intelligence Hub**: an existing top-level iframe route already uses similar naming for a different surface. Left alone in this pass; flagged for a future consolidation decision.
- **Synthesized data risk in Lead Finder**: an AI-only "lead finder" with no live data/search API risks generating plausible-looking but fabricated company names, contact names, or LinkedIn URLs presented as verified fact. Mitigation built into the module: output is framed as AI-generated research/strategy (target-company archetypes, real companies only when the model has actual knowledge, constructed LinkedIn *search* URLs rather than fabricated profile URLs, and an explicit "verify before outreach" disclaimer) rather than a scraped contact database.
- **Stale exhibition banner**: dashboard home and sidebar both contain a "Real Estate Exhibition" banner gated on a hardcoded date (`2026-06-05`) that has already passed relative to the current date. It's currently dead code (condition evaluates false) — removed as part of this cleanup rather than rewired, since it has no current business purpose.

---

## 8. Migration strategy

1. Add new Supabase table `research_requests` (status pipeline) + reuse existing `reports` table for finished Lead Finder / Talent Finder results — avoids a duplicate report system and means new results appear in `/dashboard/reports` automatically.
2. Move `services/ai-engine/` → `services/legacy-ai-engine/` (no deletion, per directive).
3. Delete verified-unused legacy UI: `/dashboard/intelligence`, `/dashboard/feasibility`, `/dashboard/reports/[id]`, `/api/reports/*`, `components/reports/*` (report-form/report-output/sub-cards), `components/intelligence/*`, `hooks/use-report.ts`, `types/report.types.ts`.
4. Keep Prisma `Report`/`ApiUsage` models in schema, marked legacy via comment — no migration, no data loss.
5. Build Research Intelligence Hub (`/dashboard/research`) with Lead Finder + Talent Finder live, 4 modules as "Coming Soon" placeholders only.
6. Rebuild `/dashboard/analytics` as Market Intelligence Hub — static curated content, zero ongoing API cost.
7. Rewrite dashboard homepage and sidebar navigation to reflect the new structure.
8. Typecheck + build after each stage; fix before moving on.
