# INVESTOR DEMO VALIDATION
**Mode: READ → VALIDATE — No code modified. No commits created.**
**Date: 2026-07-07**

Every claim below is backed by a file path, line number, or git command output.
Nothing is assumed.

---

## SECTION A — Validated Safe Tasks

Tasks confirmed by reading source code. Safe to execute as described.

---

### A.1 — Remove Debug Console Logs (P0.1)
**Verdict: SAFE — but the audit had a minor factual error about attribution**

**What was verified:**

Three console.log statements exist at lines 1–3 of `app/api/research/leads/route.ts`:
```
line 1: console.log("=== LEADS API START ===")
line 2: console.log("SERPAPI:", !!process.env.SERPAPI_API_KEY)
line 3: console.log("OPENAI:", !!process.env.OPENAI_API_KEY)
```
Evidence: Direct file read confirmed.

**Factual correction on attribution:**

The sprint plan says "the most recent git commit added these." That is incorrect.

`git show 31638d4 --stat` reveals the last commit (`debug leads api`) only touched `app/api/debug-env/route.ts` (clearing it to an empty file). It did NOT touch `leads/route.ts`.

`git blame app/api/research/leads/route.ts -L 1,5` shows the console.logs were added in commit `89b98929` (June 18, 19:31), which precedes the last commit by two minutes and 2 commits. The actual commit message for the debug logs was: `"Add logging for LEADS API initialization"`.

So the logs have been in production through 13+ subsequent commits, including two security-fix commits. This makes it slightly worse than described — it was not an oversight from today's last commit, it was deliberate and persistent.

**Behavior nuance worth knowing:**

The three console.logs are at module scope (lines 1–3, before any `import` statements). In Next.js serverless functions, module-scope code runs once per cold start, not once per request. They still fire in production and are visible in Vercel function logs, but they do not log on every API call.

The logged values are `!!process.env.SERPAPI_API_KEY` (a boolean) — they reveal whether the keys are set, not the key values themselves.

**Recommendation confirmed:** Remove lines 1–3 of `app/api/research/leads/route.ts`. No other changes needed. Zero side effects.

**One additional log found (not in sprint plan):**

`app/api/demo/generate/route.ts` line 245:
```typescript
console.log('[demo-lead]', { name, phone, email, company, sector, city, ts: new Date().toISOString() })
```
This log prints PII (name, phone number, email) on every demo form submission to server logs. This is a privacy concern beyond just log hygiene. It should be removed at the same time.

---

### A.2 — Pre-Generate Demo Account Reports (P0.5)
**Verdict: SAFE — but has a blocking prerequisite not mentioned in the sprint plan**

**What was verified:**

The dashboard page (`app/dashboard/page.tsx`) reads from `supabase.from('reports')` scoped to `user.id`. If zero reports exist, it shows:
```
"No reports yet"
"Generate your first report from Real Estate or Research Intelligence"
```
Evidence: `app/dashboard/page.tsx` lines 112–121.

The reports page (`app/dashboard/reports/reports-client.tsx`) similarly reads live from Supabase.

**Blocking prerequisite found (not in sprint plan):**

`app/dashboard/layout.tsx` lines 13–21:
```typescript
const dbUser = await prisma.user.findUnique({ where: { email: user.email ?? '' } })
if (!dbUser && user.email) {
  redirect('/dashboard/onboarding')
}
```

Every protected dashboard route passes through this layout. If the demo account does not have a Prisma `User` row, the investor will be redirected to an onboarding form asking for a "workspace name" instead of the dashboard.

The Prisma row is created via `/api/users/init` which is called by the onboarding page. If the demo account was created directly in Supabase without going through the onboarding flow, it will not have a Prisma row and will be stuck in onboarding during the demo.

**Before pre-generating reports, verify:**
1. Log in to the demo account
2. If you land on `/dashboard/onboarding` instead of `/dashboard`, complete the onboarding first
3. Only then proceed to generate demo reports

---

### A.3 — Pre-Warm Lead Finder Cache (P0.6)
**Verdict: SAFE — cache mechanism verified**

**What was verified:**

Cache is Upstash Redis with a 24-hour TTL for research results.
Evidence: `lib/redis/cache.ts` — `CACHE_TTL.REPORT: 86400`

