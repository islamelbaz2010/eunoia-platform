# Product Overview

## Verified product vision

The repository identifies Eunoia as an "AI Marketing Intelligence Platform" in `README.md`. The app metadata describes "AI-powered marketing intelligence for MENA businesses" in `app/layout.tsx`.

## Verified product surfaces

- Public/root route: `app/page.tsx` redirects authenticated users toward `/market-intelligence`.
- Authentication: login, signup, forgot password, callback routes exist under `app/(auth)/` and `app/auth/callback/route.ts`.
- Dashboard: `app/dashboard/page.tsx` shows report counts, recent reports, and module links.
- Report history: `app/dashboard/reports/page.tsx` fetches Supabase reports; `reports-client.tsx` supports search, filters, CSV export, print/PDF, and copy JSON.
- Real Estate Intelligence: `app/dashboard/real-estate/page.tsx` offers five report types.
- Research Intelligence: `app/dashboard/research/page.tsx` lists Lead Finder and Talent Finder as live, with four other modules marked Coming Soon.
- Market Intelligence Hub: `app/dashboard/analytics/page.tsx` contains curated static market insights and explicitly says it is not a live data feed.
- Separate `/market-intelligence`: `app/market-intelligence/page.tsx` embeds `https://halannews.com/` in an iframe.
- Public demo: `app/demo/page.tsx`, `app/api/demo/route.ts`, and `app/api/demo/generate/route.ts`.

## Verified live feature set

- Real-estate feasibility/report generation through `/api/intelligence`.
- Lead Finder through `/api/research/leads`.
- Talent Finder through `/api/research/talent`.
- Report history through Supabase `reports`.
- Workspace initialization through `/api/users/init`.
- Workspace read API through `/api/workspace`.

## Not verified

- Actual production usage: NOT VERIFIED.
- Paying customers: NOT VERIFIED.
- Business model enforcement beyond report limits: NOT VERIFIED.
- Accuracy of built-in market benchmarks: NOT VERIFIED.
- That the public production URL currently runs this exact commit: NOT VERIFIED.

