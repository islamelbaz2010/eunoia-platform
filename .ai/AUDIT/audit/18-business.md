# 18 — Business

**Evidence basis:** Product behavior verified from source code. Revenue model inferred from `user_plans` table, plan enforcement code, and feature set. No business documents found — code is the ground truth.

---

## Product Identity

**Eunoia Platform** is an AI-powered business intelligence SaaS targeted at Egyptian real estate professionals and B2B growth teams.

**Two distinct product lines in one codebase:**

### Product 1: Real Estate Intelligence Engine
- **5 report types:** Feasibility Analysis, Campaign ROI, Market Entry Strategy, Lead Generation Strategy, Full Analysis
- **Target user:** Real estate developers, project sales teams, marketing managers in Egypt
- **Value proposition:** Replace expensive market research consultants with instant AI-generated feasibility reports using Egypt-specific benchmarks
- **Language:** Bilingual Arabic/English (Arabic-first)

### Product 2: Research Core Engine
- **3 modules:** Lead Finder (B2B company discovery), Talent Finder (hiring), Market Intelligence (combined)
- **Target user:** B2B sales teams, HR teams, startup business development
- **Value proposition:** AI-powered prospecting — find qualified companies in Egyptian market sectors without manual search

---

## Revenue Model

**Current model (inferred from code):**

```
Plan       | Credits/month | Price  
STARTER    | 20            | Unknown ($0 — free trial likely)
PROFESSIONAL | 100         | Unknown (~$29–49/month typical)
AGENCY     | 300           | Unknown (~$99–149/month typical)
ENTERPRISE | Unlimited     | Unknown (custom/contact)
```

**Evidence:** `supabase/plan-enforcement.sql:8`, `types/plan.types.ts:7–11`

**No payment integration exists in the codebase.** Plan assignment is fully manual (service-role SQL insert). Stripe, Paddle, LemonSqueezy — zero evidence of any payment processor.

**Revenue today:** $0 (cannot collect money without payment integration).

---

## Market Analysis

### Target Market: Egypt Real Estate
**Market size:** Egypt real estate market ~$22B GDP contribution. Cairo + New Administrative Capital + North Coast are 3 of the 12 cities hardcoded in the system.

**Why it matters:** Egyptian real estate has complex regulations, Arabic-language operations, and limited access to quality market intelligence tools. English-language CRE tools (CoStar, Buildout) have zero Arabic-language presence. This is a genuine localization gap.

**Hardcoded 2026 Egypt benchmarks** (found in intelligence route):
- Cairo residential: 45,000 EGP/m²
- Administrative capital: 35,000 EGP/m²
- North Coast: 28,000 EGP/m²
- New Zayed: 32,000 EGP/m²

These benchmarks are hardcoded in source (not loaded from a CMS or data service). They will become stale.

### Target Market: B2B Sales (Lead Finder)
**Sectors covered:** 13 sectors (Tech, Finance, Healthcare, Real Estate, Retail, Food & Beverage, Education, Manufacturing, Construction, Hospitality, Media, Logistics, Consulting)

**Geography:** Egypt-first, Arabic-language outputs

---

## Competitive Landscape

### Real Estate Intelligence
| Competitor | Presence in Egypt | Arabic support | AI-native |
|---|---|---|---|
| CoStar | No | No | Partial |
| Buildout | No | No | Partial |
| Local market analysts | Yes | Yes | No |
| **Eunoia** | Egypt-only | Yes (primary) | Yes |

**Assessment:** No direct digital competitor in Egypt for AI-powered Arabic-language RE intelligence. This is a genuine market gap.

### Lead Finder
| Competitor | Egyptian focus | Arabic | Source quality |
|---|---|---|---|
| Apollo.io | Weak | No | Global |
| Hunter.io | None | No | Global |
| LinkedIn Sales Navigator | Moderate | Partial | Global |
| **Eunoia** | Strong | Yes | Egypt-web |

---

## Competitive Advantages

1. **Arabic-language AI outputs** — All report content is generated in Arabic with Egyptian-specific terminology. No Western competitor does this.
2. **Egypt 2026 market benchmarks** — Hardcoded Egypt-specific price data (though this becomes a liability when data goes stale).
3. **Calculate-then-narrate architecture** — Financial accuracy for professional-grade reports.
4. **Single-market depth** — Rather than shallow global coverage, deep Egypt focus.

## Competitive Weaknesses

1. **Benchmark staleness risk** — Hardcoded market prices. If Egypt inflation (currently high) changes RE prices significantly, reports become incorrect.
2. **No source data validation** — The RE intelligence engine uses user-provided input as truth. No market data API validates inputs.
3. **SerpAPI dependency** — Lead Finder quality entirely depends on Google's web index for Egyptian businesses.
4. **No Arabic NLP** — Reports are in Arabic, but the AI (GPT-4o-mini) is an English-first model. Arabic output quality may be inconsistent.

---

## Business Model Risks

| Risk | Severity | Mitigation |
|---|---|---|
| No payment integration = $0 revenue | CRITICAL | Build Stripe integration (3 weeks) |
| Manual plan assignment = no scalability | HIGH | Add billing webhook to auto-assign plans |
| No customer support mechanism | HIGH | No help center, chat, or ticketing |
| Single market (Egypt) concentration | MEDIUM | Feature depth before expansion |
| Benchmark data staleness | MEDIUM | Move to configurable data source |
| OpenAI dependency | MEDIUM | Abstract provider, add fallback |
| No retention mechanism | MEDIUM | No email, no reports history email digest |

---

## Commercial Readiness Score

**Score: 43/100**

| Dimension | Score | Reasoning |
|---|---|---|
| Product completeness | 60/100 | Core features work; placeholders exist |
| Technical stability | 55/100 | Critical env bug; no monitoring; no tests for financial engine |
| Business infrastructure | 10/100 | No payments, no support, no onboarding |
| Market positioning | 75/100 | Clear niche, real gap, Arabic-first |
| Legal/compliance | 30/100 | No privacy policy, terms, GDPR/PDPL assessment |
| **Overall** | **43/100** | |
