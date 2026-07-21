<!-- tokens: 1967 / budget 2500 -->

# Source Index — eunoia-platform

## Annotated Tree

`eunoia-platform/` — project root
  └── `AI_READY/` — project directory
      └── `AI_READY/eunoia-platform/` — project directory
  └── `app/` — application / UI layer
      └── `app/(auth)/` — project directory
          └── `app/(auth)/forgot-password/` — project directory
          └── `app/(auth)/login/` — project directory
          └── `app/(auth)/signup/` — project directory
      └── `app/api/` — API / route handlers
          └── `app/api/debug-env/` — project directory
          └── `app/api/demo/` — project directory
          └── `app/api/intelligence/` — project directory
          └── `app/api/research/` — project directory
          └── `app/api/users/` — project directory
          └── `app/api/workspace/` — project directory
      └── `app/auth/` — project directory
          └── `app/auth/callback/` — project directory
      └── `app/dashboard/` — project directory
          └── `app/dashboard/analytics/` — project directory
          └── `app/dashboard/onboarding/` — project directory
          └── `app/dashboard/real-estate/` — project directory
          └── `app/dashboard/reports/` — project directory
          └── `app/dashboard/research/` — project directory
          └── `app/dashboard/settings/` — configuration
      └── `app/demo/` — project directory
      └── `app/market-intelligence/` — project directory
  └── `audit/` — project directory
  └── `components/` — project directory
      └── `components/dashboard/` — project directory
      └── `components/motion/` — project directory
      └── `components/ui/` — project directory
  └── `core/` — shared library / core utilities
      └── `core/data/` — project directory
  └── `database/` — data models and schema definitions
  └── `hooks/` — project directory
  └── `i18n/` — project directory
  └── `Investor Package/` — project directory
  └── `investor-package/` — project directory
  └── `investor-review/` — project directory
  └── `investor-review-v2/` — project directory
  └── `lib/` — shared library / core utilities
      └── `lib/prisma/` — data models and schema definitions
      └── `lib/redis/` — project directory
      └── `lib/research/` — project directory
          └── `lib/research/acquisition/` — project directory
      └── `lib/supabase/` — project directory
  └── `prisma/` — data models and schema definitions
  └── `services/` — service / business logic
      └── `services/legacy-ai-engine/` — project directory
          └── `services/legacy-ai-engine/prompts/` — project directory
          └── `services/legacy-ai-engine/providers/` — project directory
  └── `supabase/` — project directory
  └── `tools/` — project directory
      └── `tools/demo/` — project directory
  └── `types/` — project directory

## Document Index

