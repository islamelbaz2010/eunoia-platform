# Eunoia Platform - Investor Demo Script

**Generated:** July 7, 2026  
**Repository:** eunoia-platform  
**Production URL:** https://ai.halannews.com

## Demo Overview

This script guides investors through a comprehensive demonstration of the Eunoia Platform, showcasing all production-ready features in a logical flow that mirrors the user journey.

## Pre-Demo Setup

**Required Environment Variables:**
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- OPENAI_API_KEY
- SERPAPI_API_KEY (optional, for Lead Finder)
- UPSTASH_REDIS_REST_URL (optional, for rate limiting)
- RESEND_API_KEY (for Demo lead capture)

**Test Account:**
- Email: [Use test account or create new]
- Password: [Minimum 8 characters]

**Test Data:**
- Industry: Real Estate
- Location: New Cairo (القاهرة الجديدة)
- Company Size: Mid-size
- Job Title: Marketing Manager
- Skills: Digital Marketing, Social Media, Analytics

---

## Demo Script

### Section 1: Authentication (5 minutes)

**Objective:** Demonstrate secure user authentication flow

**Steps:**
1. Navigate to https://ai.halannews.com
2. Click "Sign in" in the navigation
3. Enter test credentials
4. Demonstrate session persistence
5. Show automatic redirect to dashboard

**Talking Points:**
- "We use Supabase Auth for enterprise-grade authentication"
- "Sessions are automatically refreshed via middleware"
- "Email confirmation required for new signups"
- "Row-Level Security ensures data isolation"

**Files Referenced:**
- app/(auth)/login/page.tsx
- lib/supabase/middleware.ts

---

### Section 2: Onboarding (3 minutes)

**Objective:** Show workspace initialization flow

**Steps:**
1. If new user, show onboarding page
2. Enter workspace name: "Demo Workspace"
3. Click "Continue to Dashboard"
4. Show automatic Prisma User/Workspace creation

**Talking Points:**
- "Workspaces allow team collaboration"
- "Prisma handles the bootstrap process"
- "Rate limiting prevents abuse during setup"

**Files Referenced:**
- app/dashboard/onboarding/page.tsx
- lib/prisma/init-user.ts

---

### Section 3: Dashboard Overview (5 minutes)

**Objective:** Present central hub and navigation

**Steps:**
1. Show dashboard statistics (Total Reports, This Month, Last Report)
2. Demonstrate module cards navigation
3. Show recent reports list
4. Click through to different modules

**Talking Points:**
- "Dashboard provides at-a-glance platform health"
- "Statistics are real-time from Supabase"
- "Module cards organize functionality by use case"
- "Recent reports show immediate value"

**Files Referenced:**
- app/dashboard/page.tsx
- components/dashboard/shell.tsx

---

### Section 4: Market Intelligence (4 minutes)

**Objective:** Show curated market insights (no API costs)

**Steps:**
1. Navigate to Market Intelligence
2. Show Egypt Market Trends section
3. Show Real Estate Market Trends
4. Show Marketing Industry Trends
5. Show Business Insights
6. Show Growth Opportunities

**Talking Points:**
- "Static curated insights with no live API costs"
- "Egypt-specific market intelligence"
- "Regularly updated by our team"
- "Foundation for custom research requests"

**Files Referenced:**
- app/dashboard/analytics/page.tsx

---

### Section 5: Research Hub (3 minutes)

**Objective:** Present research module navigation

**Steps:**
1. Navigate to Research Intelligence Hub
2. Show live modules (Lead Finder, Talent Finder)
3. Show coming soon modules (Competitor, Market, Supplier, Recruitment)
4. Click on Lead Finder

**Talking Points:**
- "Research Hub organizes all research modules"
- "Two modules live today, four in development"
- "Each module saves to Report History"
- "CSV/Excel export for all results"

**Files Referenced:**
- app/dashboard/research/page.tsx

---

### Section 6: Lead Finder (10 minutes)

**Objective:** Demonstrate AI-powered company discovery

