<!-- tokens: 701 / budget 8000 -->

# System Map — eunoia-platform

## Module Map

- `Investor Package/` — Investor Package module (md files)
- `app/` — application / UI layer
- `audit/` — audit reports and validation outputs
- `components/` — components module (tsx files)
- `core/` — shared library / core utilities
- `hooks/` — hooks module (ts files)
- `i18n/` — i18n module (ts files)
- `investor-package/` — investor-package module (md files)
- `investor-review/` — investor-review module (md files)
- `investor-review-v2/` — investor-review-v2 module (md files)
- `lib/` — shared library / core utilities
- `prisma/` — data models and schema definitions
- `services/` — service / business logic
- `supabase/` — Supabase migrations and edge functions
- `tools/` — tools module (js files)
- `types/` — types module (ts files)

## Data Model

Entities and structures derived from schema/model files:
- `prisma/schema.prisma` — `User`, `Workspace`, `Report`, `ApiUsage`, `String`

## Interface Surface

| Surface | Purpose | Auth |
| --- | --- | --- |
| `app/api/debug-env/route.ts` | entry / routing file | — |
| `app/api/demo/route.ts` | entry / routing file | — |
| `app/api/demo/generate/route.ts` | entry / routing file | — |
| `app/api/intelligence/route.ts` | entry / routing file | — |
| `app/api/research/leads/route.ts` | entry / routing file | — |
| `app/api/research/talent/route.ts` | entry / routing file | — |
| `app/api/users/init/route.test.ts` | entry / routing file | — |
| `app/api/users/init/route.ts` | entry / routing file | — |
| `app/api/workspace/route.ts` | entry / routing file | — |
| `app/auth/callback/route.ts` | entry / routing file | — |

## Critical Flows

1. **GET /api/debug-env** — App Router route handler in `app/api/debug-env/route.ts`
2. **POST /api/demo** — App Router route handler in `app/api/demo/route.ts`
3. **POST /api/demo/generate** — App Router route handler in `app/api/demo/generate/route.ts`
4. **POST /api/intelligence** — App Router route handler in `app/api/intelligence/route.ts`
5. **POST /api/research/leads** — App Router route handler in `app/api/research/leads/route.ts`
6. **POST /api/research/talent** — App Router route handler in `app/api/research/talent/route.ts`

## Invariants & Sharp Edges

- Server-only boundary enforced in `SERPAPI_ROOT_CAUSE_ANALYSIS.md` — source: SERPAPI_ROOT_CAUSE_ANALYSIS.md
- Server-only boundary enforced in `investor-review-v2/09_SECURITY_STATUS.md` — source: investor-review-v2/09_SECURITY_STATUS.md

## Excerpts

### `lib/research/acquisition/index.ts`
```ts
export * from './types'
export * from './quota'
export * from './search-provider'
export * from './source-collector'
export * from './normalizer'
export * from './ranker'
export * from './apollo-adapter'
export * from './ai-analysis'
export * from './research-service'
```
