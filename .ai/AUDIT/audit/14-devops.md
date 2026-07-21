# 14 — DevOps

**Evidence basis:** `package.json` scripts, `vercel.json`, `vitest.config.ts`, `.gitignore`, git history, branch structure.

---

## DevOps Maturity Assessment

**Overall maturity:** Early-stage / MVP  
**Rating:** 2/5

The platform has the minimum infrastructure to deploy (Vercel) but lacks all the practices that prevent production incidents.

---

## CI/CD Pipeline

**Current state:** None.

Every commit pushed to `main` automatically deploys to production via Vercel's GitHub integration. There are no:
- Automated tests before deploy
- Linting checks before deploy
- TypeScript compilation checks before deploy
- Build previews for pull requests
- Deployment approval gates

**Evidence:** No `.github/workflows/*.yml` found in repository. Vercel auto-deploy is configured.

---

## npm Scripts

**File:** `package.json`

| Script | Command | Assessment |
|---|---|---|
| `dev` | `next dev` | Standard ✅ |
| `build` | `next build` | Standard ✅ |
| `postinstall` | `prisma generate` | Correct but duplicates vercel.json buildCommand |
| `start` | `next start` | Standard ✅ |
| `lint` | `next lint` | Standard ✅ |
| `typecheck` | `tsc --noEmit` | ✅ Exists (rare to have this explicitly) |
| `test` | `vitest run` | ✅ Tests exist |

**Assessment:** The presence of `typecheck` and `test` scripts is positive — they exist but are not run automatically in CI.

---

## Monitoring & Observability

**Production monitoring:** None beyond Vercel's built-in log streaming.

**What is observable:**
- Vercel function logs (standard stdout — includes debug console.log statements leaking key presence)
- Vercel deploy status

**What is NOT observable:**
- Error rate by route
- AI response time distribution
- SerpAPI quota consumption over time
- Redis cache hit rate
- Plan limit enforcement events
- User signup/login events

**Recommendation:** Add structured logging with a service like Axiom, Datadog, or BetterStack. At minimum, replace `console.log` with `console.error` for error events and `console.info` for operational events.

---

## Environment Management

**Local development:** `.env.local` (not committed, excluded via `.gitignore`)  
**Production:** Vercel environment variables (managed via Vercel dashboard or CLI)

**Finding:** `.env.local` is in `.gitignore` ✅. However, `.env.local.example` reveals the full list of expected environment variables — useful for onboarding.

**Problem:** No automated drift detection between `.env.local.example` and what Vercel has configured. If a new env var is added to code but not to Vercel, the deploy succeeds but the feature is silently broken.

---

## Git Workflow

**Current workflow:** Single contributor, direct commits to `main` with occasional feature branches (Claude-generated branches `claude/blissful-newton-Sdej0`, `claude/ecstatic-cerf-LtKWq`).

**Branch protection:** No branch protection rules observed (no enforcement of PR reviews before merge to main).

**Commit message quality:** Generally good — follows conventional commits pattern (`fix:`, `feat:`, `docs:`).

**Evidence of git discipline:**
- Backup branches exist (`backup-before-research-module`, `backup-clean`) — shows caution before major changes ✅
- Clean merge commits for Claude-generated branches ✅

---

## Dependency Management

**Lock file:** `package-lock.json` ✅ (committed)  
**Security audit:** No automated `npm audit` in CI  
**Version pinning:** Mix of `^` (semver minor/patch) and exact — standard practice

**Notable dependency ages:**
- `next: ^16.2.6` — Current (Next.js 16 is 2026 release)
- `react: ^19.0.0` — Current ✅
- `openai: ^4.96.2` — Current ✅
- `eslint-config-next: 15.3.0` — **Pinned to 15 while Next.js is 16** — potential lint config gap

---

## Infrastructure Costs (Estimated)

| Service | Tier | Monthly Cost |
|---|---|---|
| Vercel | Hobby (or Pro) | $0–$20 |
| Supabase | Free or Pro | $0–$25 |
| Upstash Redis | Pay-per-request | ~$0–$5 |
| OpenAI GPT-4o-mini | Pay-per-use | ~$1–$10 at low volume |
| SerpAPI | Free (100/mo) or $50 | $0–$50 |
| Apollo.io | Optional, variable | $0+ |
| **Total at MVP scale** | | **~$5–$110/month** |

---

## DevOps Action Items

| Priority | Action | Effort |
|---|---|---|
| P0 | Remove production console.log (security + noise) | 5 min |
| P1 | Add GitHub Actions CI (lint + typecheck + test) | 1 day |
| P1 | Create staging environment (Vercel preview + staging Supabase) | 1 day |
| P1 | Add branch protection to main (require PR + CI pass) | 30 min |
| P2 | Add structured logging/monitoring (Axiom or BetterStack) | 1 week |
| P2 | Automate `npm audit` in CI | 1 hour |
| P2 | Fix eslint-config-next version to match Next.js 16 | 30 min |
| P3 | Add Vercel deployment alerts (Slack/email on failed deploy) | 1 hour |
