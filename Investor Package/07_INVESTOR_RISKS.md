# Investor Risks

## P0 blockers

1. Build failure.
   Evidence: `npm run build` fails because `app/api/debug-env/route.ts` is empty and not a module.

2. Tests not runnable in current checkout.
   Evidence: `npm test` fails with `vitest: command not found`.

3. Supabase env mismatch.
   Evidence: code reads `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; env examples document `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

4. Demo generation depends on external proxy.
   Evidence: `app/api/demo/generate/route.ts` calls `https://halannews.com/api-proxy`.

5. Public demo lead data risk.
   Evidence: `supabase/leads-table.sql` has `FOR SELECT USING (true)` and `FOR INSERT WITH CHECK (true)`.

## Security risks

- Lead Finder logs boolean presence of server API keys.
- `demo_leads` table policies allow broad access if applied as written.
- Resend and service-role key use are not fully documented in env examples.
- Rate limits and quotas fail open when Redis is unavailable.
- Dependency audit shows one high-severity production vulnerability in `form-data`.

## Commercial risks

- Billing/payment integration not found.
- Paid plan assignment appears manual/infrastructure-only.
- Revenue, customers, retention, and usage are NOT VERIFIED.
- Support, SLA, privacy, deletion, and data retention processes are NOT VERIFIED.

## Technical due diligence risks

- Split Prisma/Supabase data model.
- Legacy AI engine remains in the repo and is still referenced for provider abstractions.
- Supabase generated types are a stub.
- Multiple prior audit/investor folders make repository narrative noisy.
- Legacy PHP/HTML artifacts and text files exist at repo root.

## Investor messaging risk

Do not claim "production ready." Evidence does not support that phrase.

