# EXHIBITION_CHECKLIST.md
## Eunoia Research Intelligence Platform — Operational Readiness
**Platform:** https://ai.halannews.com  
**Prepared:** 2026-07-12

---

## SECTION 1 — Manual Checks Before Leaving for the Exhibition

Complete all of these in the days before the event, not the morning of.

---

### 1.1 — Verify every required Vercel environment variable is set

**Estimated time:** 10 minutes  
**Responsible:** Developer (technical lead)  
**How:** Vercel dashboard → Project → Settings → Environment Variables  
**Expected result:** Every variable below shows a value for Production

| Variable | Required | Used by | Fail behavior if missing |
|----------|----------|---------|--------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | YES | Auth, all DB reads | Login page breaks entirely |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` | YES (one of these) | Auth client | Login page breaks entirely |
| `SUPABASE_SERVICE_ROLE_KEY` | YES | Demo lead capture `/api/demo` | Public demo form fails silently |
| `DATABASE_URL` | YES | Prisma / workspace init | `/api/workspace` and `/api/users/init` return 500 |
| `DIRECT_URL` | YES | Prisma migrations | Same as above |
| `OPENAI_API_KEY` | YES | Real Estate Intelligence, Talent Finder | Report generation returns 500 |
| `SERPAPI_API_KEY` | YES | Lead Finder | Lead Finder returns "SerpAPI not configured" error |
| `UPSTASH_REDIS_REST_URL` | YES | Rate limiting, search quota, report cache | Fails open — app works but no rate limiting or caching |
| `UPSTASH_REDIS_REST_TOKEN` | YES | Same as above | Same as above |
| `RESEND_API_KEY` | YES | Demo email delivery `/api/demo/generate` | Email not sent, but form still shows success |
| `AI_PROXY_URL` | NO | Public demo `/api/demo/generate` | Defaults to `https://halannews.com/api-proxy` |
| `APOLLO_API_KEY` | NO | Lead Finder enrichment | No-op — enrichment step skipped silently |
| `SEARCH_DAILY_QUOTA` | NO | SerpAPI daily budget | Defaults to 150 searches/day |
| `SEARCH_DAILY_QUOTA_PER_USER` | NO | Per-user SerpAPI budget | Defaults to 30 searches/day per user |

**Fallback if missing variables are found:** Add the missing variable in Vercel, trigger a new deployment, wait for it to complete, then re-run the full demo flow test before the event.

---

### 1.2 — Create and configure the demo account

**Estimated time:** 20 minutes  
**Responsible:** Developer  
**How:**
1. Go to Supabase dashboard → project `mickjkhjjmskoswqatpl` → Authentication → Users
2. Create a new user with a memorable email (e.g. `demo@eunoia.eg`) and a known password — write both down
3. Log in to `ai.halannews.com` with those credentials
4. If redirected to `/dashboard/onboarding`, complete workspace setup
5. Confirm `/dashboard` loads with the user's name in the greeting

**Expected result:** Successful login → `/dashboard` with correct greeting and empty stats  
**Fallback if creation fails:** Use an existing Supabase user account that is known to work

---

### 1.3 — Pre-generate demo reports (critical)

**Estimated time:** 30 minutes  
**Responsible:** Developer or Founder  
**How:** Logged in as demo account on `ai.halannews.com`:

1. Go to `/dashboard/real-estate` → select **Feasibility Study**
   - Project: `كمبوند النيل بالقاهرة الجديدة` | Units: 200 | Unit area: 120 m² | Sell price: 50,000 EGP/m²
   - Land cost: 50,000,000 EGP | Build cost: 22,000 EGP/m² | Down payment: 20% | Build: 48 months
   - Generate and confirm report renders completely including P&L table, ROI, and scenarios
   - Save this report — it is the primary demo artifact

2. Go to `/dashboard/research/talent`
   - Job title: Performance Marketing Manager | Location: Cairo | Industry: Real Estate | Experience: 3-5 years
   - Skills: Meta Ads, Google Ads, Arabic copywriting
   - Generate and confirm salary range, demand level, and sources appear