Cache key construction in `lib/research/acquisition/research-service.ts` lines 50–53:
```typescript
function buildQueryHash(input: RunResearchInput): string {
  const { userId, ...cacheable } = input
  const payload = JSON.stringify(cacheable)
  return crypto.createHash('sha256').update(payload).digest('hex')
}
```

The `userId` is explicitly excluded from the cache hash. Cache key = `research:acquisition:{sha256-of-query-params-without-userId}`.

**What this means for pre-warming:**

The exact same inputs from any user (or from a pre-warm run) will hit the same cache entry. Warm it with the exact query, sector hint, city hint, company size, and maxResults you plan to use in the demo. If any single parameter differs, it is a cache miss.

The research pipeline on a cold cache involves: SerpAPI search + multiple HTTP fetches + AI analysis. Can take 15–30 seconds. On a cache hit, the entire pipeline is bypassed and the result returns in under 1 second.

Cache survives for 24 hours. Pre-warming the evening before or morning of the demo is sufficient.

**No code changes needed.** Operational task only.

---

## SECTION B — Unsafe Tasks

Tasks that contain material errors, hidden risks, or undiscovered issues that require correction before execution.

---

### B.1 — Delete PHP/HTML Junk Files (P0.4)
**Verdict: UNSAFE AS DESCRIBED — contains a live API key**

The sprint plan describes this as a cosmetic cleanup. It is not cosmetic. `test.php` contains a hardcoded Anthropic API key committed in plaintext.

**Evidence:**

`test.php` line 4:
```php
$API_KEY = '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';
```

This is an Anthropic API key in the format `sk-ant-api03-*`. It is committed to the repository and visible in git history. Deleting the file removes it from the working tree but the key remains in `git log` forever unless the history is rewritten.

**Actions required before deletion:**

1. **Revoke this key immediately** in the Anthropic console — regardless of whether it has already expired or been rotated. If it is still active, anyone with repository access can use it.
2. If the GitHub repository is public or has been shared with any external party, treat this as a security incident (key exposure).
3. After revoking the key, the file can be safely deleted.

**Full file status (confirmed by read + grep):**

| File | Size | References from app code | References to external systems | Decision |
|------|------|--------------------------|-------------------------------|---------|
| `test.php` | 1KB | None | Hardcoded API key + Anthropic API | DELETE — but revoke key first |
| `api.php` | 2.9KB | None | Anthropic claude-sonnet-4-5 via PHP | SAFE TO DELETE |
| `auth.php` | 1.8KB | None | Reads local `users.json` | SAFE TO DELETE |
| `config.example.php` | 186B | None | Placeholder key only | SAFE TO DELETE |
| `index.html` | 452KB | None (from app code) | `https://halannews.com/api-proxy` | SAFE TO DELETE |
| `feasibility.html` | 157KB | None (from app code) | `https://halannews.com/api-proxy` | SAFE TO DELETE |
| `text.txt` | 63B | None | ChatGPT share URL | SAFE TO DELETE |
| `text 2.txt` through `text 6.txt` | 63B–28KB | None | ChatGPT URLs, AI prompts | SAFE TO DELETE |
| `eunoia-worker.js` | 7.2KB | None (from app code) | OpenAI API (designed for Cloudflare Workers) | SAFE TO DELETE (read below) |

**Additional context on `index.html` and `feasibility.html`:**

These are not blank placeholder files. `index.html` is 452KB — a complete functional HTML application with authentication, admin panel, report generation, and API calls. `feasibility.html` is 157KB with a full feasibility calculator. Both call `halannews.com/api-proxy` for AI generation. They represent the previous version of the entire product.

From a Next.js deployment perspective (Vercel, `.next` output directory), these HTML files in the repo root are irrelevant — Vercel deploys the Next.js build, not static files in the root unless explicitly configured. `vercel.json` does not route any path to these files. They are not served by the running application.

**Additional context on `eunoia-worker.js`:**

This is a self-contained Cloudflare Workers script. It:
- Accepts `{ prompt, social_links }` as input
- Scrapes website and Facebook URLs
- Calls OpenAI GPT-4o-mini (uses `env.OPENAI_KEY` from Cloudflare environment)
- Returns JSON in the same `{ content: [{ type: 'text', text }] }` format as the Anthropic API

