# Security Audit

**Score: 28 / 100**

> EVIDENCE CLASSIFICATION: Every finding is marked PROVEN / HIGHLY LIKELY / POSSIBLE / UNKNOWN.

---

## CRITICAL — Stop-Ship

### SEC-01: `users.json` — Committed Bcrypt Password Hashes [PROVEN]

**File:** `users.json` (tracked: `git ls-files | grep users.json` → confirmed)  
**Content:**
```json
{
  "islam.admin":   { "password_hash": "$2y$10$klc9...", "role": "admin", "active": true },
  "eunoia.sales":  { "password_hash": "$2y$10$avlx...", "role": "sales", "active": true },
  "eunoia.viewer": { "password_hash": "$2y$10$urIF...", "role": "viewer", "active": true }
}
```
**Risk:** bcrypt work-factor 10. Hashes are offline-crackable by any actor with repo access. If these passwords were reused on Supabase, OpenAI, Resend, Upstash, or any external service, credential stuffing is the immediate attack path.  
**What `git rm` does NOT fix:** the hashes remain in every historical commit. Cloning or running `git log -p` will expose them forever until history is rewritten.  
**Fix:**
1. Disable/rotate the three accounts on any system where these credentials were reused (this must be confirmed before step 2).
2. Remove from git history via `git filter-repo --path users.json --invert-paths` or BFG Repo-Cleaner.
3. Force-push rewritten history and invalidate any cached clones.
4. Add `users.json` to `.gitignore`.

---

### SEC-02: All AI Calls Routed Through External Proxy `halannews.com/api-proxy` [PROVEN]

**Evidence:**  
- `app/api/demo/generate/route.ts:60`: `fetch('https://halannews.com/api-proxy', { body: JSON.stringify({ model: 'claude-opus-4-8', messages: [{ role: 'user', content: prompt }] }) })`
- `app/api/intelligence/route.ts`: same proxy pattern confirmed (route imports show Cloudflare Worker URL env var + fallback)  
- `process.env.CLOUDFLARE_WORKER_URL=https://halannews.com/api-proxy` in `.env.example`

**Risk:**
- Every user-submitted business intelligence query (company name, city, competitors, financial projections) is transmitted to a third-party server controlled by `halannews.com`.
- No privacy policy, data-processing agreement, or SLA documented for this proxy.
- If `halannews.com` is owned by the same developer, it still represents an undisclosed cross-system data flow that must be documented before any enterprise/agency customer agreement is signed.
- The model name (`claude-opus-4-8`) suggests this proxy forwards to Anthropic's API — confirming user data transits at minimum two hops (Vercel → halannews.com → Anthropic).

**Fix:** Replace the external proxy with direct OpenAI/Anthropic SDK calls from within Vercel's serverless functions. The `OPENAI_API_KEY` env var is already declared and used in `lib/research/acquisition/ai-analysis.ts` for the research engine — extend the same pattern to the remaining routes.

---

### SEC-03: `app/market-intelligence/page.tsx` — Authenticated Iframe to External Domain [PROVEN]

**File:** `app/market-intelligence/page.tsx`  
**Code:**
```tsx
export default async function MarketIntelligencePage() {
  // ... auth check ...
  return (
    <div>
      {/* user.email rendered in same DOM */}
      <span>{user.email}</span>
      <iframe src="https://halannews.com/" style={{ flex: 1 }} />
    </div>
  )
}
```
**Risk:**
- The user's email address is rendered in the same DOM as an iframe serving an external origin. JavaScript in the iframe cannot read the parent DOM (same-origin policy), but the user is trained to trust content inside the authenticated shell — a compromised `halannews.com` could display a credential-harvesting UI indistinguishable from a legitimate dashboard feature.
- If `halannews.com` is misconfigured to allow its own iframing (`X-Frame-Options: ALLOWALL`), it would become embeddable by any third party within this authenticated context.
- `allow="clipboard-write; clipboard-read"` grants the embedded page clipboard access in the user's browser.

