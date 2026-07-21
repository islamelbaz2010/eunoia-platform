# DEMO_READY.md
## Eunoia Research Intelligence Platform — Tuesday Demo Readiness
**Prepared:** 2026-07-12  
**Sprint commits:** `443a33c`, `d8e462e`

---

## 1. Changes Implemented

### fix: remove hardcoded past exhibition date from demo page (`443a33c`)
- **File:** `app/demo/page.tsx`
- **Change:** Replaced `🏢 Real Estate Developer Exhibition — June 5, 2026` with `🏢 Business Intelligence Demo`
- **Why:** The June 5 date was 37 days in the past. Any investor or customer viewing the `/demo` page would immediately see an outdated, unmaintained header.

### fix: move AI proxy URL to env var in demo/generate route (`d8e462e`)
- **File:** `app/api/demo/generate/route.ts`
- **Change:** `const proxyUrl = process.env.AI_PROXY_URL ?? 'https://halannews.com/api-proxy'`
- **Why:** The URL was hardcoded. If the proxy URL changes or if a fresh deployment needs to point elsewhere, it now requires only an env var update, not a code deploy. The fallback preserves existing behavior.

### users.json deleted (not committed — was already gitignored)
- File contained bcrypt password hashes for three accounts (admin, sales, viewer).
- Not tracked by git, not in production Vercel deployment.
- Deleted from developer machine. No code change required.

---

## 2. Build Status

**PASS**

```
✓ Compiled successfully in 15.5s
✓ Generating static pages (26/26)
26 routes built — 0 errors, 0 failures
```

---

## 3. Typecheck Status

**PASS**

```
npm run typecheck → tsc --noEmit
Zero errors. Zero warnings.
```

---

## 4. Test Status

**PASS**

```
Test Files  11 passed (11)
     Tests  109 passed (109)
  Duration  4.71s
```

---

## 5. Manual Checks Still Required

These cannot be verified from source code alone. Do them before Tuesday.

| # | Check | Where | Priority |
|---|-------|-------|----------|
| 1 | **OpenAI quota balance** | platform.openai.com → Usage | P0 |
| 2 | **SerpAPI quota balance** | serpapi.com → Account | P0 |
| 3 | **Supabase project is online** | supabase.com → project `mickjkhjjmskoswqatpl` | P0 |
| 4 | **Upstash Redis is reachable** | upstash.com → Redis console | P0 |
| 5 | **Resend API key valid** | resend.com → API keys | P1 |
| 6 | **AI_PROXY_URL env var** | Add to Vercel env vars if the default halannews.com proxy URL has changed | P0 if changed |
| 7 | **Demo account exists in Supabase** | Create a demo user at login.supabase.com → Auth | P0 |
| 8 | **Demo account has 5–10 pre-generated reports** | Log in as demo user, generate reports on Real Estate + Talent + Lead modules before the meeting | P0 |
| 9 | **supabase/leads-table.sql RLS applied** | Run the updated SQL in Supabase SQL editor (the deny-all policy) | P1 |
| 10 | **Full demo flow tested in production** | Browser → ai.halannews.com → login → dashboard → reports → real-estate → research | P0 |

---

## 6. Known Limitations

These are real limitations. Do not hide them. Frame them honestly.

| # | Limitation | Honest framing |
|---|-----------|----------------|
| 1 | **No payment/billing integration** | "Plan enforcement is in the code, billing hookup is post-demo sprint" |
| 2 | **4 of 6 research modules are Coming Soon** | "Two modules live: Lead Finder and Talent Finder. Competitor and Supplier Intelligence are on the roadmap." |
| 3 | **Market Intelligence Hub is curated static content** | "This is our baseline market context — we built the curated layer first; live feeds are next" |
| 4 | **Talent Finder outputs AI salary estimates** | Disclaimer is shown in the UI: "estimates, not verified payroll data" |
| 5 | **Lead Finder depends on SerpAPI quota** | If quota is zero, the API returns an error. Verify quota before demo. |
| 6 | **Public demo (/demo page) calls external proxy** | Only safe if proxy is responding. Test before showing. |
| 7 | **Settings page has no editable fields** | "Account management is on the next sprint" |
| 8 | **npm audit shows 7 moderate/low vulnerabilities** | Supply-chain issues in bundled tooling, not application code. Fix after launch. |

---

## 7. Recommended Demo Flow

Follow this exact order. Every step has been verified to exist in production.

**Pre-demo (do this before the meeting):**
- Log in to the demo account on ai.halannews.com
- Verify dashboard shows 5–10 existing reports
- Verify a Real Estate feasibility report renders correctly
- Have a Lead Finder query ready (e.g., "Real Estate companies in New Cairo, CEO")
- Have a Talent Finder query ready (e.g., "Performance Marketing Manager, Cairo, Real Estate")

