# 11 — Backend

**Evidence basis:** All lib/ files, services/ files, API routes, config files.

---

## Backend Architecture

The "backend" is entirely Next.js API routes running as Vercel serverless functions. There is no separate backend server. All business logic lives in:

```
lib/
  prisma/          — Prisma client + user bootstrap
  redis/           — Upstash Redis client + cache
  research/        — Plan enforcement, rate limit, research pipeline utilities
  supabase/        — Supabase server/client/middleware

services/
  legacy-ai-engine/ — DEAD CODE — not called by any active route

app/api/           — Next.js route handlers
```

---

## Core Backend Libraries

### `lib/prisma/client.ts`
Singleton Prisma client with `globalThis` pattern to prevent connection pool exhaustion in hot-reloading environments. ✅

### `lib/redis/client.ts`
Lazy-initialized Upstash Redis wrapper. Throws on missing env vars at first use (not at module load time) — correct for serverless. ✅

### `lib/redis/cache.ts`
```typescript
export const CACHE_TTL = { REPORT: 24 * 60 * 60 }
```
Generic `cacheGet/cacheSet` wrappers with Zod schema validation on cache hits. ✅ Using Zod to validate cached data prevents serving corrupt cache entries.

### `lib/research/rate-limit.ts`
Manual Redis-based rate limiter. 5 requests/hour/key, fail-open. Uses `redis.get → incr → set` pattern. **Finding:** Race condition possible — between `get` and `incr`, two concurrent requests could both read `count < 5` and both be permitted. Should use a Lua script or `@upstash/ratelimit` (which is declared as a dependency but not used here). 

**Evidence:** `package.json:20` — `"@upstash/ratelimit": "^2.0.5"` is installed but `lib/research/rate-limit.ts` implements rate limiting manually. The `@upstash/ratelimit` library would use atomic Redis operations and avoid the race condition.

### `lib/research/plan-enforcement.ts`
Plan limit check using `research_requests.credits_used` sum for the current calendar month. Fail-open. Correct logic.

### `lib/research/acquisition/`

| File | Purpose | Tested |
|---|---|---|
| `research-service.ts` | Orchestrates full Lead Finder pipeline | ❌ no dedicated service test |
| `search-provider.ts` | SerpAPI adapter | ❌ |
| `source-collector.ts` | HTTP fetch + HTML text extraction | ❌ |
| `normalizer.ts` | Extract company info from raw text | ❌ |
| `ranker.ts` | Score sources by sector/city/size hints | ✅ `ranker.test.ts` |
| `quota.ts` | Daily search budget check | ✅ `quota.test.ts` |
| `apollo-adapter.ts` | Apollo.io enrichment adapter | ✅ `apollo-adapter.test.ts` |
| `ai-analysis.ts` | GPT-4o-mini summarization per source | ❌ |
| `types.ts` | Zod schemas + TypeScript types | N/A |
| `index.ts` | Public exports | N/A |

---

## Backend Service: Legacy AI Engine

**Location:** `services/legacy-ai-engine/`  
**Status:** DEAD CODE — zero active API routes import from this directory (the `OpenAIProvider` is used in the research pipeline but is a standalone class; the orchestrator and prompts are unused).

**Inventory:**
- `orchestrator.ts` — original report generation orchestrator
- `prompt-builder.ts` — builds prompts from templates
- `providers/openai.provider.ts` — OpenAI wrapper (reused by research pipeline)
- `providers/base.provider.ts` — AIProvider interface
- `prompts/*.prompt.ts` — 26 specialized prompt files for the original report types

**Recommendation:** Remove all files except `providers/openai.provider.ts` and `providers/base.provider.ts` (which are actively reused). Saves ~40 files of dead code.

---

## Backend Error Handling

| Route | Unhandled case |
|---|---|
| `intelligence` | AI JSON parse error exposes `raw` content to client |
| `intelligence` | No timeout guard on OpenAI call (relies on Vercel function timeout) |
| `leads` | No per-URL timeout on source fetches |
| `talent` | No timeout on OpenAI call |
| All routes | Redis errors are caught and fail-open — no alerting |

---

## Dependency Analysis

### Declared but Unused in Source
| Package | Declared in | Used? |
|---|---|---|
| `resend` | `package.json` | ❌ Zero imports found |
| `@upstash/ratelimit` | `package.json` | ❌ Manual rate limit implemented instead |
| `framer-motion` | `package.json` | Minimal (1 component) |

### Over-broad Packages
| Package | Concern |
|---|---|
| `openai` | Full SDK imported at runtime (`await import('openai')`) in intelligence route — deferred import is correct for serverless cold starts |
| `prisma` + `@prisma/client` | Correctly in `serverExternalPackages` in next.config.ts |

---

## Backend Code Quality Summary

| Observation | Assessment |
|---|---|
| Singleton patterns for Prisma + Redis | ✅ Correct |
| Fail-open for rate limit + plan enforcement | ✅ Documented, intentional |
| `as any` Supabase casts | ⚠️ Type safety bypassed |
| Manual rate limit with potential race condition | ⚠️ Should use `@upstash/ratelimit` (already installed) |
| No timeout on external HTTP calls | ⚠️ Lead Finder can hang |
| Dead legacy code (40+ files) | ⚠️ Technical debt |
| Unused declared dependencies | ⚠️ `resend`, `@upstash/ratelimit` |
| No admin/management API | ⚠️ Missing for operations |
