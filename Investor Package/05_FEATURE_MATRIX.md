# Feature Matrix

| Area | Status from repo | Evidence | Investor note |
| --- | --- | --- | --- |
| Product positioning | Verified | `README.md`, `app/layout.tsx` | AI marketing intelligence for MENA/Egypt focus. |
| Login/signup | Implemented | `app/(auth)/login`, `app/(auth)/signup` | Depends on Supabase env names being correct. |
| Forgot password | Implemented | `app/(auth)/forgot-password/page.tsx` | Redirect config NOT VERIFIED. |
| Dashboard | Implemented | `app/dashboard/page.tsx` | Shows report counts and recent reports. |
| Report history | Implemented | `app/dashboard/reports/*` | CSV, print/PDF, copy JSON are present. |
| Real Estate Intelligence | Implemented | `app/dashboard/real-estate/page.tsx`, `/api/intelligence` | Five report types are wired. |
| Lead Finder | Implemented | `app/dashboard/research/leads`, `/api/research/leads` | Requires SerpAPI and OpenAI success path. |
| Talent Finder | Implemented | `app/dashboard/research/talent`, `/api/research/talent` | AI-estimated, not verified payroll data. |
| Research Hub future modules | Not implemented | `app/dashboard/research/page.tsx` | Competitor, Market Research, Supplier, Recruitment are Coming Soon. |
| Market Intelligence Hub | Partial | `app/dashboard/analytics/page.tsx` | Static curated insights, not live data feed. |
| `/market-intelligence` route | Investor risk | `app/market-intelligence/page.tsx` | Embeds external `halannews.com`. |
| Public demo capture | Implemented | `app/api/demo/route.ts` | Requires service role key and Resend. |
| Public demo generation | Partial/risky | `app/api/demo/generate/route.ts` | External proxy dependency plus fallback text. |
| Plan limits | Infrastructure | `types/plan.types.ts`, `lib/research/plan-enforcement.ts` | No billing integration verified. |
| Billing/payments | Not found | Repository search | NOT VERIFIED. |
| Admin panel | Not found in Next app | Repository search | Legacy PHP admin code exists separately. |