**Steps:**
1. Fill in Lead Finder form:
   - Industry: Real Estate
   - Location: New Cairo
   - Company Size: Mid-size
   - Decision Maker Titles: CEO, Marketing Director
2. Click "Generate Report"
3. Show loading state with processing indicator
4. Display results:
   - Company list with confidence scores
   - Source URLs (company websites, directories)
   - Decision maker recommendations
   - LinkedIn search URLs
5. Show executive summary
6. Show confidence score explanation
7. Download CSV export

**Talking Points:**
- "Research Core Engine uses SerpAPI for real search results"
- "Companies are discovered from public sources, not AI-generated"
- "Confidence scores based on source type and taxonomy match"
- "Decision maker titles recommended by AI"
- "Results include source URLs for verification"
- "Rate limited to 5 requests per hour per user"
- "Plan enforced: 20/month on Starter, 100/month on Professional"

**Files Referenced:**
- app/dashboard/research/leads/page.tsx
- app/api/research/leads/route.ts
- lib/research/acquisition/

---

### Section 7: Talent Finder (8 minutes)

**Objective:** Show salary benchmarks and hiring intelligence

**Steps:**
1. Navigate to Talent Finder
2. Fill in form:
   - Job Title: Marketing Manager
   - Location: Cairo
   - Industry: Real Estate
   - Experience: 3-5 years
   - Skills: Digital Marketing, Social Media, Analytics
3. Click "Generate Report"
4. Display results:
   - Salary range (in EGP)
   - Hiring demand level
   - Market overview
   - Candidate sources (LinkedIn, Bayt, etc.)
   - Suggested keywords
   - Suggested candidate archetypes
5. Show estimate disclaimer
6. Download CSV export

**Talking Points:**
- "Salary ranges are AI-generated estimates from general market knowledge"
- "Uses OpenAI GPT-4o-mini for analysis"
- "Hiring demand assessment based on market conditions"
- "Candidate sources include major platforms in MENA"
- "Suggested profiles are archetypes, not real individuals"
- "Same rate limiting and plan enforcement as Lead Finder"

**Files Referenced:**
- app/dashboard/research/talent/page.tsx
- app/api/research/talent/route.ts

---

### Section 8: Real Estate Intelligence (10 minutes)

**Objective:** Demonstrate feasibility analysis for real estate

**Steps:**
1. Navigate to Real Estate module
2. Select report type: Feasibility Study
3. Fill in form:
   - Company Name: "Demo Developer"
   - City: New Cairo
   - Sector: Residential
   - Units: 200
   - Unit Area: 120 sqm
   - Land Area: 30,000 sqm
   - Sell Price: 25,000 EGP/sqm
   - Build Cost: 8,000 EGP/sqm
   - Land Cost: 150M EGP
   - Build Months: 24
   - Sales Months: 18
   - Down Payment: 20%
   - Cash Sales: 30%
4. Click "Generate Report"
5. Display results:
   - Cashflow analysis
   - ROI calculation
   - NPV and payback period
   - Viability verdict
   - Marketing recommendations
   - Risk assessment
6. Show confidence score
7. Download report

**Talking Points:**
- "Egypt-specific real estate benchmarks built in"
- "Cashflow engine calculates real numbers before AI analysis"
- "AI provides strategic recommendations on top of financial model"
- "Confidence score based on input completeness"
- "Designed for Egyptian real estate market conditions"
- "Supports multiple report types: Campaign ROI, Market Entry, Lead Gen"

**Files Referenced:**
- app/dashboard/real-estate/page.tsx
- app/api/intelligence/route.ts

---

### Section 9: Reports History (5 minutes)

**Objective:** Show report archive and export functionality

**Steps:**
1. Navigate to Reports
2. Show all generated reports from demo
3. Filter by report type
4. Click on a report to view details
5. Demonstrate CSV export
6. Show report metadata (created date, type, company)

