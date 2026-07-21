# AI Capabilities

## Verified AI routes

### Real Estate Intelligence

`app/api/intelligence/route.ts` supports:

- `feasibility`
- `campaign_roi`
- `market_entry`
- `lead_gen`
- `full_analysis`

This route authenticates the user, applies rate and plan checks, builds a report-specific prompt, calls OpenAI `gpt-4o-mini`, parses JSON, saves the report to Supabase, and returns the report.

### Talent Finder

`app/api/research/talent/route.ts` uses OpenAI `gpt-4o-mini` to estimate salary ranges, hiring demand, search keywords, and candidate archetypes. The route includes an explicit disclaimer that salary and demand are AI-generated estimates, not verified payroll data.

### Demo Report Generation

`app/api/demo/generate/route.ts` generates a public demo report through `https://halannews.com/api-proxy`, not directly through OpenAI. It falls back to hardcoded report content if AI generation fails.

## Verified Research Core Engine

Lead Finder uses `lib/research/acquisition/research-service.ts`:

1. Cache lookup.
2. SerpAPI search.
3. Fetch public HTML pages.
4. Reject non-fetchable or broken sources.
5. Normalize sources.
6. Validate companies.
7. Deduplicate companies.
8. Rank sources using deterministic confidence scoring.
9. Optionally enrich via Apollo if configured.
10. AI-analyze ranked sources.
11. Cache final result.

The confidence engine is deterministic and capped below 100 in `lib/research/acquisition/ranker.ts`.

## Verified AI safety posture

- Lead Finder says results are public-source research, not verified contact data.
- Lead Finder returns no companies if none pass validation instead of inventing entries.
- Talent Finder tells the model not to invent named candidates, emails, or phone numbers.

## Not verified

- Live OpenAI calls in this environment: NOT VERIFIED.
- Live SerpAPI success path in this environment: NOT VERIFIED.
- Apollo enrichment in production: NOT VERIFIED.
- Accuracy of AI report outputs: NOT VERIFIED.
- Model cost controls beyond rate/quota logic: NOT VERIFIED.

