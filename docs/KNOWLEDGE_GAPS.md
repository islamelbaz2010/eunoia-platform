# Knowledge Gaps

**Date:** 2026-07-21  
**Purpose:** Every unanswered architectural, operational, and product question that remains implicit in the repository. Nothing should stay undocumented or assumed.

---

## 1. Infrastructure Decisions

### GAP-001 — Billing Provider

**Question:** Which billing provider will be used for plan upgrades?

**Options considered:** Stripe, Paddle, LemonSqueezy, custom

**Current state:** No provider chosen. Upgrade CTAs link to placeholder.

**Impact if unanswered:** Sprints 6, 11 remain blocked. No self-serve revenue path.

**Who must answer:** Product owner / founder.

---

### GAP-002 — Email Provider Strategy

**Question:** Is Resend the permanent email provider, or is a different provider planned?

**Current state:** Resend SDK installed. `RESEND_API_KEY` is empty. Demo email template written. No sender domain verified.

**Impact if unanswered:** Demo email broken. No transactional notifications. GDPR/CAN-SPAM compliance uncertain.

**Who must answer:** Founder / ops.

---

### GAP-003 — APM / Error Monitoring Provider

**Question:** Which application performance monitoring tool will be used?

**Options:** Sentry, Datadog, New Relic, Axiom, Vercel monitoring, none

**Current state:** `console.log` / `console.error` only. No structured logging anywhere in the codebase.

**Impact if unanswered:** Production errors are invisible until a customer reports them.

**Who must answer:** Founder / engineering.

---

### GAP-004 — AI Proxy Architecture

**Question:** What is `halannews.com/api-proxy`? Is it a Cloudflare Worker? Is it still operational? Does it serve Claude or OpenAI?

**Sub-questions:**
- The legacy AI orchestrator uses `CLOUDFLARE_WORKER_URL` — is this the same proxy?
- The demo generate route uses `AI_PROXY_URL` — different env var, same proxy?
- `PROJECT_CONTEXT.md` says demo AI uses "Claude Opus 4.8" but the code sends `model: 'gpt-4o-mini'` — which is true?

**Current state:** Two env vars pointing to what appears to be the same hardcoded fallback URL, different code paths, no documentation.

**Impact if unanswered:** If the proxy goes down, the Real Estate module and demo report generation both fail with no recovery path.

**Who must answer:** Founder / infrastructure owner.

---

### GAP-005 — Disaster Recovery Policy

**Question:** What is the plan if Supabase is deleted again?

**Current state:** Supabase project was deleted once. No backup policy. No export schedule. 6 SQL migration files exist but must be re-run manually.

**Impact if unanswered:** Next deletion = days of downtime.

**Who must answer:** Founder / ops.

---

### GAP-006 — Database Backup Policy

**Question:** What is the retention and backup policy for `reports`, `research_requests`, `user_plans`, and `audit_log`?

**Current state:** Supabase's automatic backups apply (daily, depending on plan tier). No custom backup, no export policy, no documented retention period.

**Impact if unanswered:** Customer data loss risk; compliance exposure (GDPR data retention).

**Who must answer:** Founder / legal.

---

## 2. Architecture Decisions

### GAP-007 — AI Provider Strategy

**Question:** Is OpenAI GPT-4o-mini the permanent sole AI provider? What is the fallback if OpenAI has an outage?

**Current state:** The Cloudflare Worker proxy provides one level of fallback. Beyond that: hard failure. No other AI provider is configured.

**Impact if unanswered:** Extended OpenAI outages take down all intelligence features simultaneously.

**Who must answer:** Founder / engineering.

---

### GAP-008 — Plan Model Authority (Prisma vs Supabase)

**Question:** When will `Workspace.plan` (Prisma) be removed in favor of `user_plans` (Supabase) as the sole source of plan data?

**Current state:** Documented as DEBT-007. Two plan storage locations exist. `Workspace.plan` is always set to `STARTER` and is not used for enforcement. Risk: if code accidentally reads `Workspace.plan`, all users are treated as STARTER.

**Impact if unanswered:** Future refactoring risk; confuses new engineers; billing integration must not touch Prisma plan.

**Who must answer:** Engineering (technical decision; no external dependency).

---

### GAP-009 — Supabase Types Generation

**Question:** When will `types/supabase.types.ts` be replaced with generated types?

**Current state:** Stub file — all types are `Record<string, unknown>`. Research routes cast to `any` with `eslint-disable` comments. This means schema errors surface only at runtime.

**Impact if unanswered:** Every Supabase query is type-unsafe.

