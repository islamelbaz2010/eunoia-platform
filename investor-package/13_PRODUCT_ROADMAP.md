# Product Roadmap

## Roadmap Overview

This roadmap is based on evidence from the repository codebase, documentation, and planned features. It reflects the current state of the Eunoia Platform and identified future work.

## Current Status (Q1 2026)

### Live Modules (Production Ready)
- ✅ Lead Finder
- ✅ Talent Finder
- ✅ Real Estate Intelligence (5 report types)
- ✅ Market Intelligence Hub (curated content)
- ✅ Authentication and User Management
- ✅ Plan Enforcement Infrastructure
- ✅ Report Management
- ✅ Rate Limiting
- ✅ Search Quota Management
- ✅ Caching

### Planned Modules (Not Started)
- ⏳ Competitor Intelligence
- ⏳ Supplier Intelligence
- ⏳ Recruitment Intelligence
- ⏳ Custom Market Intelligence Research

### Missing Infrastructure
- ❌ Billing and Payment Processing
- ❌ Self-Service Plan Upgrades
- ❌ Enterprise Features (SSO, Audit Logs)
- ❌ Advanced Analytics
- ❌ CRM Integrations

---

## Q2 2026 (Immediate Priorities)

### Critical Path - Commercial Infrastructure

**Priority:** CRITICAL - Blocks revenue generation

**Items:**
1. **Payment Processing Integration**
   - Integrate Stripe or similar payment processor
   - Build checkout flow for plan upgrades
   - Implement recurring billing logic
   - Add invoice generation
   - Handle payment failures and dunning

2. **Pricing Strategy Implementation**
   - Set price points for each plan tier
   - Implement annual billing with discounts
   - Add overage handling (pay-per-report or upgrade)
   - Build enterprise pricing customization flow
   - Create public pricing page

3. **Revenue Tracking**
   - Implement revenue analytics dashboard
   - Track MRR, ARR, churn
   - Build financial reporting
   - Add customer lifetime value tracking

**Estimated Effort:** 4-6 weeks

**Dependencies:** None (can start immediately)

**Owner:** UNKNOWN (not assigned in codebase)

---

### High Priority - Module Expansion

**Priority:** HIGH - Addresses customer demand

**Items:**
1. **Competitor Intelligence Module**
   - Reuse Legacy AI Engine prompts (competitor.prompt.ts exists)
   - Integrate with Research Core Engine
   - Build UI in Research Intelligence Hub
   - Add to report types
   - Test and deploy

2. **Supplier Intelligence Module**
   - Design research pipeline for supplier discovery
   - Integrate with Research Core Engine
   - Build UI
   - Add to report types
   - Test and deploy

**Estimated Effort:** 3-4 weeks per module

**Dependencies:** Research Core Engine (complete)

**Owner:** UNKNOWN (not assigned in codebase)

---

## Q3 2026 (Short Term)

### Medium Priority - Feature Enhancements

**Items:**
1. **Recruitment Intelligence Module**
   - Full-cycle hiring pipeline research
   - Candidate sourcing integration
   - Interview scheduling (basic)
   - Offer management (basic)

2. **Custom Market Intelligence Research**
   - On-demand market sizing
   - Custom report types
   - Advanced query builder
   - White-label options

3. **Enterprise Features**
   - SSO integration (SAML/OIDC)
   - Audit logging
   - Advanced permissions
   - Admin dashboard
   - SLA monitoring

**Estimated Effort:** 6-8 weeks

**Dependencies:** Commercial infrastructure complete

---

### Medium Priority - Integrations

**Items:**
1. **CRM Integrations**
   - HubSpot integration
   - Salesforce integration
   - Pipedrive integration

2. **Email Integrations**
   - Gmail integration
   - Outlook integration
   - Email sequence automation

3. **Slack Integration**
   - Report notifications
   - Team collaboration
   - Alerting

**Estimated Effort:** 4-6 weeks

**Dependencies:** Enterprise features foundation

---

## Q4 2026 (Medium Term)

### Lower Priority - Market Expansion

**Items:**
1. **MENA Region Expansion**
   - Add UAE cities and benchmarks
   - Add Saudi Arabia cities and benchmarks
   - Local currency support (AED, SAR)
   - Arabic dialect variations

2. **Vertical Expansion**
   - Add more industry verticals
   - Healthcare benchmarks
   - Fintech benchmarks
   - E-commerce benchmarks

3. **Advanced Analytics**
   - Usage analytics dashboard
   - Customer health scoring
   - Churn prediction
   - Cohort analysis

**Estimated Effort:** 8-12 weeks

**Dependencies:** Core platform stable

---

## 2027 (Long Term)

### Strategic Initiatives

**Items:**
1. **Platform Expansion**
   - API for third-party integrations
   - Marketplace for custom modules
   - Partner program
   - White-label offering

2. **AI Enhancements**
   - Multi-provider support (Anthropic, Google)
   - Fine-tuning for Egypt market
   - Advanced RAG with knowledge base
   - Model selection optimization