**Fix:** Remove the iframe or replace with internal content. If the site's analytics/intelligence data legitimately lives at `halannews.com`, build an API integration that pulls data server-side and renders it within the platform — do not embed the raw site.

---

## HIGH

### SEC-04: `proxy.ts` Middleware Fail-Open on Missing Env Vars and Exceptions [PROVEN]

**File:** `proxy.ts:5-7, 42-44`  
```ts
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  return NextResponse.next()  // ← allows ALL requests through
}
// ...
} catch {
  return NextResponse.next()  // ← allows ALL requests through on any exception
}
```
**Mitigated by:** `app/dashboard/layout.tsx:6-11` independently re-verifies `supabase.auth.getUser()` and redirects unauthenticated users — confirmed defense-in-depth.  
**Residual risk:** `app/dashboard/layout.tsx:14-21` wraps the Prisma lookup in a try/catch with no `NODE_ENV` guard. Comment says "DB not connected in dev — allow through." In a production database outage, an authenticated Supabase user who hasn't completed onboarding would bypass the Prisma-tier check.  
**Fix:** Fail-closed in middleware when env vars are missing (return a 503 or redirect, never `NextResponse.next()` for the protected `/dashboard` path). Add `if (process.env.NODE_ENV === 'production') throw err` inside the layout's catch block.

---

### SEC-05: `images.remotePatterns: [{ hostname: '**' }]` — Live SSRF Surface [PROVEN]

**File:** `next.config.ts:9-11`  
```ts
images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] }
```
**Assessment:** The `/_next/image?url=<any-https-url>` optimizer endpoint is a fixed Next.js framework route enabled by this config — it exists and accepts requests regardless of whether any `<Image>` component is used in app code. A wildcard `hostname: '**'` means this endpoint will fetch ANY HTTPS URL, making it a server-side request forgery vector today.  
**Fix:** Restrict to actual external image hosts or remove the `images` block entirely if no external images are loaded.

---

### SEC-06: `app/api/demo/generate/route.ts` — Unsanitized Input → AI Prompt + HTML Email [PROVEN]

**File:** `app/api/demo/generate/route.ts:23-60, 96-169`  
**Route:** `POST /api/demo/generate` — public, unauthenticated, IP-rate-limited only  
**Findings:**
- User-supplied `company`, `city`, `competitors`, `website` are interpolated verbatim into an AI proxy prompt: `- Company: ${company}`. A crafted `company` value can inject instructions into the prompt, eliciting hallucinated competitor data or other outputs.
- The same values are interpolated unescaped into HTML email body sent via Resend: `<h3>مرحباً ${name}،</h3>`. A `<script>` tag in `name` is ineffective in email (most clients block script) but a `<a href="javascript:...">` or `<img onerror=...>` could execute in some mail clients.
**Fix:** HTML-escape all interpolated values before building the email body (`name.replace(/</g,'&lt;')` etc.); delimit the AI prompt's user-controlled sections with clear structural markers (e.g. JSON within a fixed schema, not inline interpolation).

---

### SEC-07: npm audit — `form-data` CRLF Injection [PROVEN]

**Severity:** HIGH (npm audit output, direct `form-data` vulnerability)  
**Package:** `form-data`  
**Vulnerability:** CRLF injection via unescaped multipart field names and filenames — can inject arbitrary HTTP headers in multipart requests.  
**Impact in this repo:** `form-data` is a transitive dependency. Impact is limited if no code in this repo sends user-controlled multipart field names/filenames. Moderate concern; worth patching.  
**Fix:** `npm audit fix` — this is a dependency-tree issue, not a code change.

---

## MEDIUM

### SEC-08: No Security Headers [PROVEN]