This worker is the backend infrastructure for the old halannews.com/api-proxy endpoint. The current demo route (`app/api/demo/generate/route.ts`) calls this proxy and expects either an Anthropic response shape (`data?.content?.[0]?.text`) or an OpenAI response shape (`data?.choices?.[0]?.message?.content`). The worker returns an OpenAI-shaped response.

No active Next.js code imports or references this file. It is a deployment artifact meant to be uploaded to Cloudflare Workers separately. Safe to delete from the repo — but do not accidentally deploy a new version of the worker while this file is in its current state.

**Corrected sprint plan action for P0.4:**

1. Revoke `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` in Anthropic console NOW
2. After confirmed revocation, delete all files listed above
3. Commit with a clear message

---

### B.2 — Hide Market Intelligence Navigation (P0.2)
**Verdict: UNSAFE AS DESCRIBED — the stated problem does not exist where specified**

The sprint plan says: "The sidebar labels this 'Market Intelligence,' implying a data intelligence feature. This is the single highest-probability credibility-ending moment in the entire demo."

This is incorrect about the sidebar. Verification:

`components/dashboard/sidebar.tsx` lines 8–15:
```typescript
const NAV = [
  { href: '/dashboard',             label: 'Dashboard',           icon: BarChart3, exact: true },
  { href: '/dashboard/reports',     label: 'Reports',             icon: FileText },
  { href: '/dashboard/real-estate', label: 'Real Estate',         icon: Building2 },
  { href: '/dashboard/research',    label: 'Research Intelligence', icon: Search },
  { href: '/dashboard/analytics',   label: 'Market Intelligence', icon: TrendingUp },
  { href: '/dashboard/settings',    label: 'Settings',            icon: Settings },
]
```

The sidebar link labeled "Market Intelligence" points to `/dashboard/analytics` — the static curated insights page, which works correctly and is demo-safe.

The iframe route (`/market-intelligence`) is **NOT linked from the sidebar, NOT linked from the dashboard module cards, and NOT accessible through any standard navigation flow**.

The iframe page is only reachable if an investor:
1. Manually types `ai.halannews.com/market-intelligence` in the address bar while authenticated, OR
2. Is referred there by an internal link (none exist in the active codebase)

**The real issue this task intended to fix:**

`app/page.tsx` line 11:
```typescript
if (user) {
  redirect('/dashboard')
} else {
  redirect('/market-intelligence')
}
```

Unauthenticated visitors to the root are sent to `/market-intelligence`, which then redirects them to `/login`. They never see the iframe (the auth check in the market-intelligence page catches them first). But this means the URL bar briefly shows `/market-intelligence` before the login redirect, which could prompt questions if an investor sees it.

**Revised assessment:**

The original risk is nearly zero. The iframe page is an orphaned route with no nav links. An investor watching a guided demo has essentially no path to it.

However, two low-risk items remain worth addressing:
1. The root page redirect for unauthenticated users goes to `/market-intelligence` instead of `/login` directly — this is slightly confusing and worth a one-line fix
2. The `/market-intelligence` route still exists and could be reached manually

**If you want to eliminate all risk:**
Change `app/page.tsx` line 11 to `redirect('/login')` instead of `redirect('/market-intelligence')`. This removes the only code path that touches the iframe route for any normal user. Estimated time: 30 seconds.

This does NOT require hiding a sidebar link (there is none to hide) or any multi-file change.

---

## SECTION C — Tasks Requiring Manual Approval Before Execution

Items that require a human decision the code cannot answer, or items that depend on external systems.

---

### C.1 — Revoke Hardcoded API Key in test.php
**Requires: Anthropic console access**

A live (or formerly live) Anthropic API key is in `test.php` line 4. This key must be checked for activity and revoked regardless of file deletion. This action requires:
- Access to the Anthropic API console
- Identifying this key: `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`
- Checking its usage log
- Revoking it

Cannot be done without credentials. No code fix can retroactively address this — the key is in git history.

**If the repository is public:** This is a security incident. The key should be treated as compromised from the date of the commit (June 18, 2026). Revoke and rotate immediately.

