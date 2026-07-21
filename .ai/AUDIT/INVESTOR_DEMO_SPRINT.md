# INVESTOR DEMO SPRINT
**Optimized for a 30–60 minute investor demo**
**Based on Phase 1 Repository Reality Audit — 2026-07-07**

> This is an execution plan only. No code has been modified. Every task below is awaiting approval before implementation.

---

## Demo Context

**What we're optimizing for:** An investor sits down, you walk them through the platform for 30–60 minutes. They are technically literate. They will navigate the sidebar. They may ask to see the GitHub repo. They will ask about revenue.

**What we are NOT optimizing for:** Production launch, security hardening, Series A due diligence, feature completeness.

**Current demo readiness:** 72/100
**Post-sprint target:** 90/100

---

## P0 — Must Be Fixed Before Tomorrow
*Total estimated time: ~2.5 hours*

These are items that will actively damage credibility if left unfixed. They are the difference between a demo that impresses and a demo that raises red flags.

---

### P0.1 — Remove Debug Console Logs from Leads Route

**Why it matters:**
The most recent git commit is `31638d4 debug leads api`. It added three `console.log` statements to the production leads API route that print whether API keys are configured. The commit message itself signals the platform is currently being debugged, not polished for investors. If an investor sees the commit history or Vercel logs during the demo, this reads as instability.

**Files involved:**
- `app/api/research/leads/route.ts` — lines 1–3

**What to do:**
Delete these three lines:
```
console.log("=== LEADS API START ===")
console.log("SERPAPI:", !!process.env.SERPAPI_API_KEY)
console.log("OPENAI:", !!process.env.OPENAI_API_KEY)
```

**Estimated time:** 2 minutes

