# Business Model

## Business Model Overview

Eunoia Platform operates as a B2B SaaS with a subscription-based pricing model. The platform provides AI-powered marketing intelligence tools for sales teams, hiring teams, and real estate professionals.

## Current Business Model Status

**Status:** PARTIALLY IMPLEMENTED

**Implemented:**
- Plan tiers and limits
- Usage tracking infrastructure
- Plan enforcement in code
- User plan assignment (manual)

**NOT Implemented:**
- Payment processing
- Billing integration
- Self-service upgrades
- Revenue tracking
- Invoice generation
- Subscription management
- Churn analytics

## Revenue Model

### Subscription Tiers

| Plan | Monthly Reports | Price | Status |
|------|----------------|-------|--------|
| Starter | 20 reports/month | UNKNOWN | Infrastructure exists, pricing not set |
| Professional | 100 reports/month | UNKNOWN | Infrastructure exists, pricing not set |
| Agency | 300 reports/month | UNKNOWN | Infrastructure exists, pricing not set |
| Enterprise | Unlimited (fair-use) | UNKNOWN | Infrastructure exists, pricing not set |

**Pricing Status:** UNKNOWN - No pricing information in codebase or documentation

**Billing Frequency:** UNKNOWN - Not implemented

**Free Trial:** UNKNOWN - Not implemented

**Annual Discounts:** UNKNOWN - Not implemented

---

### Revenue Recognition

**Status:** NOT IMPLEMENTED

**Current State:**
- No revenue tracking in database
- No payment processing
- No invoice generation
- No revenue analytics

**Missing Infrastructure:**
- Stripe/PayPal integration
- Billing webhooks
- Revenue dashboard
- Financial reporting

---

## Cost Structure

### Variable Costs

**AI Costs (OpenAI):**
- GPT-4o-mini: $0.00015/1K input tokens, $0.0006/1K output tokens
- Estimated cost per report: $0.0006 - $0.0015
- Estimated monthly cost per user (20 reports): $0.02 - $0.05

**Search Costs (SerpAPI):**
- Pricing: UNKNOWN (not in codebase)
- Daily quota: 150 searches (default)
- Estimated monthly cost: UNKNOWN

**Email Costs (Resend):**
- Pricing: UNKNOWN (not in codebase)
- Usage: Demo lead capture only
- Estimated monthly cost: UNKNOWN

---

### Fixed Costs

**Infrastructure:**
- Vercel hosting: UNKNOWN (not in codebase)
- Supabase database: UNKNOWN (not in codebase)
- Upstash Redis: UNKNOWN (not in codebase)

**Development:**
- Salaries: UNKNOWN
- Tools/services: UNKNOWN

**Marketing:**
- Customer acquisition: UNKNOWN
- Content creation: UNKNOWN

---

## Customer Acquisition

### Current Channels

**Status:** UNKNOWN - No customer acquisition tracking in codebase

**Potential Channels (inferred):**
- Direct sales (Egypt market)
- Demo landing page (/demo route)
- Word of mouth
- Organic search (SEO)

**Missing:**
- Customer acquisition cost tracking
- Channel attribution
- Conversion funnel analytics
- Marketing automation

---

## Customer Retention

### Current State

**Status:** NOT IMPLEMENTED

**Missing:**
- Churn tracking
- Retention analytics
- Customer health scoring
- Engagement metrics
- Renewal automation

**Available Data:**
- Report usage tracking (per user)
- Last report date
- Plan tier

---

## Unit Economics

### Current State

**Status:** UNKNOWN - Cannot calculate without pricing and cost data

**Missing Metrics:**
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- LTV/CAC Ratio
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Churn Rate
- Net Revenue Retention
- Gross Margin

---

## Sales Model

### Current Approach

**Status:** MANUAL - No self-service

**Process:**
1. User signs up via Supabase auth
2. User assigned to STARTER plan (default)
3. Plan upgrades require manual admin action
4. No payment collection
5. No subscription management

**Missing:**
- Self-service checkout
- Plan comparison page
- Upgrade/downgrade flows
- Payment method management
- Dunning management