**Talking Points:**
- "All reports saved to Supabase with RLS"
- "Report history limited to 50 most recent"
- "CSV export for all report types"
- "Reports persist across sessions"
- "User can only see their own reports"

**Files Referenced:**
- app/dashboard/reports/page.tsx
- app/dashboard/reports/reports-client.tsx
- lib/csv-export.ts

---

### Section 10: Workspace Management (4 minutes)

**Objective:** Show team collaboration features

**Steps:**
1. Navigate to Settings
2. Show workspace information
3. Show user account details
4. Explain plan system
5. Show team member list (if any)

**Talking Points:**
- "Workspaces support team collaboration"
- "Plan enforcement at user level"
- "Four plan tiers: Starter (20/mo), Professional (100/mo), Agency (300/mo), Enterprise (unlimited)"
- "Manual plan assignment today, billing webhook in roadmap"
- "Contact hello@eunoia.eg for upgrades"

**Files Referenced:**
- app/dashboard/settings/page.tsx
- app/api/workspace/route.ts
- types/plan.types.ts

---

### Section 11: Demo Lead Capture (3 minutes)

**Objective:** Show B2B exhibition lead capture (optional)

**Steps:**
1. Navigate to /demo
2. Show Arabic 3-step form
3. Fill in sample lead data
3. Submit form
4. Show success message
5. Explain email notification flow

**Talking Points:**
- "Designed for real estate exhibitions"
- "Arabic interface for local market"
- "Captures leads to Supabase demo_leads table"
- "Sends email notification via Resend"
- "Service role key bypasses RLS for lead capture"

**Files Referenced:**
- app/demo/page.tsx
- app/api/demo/route.ts

---

### Section 12: Technical Architecture (5 minutes)

**Objective:** Explain underlying technology stack

**Steps:**
1. Show repository structure
2. Explain dual database system (Supabase + Prisma)
3. Show environment variables
4. Explain AI provider strategy
5. Show security measures

**Talking Points:**
- "Next.js 16 with React 19 for modern frontend"
- "Supabase for authentication and primary database"
- "Prisma for User/Workspace bootstrap"
- "OpenAI GPT-4o-mini for AI generation"
- "SerpAPI for real search results"
- "Redis for rate limiting and caching"
- "Vercel for production deployment"
- "Row-Level Security on all Supabase tables"
- "Rate limiting: 5 requests/hour per user"
- "Plan enforcement: Monthly limits per tier"

**Files Referenced:**
- package.json
- prisma/schema.prisma
- supabase/*.sql
- lib/research/rate-limit.ts
- lib/research/plan-enforcement.ts

---

## Demo Summary

**Total Demo Time:** ~60 minutes  
**Modules Demonstrated:** 11  
**Features Shown:** 15+  

**Key Value Propositions:**
1. **AI-Powered Research:** Real search results with AI analysis
2. **Egypt Market Focus:** Localized benchmarks and insights
3. **Enterprise Security:** RLS, rate limiting, plan enforcement
4. **Modern Stack:** Next.js, Supabase, OpenAI
5. **Production Ready:** Live at https://ai.halannews.com

**Follow-Up Discussion Points:**
- Roadmap for coming soon modules
- Billing integration plans
- Enterprise customization options
- API access for partners
- White-label opportunities

---

## Contingency Plans

**If SerpAPI Fails:**
- Lead Finder will show graceful degradation message
- Explain optional nature of SerpAPI

**If OpenAI Fails:**
- Talent Finder and Real Estate will show error
- Explain API key requirement

**If Redis Unavailable:**
- Rate limiting fails open (allows requests)
- Explain fail-safe design

**If Supabase Fails:**
- Plan enforcement fails open (allows requests)
- Explain fail-safe design

---

## Post-Demo Materials

**Handouts:**
- Feature Matrix (02_FEATURE_MATRIX.md)
- Production Readiness Assessment (05_PRODUCTION_READY.md)
- Executive Summary (08_EXECUTIVE_SUMMARY.md)

**Access:**
- Test account credentials
- API documentation (if available)
- Repository access (if approved)
