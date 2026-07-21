# Demo Script

## Demo Overview

This script provides a structured walkthrough of the Eunoia Platform for investor demonstrations. The demo showcases the live production environment at https://ai.halannews.com.

**Demo Duration:** 15-20 minutes

**Demo Environment:** Production (https://ai.halannews.com)

**Pre-Demo Requirements:**
- Supabase auth configured
- Test user account created
- API keys configured (OPENAI_API_KEY, SERPAPI_API_KEY)
- Redis configured (Upstash)

---

## Demo Script

### Section 1: Introduction (2 minutes)

**Speaker:** Founder/CTO

**Script:**
"Eunoia Platform is an AI-powered Marketing Intelligence SaaS designed for sales teams, hiring teams, and real estate professionals in emerging markets. We focus on Egypt and the MENA region, providing evidence-based research that combines real web search data with AI analysis.

Our key differentiator is that we don't rely on AI hallucinations - every company in our results is discovered through real web searches, with confidence scores based on source quality. We're positioned between expensive enterprise tools and unreliable generic AI, serving the mid-market that's underserved today."

**Visuals:**
- Landing page at https://ai.halannews.com
- Product overview slide

---

### Section 2: Authentication & Onboarding (2 minutes)

**Speaker:** Founder/CTO

**Script:**
"Let me walk you through the user experience. Users sign up via Supabase authentication, create a workspace, and are immediately assigned to our Starter plan with 20 monthly reports. The onboarding is self-service - no sales call required."

**Action:**
- Navigate to /login or /signup
- Show authentication flow
- Show workspace creation page (/dashboard/onboarding)
- Show dashboard after onboarding

**Visuals:**
- Login/signup page
- Workspace creation form
- Dashboard landing page

**Key Points:**
- Self-service onboarding
- Supabase authentication
- Immediate access to all features
- Plan assignment (manual today, will be automated with billing)

---

### Section 3: Dashboard Overview (2 minutes)

**Speaker:** Founder/CTO

**Script:**
"Here's the main dashboard. Users can see their total reports, reports generated this month, and recent activity. The platform is organized into three main hubs: Research Intelligence, Real Estate Intelligence, and Market Intelligence."

**Action:**
- Show dashboard (/dashboard)
- Highlight statistics cards
- Show module navigation
- Show recent reports list

**Visuals:**
- Dashboard with stats
- Module cards (Reports, Real Estate, Research Intelligence, Market Intelligence)
- Recent reports section

**Key Points:**
- Clear usage tracking
- Module-based navigation
- Report history accessible
- Clean, intuitive UI

---

### Section 4: Lead Finder Demo (4 minutes)

**Speaker:** Founder/CTO

**Script:**
"Our flagship module is Lead Finder. Let me show you how it works. Users specify their target industry, location, company size, and the decision-maker titles they're looking for. The system then runs our Research Core Engine, which performs Google searches, collects and validates sources, deduplicates companies, ranks them by relevance, and uses AI to summarize each company."

**Action:**
- Navigate to /dashboard/research/leads
- Fill in form:
  - Industry: "Real Estate"
  - Location: "New Cairo"
  - Company Size: "Mid-size"
  - Titles: "CEO, Marketing Director"
- Submit request
- Show loading state
- Show results

**Visuals:**
- Lead Finder form
- Loading skeleton
- Results with company cards
- Confidence scores
- Decision-maker recommendations
- LinkedIn search URLs

**Key Points:**
- Evidence-based from real web searches
- Confidence scoring based on source quality
- Decision-maker title recommendations
- LinkedIn integration for outreach
- CSV export available

**Technical Note:** Explain the Research Core Engine pipeline (Search → Collect → Normalize → Validate → Dedup → Rank → AI Analysis)

---

### Section 5: Talent Finder Demo (3 minutes)

**Speaker:** Founder/CTO

**Script:**
"Talent Finder addresses a different use case - HR teams need salary benchmarks and hiring demand analysis. Users specify the job title, location, industry, experience level, and required skills. Our AI analyzes the market and provides salary ranges, demand levels, and candidate sourcing channels."

**Action:**
- Navigate to /dashboard/research/talent
- Fill in form:
  - Job Title: "Software Engineer"
  - Location: "Cairo"
  - Industry: "Technology"
  - Experience: "Mid-level"
  - Skills: "React, Node.js, Python"
- Submit request
- Show results

**Visuals:**
- Talent Finder form
- Results with salary ranges
- Hiring demand analysis
- Candidate archetypes
- Sourcing channels

**Key Points:**
- AI-generated salary estimates (clearly labeled as estimates)
- Hiring demand analysis
- Candidate archetypes (not real individuals)
- Sourcing channel recommendations
- Egypt market context

**Disclaimer:** Emphasize that salary ranges are AI estimates from general market knowledge, not verified payroll data.

---

### Section 6: Real Estate Intelligence Demo (3 minutes)

**Speaker:** Founder/CTO

**Script:**
"For our Egypt market focus, we've built specialized Real Estate Intelligence. This includes feasibility studies, campaign ROI analysis, and market entry intelligence. The module uses a cashflow engine with Egypt-specific benchmarks - city multipliers, CPL data, and market trends."

**Action:**
- Navigate to /dashboard/real-estate
- Select "Feasibility Study"
- Fill in form:
  - Project Name: "Demo Project"
  - City: "New Administrative Capital"
  - Units: 100
  - Unit Area: 120
  - Sell Price: 25,000 EGP/sqm
  - Build Cost: 8,000 EGP/sqm
  - Land Cost: 10,000,000 EGP
  - Build Months: 24
  - Sales Months: 18
- Submit request
- Show results

**Visuals:**
- Real Estate form
- Cashflow calculations
- Viability assessment
- ROI and NPV
- Egypt benchmarks

**Key Points:**
- Egypt-specific benchmarks
- Cashflow engine
- Viability assessment
- City multipliers (New Capital, 6th of October, etc.)
- Bilingual support (Arabic/English)

---

### Section 7: Market Intelligence Hub (1 minute)

**Speaker:** Founder/CTO

**Script:**
"Finally, our Market Intelligence Hub provides curated market trends and insights for Egypt. This is static content with no live API costs, giving users immediate access to market intelligence without consuming their report quota."

**Action:**
- Navigate to /dashboard/analytics
- Show different sections
- Highlight Egypt Market Trends
- Show Real Estate Market Trends

**Visuals:**
- Market Intelligence Hub
- Trend cards by category
- Curated insights

**Key Points:**
- Curated content (no live API costs)
- Egypt market focus
- Multiple categories (economy, real estate, marketing, business)
- No quota consumption

---

### Section 8: Report History & Export (1 minute)

**Speaker:** Founder/CTO

**Script:**
"All reports are saved to the user's history, where they can be filtered, viewed, and exported to CSV for further analysis."

**Action:**
- Navigate to /dashboard/reports
- Show report list
- Show filtering options
- Demonstrate CSV export

**Visuals:**
- Report history page
- Filter controls
- Export button

**Key Points:**
- All reports saved permanently
- Filter by type and date
- CSV export for analysis
- Per-user data isolation (RLS)

---

### Section 9: Technical Architecture (2 minutes)

**Speaker:** Founder/CTO

**Script:**
"From a technical perspective, we're built on Next.js 16 with React 19, using Supabase for authentication and database, and OpenAI GPT-4o-mini for AI analysis. Our Research Core Engine is a modular pipeline that can be reused across different research modules, enabling rapid expansion of our product offering."

**Visuals:**
- Architecture diagram (if available)
- Tech stack slide
- Database schema overview

**Key Points:**
- Modern tech stack (Next.js, React, TypeScript)
- Supabase for auth and database
- OpenAI for AI analysis
- Modular Research Core Engine
- Serverless deployment on Vercel

---

### Section 10: Business Model & Roadmap (2 minutes)

**Speaker:** Founder/CTO

**Script:**
"Our business model is subscription-based with four tiers: Starter (20 reports), Professional (100 reports), Agency (300 reports), and Enterprise (unlimited). We're currently in the process of implementing payment processing and self-service upgrades. Our roadmap focuses on completing commercial infrastructure, expanding our module coverage, and adding enterprise features."

**Visuals:**
- Pricing slide (hypothetical pricing)
- Roadmap timeline
- Module expansion plan

**Key Points:**
- Subscription-based pricing
- Four plan tiers
- Usage-based limits
- Roadmap: Commercial infrastructure → Module expansion → Enterprise features

**Disclaimer:** Be transparent that pricing is not yet set and payment processing is not implemented.

---

## Demo Preparation Checklist

### Pre-Demo Setup

- [ ] Verify production environment is accessible (https://ai.halannews.com)
- [ ] Ensure API keys are configured (OPENAI_API_KEY, SERPAPI_API_KEY)
- [ ] Verify Redis is configured (Upstash)
- [ ] Create test user account
- [ ] Verify test user has report quota available
- [ ] Test Lead Finder end-to-end
- [ ] Test Talent Finder end-to-end
- [ ] Test Real Estate Intelligence end-to-end
- [ ] Prepare architecture diagram
- [ ] Prepare pricing slide (with disclaimer)
- [ ] Prepare roadmap timeline

### During Demo

- [ ] Monitor for API rate limits
- [ ] Have backup data if APIs fail
- [ ] Be transparent about AI-generated estimates
- [ ] Emphasize evidence-based approach
- [ ] Highlight Egypt market specialization
- [ ] Disclose missing features (billing, enterprise features)

### Post-Demo

- [ ] Follow up with requested materials
- [ ] Schedule technical deep-dive if requested
- [ ] Provide access to test environment if appropriate
- [ ] Document investor questions and feedback

---

## Demo FAQ Preparation

### Common Questions

**Q: How do you prevent AI hallucinations?**
A: We use a closed-list approach where AI can only summarize real sources discovered through web search. AI cannot add, remove, or invent companies. If AI fails, we fall back to raw source excerpts.

**Q: What's your go-to-market strategy?**
A: We're focused on the Egypt market first, targeting real estate developers, marketing agencies, and SME sales teams. We plan to expand to MENA after validating in Egypt.

**Q: How do you acquire customers?**
A: Currently through direct sales and our demo landing page. We plan to add content marketing, paid advertising, and partnerships as we scale.

**Q: What's your pricing?**
A: We have plan tiers defined (Starter, Professional, Agency, Enterprise) but are still validating pricing. We expect to be in the $29-249/month range, significantly below enterprise tools.

**Q: How do you handle data privacy?**
A: User data is isolated via Row Level Security in Supabase. We don't send PII to AI providers. All data is encrypted in transit and at rest.

**Q: What's your competitive moat?**
A: Our Egypt market specialization and evidence-based approach. We have local benchmarks and city data that global competitors don't have, and our technical implementation prevents AI hallucinations.

**Q: What's your current revenue?**
A: We're pre-revenue as payment processing is not yet implemented. We have production users but no paying customers yet.

**Q: What's your team size?**
A: [Provide actual team size - not visible in codebase]

**Q: How long until you're revenue-generating?**
A: We estimate 4-6 weeks to implement payment processing and pricing, after which we can start generating revenue.

---

## Demo Script Summary

This demo script provides a comprehensive walkthrough of the Eunoia Platform, covering authentication, dashboard, all three live modules (Lead Finder, Talent Finder, Real Estate Intelligence), report management, technical architecture, and business model. The demo is designed to be 15-20 minutes and showcases the production environment. Key emphasis is placed on the evidence-based approach, Egypt market specialization, and modular architecture. Transparency is maintained about missing features (billing, enterprise features) and AI-generated estimates.

**Investor Readiness:** HIGH - Demo is well-structured and showcases live production functionality.

**Recommendation:** Use this script for investor demonstrations, with transparency about current limitations (no revenue, no billing).