**Who must answer:** Engineering (run after Supabase project is restored).

---

### GAP-010 — Multi-Tenancy Model

**Question:** Is the platform single-user-per-account forever, or will team/workspace multi-tenancy be added?

**Current state:** Every Supabase table uses `user_id` RLS. Prisma has `Workspace` model with `ownerId` (suggesting team intent) but `user_plans` is per-user. If teams are added, every RLS policy and plan enforcement call must change.

**Impact if unanswered:** Adding multi-tenancy later requires a full schema migration on live data.

**Who must answer:** Founder (product decision).

---

### GAP-011 — SerpAPI Quota Architecture

**Question:** Is the global daily SerpAPI quota (`SEARCH_DAILY_QUOTA=150`) appropriately sized for the current user base? What happens when it's exceeded?

**Current state:** `quota.ts` implements a global shared quota and per-user sub-quota. Fail-open on Redis error (quota disabled). No alerting when quota is exhausted.

**Sub-questions:**
- What is the actual SerpAPI plan monthly limit?
- What should `SEARCH_DAILY_QUOTA` be set to based on that plan?
- What should `SEARCH_DAILY_QUOTA_PER_USER` be?

**Impact if unanswered:** One high-volume user can exhaust the daily SerpAPI budget for all users with no warning.

**Who must answer:** Founder (SerpAPI plan and budget decision).

---

### GAP-012 — Apollo.io Integration Status

**Question:** Is there an active Apollo.io subscription that provides an API key?

**Current state:** `apollo-adapter.ts` is complete and production-ready. `APOLLO_API_KEY` is not set in any environment. The adapter gracefully no-ops when the key is absent.

**Impact if unanswered:** Lead enrichment (company employee count, contact data) is permanently disabled with no user-visible indication.

**Who must answer:** Founder (commercial decision).

---

### GAP-013 — proxy.ts Status

**Question:** Should `proxy.ts` be renamed to `middleware.ts` to actually run as Next.js middleware, or should it be deleted and replaced with a proper `middleware.ts`?

**Current state:** `proxy.ts` exports a function named `proxy`, not `middleware`. Next.js never executes it. It is dead code at the middleware layer. However, it contains valid session refresh and path protection logic.

**Impact if unanswered:** Sessions are not refreshed on every request; `/dashboard` path protection relies only on the layout server component.

**Who must answer:** Engineering (DEBT-002 — trivial fix).

---

## 3. Product Decisions

### GAP-014 — Decision Intelligence Business Rules

**Question:** What are the actual business rules for Real Estate feasibility, lead quality scoring, and talent hiring decisions?

**Current state:** The Rules Engine is complete and can evaluate any `BusinessRule[]`. No rules have been defined for any business domain.

**Impact if unanswered:** Decision Intelligence integration (Sprints 3-4) cannot start without domain rules.

**Who must answer:** Founder / domain expert (product decision — requires real estate and hiring knowledge).

---

### GAP-015 — Market Intelligence Data Strategy

**Question:** Will the Market Intelligence Hub eventually show live data, or is it permanently static curated content?

**Current state:** Static hardcoded text with an on-page disclaimer. Positioned as a peer product to Lead Finder and Talent Finder, which are evidence-based.

**Sub-questions:**
- Live data from which source? (World Bank API, Statista subscription, CAPMAS, CBE)
- Refresh frequency?
- Responsibility for editorial accuracy?

**Impact if unanswered:** Product inconsistency persists; customer churn risk once they notice the quality gap.

**Who must answer:** Founder (product and content strategy decision).

---

### GAP-016 — Decision-Maker Enrichment Strategy

**Question:** How will the Lead Finder's decision-maker section be made real?

**Current state:** The section shows user-supplied title strings as LinkedIn People Search links. It does not discover real contacts. Every row in a given search has identical titles (pure echo of user input).

**Options:**
- Apollo.io contact enrichment (if API key obtained — GAP-012)
- LinkedIn API (access is extremely restricted)
- Lusha / Hunter.io / Clearbit for contact enrichment
- AI-generated plausible contacts (explicitly disclaimed, similar to Talent Finder)

**Impact if unanswered:** Major product quality gap in the Lead Finder's most-checked output.

**Who must answer:** Founder (data provider and budget decision).

---

### GAP-017 — Pricing Strategy

**Question:** What are the actual prices for each plan tier?

**Current state:** Plan tiers exist (STARTER=20 reports, PROFESSIONAL=100, AGENCY=300, ENTERPRISE=unlimited). No prices are set anywhere in the codebase or documentation.