**Evidence:** `next.config.ts` (16 lines, full content read) — no `headers()` function. `proxy.ts` — no header injection.  
**Missing headers:**
- `Content-Security-Policy` — no protection against XSS, inline scripts, external resource injection
- `X-Frame-Options: DENY` — dashboard pages embeddable by any site
- `Strict-Transport-Security` — no HSTS
- `X-Content-Type-Options: nosniff` — absent
- `Referrer-Policy` — absent
- `Permissions-Policy` — absent

**Fix:** Add a `headers()` export to `next.config.ts` with standard security headers. Can be done in ~20 lines.

---

### SEC-09: `app/api/workspace/route.ts` — Non-null Assertion on `user.email` [PROVEN]

**File:** `app/api/workspace/route.ts:15`  
```ts
const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
```
**Risk:** Supabase `User.email` is typed as `string | undefined` (OAuth providers may omit email). The `!` assertion bypasses TypeScript and passes `undefined` to Prisma, potentially causing an unhandled exception or a query with unexpected semantics.  
**Mitigated by:** This route has zero frontend callers — it's confirmed dead code. Best fix: delete the route.

---

### SEC-10: RLS on Supabase Tables — `demo_leads` Policy Too Permissive [PROVEN]

**File:** `supabase/leads-table.sql`  
```sql
CREATE POLICY "Service role can insert" ON demo_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can select" ON demo_leads FOR SELECT USING (true);
```
**Risk:** Both policies use `true` as the condition — any authenticated user (not just service-role) can SELECT all demo leads. Since `demo_leads` contains user-submitted contact information (name, phone, email, company), this is a data-exposure issue for any authenticated user who calls the Supabase client directly.  
**Fix:** Add `using (false)` for non-service-role reads, or use a proper `auth.role() = 'service_role'` guard. Demo leads should only be readable by admins.

---

### SEC-11: No CSRF Protection [HIGHLY LIKELY]

**Evidence:** No CSRF tokens found anywhere in form handlers. Auth relies solely on cookie auth + Supabase SSR's default `SameSite=lax`.  
**Risk:** `SameSite=lax` provides protection for navigational (GET) requests from cross-site. POST/PATCH/DELETE from cross-site are blocked under `lax`. However, if any requests use CORS + custom headers or if `SameSite` is downgraded, CSRF becomes exploitable.  
**Current risk:** Low-to-Medium. The risk increases if any form targets are made accessible to CORS or if `SameSite=strict` was never verified in the Supabase SSR cookie setup.

---

## LOW

### SEC-12: `lib/research/rate-limit.ts:checkRateLimit` Fail-Open [PROVEN]

```ts
} catch {
  return { ok: true, resetIn: 0 }  // Redis unavailable → all requests allowed
}
```
**Assessment:** Intentional and documented convention. Acceptable if Redis downtime is rare and burst protection from the per-user limit is "best effort." Acceptable for current scale; document it explicitly in ops runbook.

### SEC-13: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` Replaces Anon Key [PROVEN]

**Evidence:** `.env.example` uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` as the variable name, but `lib/supabase/server.ts` and `proxy.ts` use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The names differ. If the `.env.local` was set up from the example file using the old name, the app would fail to initialize Supabase but silently fail open via `proxy.ts`'s env-var guard.  
**Fix:** Reconcile the variable name in `.env.example` to match what the code actually reads.

---

## WHAT PASSES

| Check | Result |
|---|---|
| IDOR across all 7 authenticated routes | PASS — identity always from verified session |
| SQL injection via Prisma | PASS — no `$queryRaw`/`$executeRaw` |
| Sensitive data in console logs | PASS — no PII/secrets logged |
| `.env.local`/`config.php` tracked in git | PASS — correctly gitignored |
| RLS on `reports`, `research_requests`, `user_plans` | PASS — enabled, `auth.uid() = user_id` |
| Session cookie handling | PASS — `@supabase/ssr` handles correctly |
| Auth callback code exchange | PASS — server-side, no code exposed to client |
| Privilege escalation via plan type | PASS — `user_plans` not self-writable |
