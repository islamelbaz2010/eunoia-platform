# Due Diligence

## Evidence reviewed

- `README.md`
- `package.json`
- `vercel.json`
- `next.config.ts`
- `proxy.ts`
- `.env.example`
- `.env.local.example`
- `prisma/schema.prisma`
- `supabase/*.sql`
- `app/**`
- `lib/**`
- `services/legacy-ai-engine/**`
- `types/**`
- root audit and investor documents as historical context only

## Verified commands

- Typecheck passed.
- Build failed.
- Test command failed.
- Production dependency audit found vulnerabilities.

## Questions an investor or technical advisor may ask

1. Does the app build from a clean checkout?
   Current answer: No, not from this checkout.

2. Are tests passing?
   Current answer: NOT VERIFIED. Test command cannot run because `vitest` is missing locally.

3. Are AI outputs grounded?
   Current answer: Partially. Lead Finder has a source pipeline; Talent Finder and real-estate reports rely on model output plus deterministic pre-calculations/disclaimers.

4. Is customer data protected?
   Current answer: Mixed. Authenticated reports use user-scoped RLS SQL, but `demo_leads` policies are open as written.

5. Is there billing?
   Current answer: NOT VERIFIED. Plan limits exist, billing integration not found.

6. Is the product deployed?
   Current answer: README lists `https://ai.halannews.com`, but current production state is NOT VERIFIED.

7. Can this scale commercially?
   Current answer: NOT VERIFIED. There are rate/quota controls, but Redis fail-open behavior, billing absence, and live dependency success paths need validation.

## Artifacts requiring cleanup before diligence

- Empty `app/api/debug-env/route.ts`.
- Root-level legacy PHP/HTML/text artifacts.
- Duplicate historical audit/investor folders.
- Supabase type stub.
- Env example mismatch.
- Debug logs in Lead Finder route.

