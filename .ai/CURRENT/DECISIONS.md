# Decision Log

**Format:** append-only. Each entry records a confirmed architectural or product decision with date, context, and source.

---

## DEC-001 — Decision Intelligence Engine as Pure-Function Library

**Date:** 2026-07-21 (Session 3)  
**Status:** CONFIRMED — implementation complete  
**Source:** Session 3 implementation; `lib/decision-intelligence/` (15 files, 61 tests)

**Decision:** The Decision Intelligence Engine is implemented as a pure TypeScript library with no I/O, no database calls, no AI calls in the core. The API is `runDecisionEngine(input): DecisionEngineResult`. Same inputs always produce same outputs.

**Rationale:** Determinism is required for explainability and auditability. AI is permitted only as a caller-side narration layer after scores are computed.

---

## DEC-002 — Calculate-Then-Narrate Pattern

**Date:** 2026-07-21 (Session 3)  
**Status:** CONFIRMED — architectural pattern defined  
**Source:** `lib/decision-intelligence/types/decision.types.ts` (`aiAnalysis` field on `DecisionOption`); `docs/DECISION_INTELLIGENCE_ARCHITECTURE.md` Stage 7

**Decision:** AI narration is always caller-side, always post-scoring, always optional. The Decision Intelligence output is valid and complete without AI narration. GPT-4o-mini receives computed scores and narrates their implications; it does not compute any score.

---

## DEC-003 — DVE as Independent Architectural Component

**Date:** 2026-07-21 (Session 5 — Final Architecture Sprint)  
**Status:** CONFIRMED — permanently canonical  
**Source:** `docs/DECISION_INTELLIGENCE_ARCHITECTURE.md` Part II

**Decision:** The Decision Validation Engine (DVE) — implemented as `validation-engine.ts` — is an independent architectural component, not merely step 4 of 6 inside the decision engine orchestrator. It has its own inputs, outputs, failure modes, and lifecycle.

**Consequence:** Every implementation sprint that wires Decision Intelligence into an API route MUST check `ValidationResult.pipelineStatus` and handle REJECTED decisions. A REJECTED decision must not be delivered to the customer.

---

## DEC-004 — Product Identity: Platform Sells Validated Decisions

**Date:** 2026-07-21 (Session 5 — Final Architecture Sprint)  
**Status:** CONFIRMED — permanently canonical  
**Source:** `docs/DECISION_INTELLIGENCE_ARCHITECTURE.md` Part V (Canonical Product Identity); `docs/NORTH_STAR.md`

**Decision:** The Eunoia Platform does NOT sell AI reports. The Eunoia Platform sells VALIDATED BUSINESS DECISIONS. A Validated Decision is a decision that has passed the DVE's 5-stage validation pipeline. Decision Intelligence output that is REJECTED by the DVE is not a product. The customer only receives VALIDATED or COMPLETED decisions.

**Consequence:** All marketing, documentation, and UI language must use "Validated Decision" as the product noun, not "AI report" or "intelligence report."

---

## DEC-005 — Trust Score as Mandatory Report Field

**Date:** 2026-07-21 (Session 5 — Final Architecture Sprint)  
**Status:** CONFIRMED — pending implementation (Sprint 4)  
**Source:** `docs/DECISION_INTELLIGENCE_ARCHITECTURE.md` Part III Dimension 13; Part IV

**Decision:** `UniversalDecisionReport` must gain a `trustScore: TrustScore` field (new type). The Trust Score is a post-DVE aggregate trust metric (0–100) across all 13 validation dimensions. It differs from the confidence score: confidence measures evidence strength; trust measures process quality.

**Implementation:** Add `TrustScore` type and `trustScore` field to `lib/decision-intelligence/types/report.types.ts` in Sprint 4.

---

## DEC-006 — North Star Metric Counts Validated Decisions Only

**Date:** 2026-07-21 (Session 5 — Final Architecture Sprint)  
**Status:** CONFIRMED — architectural constraint  
**Source:** `docs/DECISION_INTELLIGENCE_ARCHITECTURE.md` Part V; `docs/NORTH_STAR.md`; `docs/PROJECT_KPIS.md`

**Decision:** The North Star Metric ("evidence-backed decisions per month") counts only decisions that have passed the DVE (status=VALIDATED or COMPLETED). REJECTED decisions do not count. The metric is tracked in the `decisions` Supabase table filtered by `status IN ('VALIDATED', 'COMPLETED')`.

---

## DEC-007 — Sprint 2 (Knowledge Base Repair) Has No Dependencies

**Date:** 2026-07-21 (Session 5)  
**Status:** CONFIRMED  
**Source:** `docs/EXECUTION_ROADMAP.md` Sprint 2; `docs/CRITICAL_PATH.md` Step 2

**Decision:** Sprint 2 (updating stale `.ai/CURRENT/` files) is the immediately executable first action. It requires no Supabase project, no env vars, no external services. It can and should be done at the start of the next session.

---

*Decision log created 2026-07-21. Append-only.*
