# Audit Consolidation — Single Source of Truth

Deduplicates 19 prior audit/planning documents (`COMPOSIO_AUDIT.md`, `EUNOIA_FINAL_INVESTOR_GRADE_AUDIT.md`, `EUNOIA_FULL_INDEPENDENT_AUDIT.md`, `EUNOIA_RECONCILIATION_REPORT.md`, `EUNOIA_SECOND_PASS_AUDIT.md`, `FINAL_PLATFORM_AUDIT.md`, `MASTER_EXECUTION_PLAN.md`, `MASTER_SKILLS_CROSS_REFERENCE.md`, `PLAN_ENFORCEMENT_REPORT.md`, `PROJECT_AUDIT.md`, `REAL_CURRENT_STATE_AUDIT.md`, `RESEARCH_ASSET_AUDIT.md`, `RESEARCH_CORE_ENGINE_PHASE1.md`, `RESEARCH_CORE_ENGINE_PHASE2.md`, `RESEARCH_DATA_LAYER_DESIGN.md`, `SERPAPI_IMPLEMENTATION_REPORT.md`, `SERPAPI_MIGRATION_PLAN.md`, `SERPAPI_ROOT_CAUSE_ANALYSIS.md`, `USAGE_TRACKING_REPORT.md`) plus this session's own direct code verification (see `CURRENT_SYSTEM_MAP.md`) and the real-production-CSV Product Validation Audit. Where a finding is re-confirmed by reading the live code in *this* session, it's marked **[RE-VERIFIED 2026-06-21]**.

## Provenance chain

`PROJECT_AUDIT.md` (v1 baseline) → `RESEARCH_ASSET_AUDIT.md` → `RESEARCH_DATA_LAYER_DESIGN.md` → `MASTER_SKILLS_CROSS_REFERENCE.md` → `COMPOSIO_AUDIT.md` → `RESEARCH_CORE_ENGINE_PHASE1.md` → `PHASE2.md` → `FINAL_PLATFORM_AUDIT.md` → `SERPAPI_MIGRATION_PLAN.md` → `SERPAPI_IMPLEMENTATION_REPORT.md` → `SERPAPI_ROOT_CAUSE_ANALYSIS.md` → `USAGE_TRACKING_REPORT.md` / `PLAN_ENFORCEMENT_REPORT.md` → `MASTER_EXECUTION_PLAN.md` → `REAL_CURRENT_STATE_AUDIT.md` → `EUNOIA_FULL_INDEPENDENT_AUDIT.md` → `EUNOIA_SECOND_PASS_AUDIT.md` → `EUNOIA_RECONCILIATION_REPORT.md` → `EUNOIA_FINAL_INVESTOR_GRADE_AUDIT.md` (settled). After that: a real-production-CSV Product Validation Audit (5 exports, 46 rows) and now this mission.

## 1. Critical findings (consensus across 3+ docs, all still open)

1. **`app/api/users/init/route.ts` has no authentication check.** Asserted in 4 docs, full-file-verified twice. **[RE-VERIFIED 2026-06-21]** — read the full 63-line file directly this session: no `supabase.auth.getUser()` call anywhere. Accepts arbitrary `email`/`supabaseId` from the request body, returns an existing user's `userId`/`workspaceId` for any email (account enumeration), or creates a real `Workspace`+`User` row with attacker-chosen identity fields (workspace pre-registration / hijack risk if an attacker pre-creates a row for a victim's email before the victim signs up). → **Phase 1 of this mission.**
2. **No billing/payment provider integrated anywhere** (5 docs). Plan limits exist as pure infrastructure with no way for a user to pay to raise them. Out of scope for this mission's 11 phases (not a named phase) but remains the top blocker to charging money, per the Final Investor-Grade Audit's own verdict.
3. **Quota/rate-limit/plan-check all fail open on error, with zero logging in `plan-enforcement.ts`'s catch block** (4 docs). **[RE-VERIFIED 2026-06-21]** — confirmed by direct read of `lib/research/rate-limit.ts`, `lib/research/plan-enforcement.ts`, `lib/research/acquisition/quota.ts`: all three `catch` blocks return `{ ok: true, ... }`.
4. **SerpAPI daily search quota is a single global counter (default 150/day), not per-tenant** (5 docs). **[RE-VERIFIED 2026-06-21]** — `lib/research/acquisition/quota.ts:8`, one Redis key `quota:search-provider:<date>` shared by every user. → **Phase 10 of this mission.**
5. **Two parallel persistence/tenancy systems (legacy Prisma `Workspace`/`User` vs. live Supabase per-user) with no deprecation plan** (5 docs). **[RE-VERIFIED 2026-06-21]** — confirmed via `prisma/schema.prisma` (Report/ApiUsage explicitly marked `LEGACY` in schema comments) vs. the Supabase tables actually written to by the research routes. → relevant context for **Phase 10**.
6. **Talent Finder is AI-only with no real sourcing**, while presented alongside the evidence-based Lead Finder (6 docs). Not a named phase in this mission (phases target Lead Finder specifically) — flagged here so it isn't mistaken for already-fixed.
7. **No live validation of the research pipeline was ever run with real credentials**, until the user supplied real exported CSVs from production this session. The Product Validation Audit (5 files, 46 rows) is the first real evidence ever produced against this pipeline. Its findings (below) are now the most important input to this mission's phases.
8. **Zero automated tests, zero CI** (3 docs). **[RE-VERIFIED 2026-06-21]** — confirmed via `package.json` (no test framework in `devDependencies`, no `test` script) and `Glob` for `*.test.ts`/`*.spec.ts` (none outside `node_modules`). → addressed incrementally as this mission's phases add tests for new modules.
9. **`MASTER_SKILLS_PLUGINS_CONNECTORS.xlsx` was never located; Composio/MCP connectors cannot be called from production routes anyway** (4 docs each). Closed line of inquiry — not relevant to this mission, which builds pure TypeScript modules.