3. **Advanced Features**
   - Real-time collaboration
   - Team workspaces
   - Shared reports
   - Commenting and annotations

**Estimated Effort:** 12-16 weeks

**Dependencies:** Market validation in Egypt

---

## Technical Debt Roadmap

### Immediate (Q2 2026)

**Items:**
1. **Database Reconciliation**
   - Choose single database strategy (Supabase recommended)
   - Migrate or remove Prisma legacy models
   - Update all routes to use single database
   - Remove dual database complexity

2. **Monitoring and Observability**
   - Add APM (Application Performance Monitoring)
   - Implement structured logging
   - Add uptime monitoring
   - Set up alerting

3. **Testing Infrastructure**
   - Add integration tests
   - Add E2E tests with Playwright
   - Increase unit test coverage
   - Set up CI/CD pipeline with automated tests

**Estimated Effort:** 4-6 weeks

---

### Short Term (Q3 2026)

**Items:**
1. **Performance Optimization**
   - Add database indexes
   - Implement read replicas for high read volume
   - Optimize API response times
   - Add CDN for static assets

2. **Security Enhancements**
   - Add security headers
   - Implement CSRF protection
   - Add input validation framework
   - Security audit

3. **Documentation**
   - API documentation (OpenAPI/Swagger)
   - Architecture documentation
   - User guides
   - Developer documentation

**Estimated Effort:** 4-6 weeks

---

## Dependencies and Blockers

### Critical Blockers

1. **Payment Integration** - Blocks all revenue generation
2. **Pricing Strategy** - Cannot sell without pricing
3. **Database Reconciliation** - Creates technical debt and complexity

### Medium Blockers

1. **Enterprise Features** - Blocks enterprise customer acquisition
2. **Module Coverage** - Incomplete product offering
3. **Monitoring** - No visibility into production issues

---

## Resource Requirements

### Engineering Resources

**Current Team Size:** UNKNOWN (not visible in codebase)

**Estimated Requirements:**
- 1-2 Full-stack developers for commercial infrastructure
- 1 Backend developer for integrations
- 1 Frontend developer for UI enhancements
- 1 DevOps engineer for infrastructure

**Timeline:** 6-9 months to complete Q2-Q4 roadmap

---

### Product Resources

**Current Team Size:** UNKNOWN (not visible in codebase)

**Estimated Requirements:**
- 1 Product manager for roadmap prioritization
- 1 Designer for UI/UX enhancements
- 1 Content writer for documentation and marketing

---

### Go-to-Market Resources

**Current Team Size:** UNKNOWN (not visible in codebase)

**Estimated Requirements:**
- 1 Sales lead for Egypt market
- 1 Customer success manager
- 1 Marketing lead for content and campaigns

---

## Risk Mitigation

### Technical Risks

1. **Dual Database Complexity**
   - **Mitigation:** Prioritize database reconciliation in Q2
   - **Contingency:** Freeze Prisma usage, migrate to Supabase-only

2. **Third-Party API Dependencies**
   - **Mitigation:** Implement fallbacks and caching
   - **Contingency:** Multi-provider support for AI and search

3. **Scaling Challenges**
   - **Mitigation:** Add monitoring and optimization early
   - **Contingency:** Move to dedicated infrastructure if needed

---

### Commercial Risks

1. **Pricing Validation**
   - **Mitigation:** A/B test pricing with early customers
   - **Contingency:** Adjust pricing based on feedback

2. **Market Adoption**
   - **Mitigation:** Focus on Egypt market first
   - **Contingency:** Pivot to different vertical if needed

3. **Competitive Response**
   - **Mitigation:** Deepen Egypt market specialization
   - **Contingency:** Accelerate module expansion

---

## Success Metrics

### Q2 2026 Metrics

- Payment processing live
- First paying customer
- Pricing validated
- Revenue tracking operational

### Q3 2026 Metrics

- Competitor Intelligence launched
- 10 paying customers
- $1,000 MRR
- Churn rate <10%

### Q4 2026 Metrics

- 50 paying customers
- $5,000 MRR
- 2 new modules launched
- Enterprise features available

### 2027 Metrics

- 200 paying customers
- $20,000 MRR
- MENA expansion launched
- Platform API available

---

## Roadmap Summary

The Eunoia Platform roadmap prioritizes commercial infrastructure (payment processing, pricing) as the critical path for Q2 2026, as this blocks revenue generation. Module expansion (Competitor Intelligence, Supplier Intelligence) is high priority for Q2-Q3. Enterprise features, integrations, and market expansion are planned for Q3-Q4 2026. Technical debt (database reconciliation, monitoring, testing) must be addressed in parallel. Long-term initiatives (2027) include platform expansion, AI enhancements, and advanced features. The roadmap is evidence-based from repository analysis but lacks committed timelines and resource assignments.

**Investment Readiness:** MODERATE - Clear roadmap but unvalidated priorities and no resource commitments.

**Priority:** HIGH - Commercial infrastructure must be completed before investment can be validated.