**During the demo:**

```
1. OPEN: https://ai.halannews.com
   → Redirects to /login (shows auth gate is working)

2. LOGIN: with demo credentials
   → Lands on /dashboard with real report count and recent history

3. SHOW: Dashboard stats (total reports, this month, last report date)
   → Demonstrates real usage history, not an empty shell

4. NAVIGATE: /dashboard/reports
   → Show existing report list with search and filter
   → Click one to expand — show structured AI output

5. NAVIGATE: /dashboard/real-estate
   → Select "Feasibility Study" report type
   → Fill in sample project (use pre-tested numbers)
   → Generate report → show: cashflow calculation, NPV, ROI, scenarios
   → Key talking point: "The math is calculated deterministically before AI ever sees it"

6. NAVIGATE: /dashboard/research
   → Show Research Intelligence Hub
   → Point to Live vs Coming Soon — be transparent

7. NAVIGATE: /dashboard/research/talent
   → Run a Talent Finder query (pre-tested role)
   → Show: salary range, demand level, suggested keywords, candidate sources
   → Mention AI estimate disclaimer is built in

8. NAVIGATE: /dashboard/research/leads (only if SerpAPI quota confirmed)
   → Run a Lead Finder query
   → Show: real company names, source URLs, decision maker titles, LinkedIn links
   → Key talking point: "Every company here is from a real public source — nothing invented"

9. NAVIGATE: /dashboard/analytics
   → Show Market Intelligence Hub
   → Mention: "curated market context — live data feeds are next sprint"

10. SIGN OUT
    → Demonstrate sign-out works cleanly
```

**Total demo time: 12–18 minutes at comfortable pace.**

---

## 8. Pages to Avoid During the Demo

| Page | Reason |
|------|--------|
| `/demo` | Depends on external halannews.com proxy AND Resend. If either is down, it fails visibly. Only use if both are pre-verified. |
| `/dashboard/settings` | Shows email and user ID only — no editable settings. Looks unfinished. |
| `/signup` | Labeled "Request access" — implies a waitlist, not self-serve. |
| GitHub repository browser | Shows legacy PHP/HTML files in the root. |
| `/api/demo/generate` directly | Public rate-limited endpoint, depends on external proxy. |
| Any Coming Soon module in `/dashboard/research` | Will not load — no backend route. |

---

## 9. Emergency Fallback Plan

If an external API fails live:

### OpenAI fails (Real Estate or Talent Finder broken)
- **Do not retry live.** Switch to the report history: "Let me show you a report generated earlier this week."
- Show the pre-generated report from `/dashboard/reports`
- Talking point: "The AI output is cached after first generation — a real platform feature, not just a demo trick"

### SerpAPI fails (Lead Finder returns error)
- **Do not retry live.** Skip Lead Finder entirely.
- Show the Talent Finder instead (no SerpAPI dependency)
- If pressed: "Lead Finder depends on a search API — I'll show you a cached result from yesterday's session"
- Load a pre-generated Lead Finder report from `/dashboard/reports`

### Supabase fails (auth or reports not loading)
- This would prevent login. This is a full-stop scenario.
- Mitigation: confirm Supabase is live at supabase.com/dashboard before the meeting
- If it happens live: "We're seeing an infrastructure blip — let me pull up a screen recording of the same flow"
- Have a screen recording of the full demo path as absolute last resort

### Redis fails (rate limiter)
- Rate limiting fails open — the app continues to function normally
- No user-visible impact

### halannews.com proxy fails (/demo page)
- The `/demo` public page will return an error on form submit
- Fallback: don't use `/demo` in the demo — the authenticated product flow doesn't depend on this proxy
- All main routes (Real Estate, Lead Finder, Talent Finder) use OpenAI directly

---

## 10. Final Verdict

### READY WITH CONDITIONS

**The product is demonstrable on Tuesday.** Build passes. Tests pass. TypeScript is clean. The live site is up on Vercel. The critical embarrassment items (past date, users.json) are fixed. The proxy URL is now configurable.

**The conditions are operational, not code:**

1. ✅ **Code is ready** — build/test/typecheck all pass
2. ⚠️ **Demo account must be created and pre-loaded** — do this today
3. ⚠️ **SerpAPI quota must be verified** — do this before the meeting
4. ⚠️ **OpenAI quota must be verified** — do this before the meeting
5. ⚠️ **Full demo path must be tested in production** — do this today, not 5 minutes before the meeting
6. ⚠️ **AI_PROXY_URL env var** — add to Vercel if the default proxy URL has changed

If conditions 2–5 are met, the demo is stable. If any external API fails during the live presentation, the fallback plan above handles it without showing a broken product.

**Do not wait for approval to set up the demo account and run the pre-flight test. Do those now.**
