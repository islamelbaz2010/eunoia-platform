# Production Status

## Verification commands run

- `npm run typecheck`: PASS.
- `npm test`: FAILS because `vitest` command is not found.
- `npm run build`: FAILS because `app/api/debug-env/route.ts` is not a module.
- `npm audit --omit=dev --json`: reports 8 production vulnerabilities: 1 high, 4 moderate, 3 low.

## Build status

NO GO.

The production build fails in this checkout. Next.js reports:

`Type error: File 'app/api/debug-env/route.ts' is not a module.`

The file has 0 lines.

## Test status

NO GO.

The repo has test files and a configured test command, but `npm test` cannot run because `vitest` is missing from the local executable path.

## TypeScript status

GO.

`npm run typecheck` passes.

## Deployment configuration

`vercel.json` sets:

- build command: `npm install && npx prisma generate && npm run build`
- output directory: `.next`
- framework: `nextjs`

Because `npm run build` currently fails, the configured Vercel build would fail from this checkout unless production has a different file state.

## Environment variables

Documented in `.env.example` and `.env.local.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `OPENAI_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `CLOUDFLARE_WORKER_URL`
- `SERPAPI_API_KEY`
- `SEARCH_DAILY_QUOTA`
- `SEARCH_DAILY_QUOTA_PER_USER`
- `APOLLO_API_KEY`
- `NEXT_PUBLIC_SITE_URL`

Used but missing from examples:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

## Not verified

- Current Vercel production health: NOT VERIFIED.
- Production secrets: NOT VERIFIED.
- Supabase project schema state: NOT VERIFIED.
- Runtime success of AI/search/email flows: NOT VERIFIED.

