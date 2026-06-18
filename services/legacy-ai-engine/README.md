# Legacy AI Engine

Relocated from `services/ai-engine/` during the Research Intelligence transformation.

This is the generic, multi-provider report orchestration engine that powered the
retired `/dashboard/intelligence` and `/dashboard/feasibility` pages (30 report
types: COMPETITOR, PRICING, CAMPAIGN, CLV_RETENTION, market entry, content/SEO,
crisis, sentiment, etc.). It is no longer wired to any route, but it is kept —
not deleted — for future reuse:

- `orchestrator.ts` + `prompt-builder.ts` — provider-agnostic report generation pipeline.
- `prompts/*.prompt.ts` — 30 prompt templates, e.g. `competitor.prompt.ts` and
  `pricing.prompt.ts` are natural starting points for the future Competitor
  Intelligence / Supplier Intelligence modules on the Research Intelligence Hub.
- `providers/` — model provider abstraction (OpenAI-backed today).

The Prisma `Report` / `ApiUsage` models this engine used to write to are also kept
(marked legacy in `prisma/schema.prisma`), so no historical data is lost.