3. Go to `/dashboard/research/leads`
   - Industry: Real Estate | Location: New Cairo | Company size: 50-200 | Titles: CEO, Marketing Director
   - Generate and confirm at least 3 companies appear with source URLs and LinkedIn links
   - If 0 results, try a different industry (e.g. Restaurant) or location (e.g. Cairo)

4. Go to `/dashboard/reports` — confirm all 3 reports appear in the list

**Expected result:** `/dashboard/reports` shows at least 3 pre-generated reports with correct types and dates  
**Fallback:** If real-time generation fails during rehearsal, record a video of a successful run to use as backup

---

### 1.4 — Verify SerpAPI quota balance

**Estimated time:** 5 minutes  
**Responsible:** Developer  
**How:** Log in to serpapi.com → Account → Usage dashboard  
**Expected result:** At least 50 searches remaining in the current billing period (default quota is 150/day)  
**Fallback if quota is exhausted:** Purchase additional searches or upgrade the plan before the event. Alternatively, remove Lead Finder from the demo flow and rely on pre-generated reports.

---

### 1.5 — Verify OpenAI quota and billing

**Estimated time:** 5 minutes  
**Responsible:** Developer  
**How:** Log in to platform.openai.com → Usage → check spend vs. hard limit  
**Expected result:** Account is not near its spending limit and has no active billing holds  
**Fallback if blocked:** Top up OpenAI credits before the event

---

### 1.6 — Verify Resend API key and sender domain

**Estimated time:** 5 minutes  
**Responsible:** Developer  
**How:** Log in to resend.com → check the API key status and that `eunoia.zone` domain is verified  
**Expected result:** API key is active; `reports@eunoia.zone` sender shows as verified  
**Fallback if unverified:** The demo form at `/demo` will still show success to the user — email delivery fails silently. This is acceptable for the exhibition.

---

### 1.7 — Confirm the AI proxy is responding (for /demo page only)

**Estimated time:** 2 minutes  
**Responsible:** Developer  
**How:** Open browser, go to `https://ai.halannews.com/demo`, fill in test data, submit  
**Expected result:** Step 3 (success screen) appears within 10–15 seconds, confirmation email arrives  
**Fallback if proxy is down:** Do not use `/demo` in the live presentation. Show the authenticated product flow only. The main product routes (Real Estate, Lead Finder, Talent Finder) do not depend on this proxy.

---

### 1.8 — Test the complete demo flow in production (full dress rehearsal)

**Estimated time:** 20 minutes  
**Responsible:** Founder + Developer, together  
**How:** Open `https://ai.halannews.com` in a fresh private/incognito window. Do not use localhost.
- Log in with demo credentials → verify dashboard loads
- Open `/dashboard/reports` → verify pre-generated reports appear
- Open one report → expand it → verify content is correct
- Open `/dashboard/real-estate` → generate a live Feasibility Study → verify report renders
- Open `/dashboard/research/talent` → run a query → verify result renders
- Open `/dashboard/research/leads` → run a query → verify companies appear
- Open `/dashboard/analytics` → verify content loads
- Sign out → verify redirect to login

**Expected result:** All steps complete without errors. Full flow takes under 5 minutes.  
**Fallback:** If any step fails, diagnose and fix before the event. Do not proceed to the exhibition with an untested flow.

---

## SECTION 2 — Manual Checks on Tuesday Morning

Do these at least 2 hours before the first demo, not 10 minutes before.

---

### 2.1 — Confirm the live site is responding

**Estimated time:** 2 minutes  
**Responsible:** Founder  
**How:** Open `https://ai.halannews.com/login` in a browser on the event device  
**Expected result:** Login page loads within 3 seconds  
**Fallback:** If the page is down, check Vercel status (vercel.com/status) and the deployment log. If a recent deployment failed, roll back to the previous deployment from the Vercel dashboard.

---

### 2.2 — Confirm demo account login still works

**Estimated time:** 2 minutes  
**Responsible:** Founder  
**How:** Log in to `ai.halannews.com` with demo credentials on the event device  
**Expected result:** Successful login, `/dashboard` loads with the pre-generated reports visible  
**Fallback:** If password is rejected, use Supabase dashboard → Auth → Users → reset the demo account's password and update your notes