---

### C.2 — halannews.com Proxy — Replace or Keep
**Requires: Architectural decision from the founder**

The sprint plan recommends replacing the proxy with a direct OpenAI call ("use the existing OPENAI_API_KEY"). This is factually incorrect about what the proxy does.

**What was verified:**

`app/api/demo/generate/route.ts` lines 54–62:
```typescript
const res = await fetch('https://halannews.com/api-proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-opus-4-8',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  }),
})
```

The proxy is called with `model: 'claude-opus-4-8'` — this is Anthropic Claude, not OpenAI. The `OPENAI_API_KEY` cannot service this call directly.

**What the proxy actually is:**

`eunoia-worker.js` (the Cloudflare Worker in the repo root) is the proxy backend. It accepts a prompt, scrapes URLs, and calls OpenAI GPT-4o-mini. The response format it returns (`{ content: [{ type: 'text', text }] }`) mimics the Anthropic SDK response format. The demo route handles both response shapes:
```typescript
data?.content?.[0]?.text ?? data?.choices?.[0]?.message?.content ?? '{}'
```

`api.php` in the repo root is an alternative PHP implementation that calls the real Anthropic API (`claude-sonnet-4-5`). The halannews.com server likely runs this PHP backend.

**Risks of keeping the proxy:**
- External single point of failure — if halannews.com is unavailable, the demo route falls back to hardcoded text (the fallback IS present in the route, lines 207–228)
- Data privacy: user-submitted demo lead data (company name, sector, city) is sent to an external server
- Architecturally unexplainable to investors ("your AI platform calls a news website to generate AI reports")

**Risks of replacing the proxy:**
- The demo route currently calls Claude claude-opus-4-8. Replacing with direct OpenAI uses GPT-4o-mini instead — different model, different output quality
- Alternatively: adding `ANTHROPIC_API_KEY` to the environment and using the Anthropic SDK directly is ~2 hours of work
- Neither option breaks the fallback (which still exists in the code regardless)

**Decision required from founder:**
1. Keep proxy + rely on fallback (lowest effort, highest residual risk)
2. Replace with direct OpenAI GPT-4o-mini (fast, uses existing key, slight quality change)
3. Replace with direct Anthropic Claude (requires new API key in env, best quality parity)

The sprint plan's stated approach (option 2) is achievable but misidentifies it as a 1-to-1 swap of the existing OpenAI key. It requires no new key, just different code — but output quality will differ.

---

### C.3 — Demo Account State Verification
**Requires: Access to the live demo account**

Before pre-generating reports (P0.5), the demo account must be verified to have:

1. A valid Supabase `auth.users` record
2. A Prisma `User` record in the PostgreSQL database (otherwise dashboard → onboarding redirect)
3. A row in `user_plans` table (defaults to STARTER automatically if absent — this is fine)
4. No pending rate limit blocks in Redis
5. Fewer than 20 existing reports this month (otherwise plan limit hit during demo)

None of these can be verified from the code. Requires Supabase dashboard access and a test login.

**If no dedicated demo account exists:** Create one fresh, complete the onboarding flow (which creates the Prisma row), then generate reports. Do not use a real user account.

---

## SECTION D — Recommended Execution Order

Execute in this exact sequence. Each step is blocked by the one before it.

