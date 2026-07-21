# AI Capabilities

## AI Integration Overview

Eunoia Platform uses AI as an analysis and summarization layer, not as a content generation source. The platform follows an evidence-first approach where AI only processes real data from web searches, never inventing information.

## AI Models Used

### Primary Model: OpenAI GPT-4o-mini

**Provider:** OpenAI

**Model:** gpt-4o-mini

**Usage:**
- Talent Finder - Market analysis and salary estimation
- Research Core Engine - Source summarization
- Real Estate Intelligence - Feasibility analysis
- Legacy AI Engine - 30 report types (retired but preserved)

**Cost:** $0.00015/1K input tokens, $0.0006/1K output tokens

**Configuration:**
- Max tokens: 2500 (Talent Finder), 2000 (Research Core), 8000 (Legacy)
- Temperature: 0.2-0.4 (low temperature for factual output)
- Response format: JSON (structured output)

### Fallback Model: GPT-4o (Configurable)

**Status:** Available but not default

**Usage:** Can be configured via environment variables

**Cost:** Higher than GPT-4o-mini

## AI Use Cases

### 1. Talent Finder - Market Analysis

**Purpose:** Generate salary benchmarks and hiring demand analysis

**Input Data:**
- Job title
- Location
- Industry
- Experience level
- Required skills

**AI Output:**
- Market overview (2-3 sentences)
- Salary range (min/max, currency, period)
- Salary notes (caveats on variation)
- Hiring demand level (High/Medium/Low)
- Hiring demand trend (growing/stable/declining)
- Hiring demand notes (1-2 sentences)
- Suggested keywords for job postings (5 keywords)
- Candidate archetypes (6 profiles describing patterns, not real individuals)

**Prompt Strategy:**
- Explicit instruction to NOT invent specific candidates
- Archetypes must describe patterns, not real people
- Salary estimates labeled as estimates, not verified data
- Low temperature (0.4) for factual consistency

**Validation:**
- JSON schema validation
- Range validation (salary min <= max)
- Enum validation (demand level must be High/Medium/Low)

**Fallback:** If AI fails, returns error to user

---

### 2. Research Core Engine - Source Summarization

**Purpose:** Summarize collected web sources for company profiles

**Input Data:**
- Closed list of already-discovered sources
- Each source includes: title, source type, excerpt (800 chars max)
- Query context

**AI Output:**
- Per-source summaries (1-2 sentences each)
- Mapped back to original source by index

**Prompt Strategy:**
- **Closed-list approach** - AI cannot add, remove, or reorder items
- Explicit instruction: "there are exactly N items, indexed 0 to N-1"
- AI must return array with index mapping
- If AI fails, fallback to raw excerpt (no data loss)

**Safety Mechanism:**
- AI output mapped back to fixed input array by index
- Malformed JSON or missing indices handled gracefully
- Never trusts AI's array ordering - uses fixed index mapping

**Validation:**
- ResearchResultItemSchema validation (Zod)
- Summary length validation
- Source type validation

**Fallback:** Raw excerpt if AI summarization fails

---

### 3. Real Estate Intelligence - Feasibility Analysis

**Purpose:** Analyze real estate project viability and provide recommendations

**Input Data:**
- Cashflow calculations (revenue, costs, ROI, NPV, payback)
- Project parameters (units, area, location, timeline)
- Egypt-specific benchmarks

**AI Output:**
- Viability assessment (viable/not viable)
- Risk factors
- Recommendations
- Market positioning advice

**Prompt Strategy:**
- Context: Egyptian real estate market
- Benchmarks: CPL, margins, decision cycles
- City-specific multipliers

**Validation:**
- Structured JSON output
- Viability boolean validation

**Fallback:** Cashflow calculations still work without AI

---

### 4. Legacy AI Engine - 30 Report Types (Retired)

**Purpose:** Generic marketing intelligence reports

**Status:** Retired but preserved for future use

**Report Types:**
- COMPETITOR
- PRICING
- CAMPAIGN
- FULL_ANALYSIS
- CLV_RETENTION
- TREND_RESEARCH
- MEDIA_MIX
- OPPORTUNITY_SCORING
- REAL_ESTATE_LAUNCH
- REAL_ESTATE_LEADS
- REAL_ESTATE_FEASIBILITY
- PRELIMINARY
- DETAILED
- CONTENT_SEO
- BRAND_AWARENESS
- EXECUTIVE_SUMMARY
- SENTIMENT
- CRISIS
- SOCIAL_AUDIT
- LEAD_QUALITY
- MARKET_ENTRY
- ECOMMERCE_GROWTH
- SEASONAL
- CUSTOMER_JOURNEY
- ANNUAL_BUDGET
- REBRANDING
- B2B_STRATEGY
- PRODUCT_LAUNCH
- DIGITAL_READINESS
- INFLUENCER

**Prompt Templates:** Located in `services/legacy-ai-engine/prompts/`

**Future Use:** Competitor Intelligence, Supplier Intelligence modules

---

## AI Architecture

### Provider Pattern

**Interface:** `services/legacy-ai-engine/providers/base.provider`

**Implementation:** `OpenAIProvider`

**Benefits:**
- Swappable AI providers (Anthropic, Google, etc.)
- Consistent interface across all AI calls
- Cost estimation built-in
- Stream support for real-time responses

**Methods:**
- `generate(prompt, options)` - Synchronous generation
- `stream(prompt, options)` - Streaming generation
- `estimateCost(inputTokens, outputTokens)` - Cost calculation

---

### Cost Optimization

