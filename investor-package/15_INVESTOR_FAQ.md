# Investor FAQ

## Product & Market

### Q: What problem does Eunoia solve?

A: Eunoia addresses the gap between expensive enterprise tools (Bloomberg, Gartner at $1,000+/month) and unreliable generic AI (ChatGPT, Claude which can hallucinate). We provide evidence-based marketing intelligence for mid-market companies in emerging markets (Egypt/MENA) at affordable price points.

### Q: Who is your target customer?

A: Our primary customers are SMEs and mid-size companies in Egypt across three segments: real estate developers/brokers, marketing agencies, and B2B sales/HR teams. Ideal customers have 20-500 employees, are budget-conscious but willing to pay for value, and need quick, evidence-based insights.

### Q: What's your total addressable market?

A: UNKNOWN - We have not conducted market size analysis. Our initial focus is Egypt real estate and marketing services sectors, but we have not quantified the market size.

### Q: How do you acquire customers?

A: Currently through direct sales and our demo landing page. We plan to expand to content marketing, paid advertising, and partnerships. We do not have customer acquisition cost (CAC) data yet.

### Q: What's your competitive advantage?

A: Our primary advantages are: (1) Evidence-based approach - all data from real web searches, not AI hallucinations; (2) Egypt market specialization with local benchmarks; (3) Affordable pricing for mid-market; (4) Modular Research Core Engine for rapid expansion.

---

## Technology & Product

### Q: What's your tech stack?

A: Next.js 16, React 19, TypeScript, TailwindCSS, Supabase (auth + database), OpenAI GPT-4o-mini, SerpAPI for search, Upstash Redis for caching. Deployed on Vercel.

### Q: Is your AI proprietary?

A: No, we use OpenAI GPT-4o-mini. Our proprietary component is the Research Core Engine - a multi-stage pipeline (Search → Collect → Normalize → Rank → AI Analysis) that ensures evidence-based results and prevents hallucinations.

### Q: How do you prevent AI hallucinations?

A: We use a closed-list approach where AI can only summarize real sources discovered through web search. AI cannot add, remove, or invent companies. If AI fails, we fall back to raw source excerpts. Confidence scores are based on source quality, not AI estimation.

### Q: What modules do you have live?

A: Currently live: Lead Finder, Talent Finder, Real Estate Intelligence (5 report types), Market Intelligence Hub (curated content). Planned: Competitor Intelligence, Supplier Intelligence, Recruitment Intelligence, Custom Market Intelligence.

### Q: Is your product production-ready?

A: Yes, we're live at https://ai.halannews.com with working modules, authentication, plan enforcement, and report management. However, commercial infrastructure (billing, payment processing) is not implemented.

---

## Business Model & Revenue

### Q: What's your business model?

A: Subscription-based SaaS with four tiers: Starter (20 reports/month), Professional (100 reports/month), Agency (300 reports/month), Enterprise (unlimited fair-use). Usage-based pricing aligns cost with value.

### Q: What's your pricing?

A: UNKNOWN - We have plan tiers defined but have not set actual price points. We expect to be in the $29-249/month range based on competitive positioning, but this is not validated.

### Q: Do you have paying customers?

A: No - We have production users (inferred from auth system) but payment processing is not implemented, so we cannot generate revenue.

### Q: What's your current revenue?

A: $0 - We are pre-revenue due to missing billing infrastructure.

### Q: What's your monthly recurring revenue (MRR)?

A: $0 - No billing system implemented.

### Q: What's your customer acquisition cost (CAC)?

A: UNKNOWN - No customer acquisition tracking or cost analysis.

### Q: What's your customer lifetime value (LTV)?

A: UNKNOWN - No revenue or churn data to calculate.

### Q: What's your churn rate?

A: UNKNOWN - No churn tracking implemented.

---

## Financials

### Q: What are your variable costs?

A: OpenAI costs are ~$0.0006-0.0015 per report. SerpAPI costs are unknown (not in codebase). Estimated variable cost per report is ~$0.001-0.005.

### Q: What are your fixed costs?

A: UNKNOWN - Infrastructure costs (Vercel, Supabase, Upstash) are not tracked in codebase. Development and operational costs are unknown.

### Q: What's your gross margin?

A: UNKNOWN - Cannot calculate without pricing and cost data.

### Q: Have you raised capital before?

A: UNKNOWN - No funding history visible in repository.

### Q: How much are you raising?

A: UNKNOWN - No funding ask documented in repository.

### Q: What's your runway?

A: UNKNOWN - No financial data available.

---

## Team & Operations

### Q: Who is on the team?

A: UNKNOWN - Team composition not visible in codebase or documentation.

### Q: Who are the founders?

A: UNKNOWN - Founder information not documented in repository.

### Q: What's your team size?

A: UNKNOWN - Not visible in codebase.

### Q: Do you have technical advisors?

A: UNKNOWN - Not documented in repository.

---

## Roadmap & Strategy

### Q: What's your near-term roadmap?

A: Critical priority is implementing commercial infrastructure (payment processing, pricing, revenue tracking). High priority is expanding module coverage (Competitor Intelligence, Supplier Intelligence). Medium priority is adding enterprise features (SSO, audit logs).

### Q: When will you be revenue-generating?

A: We estimate 4-6 weeks to implement payment processing and pricing, after which we can start generating revenue.

