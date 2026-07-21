# 10 — DEPLOYMENT STATUS
*What is actually deployed and how.*

---

## Deployment Platform

**Platform:** Vercel
**Production URL:** https://ai.halannews.com
**Repository:** GitHub (`islamelbaz2010/eunoia-platform`, branch: `main`)
**Deployment Method:** Auto-deploy on push to `main`

---

## Build Configuration

### vercel.json
```json
{
  "buildCommand": "npm install && npx prisma generate && npm run build",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

Evidence: `vercel.json` (root)

**Note:** The build command explicitly runs `prisma generate` for the legacy Prisma schema. This is required because `postinstall` in `package.json` also runs it, and Vercel needs it for the build to succeed (`serverExternalPackages: ['@prisma/client', 'prisma']` in `next.config.ts`).

### next.config.ts
```typescript
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }]  // Very permissive
  }
}

export default withNextIntl(nextConfig)
```

Evidence: `next.config.ts`

---

## Environment Variables (Required for Production)

| Variable | Required By | Status |
|----------|-----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client | ✅ Must be set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client | ✅ Must be set |
| `SUPABASE_SERVICE_ROLE_KEY` | `/api/demo` route | ✅ Must be set (missing from .env.local.example) |
| `OPENAI_API_KEY` | All AI routes | ✅ Must be set |
| `SERPAPI_API_KEY` | Lead Finder | ✅ Must be set for leads |
| `UPSTASH_REDIS_REST_URL` | Rate limiting + cache | ✅ Must be set |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting + cache | ✅ Must be set |
| `RESEND_API_KEY` | Demo emails | ✅ Must be set |
| `DATABASE_URL` | Prisma (legacy) | ✅ Must be set (build fails without) |
| `DIRECT_URL` | Prisma (legacy) | ✅ Must be set |
| `APOLLO_API_KEY` | Apollo enrichment | ❌ Optional — no-ops without it |
| `SEARCH_DAILY_QUOTA` | SerpAPI quota cap | ❌ Optional — has default |

**Critical gap:** `SUPABASE_SERVICE_ROLE_KEY` is not in `.env.local.example` but is required by the demo lead capture system.

---

## Recent Deployment History

From git log:
```
31638d4 debug leads api          ← LAST COMMIT — debug logs in production
e21d043 Merge pull request #9   ← Multi-tenant audit fixes (merged)
f8175e1 fix: exclude test/vitest-config files from the production tsconfig
4e65464 docs: Vercel build failure root cause report
5a7bd2e docs: production-truth audit — deployment reality report
```

**Critical observation:** The most recent commit (`31638d4 debug leads api`) added debug `console.log` statements to `/api/research/leads/route.ts`. This is currently in production.

---

## Build Notes

### Why Prisma Is in the Build Command
The repo uses Prisma's `output` configuration to generate client code to a custom path (`lib/prisma/generated`). The generated code is checked into the repo (it's not gitignored), but Vercel still regenerates it during build because:
1. `vercel.json` explicitly runs `npx prisma generate`
2. `package.json` `postinstall` runs `prisma generate`

This was a known source of build failures (documented in `4e65464 docs: Vercel build failure root cause report`).

### Why `serverExternalPackages`
Prisma requires `serverExternalPackages: ['@prisma/client', 'prisma']` in `next.config.ts` to prevent Next.js from trying to bundle the Prisma client, which would break. This is standard practice for Prisma with Next.js.

---

## Domain Configuration

- **Production domain:** `ai.halannews.com` (subdomain of `halannews.com`)
- **This creates architectural coupling:** The AI platform lives under `halannews.com` — a news brand, not an AI/tech brand
- **Implication for investors:** Domain suggests this is a news media company's internal tool, not a standalone SaaS

---

## Deployment Health

| Aspect | Status |
|--------|--------|
| Build process | ✅ Working (recent commits show successful deploys) |
| Database connectivity | ✅ Supabase connected |
| AI routes | ✅ OpenAI connected |
| Rate limiting | ✅ Upstash Redis connected |
| Email delivery | ✅ Resend connected |
| Demo AI generation | ⚠️ External dependency (halannews.com/api-proxy) |

---

## Performance Considerations

- **No response streaming** on AI routes — user waits for full 4000-token response before seeing anything
- **SerpAPI results can be slow** — Lead Finder pipeline involves multiple HTTP fetches
- **Redis caching** mitigates repeat search cost
- **No CDN optimization** beyond Vercel's default static asset serving
- **`images.remotePatterns: [{ hostname: '**' }]`** — allows images from any domain (permissive, minor security concern)

---

## What's Missing for Production Readiness

| Gap | Priority |
|-----|----------|
| Streaming AI responses (show partial output) | MEDIUM |
| Remove debug logs from leads route | HIGH |
| Custom domain separate from halannews.com | LOW (brand concern) |
| Error monitoring (Sentry/Datadog) | MEDIUM |
| Uptime monitoring | MEDIUM |
| Production CI/CD pipeline (tests before deploy) | MEDIUM |