---

### 2.3 — Confirm pre-generated reports are still in the system

**Estimated time:** 2 minutes  
**Responsible:** Founder  
**How:** Navigate to `/dashboard/reports` while logged in as demo account  
**Expected result:** At least 3 reports (Feasibility Study, Talent Finder, Lead Finder) appear in the list  
**Fallback:** If reports are missing, generate them again now — allow 15 minutes

---

### 2.4 — Check SerpAPI quota remaining for today

**Estimated time:** 2 minutes  
**Responsible:** Developer (remote check acceptable)  
**How:** serpapi.com → Account → today's usage  
**Expected result:** At least 30 searches remaining (default per-user daily limit is 30)  
**Fallback:** If quota is at zero, remove Lead Finder from today's live demo. Use the pre-generated lead report from `/dashboard/reports` instead.

---

### 2.5 — Load the dashboard on the event device and leave it logged in

**Estimated time:** 1 minute  
**Responsible:** Founder  
**How:** Log in on the laptop/device being used for the demo. Keep the tab open and the screen from locking.  
**Expected result:** Dashboard is visible, no session timeout during the event  
**Fallback:** If the session expires between demos, re-login immediately — it takes under 20 seconds

---

## SECTION 3 — Checks 15 Minutes Before the First Demo

Stand-up checks only. If anything fails here, switch to the pre-generated report fallback immediately — do not debug live.

---

### 3.1 — Reload the dashboard tab

**Estimated time:** 30 seconds  
**Responsible:** Founder  
**How:** Press Cmd+R (or Ctrl+R) on the dashboard tab  
**Expected result:** Dashboard reloads, shows user greeting, report counts, recent reports  
**Fallback:** If it shows login page, re-login. If it shows an error, navigate directly to `/dashboard/reports`.

---

### 3.2 — Confirm the pre-generated Feasibility Study is accessible

**Estimated time:** 1 minute  
**Responsible:** Founder  
**How:** Click `/dashboard/reports` → click the Feasibility Study entry to expand it  
**Expected result:** Report data expands showing executive summary, financials, and verdict  
**Fallback:** If empty or errored, navigate to `/dashboard/real-estate` and generate a new one now (allow 60 seconds for AI response)

---

### 3.3 — Run a 30-second live API health check

**Estimated time:** 1 minute  
**Responsible:** Founder  
**How:** Go to `/dashboard/research/talent` → enter any job title → click generate → watch for response  
**Expected result:** Report begins generating within 3 seconds, result appears within 15 seconds  
**Fallback:** If it times out or errors, note "Live API is currently slow" and plan to show only pre-generated reports during this demo slot

---

### 3.4 — Prepare the browser

**Estimated time:** 2 minutes  
**Responsible:** Founder  
- Close all unrelated tabs
- Set browser zoom to 90% (wider view of the dashboard)
- Keep the following tabs ready: `/dashboard`, `/dashboard/reports`, `/dashboard/real-estate`, `/dashboard/research/leads`, `/dashboard/research/talent`, `/dashboard/analytics`
- Turn off browser notifications
- Silence the device

---

## SECTION 4 — Emergency Recovery Procedures

---

### 4.1 — OpenAI Fails

**Symptoms:** Real Estate Intelligence or Talent Finder returns an error message or spins indefinitely

**Estimated recovery time:** 0 minutes (switch to fallback immediately)  
**Responsible:** Founder — do not wait for developer to diagnose

**Recovery steps:**
1. Do not retry the failed request live. Close the form or navigate away.
2. Open `/dashboard/reports` — the pre-generated Feasibility Study is there.
3. Say: *"Let me show you a report generated from our pre-loaded demo account — same flow, same output."*
4. Expand the pre-generated report and walk through the structured AI analysis.
5. Continue the demo using only pre-generated reports for the remainder of the session.

**Expected result:** Demo continues without visible failure. Investor sees real report output.  
**Talking point:** *"In production, reports are cached after the first generation — this is an actual platform feature, not a demo workaround."*

