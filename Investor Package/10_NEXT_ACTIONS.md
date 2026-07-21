# Next Actions

## P0: before any investor demo

1. Fix or remove empty `app/api/debug-env/route.ts`.
2. Make `npm run build` pass.
3. Make `npm test` runnable from a clean install, or remove the test claim from investor materials.
4. Align Supabase env variable names across code and examples.
5. Remove key-presence debug logs from `app/api/research/leads/route.ts`.
6. Lock down `demo_leads` RLS or disable public lead capture during demo.
7. Decide whether to hide `/market-intelligence` or replace the external iframe with a truthful internal screen.

## P1: before technical due diligence

1. Generate real Supabase TypeScript types.
2. Reconcile Prisma user/workspace data with Supabase auth/reporting model.
3. Document all required env vars, including service role and Resend.
4. Validate live OpenAI, SerpAPI, Resend, Redis, Supabase, and Apollo paths.
5. Add CI for typecheck, tests, build, and dependency audit.
6. Resolve dependency audit findings.
7. Clean root-level legacy artifacts or move them to an archive folder.

## P2: before commercial launch

1. Add billing/payment integration or clearly define manual enterprise-only sales.
2. Add privacy, deletion, retention, and data-processing documentation.
3. Add monitoring and alerting.
4. Add backup/restore documentation.
5. Add admin plan assignment workflow.
6. Add evidence packs for benchmark sources, AI disclaimers, and model limitations.