### Q: What's your go-to-market strategy?

A: Focus on Egypt market first through direct sales and demo landing page. Plan to add content marketing, paid advertising, and partnerships. No GTM documentation exists in repository.

### Q: Do you plan to expand beyond Egypt?

A: Yes, we plan to expand to MENA region (UAE, Saudi Arabia) after validating in Egypt. This is a medium-term initiative.

### Q: What's your product roadmap for the next 12 months?

A: See 20_NEXT_12_MONTH_PLAN.md for detailed roadmap. Summary: Commercial infrastructure → Module expansion → Enterprise features → MENA expansion.

---

## Technical Risks

### Q: What happens if OpenAI increases prices?

A: Our variable costs per report are very low (~$0.001-0.005), so even significant price increases would have minimal impact on unit economics. We also have provider abstraction to switch to Anthropic or Google if needed.

### Q: What happens if SerpAPI goes down?

A: We have error handling and graceful degradation. Research requests would fail with clear error messages. We could implement fallback search providers (Bing, Composio) as needed.

### Q: What's your technical debt?

A: See 17_TECHNICAL_DEBT.md for detailed analysis. Primary issues: dual database strategy (Supabase + Prisma), limited monitoring/observability, missing automated tests, no CI/CD pipeline.

### Q: Is your architecture scalable?

A: Yes, we use serverless architecture on Vercel with automatic scaling. Database is managed by Supabase with connection pooling. For enterprise scale, we would need dedicated infrastructure, read replicas, and advanced caching.

---

## Commercial Risks

### Q: What if customers don't pay for your product?

A: This is a critical risk. We have not validated willingness-to-pay. Our mitigation strategy is to start with low pricing, offer free trials, and iterate based on customer feedback.

### Q: What if competitors copy your approach?

A: Our Egypt market specialization and local benchmarks are not easily replicated by global competitors. Our Research Core Engine implementation is also non-trivial to copy. However, this is a valid risk we monitor.

### Q: What if the Egypt market doesn't adopt SaaS tools?

A: We would need to adapt our GTM strategy, potentially focusing on different markets or verticals. Our modular architecture allows us to pivot to different use cases.

### Q: What if currency devaluation affects pricing?

A: EGP depreciation is a known risk in Egypt. We can adjust pricing in local currency or move to USD pricing for stability. This is a manageable operational issue.

---

## Data & Privacy

### Q: How do you handle user data?

A: User data is isolated via Row Level Security (RLS) in Supabase. Users can only see their own data. We don't send PII to AI providers. Data is encrypted in transit and at rest.

### Q: Do you sell user data?

A: No. User data is used solely for providing the service. We have no third-party data sharing.

### Q: Are you GDPR compliant?

A: We have not explicitly implemented GDPR compliance measures. This would be required for EU expansion.

### Q: What's your data retention policy?

A: UNKNOWN - No data retention policy documented in repository.

---

## Due Diligence

### Q: Can I see your code?

A: The repository is public at https://github.com/islamelbaz2010/eunoia-platform. This investor package provides comprehensive analysis of the codebase.

### Q: Have you had a security audit?

A: UNKNOWN - No security audit documentation visible in repository.

### Q: Do you have IP protection?

A: UNKNOWN - No patent or trademark documentation visible in repository.

### Q: Are there any legal issues?

A: UNKNOWN - No legal documentation visible in repository.

### Q: Do you have customer contracts?

A: No - We have no paying customers yet.

---

## Investment

### Q: Why should I invest now?

A: The product is technically sound and production-ready with clear value proposition in an underserved market (Egypt mid-market). The primary gap is commercial infrastructure, which is a solvable execution problem rather than a fundamental product issue.

### Q: What's the biggest risk to this investment?

A: The biggest risk is commercial validation - we have not proven that customers will pay for this product at our planned price points. Technical risk is low; market risk is high due to lack of validation.

### Q: What will you use investment for?

A: UNKNOWN - No use of funds documented. Likely needs: commercial infrastructure completion, team expansion, customer acquisition, market expansion.

### Q: What's your exit strategy?

A: UNKNOWN - No exit strategy documented. Potential exits: acquisition by larger SaaS company, acquisition by regional player, IPO (long-term).

---

## Miscellaneous

### Q: How long did it take to build the product?

A: UNKNOWN - Development timeline not documented in repository.

### Q: How many users do you have?

A: UNKNOWN - User count not tracked or documented. Auth system exists but no analytics visible.

### Q: What's your user engagement?

A: UNKNOWN - No engagement metrics tracked (DAU, MAU, session duration, etc.).

### Q: Do you have case studies or testimonials?

A: UNKNOWN - No case studies or testimonials visible in repository.

### Q: What's your support model?

A: Currently email-based (hello@eunoia.eg mentioned in settings). No support ticket system or SLA defined.

---

## Summary

This FAQ addresses common investor questions based on evidence from the repository. Critical unknowns include: market size, pricing, revenue, team composition, funding history, and customer validation. The product is technically sound but commercially unvalidated. The primary investment risk is market adoption and willingness-to-pay, not technical execution.

**Investor Readiness:** LOW - Too many critical unknowns for investment due diligence.

**Priority:** CRITICAL - Must address commercial validation, pricing, and team documentation before investment.