## 2. Real-production evidence (Product Validation Audit, supersedes all prior speculation about output quality)

Five real exported CSVs from `ai.halannews.com` production (Bank/Dubai, Real Estate Developer/Dubai, Real Estate Developer/Cairo, Hospital/Cairo, Clinic/Cairo — 46 result rows total), manually classified row-by-row:

- **~33% precision** — only ~15/46 rows were genuine target companies; the rest were directories, government sites, job boards, social posts, or broken sources.
- **Root cause, confirmed in code this session**: `classifySourceType()` in `lib/research/acquisition/source-collector.ts` defaults to `'company_website'` for any domain not in the small hardcoded `DIRECTORY_DOMAINS` list or `NO_FETCH_DOMAINS` list — Wikipedia, government domains, job boards, embassy PDFs, and competitor sites all fall through to this default and get scored as if they were a real company's own site. → **Phase 2 (Company Validation Engine)** and **Phase 5 (Source Quality Engine)** directly target this.
- **Inverted confidence**: in the Bank/Dubai search, the one genuine bank scored lowest (75%) while four directory/listicle pages scored 90-95%. Caused by `ranker.ts`'s additive scoring rewarding long text + taxonomy-keyword matches, which directory pages often have more of than a thin company homepage. → **Phase 4 (Confidence Engine Rebuild)**.
- **Cross-domain duplication**: the same real company (e.g., a clinic's website + its Instagram page) counted as two separate results. Confirmed in code: `normalizer.ts` dedupes only by exact domain. → **Phase 3 (Deduplication Engine)**.
- **`companySize` has zero effect on results** — confirmed in code: `app/api/research/leads/route.ts` stores it in `search_criteria` but never passes it into `buildLeadQuery()` or `ResearchService.run()`. → **Phase 7**.
- **Decision-maker titles are a 100% verbatim echo of user input** across all 46 rows in every file. Confirmed in code: `decisionTitles.map(title => ({ title, linkedin_search_url: ... }))` in `route.ts`. → **Phase 8**.
- **Named-but-unsurfaced recall failures**: major real companies (Emaar, DAMAC, Talaat Moustafa Group, etc.) appeared only inside *other* results' AI-generated summary text, never as their own result row. → **Phase 6 (Company Expansion Engine)**.

## 3. Recommended but never implemented (carried forward, still true as of this session)

- Billing/payment integration — still absent.
- Plan-assignment UI — still absent; every user implicitly STARTER.
- Running `usage-tracking.sql`/`plan-enforcement.sql` against the live DB — unconfirmed, cannot be verified from this sandbox (no DB credentials available here either).
- Per-tenant/plan-aware search quota — still a single global counter. → **Phase 10**.
- Cost-weighted credits per report type — still flat 1 credit for both Lead and Talent Finder. Out of scope for this mission.
- Competitor/Supplier/Market Intelligence modules — still not built. Out of scope for this mission.
- Talent Finder refactor — still unaddressed. Out of scope for this mission (named phases target Lead Finder).
- Deleting the two unauthenticated debug endpoints (`app/api/debug/env`, `app/api/debug-env`) — still present. Low severity (booleans only, no secrets) per 2 prior docs' correction; not a named phase, will flag in `COMMERCIAL_READINESS_REPORT.md` (Phase 11) rather than fix unprompted.
- Moving root-level audit `.md` files into `/docs` — still not done; out of scope here (would risk an unrequested, sprawling rename/move during an already-large mission).
- CI pipeline — still absent. Out of scope as a named phase, but each phase below adds tests that a future CI step could run.

## 4. Contradictions across the prior docs (now resolved, no action needed)

- "Is the research code live on `main`?" — resolved by `EUNOIA_RECONCILIATION_REPORT.md`: yes, via a stale-fetch artifact in the second-pass audit, not a real discrepancy.
- Debug-endpoint severity (Critical → Low/Medium) — resolved; carried into this doc at Low/Medium.
- "Usage tracking is global" — resolved to: only the SerpAPI search quota is global; rate-limit and plan-credit checks are per-user. Reflected correctly in §1.4 above.
- Investor score drift (26 → 22-34 range → 32/100 settled) — explained by genuinely improving evidence quality across audits, not an error; the 32/100 figure is the most recent and most evidenced.

## 5. What this mission changes vs. what it deliberately leaves alone

In scope (named phases 1-10, plus Phase 11 reporting): `app/api/users/init/route.ts` auth fix; new `lib/research/company-validation.ts`, `dedup.ts`, `source-quality.ts`, `company-expansion.ts`; confidence engine rebuild; `companySize` filter decision; decision-maker engine rebuild; `ApolloAdapter` design (enrichment-only); multi-tenant quota/plan review.

Explicitly out of scope (per the mission's own boundaries and to avoid scope creep beyond what was asked): billing integration, Talent Finder rework, Competitor/Supplier/Market Intelligence builds, moving/deleting audit docs, CI setup, debug-endpoint removal. These are named in `COMMERCIAL_READINESS_REPORT.md` (Phase 11) as a ranked backlog, not implemented here.