---

### 4.2 — SerpAPI Fails

**Symptoms:** Lead Finder shows "Search provider error" or "Daily search quota exhausted"

**Estimated recovery time:** 0 minutes (skip the feature)  
**Responsible:** Founder

**Recovery steps:**
1. Do not retry. Navigate away from the Lead Finder form.
2. Open `/dashboard/reports` — the pre-generated Lead Finder report is there.
3. Expand it and walk through the company list, confidence scores, source URLs, and LinkedIn links.
4. Say: *"Here's the output from a Lead Finder run I did earlier this week — same query format."*
5. Describe the pipeline verbally: *"This runs SerpAPI → URL collection → validation → deduplication → AI summarization. Nothing in this list is invented."*

**Expected result:** Investor understands what Lead Finder does and sees real output.  
**Talking point if asked why it's not running live:** *"We hit our daily search quota — we pre-ran a few queries this morning to prepare the demo."* (Only say this if it's true. If the key is missing or the account is suspended, say *"The live search API is currently unavailable — let me show you a pre-generated result."*)

---

### 4.3 — Supabase Fails

**Symptoms:** Login page shows an error; dashboard shows blank or "error loading data"; reports don't load

**Estimated recovery time:** 5–10 minutes if the issue is transient  
**Responsible:** Developer (remotely) + Founder

**Recovery steps:**
1. Immediately check `status.supabase.com` on a phone. If there is an active incident, this is a Supabase-side outage — not a code issue.
2. If an outage is confirmed: apologize briefly, say *"There appears to be a third-party infrastructure issue"* and switch to a screen recording.
3. If no outage is shown: check Vercel deployment logs (Developer does this remotely). The env var `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` may have changed or been deleted.
4. If login works but reports don't load: navigate to `/dashboard/analytics` — the Market Intelligence Hub loads from static code only and has zero Supabase dependency. Use it as a talking point while the issue is diagnosed.
5. Developer remote fix: if a missing env var is identified, add it in Vercel and redeploy (takes 2–3 minutes).

**Absolute fallback:** Screen recording of the full demo flow prepared in advance. If Supabase is fully down, say: *"Let me walk you through this on the recording — the live environment will be back shortly."*

**Talking point:** *"Our auth and data layer run on Supabase — a managed, enterprise-grade Postgres platform. Outages are rare; they publish an SLA at status.supabase.com."*

---

### 4.4 — Redis (Upstash) Fails

**Symptoms:** None visible. Redis failure is transparent to the user.

**Estimated recovery time:** 0 minutes — no action needed  
**Responsible:** Nobody — the app handles this automatically

**What actually happens:** Every rate-limit check and quota check in the codebase has an explicit `catch` that returns `{ ok: true }` — the fail-open pattern. If Redis is unreachable, all requests are allowed through. Report caching is also disabled, meaning each request calls OpenAI or SerpAPI fresh instead of serving a cached result.

**Expected result:** The platform functions normally. Users may see slightly slower responses if heavy caching was being used.  
**No action required during the demo.**

---

### 4.5 — AI Proxy (halannews.com/api-proxy) Fails

**Symptoms:** The public `/demo` page form submits, spins, then shows an error  
**Note:** This proxy is used ONLY by the public `/demo` page. It does NOT affect the authenticated product.

**Estimated recovery time:** 0 minutes (avoid the page)  
**Responsible:** Founder — do not attempt to debug

**Recovery steps:**
1. Do not use the `/demo` page at all during this demo slot.
2. If you were planning to show the public demo flow to capture a lead live, skip it.
3. Explain: *"Our lead capture form sends an AI-generated report via email. I'll send you one after the session with your company details."*
4. After the meeting, generate the email report manually or directly through the authenticated product, and send it to the contact.

**The authenticated product (login → dashboard → reports → real-estate → research) is completely unaffected by this proxy.**

---

*This checklist covers all verified environment variables and flows from direct source code inspection.*  
*Every fallback described here requires zero code changes — they are operational switches only.*