**Caching Strategy:**
- Research results cached by input hash (Redis)
- Cache hit = no AI call = zero cost
- TTL: 24 hours (configurable)

**Token Optimization:**
- Max tokens limited per use case
- Excerpt truncation before AI (800 char max)
- Low temperature reduces output variance

**Quota Management:**
- Daily search quota (SerpAPI) limits data collection
- Per-user fair-share prevents quota exhaustion
- Plan limits control monthly usage

---

### Error Handling

**AI Failure Modes:**
1. **API key missing** - Graceful error message
2. **Rate limit exceeded** - Error with retry guidance
3. **Malformed JSON** - Fallback to raw data
4. **Timeout** - Error with context
5. **Content policy violation** - Error message

**Fallback Strategy:**
- Talent Finder: Error to user (no fallback)
- Research Core: Raw excerpt fallback
- Real Estate: Cashflow without AI analysis
- Legacy: Error to user

---

## AI Safety Measures

### Hallucination Prevention

**Closed-List Approach (Research Core):**
- AI receives fixed list of sources
- AI cannot add new sources
- AI cannot remove sources
- AI only summarizes, never invents

**Explicit Constraints (Talent Finder):**
- "Do not invent specific named candidates, emails, or phone numbers"
- "suggested_profiles must describe candidate ARCHETYPES"
- Salary ranges labeled as "estimate, not verified"

**Evidence-First Philosophy:**
- All company data from real web searches
- AI only analyzes, never generates from scratch
- Confidence scores from source quality, not AI estimation

---

### Data Privacy

**No PII in AI Prompts:**
- User emails not sent to AI
- User names not sent to AI
- Workspace names not sent to AI

**Anonymized Data:**
- Search queries may contain company names (public data)
- Location data (public data)
- Industry data (public data)

**AI Data Retention:**
- OpenAI data retention policy applies
- No custom data retention agreements
- Cache in Redis (24-hour TTL)

---

## AI Performance

### Response Times

**Talent Finder:**
- AI call: ~2-5 seconds
- Total request: ~5-10 seconds (including database operations)

**Research Core (Lead Finder):**
- Search: ~1-2 seconds
- Collection: ~2-5 seconds (parallel fetches)
- AI analysis: ~2-5 seconds
- Total: ~5-15 seconds

**Real Estate Intelligence:**
- Cashflow calculation: <1 second
- AI analysis: ~3-5 seconds
- Total: ~5-10 seconds

---

### Cost Per Request

**Talent Finder:**
- Input tokens: ~500
- Output tokens: ~800
- Cost: ~$0.0006 per request

**Research Core (Lead Finder):**
- Input tokens: ~1,500
- Output tokens: ~1,000
- Cost: ~$0.001 per request

**Real Estate Intelligence:**
- Input tokens: ~2,000
- Output tokens: ~1,500
- Cost: ~$0.0015 per request

**Monthly Cost Estimates (Starter Plan - 20 reports):**
- All Talent Finder: ~$0.012
- All Lead Finder: ~$0.02
- All Real Estate: ~$0.03
- Mixed: ~$0.02-0.05 per user/month

---

## AI Limitations

### Current Limitations

1. **Single Model Provider** - Only OpenAI, no redundancy
2. **No Fine-Tuning** - Using base models only
3. **No RAG** - No retrieval-augmented generation beyond web search
4. **No Model Selection** - Fixed model per use case
5. **No A/B Testing** - No prompt optimization framework
6. **No Quality Metrics** - No AI output quality tracking

### Enterprise Requirements (Not Implemented)

1. **Model Redundancy** - Fallback to alternative providers
2. **Custom Fine-Tuning** - Domain-specific models
3. **Advanced RAG** - Knowledge base integration
4. **Model Selection** - Dynamic model routing
5. **Quality Monitoring** - AI output quality metrics
6. **Cost Optimization** - Advanced token optimization

---

## AI Roadmap

### Short Term (Planned)

1. **Competitor Intelligence Module** - Reuse Legacy AI Engine prompts
2. **Supplier Intelligence Module** - Reuse Legacy AI Engine prompts
3. **Prompt Optimization** - A/B testing for better outputs

### Medium Term (Not Planned)

1. **Multi-Provider Support** - Add Anthropic Claude
2. **Fine-Tuning** - Domain-specific models for Egypt market
3. **Advanced RAG** - Knowledge base integration

### Long Term (Not Planned)

1. **Custom Model Training** - Proprietary models
2. **Model Hosting** - Self-hosted models
3. **AI Research** - Novel AI architectures

---

## AI Compliance

### OpenAI Usage Policy

**Compliance:**
- No generation of harmful content
- No generation of PII
- No generation of misleading information
- Clear disclaimers on AI-generated content

**Data Usage:**
- OpenAI may use API data for improvement (default)
- No opt-out visible in code
- Enterprise agreement available (not implemented)

---

### AI Transparency

**User Communication:**
- Clear disclaimers on AI-generated estimates
- Confidence scores shown to users
- Source URLs provided for verification
- "Estimate disclaimer" on salary ranges

**Internal Tracking:**
- No AI usage analytics visible
- No cost tracking per user
- No quality metrics collection

---

## AI Summary

Eunoia Platform uses OpenAI GPT-4o-mini for analysis and summarization, following an evidence-first approach where AI never invents data. The platform uses a closed-list approach for research to prevent hallucinations, with graceful fallbacks when AI fails. Cost optimization is achieved through caching and token limits. The AI integration is production-ready but lacks enterprise features like multi-provider support and fine-tuning. The primary AI use cases are Talent Finder (market analysis), Research Core (source summarization), and Real Estate Intelligence (feasibility analysis).
