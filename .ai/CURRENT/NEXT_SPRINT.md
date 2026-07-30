# Next Sprint

**Updated:** 2026-07-21  
**Status:** READY — no external dependencies

---

## Sprint Name

Sprint 2 — Knowledge Base Repair

## Objective

Correct all critically stale claims in `.ai/CURRENT/` canonical memory files so that a new AI session loading these files receives accurate platform state.

This sprint is the highest-priority immediately executable action. It costs no infrastructure, requires no Supabase project, and takes an estimated 1–3 hours.

## Scope

Documentation changes only. No production code changes. Files modified are in `.ai/CURRENT/` and `README.md`.

### Files to Update

| File | What to Fix |
|---|---|
| `.ai/CURRENT/MASTER_PROJECT_MEMORY.md` | Sections 13–15 say DI is "Pre-Implementation" — WRONG. DI library is complete (15 files, 61 tests). Add correction (delta already appended 2026-07-21). Also: project name is "UNKNOWN" — fix to "eunoia-platform". |
| `.ai/CURRENT/CURRENT_SYSTEM_MAP.md` | Add "SUPERSEDED" header at top pointing to `docs/MODULE_INVENTORY.md` and `docs/PLATFORM_ARCHITECTURE_MAP.md`. Remove claim that no test framework exists. Remove claim that company-validation, dedup, source-quality, company-expansion, ApolloAdapter don't exist. Correct claim that `proxy.ts` is root middleware. |
| `README.md` | Change production URL from `ai.halannews.com` to `intelligence.eunoiazones.com`. |
| `.ai/CURRENT/PROJECT_CONTEXT.md` | Fix production URL. Fix Demo AI description (GPT-4o-mini via `AI_PROXY_URL`, not Claude via Cloudflare). Add missing env vars: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SEARCH_DAILY_QUOTA_PER_USER`, `AI_PROXY_URL`, `ADMIN_EMAILS`. |
| `.ai/BOOTSTRAP/START_SESSION.md` | Add note that SPRINT_MEMORY.md appendix content takes precedence over MASTER_PROJECT_MEMORY.md for phase/status fields when they conflict. |

## Exclusions

- Do NOT modify any file in `docs/` (already correct)
- Do NOT modify any production code
- Do NOT modify `SPRINT_MEMORY.md` or `DECISIONS.md` (append-only)

## Acceptance Criteria

| # | Criterion | Verification |
|---|---|---|
| 2.1 | MASTER_PROJECT_MEMORY.md no longer says "Pre-Implementation" for DI | `grep "Pre-Implementation" .ai/CURRENT/MASTER_PROJECT_MEMORY.md` → no results |
| 2.2 | CURRENT_SYSTEM_MAP.md has SUPERSEDED header at top | First line contains "SUPERSEDED" |
| 2.3 | CURRENT_SYSTEM_MAP.md no longer claims no test framework | `grep "no test framework" .ai/CURRENT/CURRENT_SYSTEM_MAP.md` → no results |
| 2.4 | README.md production URL is `intelligence.eunoiazones.com` | `grep "intelligence.eunoiazones.com" README.md` → result |
| 2.5 | PROJECT_CONTEXT.md production URL is correct | Same check |
| 2.6 | PROJECT_CONTEXT.md lists `AI_PROXY_URL` | `grep "AI_PROXY_URL" .ai/CURRENT/PROJECT_CONTEXT.md` → result |
| 2.7 | New AI session reading all CURRENT docs would know DI is built | Manual review |

## Risks

- None. Documentation-only sprint.

## Dependencies

- None. Executable immediately.

## Responsible

AI session at start of next work session.

## Status

READY

---

*After Sprint 2 is complete, the next sprint depends on Supabase restoration (user action). See `docs/CRITICAL_PATH.md` Step 1 for infrastructure recovery instructions.*