**Risk if skipped:** LOW probability of investor noticing (they'd need to see Vercel logs), but HIGH damage if they do. The commit message alone is visible on GitHub.

**Demo impact:** Removes the only evidence that the platform is currently in a debugging state.

**Investor impact:** Last commit message changes from "debug leads api" to a clean state. If they visit GitHub, they see polish instead of a debugging session.

---

### P0.2 — Hide or Redirect the Market Intelligence Sidebar Link

**Why it matters:**
Navigating to `/market-intelligence` while authenticated renders an iframe of `https://halannews.com/` — a third-party news homepage. The sidebar labels this "Market Intelligence," implying a data intelligence feature. This is the single highest-probability credibility-ending moment in the entire demo. An investor who clicks this will immediately ask "what is this?" and there is no good answer.

**Files involved:**
- `app/market-intelligence/page.tsx` — the page that renders the iframe
- Dashboard sidebar navigation component (wherever the "Market Intelligence" link is rendered)

**What to do:**
Two options (choose one):
1. **Quick fix:** Remove the nav link from the sidebar so the route is unreachable during the demo
2. **Better fix:** Redirect `/market-intelligence` → `/dashboard/analytics` (the static insights page that actually works)

**Estimated time:** 5–10 minutes

**Risk if skipped:** HIGH probability of investor clicking it (it's in the sidebar). CRITICAL damage when they do.

**Demo impact:** Eliminates the highest-risk single click in the entire demo.

**Investor impact:** Prevents "why does your AI platform show me a news website?" — a question with no clean answer.

---

### P0.3 — Replace halannews.com AI Proxy in Demo Route

**Why it matters:**
`/api/demo/generate` sends lead data to `https://halannews.com/api-proxy` to generate AI reports. This is the route that powers the exhibition demo form. Two problems: (1) it is a single point of failure — if halannews.com is unavailable, demo form submissions fail or fall back to static hardcoded text; (2) if an investor asks "how does the AI report generation work?", explaining that it routes through a third-party news website's server is architecturally unexplainable. It also raises questions about data privacy (visitor phone numbers, emails being sent to an external service).

**Files involved:**
- `app/api/demo/generate/route.ts` — lines 54–66 (the `fetch` call to halannews.com)

**What to do:**
Replace the proxy fetch with a direct OpenAI call using `OPENAI_API_KEY` (which is already configured for all other AI routes). The demo prompt logic already exists in the file — it just needs to call OpenAI directly instead of the proxy.

**Estimated time:** 1.5–2 hours (write the direct call, test the output, verify email delivery still works)

**Risk if skipped:** MEDIUM probability the proxy is fine on demo day. HIGH impact if it fails (demo form generates a static fallback report instead of a real AI one). Also HIGH impact if investor asks about architecture.

**Demo impact:** Removes a live external dependency from the demo flow. Demo form now works regardless of halannews.com status.

**Investor impact:** Removes the question "why does your AI platform depend on a news website's infrastructure?"

---

### P0.4 — Delete PHP/HTML Junk Files from Repository Root

**Why it matters:**
The repository root contains `api.php`, `auth.php`, `config.example.php`, `test.php`, `feasibility.html`, `index.html`, `text.txt`, `text 2.txt` through `text 6.txt`, and `eunoia-worker.js`. These are artifacts from a previous PHP/HTML version of the platform. If an investor browses the GitHub repository during or after the meeting, they will immediately see these files alongside the Next.js project and question the platform's maturity, history, and technical direction.

**Files involved:**
- `api.php`
- `auth.php`
- `config.example.php`
- `test.php`
- `feasibility.html`
- `index.html`
- `text.txt`, `text 2.txt`, `text 3.txt`, `text 4.txt`, `text 5.txt`, `text 6.txt`
- `eunoia-worker.js` *(verify this is not actively used before deleting)*

**What to do:**
Delete all files listed above. Commit with a message like `chore: remove legacy PHP/HTML artifacts from repo root`.

**Estimated time:** 5 minutes (plus verify `eunoia-worker.js` is not deployed to Cloudflare or referenced anywhere)

**Risk if skipped:** LOW probability of demo day impact (investor would have to actively browse GitHub). MEDIUM damage if they do.

**Demo impact:** No direct impact on the demo itself.

**Investor impact:** GitHub repo looks like a focused Next.js SaaS, not a multi-generation rebuild. Removes questions about platform maturity.

---

### P0.5 — Pre-Generate Demo Account Reports

**Why it matters:**
The dashboard homepage shows report counts. The reports history page shows all past reports. If the demo account has zero reports, both pages look empty and broken. An investor seeing "No reports yet. Generate your first report to get started" as the dashboard state is the equivalent of showing a restaurant with an empty dining room.

**Files involved:**
No code changes. This is an operational task.

**What to do:**
1. Log in to the demo account (or create a dedicated demo account)
2. Generate at least 5 reports across different types:
   - 2× Real Estate Feasibility Study (different projects, different cities)
   - 1× Campaign ROI Audit
   - 1× Lead Finder (pre-warms Redis cache — see P0.6)
   - 1× Talent Finder
3. Verify all reports appear in the Reports History page
4. Verify the dashboard stats show correct counts

**Estimated time:** 20–30 minutes

**Risk if skipped:** HIGH probability of empty state during demo. MEDIUM damage (reads as "no one uses this").

**Demo impact:** Dashboard looks like an active product with history. Reports page shows searchable archive.

**Investor impact:** Visible evidence of product usage, even if minimal.

---

### P0.6 — Pre-Warm Lead Finder Cache

**Why it matters:**
The Lead Finder pipeline makes live SerpAPI calls, fetches URLs, and runs AI analysis. On a cold cache, this can take 10–20 seconds and may hit rate limits or return 0 results if SerpAPI quota is tight. During a live demo with an investor watching, a loading spinner for 20 seconds followed by 0 results is a demo-ending moment.

**Files involved:**
No code changes. Operational task.

**What to do:**
1. Before the investor meeting, run the Lead Finder with the exact query you plan to show:
   - Recommended: industry = "Real Estate Developer", city = "New Cairo" or "Cairo", size = "51-200"
2. Confirm the results are good (5+ companies with summaries)
3. Note the exact inputs so you reproduce them exactly in the demo (Redis caches by input hash)
4. Have a backup query ready in case the first returns 0 results

**Estimated time:** 10–15 minutes

**Risk if skipped:** MEDIUM probability of slow or empty results during demo. HIGH impact on demo momentum.

**Demo impact:** Lead Finder returns results in 1–2 seconds (cache hit) instead of 15–20 seconds (cold pipeline).

**Investor impact:** Demo feels fast and confident. "This is instant" is more impressive than watching a loading spinner.

---

## P1 — Should Be Fixed This Week
*Total estimated time: ~1.5–2 days*

These items won't break the demo tomorrow, but they will come up in follow-up due diligence, a second meeting, or when the investor shares access with their technical advisor.

---

### P1.1 — Generate and Commit Supabase TypeScript Types

**Why it matters:**
The live database tables (`reports`, `research_requests`, `user_plans`, `demo_leads`) are not in the generated Supabase types. Every route that accesses these tables casts `supabase as any`, which disables TypeScript's safety checks. A technical reviewer doing code review will flag this immediately as a quality concern.

**Files involved:**
- `types/supabase.types.ts` — needs regeneration
- All route files that use `supabase as any`

**What to do:**
Run `npx supabase gen types typescript --project-id [project-id] > types/supabase.types.ts` and update route files to use the typed client.

**Estimated time:** 30–60 minutes

**Risk:** LOW for demo. MEDIUM for technical due diligence review.

**Demo impact:** None visible to investor.

**Investor impact:** If they have a technical advisor review the code post-meeting, this is a quick win that shows TypeScript discipline.

---

### P1.2 — Add Error Monitoring (Sentry)

**Why it matters:**
Currently, there is zero visibility into production errors. If a report generation fails for 10% of users, you won't know until someone emails `hello@eunoia.eg`. An investor who asks "how do you monitor production health?" needs a better answer than "Vercel function logs."

**Files involved:**
- `package.json` — add `@sentry/nextjs`
- `sentry.client.config.ts`, `sentry.server.config.ts` — new files
- `next.config.ts` — wrap with Sentry

**What to do:**
Standard Sentry Next.js integration. Configure DSN from Sentry project. Takes 30 minutes.

**Estimated time:** 30 minutes

**Risk:** None. Sentry is additive and does not change behavior.

**Demo impact:** None visible.

**Investor impact:** If asked "how do you monitor production health?", the answer becomes "we use Sentry for error tracking and Vercel for deployment monitoring" — a credible answer.

---

### P1.3 — Add SUPABASE_SERVICE_ROLE_KEY to .env.local.example

**Why it matters:**
`/api/demo/route.ts` uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS when saving demo leads. This key is not documented in `.env.local.example`. Any developer who sets up the project from the repo will experience silent failures on the demo route and spend hours debugging.

**Files involved:**
- `.env.local.example`

**What to do:**
Add `SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here` to the example file.

**Estimated time:** 2 minutes

**Risk:** None.

**Demo impact:** None.

**Investor impact:** Shows engineering discipline. A technical advisor cloning the repo to evaluate it will have a better experience.

---

### P1.4 — Commit a Clean State After P0 Work

**Why it matters:**
After completing P0 tasks, the last git commit should reflect polish and readiness — not debugging. A meaningful commit message like `chore: demo prep — remove debug logs, clean repo, remove junk files` is the last thing an investor sees when they visit the GitHub repo.

**Files involved:**
All files touched in P0 tasks.

**What to do:**
After P0 is complete, make one clean commit with a clear message. Do not have multiple small cleanup commits — squash them into one.

**Estimated time:** 5 minutes

**Risk:** None.

**Demo impact:** None visible during demo.

**Investor impact:** GitHub commit history last entry shows intentional preparation, not debugging.

---

### P1.5 — Prepare Verbal Answers for Predictable Investor Questions

**Why it matters:**
Some gaps in the platform cannot be fixed with code before the meeting. The investor will ask about them. A prepared, honest, confident answer is better than a surprised one.

**Files involved:** None. This is preparation, not code.

**Questions to prepare:**

| Question | Honest Answer |
|----------|--------------|
| "Why is this at ai.halannews.com?" | [Explain the relationship with halannews.com — connection, independence, planned decoupling] |
| "How many paying customers do you have?" | [Number of users, plans manually assigned during pilot, seeking capital to wire payments] |
| "When can you accept payment?" | "Stripe integration is 1-2 weeks. It's our first engineering priority post-funding." |
| "What's in the 'Coming Soon' modules?" | "Lead Finder and Talent Finder are live. Competitor and Supplier Intelligence are the next builds — they share the same pipeline architecture." |
| "What's the CRM?" | [Be honest — it's on the roadmap, not built] |
| "What happens if OpenAI goes down?" | "Rate limiting and caching reduce exposure. A provider fallback is on the roadmap." |

**Estimated time:** 30 minutes of preparation

**Risk:** HIGH if skipped. Unprepared answers to these questions are more damaging than the gaps themselves.

**Demo impact:** Smooth, confident Q&A after the demo.

**Investor impact:** Founders who know their own gaps and have a plan are more fundable than founders who are surprised by them.

---

## P2 — Can Wait
*Total estimated time: ~2–4 weeks*

These are real technical issues but have no impact on a 30–60 minute investor demo. Address them after funding or before Series A due diligence.

---

### P2.1 — Remove Legacy AI Engine Folder

**Why:** `services/legacy-ai-engine/` is 35+ dead prompt files. Adds confusion for any new engineer. No live route calls any of it.
**Files:** `services/legacy-ai-engine/` (entire folder)
**Estimated time:** 1 day (verify no imports, delete, test build)
**Demo/investor impact:** None visible in demo. Relevant only for code review.

---

### P2.2 — Simplify Prisma Out of Build Pipeline

**Why:** `vercel.json` and `package.json postinstall` run `prisma generate` on every deploy for a fully legacy database layer. Adds build time and complexity.
**Files:** `vercel.json`, `package.json`, `next.config.ts`
**Estimated time:** 1 day (verify nothing breaks without it, update configs)
**Demo/investor impact:** None visible. Faster builds over time.

---

### P2.3 — Stripe Integration (Plan Upgrades + Billing)

**Why:** Platform cannot collect revenue without this. Critical for business but not for tomorrow's demo.
**Files:** New files — `app/api/payment/`, `app/dashboard/settings/page.tsx`, `app/api/webhooks/stripe/`
**Estimated time:** 1–2 weeks
**Demo/investor impact:** Having a plan (vs. a built feature) is sufficient for tomorrow. Investor will fund this.

---

### P2.4 — Add Streaming to AI Responses

**Why:** Reports block the UI for up to 30 seconds on cold cache. Streaming would show partial output progressively. Better UX.
**Files:** All three AI route files + frontend components
**Estimated time:** 2 days
**Demo/investor impact:** Not needed for demo (pre-warming cache handles the wait). Relevant for live user experience.

---

### P2.5 — Replace Analytics Page with Live Market Data

**Why:** The Market Intelligence Analytics page is 18 static insight cards with a disclaimer that it is "not a live data feed." It works for a demo but is not a real product feature.
**Files:** `app/dashboard/analytics/page.tsx` — full rewrite + data provider integration
**Estimated time:** 3–4 weeks
**Demo/investor impact:** Static content is fine for tomorrow. Frame as "curated insights now, live data feed in the roadmap."

---

### P2.6 — Build Admin Panel

**Why:** Currently all admin tasks (viewing leads, assigning plans) require direct Supabase dashboard access. Not scalable.
**Files:** New — `app/admin/`
**Estimated time:** 2–3 weeks
**Demo/investor impact:** None for tomorrow. Relevant for operational scale post-investment.

---

### P2.7 — Refactor Real Estate Dashboard to Tailwind CSS

**Why:** `app/dashboard/real-estate/page.tsx` (1,111 lines) uses inline CSS and `<style>` tags. Rest of codebase uses Tailwind. Inconsistent and hard to maintain.
**Files:** `app/dashboard/real-estate/page.tsx`
**Estimated time:** 2–3 days
**Demo/investor impact:** None. UI looks fine as-is.

---

### P2.8 — GDPR Compliance Layer

**Why:** No data deletion, no privacy policy, no retention limits on demo leads. Required for EU users or enterprise contracts.
**Files:** New policy pages, new deletion APIs
**Estimated time:** 1 week
**Demo/investor impact:** None for tomorrow. Required before any EU market expansion.

---

## Summary Table

| ID | Task | Group | Time | Must-Do |
|----|------|-------|------|---------|
| P0.1 | Remove debug console.logs | P0 | 2 min | YES |
| P0.2 | Hide Market Intelligence nav link | P0 | 5 min | YES |
| P0.3 | Replace halannews.com proxy in demo route | P0 | 1.5–2 hrs | YES |
| P0.4 | Delete PHP/HTML junk files | P0 | 5 min | YES |
| P0.5 | Pre-generate demo account reports | P0 | 20–30 min | YES |
| P0.6 | Pre-warm Lead Finder cache | P0 | 10–15 min | YES |
| P1.1 | Generate Supabase TypeScript types | P1 | 30–60 min | Recommended |
| P1.2 | Add Sentry error monitoring | P1 | 30 min | Recommended |
| P1.3 | Add service role key to .env.example | P1 | 2 min | Recommended |
| P1.4 | Clean commit after P0 work | P1 | 5 min | Recommended |
| P1.5 | Prepare verbal answers for investor Q&A | P1 | 30 min | STRONGLY YES |
| P2.1 | Remove legacy AI engine folder | P2 | 1 day | No |
| P2.2 | Simplify Prisma out of build | P2 | 1 day | No |
| P2.3 | Stripe integration | P2 | 1–2 wks | No |
| P2.4 | Streaming AI responses | P2 | 2 days | No |
| P2.5 | Live market data (replace static analytics) | P2 | 3–4 wks | No |
| P2.6 | Admin panel | P2 | 2–3 wks | No |
| P2.7 | Refactor RE dashboard to Tailwind | P2 | 2–3 days | No |
| P2.8 | GDPR compliance | P2 | 1 wk | No |

**P0 total: ~2.5 hours**
**P1 total: ~1.5 hours + 30 min prep**
**P2 total: 4–6 weeks (post-funding work)**

---

## Recommended Demo Flow (After P0 Complete)

1. `/demo` — show the exhibition lead capture form (3-step, clean, complete)
2. Login → `/dashboard` — show report stats (pre-populated from P0.5)
3. `/dashboard/real-estate` — live generate a Feasibility Study (most impressive feature)
4. `/dashboard/research` → Lead Finder — run the pre-warmed query (instant results from cache)
5. `/dashboard/research` → Talent Finder — quick live query (no external dependency, fast)
6. `/dashboard/reports` — show the full reports archive (search, filter, export)
7. `/dashboard/analytics` — show market insights page (static, never fails)

**Do not navigate to:** Market Intelligence tab, Settings page, Coming Soon research modules.

---

*Plan created: 2026-07-07*
*All tasks are awaiting approval. No code has been modified.*