**Impact if unanswered:** Billing Sprint (Sprint 6) cannot configure checkout sessions.

**Who must answer:** Founder (commercial decision).

---

### GAP-018 — GDPR / Data Residency

**Question:** Are any users in jurisdictions requiring GDPR compliance or data residency (EU, UAE PDPL, Saudi PDPD)?

**Current state:** Supabase project is hosted in a region unknown from documentation. No data processing agreement (DPA) with Supabase. Privacy Policy is a placeholder. No GDPR mechanisms (cookie consent, data subject rights flows).

**Impact if unanswered:** Legal exposure if EU or UAE enterprise customers are onboarded.

**Who must answer:** Founder / legal.

---

### GAP-019 — Audit Log Retention

**Question:** How long should audit log entries be retained, and what happens when they expire?

**Current state:** `audit_log` table exists. No TTL, no retention policy, no archival process.

**Impact if unanswered:** Table grows unbounded; legal retention requirements unmet.

**Who must answer:** Founder / legal.

---

## 4. Operational Decisions

### GAP-020 — Admin Access Model

**Question:** Is `ADMIN_EMAILS` string check (comma-separated list of email addresses) the permanent admin identity mechanism, or will a database role system be introduced?

**Current state:** `lib/admin/auth.ts` checks `process.env.ADMIN_EMAILS.split(',').includes(email)`. No database role. If a team grows, managing admin access via env var becomes unscalable.

**Impact if unanswered:** Security gap at scale; admin access cannot be revoked without a redeploy.

**Who must answer:** Engineering / founder.

---

### GAP-021 — Rate Limiting Strategy (Redis Down)

**Question:** If Upstash Redis is unavailable, all rate limits and quota controls fail open. Is this the intended behavior?

**Current state:** Fail-open is the design (an infra hiccup shouldn't block paying customers). But all three control mechanisms (per-user rate limit, per-user plan limit, global SerpAPI quota) fail open simultaneously if Redis has an outage — an outage removes all controls at once.

**Options:**
- Current design (fail-open) — revenue risk in an outage
- Fail-closed — better security, worse availability
- In-memory fallback window — partial mitigation

**Impact if unanswered:** An extended Redis outage removes rate limiting and quota enforcement simultaneously.

**Who must answer:** Founder / engineering (availability vs. security trade-off).

---

### GAP-022 — Uptime Monitoring

**Question:** Is there an external uptime monitor configured for `intelligence.eunoiazones.com`?

**Current state:** `/api/health` returns `{ ok: true }`. No external uptime monitor configuration documented anywhere. No alerting.

**Impact if unanswered:** Platform downtime goes undetected until a user reports it.

**Who must answer:** Ops (5-minute task if using BetterUptime, UptimeRobot, or Vercel monitoring).

---

### GAP-023 — Vercel AI SDK Usage

**Question:** The `ai` package (Vercel AI SDK v4.3.16) is a production dependency. Which features or routes use it?

**Current state:** Package is installed but not discoverable from static file listing — requires grepping import statements. If unused, it adds bundle size for no benefit.

**Impact if unanswered:** Unknown dependency; may be used by a route not found in the inventory.

**Who must answer:** Engineering (grep `from 'ai'` in the codebase).

---

## 5. Decision Intelligence Specific

### GAP-024 — Evidence Sources for Real Estate

**Question:** What constitutes an `EvidenceItem` in a Real Estate feasibility decision? Where does the evidence come from?

**Examples needed:**
- User-supplied project cost estimate → `user_input` source type
- Egypt 2026 benchmark data → `internal_data` source type
- GPT-4o-mini feasibility commentary → `ai_analysis` source type
- Historical transaction data → where does this come from?

**Impact if unanswered:** Cannot write the Real Estate data adapter without knowing what evidence goes in.

**Who must answer:** Engineering / founder (product design).

---

### GAP-025 — Confidence Dimension Inputs for Real Estate

**Question:** For Real Estate, what provides each of the 5 confidence dimensions?

| Dimension | Input needed |
|---|---|
| evidence_volume | How many evidence items constitute "high volume"? |
| evidence_quality | Which source types dominate the feasibility analysis? |
| evidence_freshness | What are the age distributions of the inputs? |
| evidence_consistency | How are contradictions detected in financial estimates? |
| rule_compliance | What rule pass rate is "high compliance"? |

**Impact if unanswered:** Confidence scores will be meaningless without calibrated inputs.

**Who must answer:** Engineering / domain expert.

---

*Knowledge gaps produced 2026-07-21. Read-only assessment.*
