# Demo Flow

## Demo recommendation

Do not run an investor demo from this checkout until P0 blockers are fixed. The current build failure alone makes the demo NO GO.

## Controlled demo path after fixes

1. Log in with a pre-created demo account.
2. Open Dashboard.
3. Show existing reports first to avoid empty-state risk.
4. Open Report History and show filtering, CSV export, print/PDF, and JSON copy.
5. Open Real Estate Intelligence.
6. Generate a feasibility report with pre-tested inputs.
7. Open Research Intelligence Hub.
8. Run Lead Finder only if SerpAPI quota and OpenAI are confirmed.
9. Run Talent Finder as an AI estimate, explicitly caveated.
10. End on Due Diligence posture: evidence-based MVP, not fully production/commercial hardened.

## Avoid during demo

- `/market-intelligence`, because it embeds `https://halannews.com/`.
- Public demo generation unless the proxy, Resend, rate limiting, and fallback behavior are tested.
- Empty dashboard state.
- Claims about live market data from the static analytics hub.
- Claims about verified candidate/payroll data from Talent Finder.
- Claims about verified company/contact database from Lead Finder.

## Required pre-demo checks

- Build passes.
- Test command runs or test limitation is disclosed internally.
- Vercel production env has exact variable names used by code.
- Demo account contains saved reports.
- SerpAPI quota is available.
- OpenAI key is working.
- Redis rate limit/cache is configured or fail-open behavior is accepted.
- Demo lead table RLS is corrected or demo lead capture is disabled.