```
STEP 1 (Immediate — no deploy needed)
→ Revoke the Anthropic API key in test.php via Anthropic console
→ Evidence: test.php line 4
→ Time: 5 minutes

STEP 2 (Code change — leads/route.ts)
→ Delete lines 1–3 of app/api/research/leads/route.ts (the three console.logs)
→ While there: also delete line 245 of app/api/demo/generate/route.ts (PII log)
→ Time: 5 minutes

STEP 3 (Code change — page.tsx)
→ Change app/page.tsx line 11: redirect('/market-intelligence') → redirect('/login')
→ Time: 30 seconds

STEP 4 (Architectural decision — founder must decide)
→ Choose proxy replacement approach (C.2 above)
→ If replacing: implement and test the new demo route AI call
→ If keeping: confirm the fallback is acceptable for demo day
→ Time: 30 minutes decision + 2 hours implementation if replacing

STEP 5 (File deletion — after key is confirmed revoked)
→ Delete all listed files: test.php, api.php, auth.php, config.example.php, 
  index.html, feasibility.html, text.txt, text 2.txt–text 6.txt, eunoia-worker.js
→ Time: 5 minutes

STEP 6 (One commit)
→ Commit all changes from Steps 2–5 with message:
  "chore: demo prep — remove debug logs, clean legacy files, fix root redirect"
→ Time: 5 minutes

STEP 7 (Operational — no code)
→ Verify demo account exists and has completed onboarding (C.3 above)
→ Log in, confirm you reach /dashboard (not /dashboard/onboarding)
→ Time: 15 minutes

STEP 8 (Operational — no code)
→ Pre-generate 5 reports on demo account (2× real estate, 1× campaign ROI, 1× lead finder, 1× talent)
→ Note: the lead finder run in this step will warm the cache for Step 9
→ Time: 20–30 minutes

STEP 9 (Operational — cache verification)
→ Run the Lead Finder again with your exact demo query (same inputs as Step 8 lead run)
→ Verify it returns in under 2 seconds (cache hit) vs 15–20 seconds (miss)
→ Time: 5 minutes
```

---

## SECTION E — Revised Time Estimates

| Task | Sprint Plan Estimate | Validated Estimate | Notes |
|------|--------------------|--------------------|-------|
| Revoke API key | Not in sprint plan | 5 min | Requires Anthropic console |
| Remove 3 debug console.logs | 2 min | 5 min | Also remove PII log in demo/generate route |
| Fix root page redirect | 5–10 min (wrong fix) | 30 sec | One-line change to page.tsx |
| Proxy decision (keep/replace) | 1.5–2 hrs | 30 min + 0–2 hrs | Depends on architectural choice |
| Delete junk files | 5 min | 10 min | Allow time to confirm key revoked first |
| One clean commit | 5 min | 5 min | |
| Demo account verification | 15 min | 20 min | Includes onboarding check |
| Pre-generate reports | 20–30 min | 30 min | Includes potential onboarding |
| Cache pre-warm + verify | 10–15 min | 15 min | |
| **TOTAL** | **~2.5 hours** | **~2–3 hours** | Excluding proxy replacement if chosen |

---

## SECTION F — Findings Not in the Sprint Plan

These items were discovered during validation and are not addressed anywhere in the sprint plan. They are documented here for awareness.

### F.1 — CRITICAL: Hardcoded API Key in test.php
**Not mentioned in sprint plan.** The sprint plan treats `test.php` as cosmetic junk. It contains a real Anthropic API key. See Section B.1 and C.1 above.

### F.2 — MEDIUM: PII Logged on Every Demo Form Submission
`app/api/demo/generate/route.ts` line 245 logs visitor name, phone, and email to server logs on every exhibition form submission. Not in sprint plan. Should be removed alongside the P0.1 console.log cleanup.

### F.3 — LOW: Root Page Redirects Unauthenticated Users to Wrong Route
`app/page.tsx` line 11 redirects unauthenticated visitors to `/market-intelligence` instead of `/login`. The iframe is never shown (the market-intelligence page catches unauthenticated users and redirects to login), but the URL briefly shows `/market-intelligence` in the browser. A one-line fix. Not in sprint plan but the actual correction needed for the P0.2 concern.

### F.4 — MEDIUM: Dashboard Prisma Check is a Demo Blocker
`app/dashboard/layout.tsx` checks for a Prisma `User` record on every dashboard load. New accounts without this record hit an onboarding redirect. If the demo account was not properly initialized, the investor sees a "Set up your workspace" form instead of the dashboard. Not mentioned in the sprint plan.

### F.5 — INFORMATIONAL: eunoia-worker.js is the halannews.com Proxy Backend
The `eunoia-worker.js` in the repo root is the Cloudflare Worker that powers `halannews.com/api-proxy`. It calls OpenAI GPT-4o-mini and returns an Anthropic-shaped response. The `api.php` is a PHP alternative that calls the real Anthropic API. The `index.html` and `feasibility.html` are prior versions of the full product. These files tell the story of the platform's evolution.

---

*Validation complete. No code was modified. No commits were created. Awaiting approval before any execution.*
