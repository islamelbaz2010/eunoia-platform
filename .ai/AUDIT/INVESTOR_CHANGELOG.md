# Investor Changelog

Date: 2026-07-07

## Commits Created

1. `fc09e4d fix: restore debug env route module`
2. `85c3274 fix: remove research API debug logging`
3. `5254d01 fix: align Supabase environment keys`
4. `57e5075 fix: reduce investor demo safety risks`

## Modified Files

### `app/api/debug-env/route.ts`

Why it changed:
- The file was empty and broke `next build` and `tsc`.

Risk:
- Low. The route now returns a 404 JSON response.

Rollback:
- Revert commit `fc09e4d`.

### `app/api/research/leads/route.ts`

Why it changed:
- Removed production debug logs that printed route start and API key presence booleans.

Risk:
- Low. No request logic changed.

Rollback:
- Revert commit `85c3274`.

### `lib/supabase/client.ts`
### `lib/supabase/server.ts`
### `lib/supabase/middleware.ts`
### `proxy.ts`
### `app/(auth)/forgot-password/page.tsx`

Why they changed:
- Runtime code previously required `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` while env examples documented `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Code now accepts `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` first and falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Risk:
- Low. The same public Supabase key role is used; this only adds compatibility with the documented name.

Rollback:
- Revert commit `5254d01`.

### `.env.example`
### `.env.local.example`

Why they changed:
- Added `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to match runtime usage.

Risk:
- Low. Documentation-only examples.

Rollback:
- Revert commit `5254d01`.

### `supabase/leads-table.sql`

Why it changed:
- The prior policies allowed public insert/select according to the SQL file. The demo lead API uses a service-role client, so public access is unnecessary.

Risk:
- Medium. The SQL must be applied in Supabase. If any public client depends on direct anon inserts into `demo_leads`, that would stop working.

Rollback:
- Revert commit `57e5075` or restore the prior policies in Supabase.

### `app/market-intelligence/page.tsx`

Why it changed:
- Removed investor-demo risk from embedding `https://halannews.com/` inside the product.
- Authenticated users now redirect to the internal `/dashboard/analytics` Market Intelligence Hub.

Risk:
- Low. This removes an external dependency from a demo route.

Rollback:
- Revert commit `57e5075`.

## Verification Results

- `npm install`: pass.
- `npm run build`: pass.
- `npm run typecheck`: pass.
- `npm test`: pass.
- `npm audit --omit=dev`: fails with known dependency advisories.

