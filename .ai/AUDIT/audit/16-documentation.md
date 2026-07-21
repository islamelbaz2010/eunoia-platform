# 16 — Documentation

**Evidence basis:** All markdown files, code comments, env example files, SQL comments.

---

## Documentation Inventory

### Root-Level Documentation (20+ files — excessive clutter)

| File | Content | Quality | Status |
|---|---|---|---|
| `BUILD_FAILURE_ROOT_CAUSE_REPORT.md` | Vercel build failure analysis | High quality | Stale — resolved |
| `COMMERCIAL_READINESS_REPORT.md` | Prior commercial readiness audit | Detailed | Stale |
| `COMPOSIO_AUDIT.md` | Composio integration assessment | Relevant | Historical |
| `CURRENT_SYSTEM_MAP.md` | System architecture snapshot | Useful | May be stale |
| `DEPLOYMENT_REALITY_REPORT.md` | Deployment state | Detailed | Historical |
| `EUNOIA_FINAL_INVESTOR_GRADE_AUDIT.md` | Prior investor audit | Detailed | Superseded by this audit |
| `EUNOIA_FULL_INDEPENDENT_AUDIT.md` | Prior independent audit | Detailed | Superseded |
| `EUNOIA_RECONCILIATION_REPORT.md` | Reconciling contradictions | Useful | Historical |
| `EUNOIA_SECOND_PASS_AUDIT.md` | Second pass audit | Detailed | Superseded |
| `FINAL_PLATFORM_AUDIT.md` | Prior platform audit | Detailed | Superseded |
| `MASTER_EXECUTION_PLAN.md` | Development roadmap | High quality | Partially executed |
| `MASTER_SKILLS_CROSS_REFERENCE.md` | Skills mapping | Reference | Historical |
| `PLAN_ENFORCEMENT_REPORT.md` | Plan enforcement analysis | Good | Superseded |
| `PROJECT_AUDIT.md` | Prior audit | Detailed | Superseded |
| `REAL_CURRENT_STATE_AUDIT.md` | State snapshot | Useful | May be stale |
| `RESEARCH_ASSET_AUDIT.md` | Research module audit | Good | Historical |
| `RESEARCH_CORE_ENGINE_PHASE1.md` | Phase 1 implementation notes | Technical | Historical |
| `RESEARCH_CORE_ENGINE_PHASE2.md` | Phase 2 implementation notes | Technical | Historical |
| `RESEARCH_DATA_LAYER_DESIGN.md` | Data layer design | Good | Historical |
| `SERPAPI_IMPLEMENTATION_REPORT.md` | SerpAPI migration | Technical | Historical |
| `SERPAPI_MIGRATION_PLAN.md` | Migration plan | Detailed | Completed/stale |
| `SERPAPI_ROOT_CAUSE_ANALYSIS.md` | Root cause for SerpAPI issues | Good | Resolved |
| `USAGE_TRACKING_REPORT.md` | Usage tracking | Good | Historical |
| `VERIFICATION_REPORT.md` | Verification of prior findings | Good | Historical |
| `AUDIT_CONSOLIDATION.md` | Consolidated audit | Good | Superseded |

**Assessment:** The root directory contains **25 markdown documents** representing the full audit/development history of the project. While valuable for historical context, they clutter the repository root, make the codebase appear messy to any new collaborator or investor doing technical due diligence, and contain references to features and bugs that may no longer be accurate.

---

### Code-Level Documentation

**Quality: Good for a startup, better than average.**

Notable documentation in source:
- `prisma/schema.prisma` — Every legacy model has a `/// LEGACY:` comment explaining what it was and why it's kept ✅
- `lib/research/plan-enforcement.ts:17–26` — JSDoc explains fail-open behavior and references the policy decision ✅
- `lib/research/acquisition/research-service.ts:64–69` — Comment on cache key hash excluding userId ✅
- `lib/research/rate-limit.ts:11` — Comment linking to legacy behavior for consistency ✅
- `app/api/users/init/route.ts:7–13` — Comment explaining the security fix and previous vulnerability ✅
- `supabase/plan-enforcement.sql:1–10` — Explains plan assignment is manual and why ✅
- `supabase/research-tables.sql:1–14` — Explains synchronous execution vs future queue architecture ✅

**Negative patterns:**
- `app/api/intelligence/route.ts` — 1,051 lines with zero file-level documentation explaining what the route does
- Large prompt builder functions have no documentation on when they're called or what business context they serve
- `services/legacy-ai-engine/` — No documentation explaining that this is dead code

---

### Environment Variable Documentation

**`.env.example`** — Well-documented. Every variable has a comment explaining purpose and how to obtain it. ✅  
**`.env.local.example`** — Same quality. ✅  
**Problem:** Variable names in `.env.example` (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) don't match what the code reads (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).

---

### SQL Schema Documentation

Supabase SQL files have good header comments explaining:
- When to run
- Dependencies on other tables
- Idempotency guarantees
- Manual vs automated behavior

Assessment: ✅ Better than average for a startup.

---

## Documentation Gaps

| Gap | Impact |
|---|---|
| No `README.md` | New contributors cannot onboard; investors doing tech diligence find an undocumented repo |
| No CLAUDE.md | No persistent project context for AI assistant sessions |
| No `CONTRIBUTING.md` | No documented dev workflow |
| No API documentation | No Swagger/OpenAPI spec; API is undocumented externally |
| No architecture diagram | Only text descriptions; no visual system diagram |
| 25 stale audit docs at root | Repository looks unorganized; some contain outdated information |

---

## Recommendations

| Priority | Action | Effort |
|---|---|---|
| P1 | Create `README.md` with setup instructions, env vars, and architecture overview | 2 hours |
| P1 | Move all audit/docs markdown to `/docs` directory | 30 min |
| P2 | Create `CLAUDE.md` for AI-assistant session context | 1 hour |
| P2 | Add file-level comment to `app/api/intelligence/route.ts` explaining the engine | 15 min |
| P2 | Document that `services/legacy-ai-engine/` is dead code pending removal | 10 min |
| P3 | Add OpenAPI spec for all API routes | 1–2 days |
