# 07 — AI ENGINE STATUS
*What AI is used, how, and how good is it.*

---

## AI Architecture Overview

Eunoia uses **two distinct AI patterns**, not one:

### Pattern 1: Pre-Calculate + Interpret (Real Estate Intelligence)
The system calculates all financial numbers using deterministic JavaScript math, then asks AI only to interpret and explain the results in natural language. AI cannot hallucinate the numbers because they are embedded in the prompt as hard facts.

**This is architecturally superior** to asking AI to generate financial numbers from scratch. It solves one of the biggest problems with AI-powered financial tools.

Evidence: `app/api/intelligence/route.ts` — `calculateCashflow()`, `calculateCampaignROI()`, `calculateMarketEntry()`, `calculateLeadGen()`, `calculateFullAnalysis()` all run before any AI call.

### Pattern 2: Research Pipeline + AI Analysis (Lead/Talent Finder)
Real data is gathered from the web (SerpAPI → URL collection → normalization), then AI is used to write company summaries from the actual collected text — not to invent companies.

**This is architecturally responsible** — Lead Finder explicitly states "none are AI-generated" and shows 0 results rather than inventing results when sources don't pass validation.

Evidence: `app/api/research/leads/route.ts` line 155, `lib/research/acquisition/ai-analysis.ts`

---

## AI Provider: OpenAI GPT-4o-mini

**Status: VERIFIED CONFIGURED**

| Parameter | Value | Evidence |
|-----------|-------|----------|
| Model | `gpt-4o-mini` | All routes use this model |
| Max tokens (intelligence) | 4,000 | `route.ts` line 1002 |
| Max tokens (talent) | 2,500 | `talent/route.ts` line 119 |
| Temperature (intelligence) | 0.3 | Low — consistency over creativity |
| Temperature (talent) | 0.4 | Slightly higher for variety |
| Response format | JSON only (enforced in prompt) | System prompt: "Start directly with { and end with }" |
| JSON cleaning | ✅ Robust | Strips markdown code blocks, finds `{` to `}` |

---

## AI Provider: Claude (claude-opus-4-8) — EXTERNAL PROXY

**Status: EXTERNAL DEPENDENCY**

Used exclusively in `/api/demo/generate` — routed through `https://halannews.com/api-proxy`.

This means:
1. The demo report generation uses a more powerful model (claude-opus-4-8 vs GPT-4o-mini)
2. But the call is proxied through an external domain not under direct control
3. No direct Claude API key is configured in this repository's env

Evidence: `app/api/demo/generate/route.ts` lines 54-66

---

## AI Prompt Quality Assessment

### Feasibility Study Prompt
**Quality: EXCELLENT**
- Pre-injects all calculated numbers (NPV, ROI, cashflow) as hard constraints
- Instructs AI to "use EXACT calculated numbers above — do NOT change them"
- Uses Arabic technical labels for Egypt market context
- Verdict is pre-determined by code logic, AI just explains it
- Confidence score is calculated by data completeness, not AI estimation
- Evidence: `buildFeasibilityPrompt()` — 200+ lines

### Campaign ROI Prompt
**Quality: EXCELLENT**
- All CPL comparisons pre-calculated against Egypt 2026 benchmarks
- Channel breakdown pre-computed
- AI writes interpretation and recommendations only
- Evidence: `buildCampaignROIPrompt()`

### Lead Finder Prompt
**Quality: GOOD**
- AI summarizes collected source text, not inventing companies
- Appropriate disclaimer about accuracy
- Evidence: `lib/research/acquisition/ai-analysis.ts`

### Talent Finder Prompt
**Quality: GOOD**
- Explicitly prohibits AI from inventing named candidates
- "suggested_profiles must describe candidate ARCHETYPES, not real individuals"
- Salary explicitly labeled as estimate
- Evidence: `talent/route.ts:buildPrompt()`

### Demo Report Prompt
**Quality: ADEQUATE**
- Generates a light demo report via external proxy
- Has hardcoded fallback if AI fails
- Evidence: `api/demo/generate/route.ts:generateReport()`

---

## Egypt Market Intelligence (Embedded in Code)

This is a genuine competitive advantage — hardcoded Egypt 2026 market data that informs all calculations:

```javascript
// From app/api/intelligence/route.ts
const RE_BENCHMARKS = {
  developer: {
    cpl_meta: '300-800 EGP',
    cpl_google: '500-1200 EGP',
    cpl_tiktok: '150-400 EGP',
    avg_margin: '20-35%',
    net_margin: '10-20%',
    decision_cycle: '60-365 days',
    avg_ticket: '2M-20M EGP',
    cac: '5000-20000 EGP',
    market_size: 'EGP 600B Egypt real estate 2026',
    market_growth: '18% annually',
    city_multipliers: {
      'العاصمة الإدارية': 1.3,
      'الساحل الشمالي': 1.4,
      // ... 7 city multipliers
    }
  },
  broker: { ... }
}
```

**This is NOT AI-generated** — these are pre-researched market benchmarks embedded in the codebase.

---

## AI Caching

- Research queries are cached by input hash in Upstash Redis
- Cache TTL: `CACHE_TTL.REPORT` (defined in `lib/redis/cache.ts`)
- A cache hit skips SerpAPI search entirely
- Evidence: `lib/research/acquisition/research-service.ts` lines 161-165

---

## Legacy AI Engine (Fully Retired)

`services/legacy-ai-engine/` contains:
- 35+ specialized prompt files (competitor, pricing, campaign, CLV, trend, etc.)
- An orchestrator and prompt builder
- OpenAI provider

**Status: ENTIRELY DEAD CODE** — no route calls any of this
Evidence: `services/legacy-ai-engine/README.md` and schema `/// LEGACY:` comments on all 28 ReportTypes

---

## AI Strengths

1. **Financial hallucination prevention** — numbers are pre-calculated, AI only interprets
2. **Evidence-based research** — Lead Finder returns 0 results rather than inventing them
3. **Appropriate disclaimers** — Talent Finder salary explicitly labeled as AI estimate
4. **Low temperature** — consistent, professional outputs
5. **JSON enforcement** — robust cleaning pipeline for AI output parsing
6. **Caching** — avoids repeat API costs on identical queries

## AI Weaknesses / Risks

1. **Single provider dependency** — OpenAI only (no fallback provider)
2. **No streaming** — reports block until full response received (can be slow for 4000-token responses)
3. **No model fallback** — if GPT-4o-mini is unavailable, all AI routes fail
4. **Egypt benchmark data is static** — encoded in source code, not dynamically updated
5. **Demo route proxy dependency** — halannews.com/api-proxy for Claude calls
6. **No AI cost monitoring** — token costs not tracked beyond the legacy ApiUsage table
