# Project KPIs

**Date:** 2026-07-21  
**Owner:** Founder  
**Purpose:** Quantified targets across all dimensions. Used to measure progress, declare sprint success, and decide when the platform is ready for the next stage.

---

## North Star KPI

| KPI | Definition | Current | MVP Target | Growth Target |
|---|---|---|---|---|
| Evidence-backed decisions/month | Decision Intelligence Engine outputs delivered to paying customers with confidence score + rule evaluation + explainability | **0** | **>0** (1 module live, 1 paying customer) | **>500** |

See `docs/NORTH_STAR.md` for definition.

---

## Technical KPIs

| KPI | Definition | Current | Sprint Target | Production Target |
|---|---|---|---|---|
| TypeScript errors | `tsc --noEmit` error count | 0 | 0 (always) | 0 (always) |
| Test pass rate | % of tests passing | 100% (194/194) | 100% (always) | 100% (always) |
| Test count | Total automated tests | 194 | 220+ (after DI integration) | 300+ (after billing) |
| API route test coverage | % of API routes with at least one test | 0% (0/15 routes) | 33% (Sprint 4–5) | 80% (production) |
| TypeScript `any` usage | Count of explicit `any` in non-test source | Unknown (multiple `supabase as any`) | 0 (after Sprint 1) | 0 |
| Build success rate | % of `git push` events that produce a successful Vercel build | Unknown | 95%+ | 99%+ |
| Cold start p95 | 95th percentile cold start time for API routes | Unknown | <3s | <2s |
| Dependency freshness | % of npm dependencies within 6 months of latest major | Unknown | ≥80% | ≥90% |

---

## Infrastructure KPIs

| KPI | Definition | Current | MVP Target | Production Target |
|---|---|---|---|---|
| Platform uptime | % time `GET /api/health` returns 200 | 0% (Supabase deleted) | 95% | 99.5% |
| TTFR (Time to Full Recovery) | Time to restore platform after Supabase deletion | Not measured | <4 hours | <1 hour |
| Env var coverage | % of required env vars set in Vercel production | ~30% | 100% | 100% |
| PITR enabled | Supabase Point-in-Time Recovery active | No | Yes (Sprint 1) | Yes |
| Backup retention | Days of automated backup available | 0 (project deleted) | 7 days | 30 days |
| Incident response time | Time from outage detection to first action | Unknown (no monitoring) | <30 min | <15 min |

---

## Documentation KPIs

| KPI | Definition | Current | Post-Sprint Target |
|---|---|---|---|
| Consistency issues | Count of documented cross-document contradictions | 24 (CONSISTENCY_AUDIT.md) | 0 (after Sprint 2) |
| Critical stale docs | Count of canonical docs with CRITICAL stale claims | 3 (MASTER_PROJECT_MEMORY, CURRENT_SYSTEM_MAP, README) | 0 (after Sprint 2) |
| Knowledge gaps | Undocumented architectural questions | 25 (KNOWLEDGE_GAPS.md) | <10 (after ADR work) |
| Bootstrap success rate | % of time a new AI session starts with correct platform state | ~30% (BOOTSTRAP_VALIDATION) | 90% (after Sprint 2) | 
| Documentation health score | Overall score (CONSISTENCY_AUDIT + KNOWLEDGE_GAPS + stale docs) | 55/100 | 75/100 (post Sprint 2) |

---

## Testing KPIs

| KPI | Definition | Current | Target |
|---|---|---|---|
| Decision Intelligence coverage | % of DI engine files with tests | 100% (6/6 files) | 100% (maintain) |
| Research library coverage | % of research library files with tests | ~75% (15/20 files) | 90% |
| API route coverage | % of routes with at least one test | 0% | 80% (pre-launch) |
| End-to-end test coverage | % of MVP acceptance criteria with automated test | 0% | 50% (Sprint 8) |
| Auth test coverage | Auth flows with automated test | 0% | 100% (pre-launch) |
| Billing test coverage | Billing flows with automated test | 0% | 100% (pre-launch) |

---

## Commercial KPIs

