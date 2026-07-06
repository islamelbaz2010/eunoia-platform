# Performance Audit

**Score: 62 / 100**

---

## Bundle / Build Artifacts

### NFT Bloat — 24.66MB across 4 serverless functions [PROVEN]

**Root cause:** `prisma/schema.prisma` `output = "../lib/prisma/generated"` generates a Prisma client that uses `process.cwd()`-based runtime path resolution. Next.js's Node File Trace cannot statically resolve `process.cwd()` at build time and falls back to including the entire working directory in any function that imports Prisma.

**Affected routes** (all import `lib/prisma/client.ts` directly or transitively):
- `app/api/intelligence/route.ts`
- `app/api/research/leads/route.ts`
- `app/api/research/talent/route.ts`
- `app/api/workspace/route.ts` (dead code — also bloated)

**What's included in those bundles that shouldn't be:**
- 26 root-level `.md` audit files (~combined several MB of markdown)
- `index.html` (444KB — legacy PHP frontend)
- `IMG_0070.jpeg`–`IMG_0073.jpeg` (232KB total)
- Legacy PHP files (`api.php`, `auth.php`, etc.)
- `Eunoia_Platform_Analysis_Final.xlsx`
- `text.txt` through `text 6.txt`
- `users.json` (**bcrypt hashes packaged into the serverless function bundle**)

**Fix:** Remove `output = "../lib/prisma/generated"` from `prisma/schema.prisma`. Let Prisma generate to the default `node_modules/.prisma/client`, which is resolved via standard Node.js `require()` resolution — NFT handles that correctly.

**Secondary fix:** Cleaning up legacy files eliminates the content being swept in even if the root cause remains.

### Dead Packages Contributing to Bundle

| Package | Status |
|---|---|
| `framer-motion` | ✅ CORRECTED: zero usages in app; ~100KB+ gzipped — safe to delete |
| `ai` (Vercel AI SDK) | Unused — safe to delete; eliminates 4 npm vulnerabilities |
| 8 unused Radix packages | Unused — none imported by `components/ui/` |
| `sonner` | Unused — safe to delete |
| `@upstash/ratelimit` | Unused — safe to delete |

**Note:** `lib/csv-export.ts` IS used — by `app/dashboard/research/leads/page.tsx:7` and `app/dashboard/research/talent/page.tsx:6`. Not dead code — remove from dead code list.

---

## Server-Side Rendering

### Dashboard Page [PASSING]

`app/dashboard/page.tsx` is a React Server Component that:
1. Makes 3 Supabase queries in parallel (`Promise.all`) ✅
2. Returns fully server-rendered HTML
3. No waterfall

### `app/dashboard/analytics/page.tsx` [ISSUE — PROVEN]

Marked `'use client'` but contains zero `useState`, `useEffect`, or event handlers. All content is static JSX. This page:
- Disables streaming SSR
- Forces the entire static content into the client bundle
- Adds JavaScript weight for a page that needs zero JS

**Fix:** Remove `'use client'` and make it a Server Component.

### Dashboard Layout Auth Check [NECESSARY SEQUENCE]

`app/dashboard/layout.tsx` makes 2 Supabase calls: auth check then Prisma existence check. These are necessarily sequential (Prisma check only runs if auth succeeds) — not a fixable waterfall.

---

## Database Query Performance

### Missing Index on `reports.user_id` [PROVEN — HIGH IMPACT]

Every `app/dashboard/page.tsx` dashboard load runs:
```sql
SELECT count(*) FROM reports WHERE user_id = $1
SELECT count(*) FROM reports WHERE user_id = $1 AND created_at >= $2
SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5
```

Three sequential full-table scans per dashboard home page load without an index.

**Fix:**
```sql
CREATE INDEX IF NOT EXISTS reports_user_id_idx ON reports(user_id);
CREATE INDEX IF NOT EXISTS reports_user_id_created_at_idx ON reports(user_id, created_at DESC);
```

### Missing Index on `User.workspaceId` (Prisma) [PROVEN]

**Fix:**
```prisma
model User {
  @@index([workspaceId])
}
```

### `research_requests` Index [PASSING]

`user_id` index exists. A composite `(user_id, created_at)` index would help the plan enforcement query.

---

## API Response Times

### Bottlenecks

| Endpoint | Estimated P95 latency | Bottleneck |
|---|---|---|
| `POST /api/intelligence` | 10-30s | AI inference (external proxy, no streaming) |
| `POST /api/research/leads` | 5-20s | HTTP collection (up to 10+ concurrent fetches + AI analysis) |
| `POST /api/research/talent` | 5-15s | AI inference (external proxy) |
| `POST /api/demo/generate` | 5-15s | AI inference (external proxy) |
| `GET /dashboard` | 200-500ms | 3× parallelized Supabase queries |

**Vercel timeout risk:** Serverless functions default to 10s (Hobby) or 60s (Pro). AI-heavy routes are at risk of timeout.

**No streaming implemented.** All AI routes use synchronous request-response. Migrating to direct OpenAI/Anthropic calls would enable streaming via the Vercel AI SDK.

---

## Caching Effectiveness

| Cache | Key | TTL | Assessment |
|---|---|---|---|
| Research results | SHA256 of query + hints | 24h | ✅ Good — identical queries share cache across users |
| Intelligence reports | SHA256 of type + context | 24h | ✅ Good |
| Plan tier | None | N/A | ❌ 2 Supabase calls per research request uncached |

**Fix:** Add 60s TTL cache on `user_plans.plan` keyed by `userId`.

---

## Memory / Connection Management

| Item | Status |
|---|---|
| Prisma singleton | ✅ Correct (`globalThis` pattern) |
| Redis lazy singleton | ✅ Correct (HTTP client, not persistent TCP) |
| Supabase client | ✅ Created per-request (correct for SSR) |
| Memory leaks | None detected |
| N+1 query patterns | None detected |

---

## No Fetch Timeout in `FetchSourceCollector` [PROVEN]

`lib/research/acquisition/source-collector.ts` calls `fetch(url)` with no `AbortController` or timeout. A slow target server holds the Vercel function slot open until the platform-level timeout.

**Fix:**
```typescript
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 5000)
try {
  const response = await fetch(url, { signal: controller.signal })
  // ...
} finally {
  clearTimeout(timeout)
}
```

---

## Performance Scorecard

| Category | Score | Finding |
|---|---|---|
| Database indexes | 40/100 | Missing critical index on `reports.user_id` |
| Bundle size | 50/100 | NFT bloat + dead packages |
| Caching | 70/100 | Research caching good; plan limit uncached |
| API latency | 45/100 | No streaming; AI proxy adds hop; timeout risk |
| SSR correctness | 65/100 | `analytics` page wrongly client-rendered |
| Memory management | 90/100 | No leaks, correct singletons |
| Parallel data fetching | 85/100 | Dashboard correctly uses Promise.all |