| Path | Category | Date | Summary | Authority |
| --- | --- | --- | --- | --- |
| `Investor Package/03_ARCHITECTURE.md` | architecture | — | - Framework: Next.js, React, TypeScript. - Database/auth: Supabase plus Prisma/P | canonical (by recency; no declared status) |
| `MASTER_EXECUTION_PLAN.md` | roadmap | 2026-06-18 | Master Execution Plan — Eunoia Intelligence Platform | canonical (by recency; no declared status) |
| `README.md` | readme | — | AI Marketing Intelligence Platform | canonical (by recency; no declared status) |
| `audit/07-architecture.md` | architecture | — | **Evidence basis:** All source files, config files, SQL schemas, dependency grap | canonical (by recency; no declared status) |
| `investor-package/05_ARCHITECTURE.md` | architecture | — | Eunoia Platform is a modern SaaS application built on Next.js 16 with a serverle | canonical (by recency; no declared status) |
| `audit/04-roadmap.md` | roadmap | — | **Evidence basis:** Feature gaps identified from source code + business requirem | canonical (by recency; no declared status) |
| `investor-package/13_PRODUCT_ROADMAP.md` | roadmap | — | This roadmap is based on evidence from the repository codebase, documentation, a | canonical (by recency; no declared status) |
| `investor-review-v2/16_ROADMAP.md` | roadmap | — | 16 — ROADMAP *Evidence-based: what exists, what's missing, realistic timelines.* | canonical (by recency; no declared status) |
| `investor-review-v2/20_FINAL_DECISION.md` | decision | — | 20 — FINAL DECISION *Written as an investor. Honest. Evidence-based. No flattery | canonical (by recency; no declared status) |
| `EUNOIA_FINAL_INVESTOR_GRADE_AUDIT.md` | business | — | Eunoia Intelligence Platform — Final Investor-Grade Audit (Confirmed Production  | canonical (by recency; no declared status) |
| `INVESTOR_CHANGELOG.md` | business | 2026-07-07 | 1. `fc09e4d fix: restore debug env route module` 2. `85c3274 fix: remove researc | canonical (by recency; no declared status) |
| `INVESTOR_DEMO_BLOCKERS_VERIFIED.md` | business | 2026-07-07 | Investor Demo Blockers Verified | canonical (by recency; no declared status) |
| `INVESTOR_DEMO_FINAL_STATUS.md` | business | 2026-07-07 | The repository has moved from NO GO to GO WITH CONDITIONS for tomorrow's investo | canonical (by recency; no declared status) |
| `INVESTOR_DEMO_SPRINT.md` | business | 2026-07-07 | INVESTOR DEMO SPRINT **Optimized for a 30–60 minute investor demo** **Based on P | canonical (by recency; no declared status) |
| `INVESTOR_DEMO_VALIDATION.md` | business | 2026-07-07 | INVESTOR DEMO VALIDATION **Mode: READ → VALIDATE — No code modified. No commits  | canonical (by recency; no declared status) |
| `audit/19-investor-readiness.md` | business | — | **Evidence basis:** Source code, git history, feature inventory, business assess | historical |
| `investor-package/11_PRICING_STRATEGY.md` | business | — | **What Exists:** - Plan tier infrastructure (Starter, Professional, Agency, Ente | canonical (by recency; no declared status) |
| `investor-package/15_INVESTOR_FAQ.md` | business | — | Q: What problem does Eunoia solve? | canonical (by recency; no declared status) |
| `investor-package/19_EXECUTIVE_PITCH.md` | business | — | "Eunoia Platform is an AI-powered Marketing Intelligence SaaS for emerging marke | canonical (by recency; no declared status) |
| `investor-package/INVESTOR_PRESENTATION_READINESS.md` | business | — | Investor Presentation Readiness | canonical (by recency; no declared status) |
| `investor-package/INVESTOR_RECOMMENDATION.md` | business | — | **NO - Do not present this tomorrow for investment.** | canonical (by recency; no declared status) |
| `investor-package/INVESTOR_SCORECARD.md` | business | — | This scorecard evaluates the Eunoia Platform across key dimensions relevant to i | canonical (by recency; no declared status) |
| `investor-review-v2/14_INVESTOR_READINESS.md` | business | — | 14 — INVESTOR READINESS *Honest assessment: what will impress, what will concern | canonical (by recency; no declared status) |
| `Investor Package/07_INVESTOR_RISKS.md` | risk | — | 1. Build failure.    Evidence: `npm run build` fails because `app/api/debug-env/ | canonical (by recency; no declared status) |
| `investor-package/16_RISK_ANALYSIS.md` | risk | — | This analysis identifies key risks facing the Eunoia Platform based on evidence  | canonical (by recency; no declared status) |
| `investor-review-v2/19_RISK_REGISTER.md` | risk | — | 19 — RISK REGISTER *Catalogued risks, evidence-based, prioritized by probability | canonical (by recency; no declared status) |
| `investor-review/06_INVESTOR_RISKS.md` | risk | — | Eunoia Platform - Investor Risk Assessment | historical |
| _2 earlier/historical draft(s) at `03-architecture`, `readme_` | | | | historical |

## Retrieval Pointers

- For orientation: `README.md`
- For architecture / system design: `Investor Package/03_ARCHITECTURE.md`
- For roadmap / priorities: `MASTER_EXECUTION_PLAN.md`
- For decisions / ADRs: `investor-review-v2/20_FINAL_DECISION.md`