---

## Go-to-Market Strategy

### Current Focus

**Status:** UNKNOWN - Not documented in codebase

**Inferred Strategy:**
- Egypt market focus
- Real estate vertical
- Marketing agencies
- Direct sales approach

**Missing:**
- GTM documentation
- ICP (Ideal Customer Profile) definition
- Sales playbook
- Partnership strategy
- Channel strategy

---

## Business Model Validation

### Current Validation Status

**Product-Market Fit:** PARTIALLY VALIDATED
- Production deployment at https://ai.halannews.com
- Live users (inferred from auth system)
- Working modules (Lead Finder, Talent Finder, Real Estate)

**Commercial Viability:** NOT VALIDATED
- No revenue generated
- No pricing set
- No payment processing
- No customer acquisition metrics

**Scale Potential:** UNKNOWN
- No unit economics
- No growth metrics
- No market size analysis

---

## Business Model Strengths

1. **Clear Value Proposition** - Evidence-based intelligence vs. generic AI
2. **Vertical Focus** - Egypt real estate and marketing services
3. **Modular Architecture** - Easy to add new research modules
4. **Usage-Based Pricing** - Aligns cost with value
5. **Low Variable Costs** - AI costs per report are minimal

---

## Business Model Weaknesses

1. **No Revenue Generation** - Critical gap - cannot validate business
2. **No Pricing Strategy** - Plan tiers exist but no prices set
3. **No Payment Infrastructure** - No billing integration
4. **No Unit Economics** - Cannot measure CAC, LTV, margins
5. **Manual Plan Assignment** - No self-service upgrades
6. **No Churn Management** - No retention tracking
7. **No Revenue Analytics** - No financial visibility

---

## Business Model Risks

### Critical Risks

1. **Commercial Infrastructure Missing** - Cannot generate revenue
2. **Pricing Unknown** - No market validation of price points
3. **Unit Economics Unknown** - Cannot measure profitability
4. **Customer Acquisition Strategy Undefined** - No GTM plan
5. **Churn Risk** - No retention mechanisms in place

### Medium Risks

1. **Dependence on Third-Party APIs** - OpenAI, SerpAPI cost changes
2. **Single Market Focus** - Egypt concentration risk
3. **Limited Module Coverage** - Only 2 of 6 research modules live
4. **No Enterprise Features** - Cannot serve large customers

---

## Required Actions for Commercial Viability

### Immediate (Critical)

1. **Set Pricing** - Define price points for each plan tier
2. **Implement Payment Processing** - Integrate Stripe or similar
3. **Build Self-Service Checkout** - Enable plan upgrades
4. **Track Revenue** - Implement revenue analytics
5. **Measure Unit Economics** - Track CAC, LTV, churn

### Short Term

1. **Define GTM Strategy** - Document customer acquisition approach
2. **Implement Churn Tracking** - Build retention analytics
3. **Add Usage Analytics** - Track feature usage patterns
4. **Build Sales Dashboard** - Revenue and customer metrics
5. **Implement Dunning Management** - Handle failed payments

### Medium Term

1. **Expand Module Coverage** - Launch Competitor/Supplier Intelligence
2. **Add Enterprise Features** - SSO, audit logs, advanced permissions
3. **Implement Annual Billing** - Offer annual discounts
4. **Build Partner Program** - Channel sales strategy
5. **Expand Geographic Focus** - Beyond Egypt market

---

## Business Model Summary

Eunoia Platform has a clear subscription-based business model with defined plan tiers and usage tracking infrastructure. However, critical commercial infrastructure is missing: no pricing strategy, no payment processing, no revenue tracking, and no self-service upgrades. The product is production-ready but cannot generate revenue without completing the billing and payment integration. Unit economics cannot be calculated without pricing and cost data. The business model is structurally sound but commercially non-functional.

**Investment Readiness:** LOW - Cannot validate commercial viability without revenue generation capability.

**Priority:** CRITICAL - Payment and billing integration must be completed before investment due diligence.
