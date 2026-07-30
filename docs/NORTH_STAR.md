# North Star

**Document Type:** Canonical — never superseded, only refined by founder decision.  
**Date:** 2026-07-21  
**Owner:** Founder

---

## Vision

Every business decision in the MENA region is made with evidence, confidence, and full explainability — not gut feel and not AI guesswork.

---

## Mission

Build the intelligence layer for MENA business decisions. Give every founder, developer, broker, and marketing director access to the same evidence-based decision framework that enterprise consultancies charge hundreds of thousands of dollars for.

---

## Product Identity

**Eunoia Platform is not a report generator.**

Reports are outputs. The product is the decision.

Every intelligence request the platform receives should produce:
- A ranked set of options
- Evidence supporting each option with source citations and freshness scores
- Confidence scores across five dimensions (volume, quality, freshness, consistency, rule compliance)
- Business rules that deterministically pass or block each option
- A validation pipeline that flags structural, logical, and evidence gaps
- A full explainability package — WHY the recommended option won, WHY each other option lost
- A Universal Decision Report that a non-technical stakeholder can read and act on

This is what differentiates the platform from any generic AI tool. The output is explainable, auditable, and reproducible. The same inputs always produce the same scores. AI is used for narration only — after the math is done.

---

## Core Product

**The Decision Intelligence Engine** — a pure-function TypeScript library that converts structured business context and evidence into a scored, validated, explainable decision.

The three customer-facing modules (Real Estate Intelligence, Lead Finder, Talent Finder) are delivery vehicles for the Decision Intelligence Engine. They are not the product. The product is what the engine produces.

---

## Ideal Customer

**Primary:** Egyptian real estate developer, broker, or marketing agency making market-entry, feasibility, or lead acquisition decisions with budgets that would otherwise go to a consulting report.

**Secondary:** MENA-based B2B sales team or HR manager needing evidence-based lead lists or talent market intelligence without a research department.

**Common traits:**
- Makes decisions with high financial stakes (project feasibility, market entry, acquisition)
- Currently relies on either gut feel, expensive consultants, or generic AI tools
- Needs to justify decisions to partners, investors, or boards
- Operates in Egypt, UAE, Saudi Arabia, or other MENA markets
- Has neither the time nor the resources to conduct primary research

---

## Ideal Workflow

1. Customer arrives with a business question ("Is this real estate project feasible in New Cairo?", "Who are the top B2B leads in the medical sector in Riyadh?")
2. Platform collects structured inputs (location, sector, project parameters, search criteria)
3. Decision Intelligence Engine runs: rules evaluate options, evidence is weighted, confidence is scored, validation pipeline runs, explainability is generated
4. Customer receives a Universal Decision Report: recommended option, confidence band, top evidence, rules that fired, alternatives considered, why each alternative was ranked lower
5. Customer exports the report for board presentation, investor memo, or team briefing
6. Platform stores the decision for history and cross-decision trending

---

## Business Outcome

**For the customer:** Decisions that were previously either impossible to make with evidence (no research budget) or took weeks to produce (consultancy engagement) are made in minutes with full audit trail.

**For the business:** Recurring SaaS revenue from customers who make frequent decisions — not one-off report buyers. The platform compounds in value as customers store more decisions and the engine learns what rules matter most in their domain.

---

## What Success Means

- A customer in Egypt can evaluate a real estate feasibility in under 10 minutes with more evidence than they would get from a week of manual research
- A sales team can produce a lead list with individual company confidence scores and rule-based filtering that a human researcher would take days to produce
- Every output can be defended in a board meeting: "This recommendation came from these evidence sources, with this confidence, blocked by this rule, better than these alternatives for these reasons"
- The platform has self-serve billing, automatic plan enforcement, and zero manual intervention for the operator
- Decision Intelligence Engine is integrated into all three modules; legacy AI engine is retired

---

## What Failure Means

- The platform remains a report generator — AI text that cannot be audited, reproduced, or explained
- Decision Intelligence Engine stays as an unintegrated library collecting dust
- Revenue requires manual plan management by an operator
- Supabase gets deleted again with no recovery plan
- Business rules are never defined and the engine never runs in production

---

## North Star Metric

**Evidence-backed decisions per month** — the number of Decision Intelligence Engine outputs delivered to paying customers. Not page views, not AI calls, not reports generated. Decisions that include a confidence score, rule evaluation, and explainability package.

Current: **0** (engine not integrated).  
MVP target: **>0** (at least one module integrated, at least one paying customer uses it).  
Growth target: **>500/month** (platform is the decision layer, not a supplementary tool).

---

*North Star is canonical. Refine by founder decision only. Never supersede — append versioned updates below with date and owner.*
