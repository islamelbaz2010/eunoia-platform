# 16 — ROADMAP
*Evidence-based: what exists, what's missing, realistic timelines.*

---

## Roadmap Basis

This roadmap is derived from:
1. What is currently built (verified in audit)
2. What is in the "Coming Soon" UI stubs
3. What is referenced in code comments and legacy prompts
4. What is structurally needed for a viable SaaS business

No invented features. No invented timelines. Estimates based on complexity observed in existing code.

---

## Phase 0: Demo Cleanup (TODAY — 2-4 hours)

| Task | Effort | Impact |
|------|--------|--------|
| Remove debug console.logs from leads route | 5 min | Professionalism |
| Hide market-intelligence nav link | 5 min | Remove investor confusion |
| Delete PHP/HTML junk files from root | 5 min | Clean repo |
| Pre-generate demo account reports | 15 min | Demo readiness |
| Verify production build + all features work | 30 min | Confidence |
| Remove halannews.com proxy → direct OpenAI in demo route | 2 hrs | Remove critical dependency |

**Output:** Demo-ready platform at 88/100 readiness

---

## Phase 1: Commercial Infrastructure (Weeks 1-3)

*Goal: Platform can collect revenue without manual intervention*

| Task | Effort | Priority |
|------|--------|---------|
| Stripe integration (subscription billing) | 1 week | CRITICAL |
| Self-serve plan upgrade UI | 3 days | CRITICAL |
| Stripe webhook handler (plan sync) | 2 days | CRITICAL |
| Error monitoring (Sentry) | 2 hours | HIGH |
| Generate Supabase TypeScript types | 30 min | MEDIUM |
| Remove debug code / junk files (if not done in Phase 0) | 30 min | HIGH |
| Admin lead view (read demo_leads in platform) | 1 day | MEDIUM |

**Output:** Platform can accept payment and scale without manual ops

---

## Phase 2: Product Depth (Weeks 4-8)

*Goal: Complete the research suite and add retention features*

| Task | Effort | Priority |
|------|--------|---------|
| Competitor Intelligence module (backend + UI) | 3-4 weeks | HIGH |
| Streaming AI responses (no more waiting 30s) | 2 days | HIGH |
| Team workspace / multi-user access | 2-3 weeks | MEDIUM |
| Report sharing (client-facing link) | 1 week | MEDIUM |
| Apollo contact enrichment (activate key) | 30 min | HIGH |
| Customer onboarding email sequence | 3 days | MEDIUM |
| Lead Finder pagination (10+ results) | 1 day | MEDIUM |
| Supplier Intelligence module | 3-4 weeks | LOW |

**Output:** Expanded product, team sales possible, higher engagement

---

## Phase 3: Market Intelligence (Weeks 9-16)

*Goal: Replace static insights with real data*

| Task | Effort | Priority |
|------|--------|---------|
| Replace halannews.com iframe with real market intelligence | 3-4 weeks | HIGH |
| Live Egypt real estate market data feed | 3-4 weeks | MEDIUM |
| Dynamic Egypt 2026 benchmarks (not hardcoded) | 2 weeks | MEDIUM |
| Recruitment Intelligence module | 2-3 weeks | MEDIUM |
| Mobile-responsive design pass | 1 week | MEDIUM |

**Output:** Product differentiation from generic AI tools

---

## Phase 4: Enterprise & Scale (Weeks 17-24)

*Goal: Serve agencies and enterprises*

| Task | Effort | Priority |
|------|--------|---------|
| Full admin panel (user management, billing, usage) | 3-4 weeks | HIGH |
| Workspace-level billing (agency) | 2 weeks | HIGH |
| API access for enterprise tier | 2-3 weeks | MEDIUM |
| White-label / custom domain support | 2-3 weeks | MEDIUM |
| AI cost optimization (streaming, caching) | 1 week | MEDIUM |
| GDPR compliance layer | 1 week | HIGH (if EU) |

**Output:** Enterprise-ready, scalable operations

---

## Legacy Code Cleanup (Parallel Track)

| Task | Effort |
|------|--------|
| Remove `services/legacy-ai-engine/` folder | 1 day |
| Simplify Prisma out of build pipeline | 1 day |
| Convert real estate dashboard to Tailwind CSS | 2-3 days |
| Standardize API error response format | 1-2 days |

---

## Realistic Timeline Summary

| Milestone | Timeline | Description |
|-----------|----------|-------------|
| Demo ready | TODAY | 2-4 hours of cleanup |
| Revenue-ready | Week 3 | Stripe + plan upgrade |
| Full research suite | Week 8 | Competitor + Supplier modules |
| Real market data | Week 16 | Replace static content |
| Enterprise ready | Week 24 | White-label, API, compliance |

---

## What This Roadmap Needs (Investment Thesis)

To execute Phase 1-2 (Weeks 1-8), estimated cost:
- 1 engineer full-time for 8 weeks: ~$8-16K USD (Egypt rates)
- Third-party APIs (SerpAPI, OpenAI, Apollo): ~$500-1000/month at scale
- Infrastructure (Vercel, Supabase, Redis): ~$100-300/month

**Minimum viable investment for revenue-ready product:** ~$20-30K USD
**For Phase 1-4 full execution:** ~$100-200K USD