| KPI | Definition | Current | MVP Target | 90-day Post-Launch |
|---|---|---|---|---|
| Monthly Recurring Revenue (MRR) | Recurring revenue from paid plans | $0 | $1 (one paying customer) | $2,000+ |
| Paying customers | Users with active PROFESSIONAL+ plan | 0 | 1 | 20+ |
| Self-serve conversion | % of signups that upgrade without operator intervention | 0% (no billing) | >0% | >5% |
| Plan enforcement accuracy | % of API requests where plan limits are correctly enforced | 0% (intelligence route unguarded) | 100% | 100% |
| Churn rate | % of paying customers who downgrade in a given month | N/A | N/A (no customers) | <10% |
| Time to first decision | Minutes from signup to first Decision Report | N/A | <15 minutes | <5 minutes |

---

## AI + Decision Intelligence KPIs

| KPI | Definition | Current | MVP Target | Growth Target |
|---|---|---|---|---|
| Decisions delivered | Total DI Engine outputs with confidence + explainability | 0 | 1+ | 500+/month |
| Modules with DI integration | Count of modules wired to `runDecisionEngine()` | 0/3 | 1/3 (Real Estate) | 3/3 |
| Business rules defined | Total domain-specific rules across all modules | 0 | 3+ (Real Estate only) | 15+ |
| Evidence items per decision | Average evidence sources evaluated per decision | N/A | ≥3 | ≥5 |
| AI narration latency | Time from score calculation to AI narration completion | N/A | <5s | <3s |
| OpenAI call success rate | % of AI calls that complete without error | Unknown | 95% | 99% |
| SerpAPI quota exhaustion events | Days per month where global quota hits 0 | Unknown | 0 (quota is 150/day) | 0 |

---

## Security KPIs

| KPI | Definition | Current | Target |
|---|---|---|---|
| RLS coverage | % of Supabase tables with RLS enabled | 0% (project deleted) | 100% (Sprint 1) |
| Service role key exposure | Count of client-bundle files containing the service role key | Unknown | 0 |
| Admin route protection | % of admin routes that check `isAdminUser()` | 100% (code verified) | 100% (always) |
| Auth brute-force protection | Rate limiting on login/signup routes | 0% (middleware missing) | 100% (Sprint 3) |
| Data breach surface | User data accessible without RLS check | All tables (project deleted) | 0 tables |

---

## Observability KPIs

| KPI | Definition | Current | MVP Target | Production Target |
|---|---|---|---|---|
| Error visibility | % of production errors visible to operator | ~0% (console.log only) | 50% (Sprint 9) | 95% |
| Uptime monitoring | Alerts generated within 5 min of downtime | No | Yes (Sprint 9) | Yes |
| Request trace coverage | % of API requests with a trace ID | 0% | 0% (post-MVP) | 80% |
| Token usage tracking | % of OpenAI calls tracked for cost monitoring | 0% | 0% (post-MVP) | 100% |
| Quota visibility | Can operator see current SerpAPI quota remaining? | No (Redis key only) | No (post-MVP) | Yes (admin dashboard) |

---

## Health Score Targets

From `docs/PROJECT_HEALTH_SCORE.md` (current: 46/100):

| Dimension | Current | After Sprint 1 | After MVP Gate | Production |
|---|---|---|---|---|
| Architecture | 72 | 74 | 76 | 80 |
| Code Quality | 78 | 82 | 82 | 85 |
| Infrastructure | 15 | 65 | 70 | 80 |
| Documentation | 55 | 70 | 72 | 78 |
| Testing | 68 | 72 | 76 | 82 |
| Commercial | 22 | 30 | 72 | 80 |
| Security | 62 | 70 | 78 | 85 |
| Observability | 12 | 15 | 18 | 65 |
| Decision Intelligence | 38 | 38 | 68 | 82 |
| Knowledge | 52 | 72 | 74 | 80 |
| **OVERALL** | **46** | **~57** | **~70** | **~80** |

---

## KPI Review Cadence

| Review | When | Owner |
|---|---|---|
| Technical KPIs | Every sprint completion | Technical lead / AI session |
| Commercial KPIs | Monthly after MVP | Founder |
| Documentation KPIs | Every documentation sprint | Technical lead / AI session |
| Security KPIs | Quarterly after MVP | Technical lead |
| Health Score | Every sprint | Technical lead / AI session |

---

*KPIs are canonical targets. Adjust only by founder decision, recorded in `.ai/CURRENT/SPRINT_MEMORY.md`.*
