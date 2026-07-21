# 19 — RISK REGISTER
*Catalogued risks, evidence-based, prioritized by probability × impact.*

---

## Risk Matrix

| ID | Risk | Probability | Impact | Rating | Status |
|----|------|------------|--------|--------|--------|
| R1 | halannews.com proxy goes down during demo | HIGH | CRITICAL | CRITICAL | OPEN |
| R2 | SERPAPI quota exhausted during demo | MEDIUM | HIGH | HIGH | OPEN |
| R3 | OpenAI service unavailable | LOW | CRITICAL | HIGH | OPEN |
| R4 | Investor asks about revenue / paying customers | HIGH | HIGH | HIGH | OPEN |
| R5 | Investor clicks Market Intelligence → sees halannews.com | HIGH | HIGH | HIGH | OPEN |
| R6 | Debug logs visible in Vercel during demo | MEDIUM | MEDIUM | MEDIUM | OPEN |
| R7 | Investor reviews GitHub repo, sees PHP files | MEDIUM | MEDIUM | MEDIUM | OPEN |
| R8 | Platform cannot scale without payment system | CERTAIN | HIGH | HIGH | KNOWN GAP |
| R9 | Multi-tenant data leakage (previously fixed) | LOW | CRITICAL | MEDIUM | MITIGATED |
| R10 | Key-person risk (apparent solo developer) | HIGH | HIGH | HIGH | STRUCTURAL |

---

## Risk Detail

### R1: halannews.com Proxy Dependency — CRITICAL
**Evidence:** `app/api/demo/generate/route.ts` line 54
**Scenario:** During the investor demo, a lead fills in the exhibition form and the AI report generation fails because halannews.com is unreachable
**Fallback:** A hardcoded report text is sent instead — looks like it worked
**Investor impact:** They receive a demo report but it's static text
**Mitigation available:** Replace proxy with direct OpenAI call — 2 hours of work
**Current status:** NOT MITIGATED

### R2: SerpAPI Quota Exhausted — HIGH
**Evidence:** `lib/research/quota.ts` — SEARCH_DAILY_QUOTA env var
**Scenario:** Lead Finder demo fails silently or returns 0 results because daily quota hit
**Mitigation available:** Pre-warm cache with demo query before meeting; have fallback query ready
**Current status:** NOT MITIGATED (easy to mitigate)

### R3: OpenAI Unavailability — HIGH
**Evidence:** All AI routes use a single OpenAI client, no fallback
**Scenario:** OpenAI has a service incident on demo day; all AI features fail
**Fallback:** None for Real Estate, Lead Finder; demo route has hardcoded fallback
**Mitigation available:** Build into a contingency plan; could add Anthropic fallback
**Current status:** KNOWN ARCHITECTURAL WEAKNESS

### R4: Investor Asks "How Many Paying Customers?" — HIGH
**Evidence:** No payment system exists; `demo_leads` table has exhibition leads only
**Scenario:** Investor asks direct question about revenue or customers
**Risk:** Honest answer is "we have demo leads from an exhibition, no paying customers yet"
**Mitigation available:** Prepare honest verbal answer; frame as pre-revenue seed round
**Current status:** REQUIRES HONEST COMMUNICATION

### R5: Investor Navigates to Market Intelligence — HIGH
**Evidence:** `app/market-intelligence/page.tsx` — renders halannews.com iframe
**Scenario:** Investor sees "Market Intelligence" in the sidebar and clicks it
**Result:** They see the halannews.com news homepage in an iframe
**Impact:** Complete credibility loss — looks like a bug or a hack
**Mitigation available:** Hide nav link in 5 minutes; or redirect to analytics page
**Current status:** NOT MITIGATED — EASIEST FIX IN THIS AUDIT

### R6: Debug Logs Visible — MEDIUM
**Evidence:** `app/api/research/leads/route.ts` lines 1-3
**Scenario:** Investor asks to see production logs, or screen share shows console
**Impact:** Shows last commit was "debug leads api" — suggests instability
**Mitigation:** Remove 3 lines of code
**Current status:** NOT MITIGATED — TRIVIAL FIX

### R7: PHP Files in Repo — MEDIUM
**Evidence:** `api.php`, `auth.php`, `test.php`, `feasibility.html` in repo root
**Scenario:** Investor reviews GitHub repo during/after meeting
**Impact:** Raises questions about maturity, platform history, code quality
**Mitigation:** Delete files (5 minutes)
**Current status:** NOT MITIGATED — TRIVIAL FIX

### R8: No Revenue Mechanism — HIGH
**Evidence:** Zero payment code anywhere in repository
**Scenario:** Investor funds the company; team cannot collect revenue
**Impact:** Extended runway burn, manual plan management, no financial reporting
**Mitigation:** Stripe integration (1-2 weeks)
**Current status:** KNOWN GAP — PLANNED

### R9: Multi-Tenant Leakage (Previously Fixed) — MITIGATED
**Evidence:** Git commits `84995c2`, `f25aab8` — explicit security fixes
**Scenario:** User A sees User B's reports
**Current status:** MITIGATED — fixes confirmed in code review

### R10: Key-Person / Team Risk — STRUCTURAL
**Evidence:** Consistent single-author code style, no PR templates or team conventions
**Scenario:** If the primary developer is unavailable, development stops
**Impact:** Investor concern about execution risk
**Mitigation:** This is a team/hiring question, not a code fix
**Current status:** STRUCTURAL — requires team growth

---

## Risks That Do NOT Apply

| Risk | Why It Doesn't Apply |
|------|---------------------|
| SQL injection | Supabase SDK uses parameterized queries |
| Auth bypass | All routes verified with `supabase.auth.getUser()` |
| Cross-tenant data access (current) | Fixed in security audit commits |
| AI hallucinating financial numbers | Pre-calculation architecture prevents this |
| AI inventing fake companies in Lead Finder | Pipeline validates real sources |
| Infinite loop / runaway AI costs | Rate limiting (5/hr) + plan limits (20-300/month) |

---

## Risk Prioritization for Demo Day

**Must fix today (HIGH impact, trivial effort):**
1. R5 — Hide Market Intelligence nav link (5 min)
2. R6 — Remove debug console.logs (2 min)
3. R7 — Delete PHP/HTML files (5 min)

**Must mitigate today (HIGH impact, 2 hours):**
4. R1 — Replace halannews.com proxy with direct OpenAI (2 hrs)
5. R2 — Pre-warm Lead Finder cache (15 min)

**Prepare verbal answer (cannot fix in code):**
6. R4 — "We're pre-revenue, seeking seed funding"
7. R10 — "We're looking to expand the engineering team with this raise"
