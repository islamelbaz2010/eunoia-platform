# API Reference

## Base URL

**Production:** https://ai.halannews.com

**Local:** http://localhost:3000

## Authentication

All API routes require authentication via Supabase JWT token.

**Header:** `Authorization: Bearer <token>`

**Token Source:** Supabase auth session

## API Endpoints

### Research API

#### POST /api/research/leads

Generate lead finder research report.

**Authentication:** Required

**Rate Limit:** Per-user rate limit via Redis

**Plan Limit:** Enforced per user plan tier

**Request Body:**
```json
{
  "industry": "string (required)",
  "location": "string (required)",
  "companySize": "string (required)",
  "titles": "string (required, comma-separated)"
}
```

**Parameters:**
- `industry` - Industry sector (e.g., "Technology", "Real Estate")
- `location` - City name (e.g., "Cairo", "Dubai")
- `companySize` - Company size bucket (e.g., "startup", "sme", "mid-size", "enterprise")
- `titles` - Decision-maker job titles (comma-separated, max 3)

**Response (Success 200):**
```json
{
  "success": true,
  "report": {
    "search_criteria": {
      "industry": "string",
      "location": "string",
      "company_size": "string",
      "titles": "string"
    },
    "executive_summary": "string",
    "research_summary": "string",
    "companies": [
      {
        "name": "string",
        "sourceUrl": "string",
        "sourceType": "company_website | business_directory | public_listing",
        "confidenceScore": 0-100,
        "summary": "string",
        "linkedin_company_search_url": "string",
        "decision_makers": [
          {
            "title": "string",
            "reason": "string",
            "linkedin_search_url": "string"
          }
        ]
      }
    ],
    "outreach_disclaimer": "string",
    "confidence_score": {
      "pct": 0-100,
      "label": "High | Medium | Low",
      "reason": "string"
    },
    "total_sources_found": 0,
    "total_sources_collected": 0,
    "total_sources_validated": 0,
    "total_sources_deduped": 0,
    "total_sources_expanded": 0
  }
}
```

**Response (Errors):**
- `401 Unauthorized` - Missing or invalid authentication
- `400 Bad Request` - Missing required fields
- `429 Too Many Requests` - Rate limit exceeded
- `403 Forbidden` - Plan limit exceeded
- `502 Bad Gateway` - Search provider error

**Implementation:** `app/api/research/leads/route.ts`

---

#### POST /api/research/talent

Generate talent finder research report.

**Authentication:** Required

**Rate Limit:** Per-user rate limit via Redis

**Plan Limit:** Enforced per user plan tier

**Request Body:**
```json
{
  "jobTitle": "string (required)",
  "location": "string (required)",
  "industry": "string (required)",
  "experience": "string (required)",
  "skills": "string (required)"
}
```

**Parameters:**
- `jobTitle` - Target job title (e.g., "Software Engineer", "Marketing Manager")
- `location` - City name (e.g., "Cairo", "Dubai")
- `industry` - Industry sector
- `experience` - Experience level (e.g., "entry", "mid", "senior")
- `skills` - Required skills (comma-separated)

**Response (Success 200):**
```json
{
  "success": true,
  "report": {
    "search_criteria": {
      "job_title": "string",
      "location": "string",
      "industry": "string",
      "experience": "string",
      "skills": "string"
    },
    "executive_summary": "string",
    "market_overview": "string",
    "salary_range": {
      "min": 0,
      "max": 0,
      "currency": "string",
      "period": "month | year",
      "notes": "string"
    },
    "hiring_demand": {
      "level": "High | Medium | Low",
      "trend": "string",
      "notes": "string"
    },
    "candidate_sources": [
      {
        "name": "string",
        "url": "string",
        "type": "string"
      }
    ],
    "suggested_keywords": ["string"],
    "suggested_profiles": [
      {
        "archetype": "string",
        "background": "string"
      }
    ],
    "estimate_disclaimer": "string",
    "confidence_score": {
      "pct": 0-100,
      "label": "High | Medium | Low",
      "reason": "string"
    }
  }
}
```

**Response (Errors):**
- `401 Unauthorized` - Missing or invalid authentication
- `400 Bad Request` - Missing required fields
- `429 Too Many Requests` - Rate limit exceeded
- `403 Forbidden` - Plan limit exceeded
- `500 Internal Server Error` - AI generation failed

**Implementation:** `app/api/research/talent/route.ts`

---

### Intelligence API

#### POST /api/intelligence

Generate real estate intelligence report.

**Authentication:** Required

**Rate Limit:** Per-user rate limit via Redis

**Plan Limit:** Enforced per user plan tier

**Request Body:**
```json
{
  "reportType": "feasibility | campaign_roi | market_entry | lead_gen | full_analysis",
  "projectName": "string",
  "city": "string",
  "units": 0,
  "unitArea": 0,
  "landArea": 0,
  "sellPriceSqm": 0,
  "buildCostSqm": 0,
  "landCost": 0,
  "buildMonths": 0,
  "salesMonths": 0,
  "downPaymentPct": 0,
  "cashSalesPct": 0
}
```

**Parameters:**
- `reportType` - Type of intelligence report
- `projectName` - Project name
- `city` - City name (affects multipliers)
- `units` - Number of units
- `unitArea` - Area per unit (sqm)
- `landArea` - Total land area (sqm)
- `sellPriceSqm` - Selling price per sqm
- `buildCostSqm` - Construction cost per sqm
- `landCost` - Total land cost
- `buildMonths` - Construction timeline (months)
- `salesMonths` - Sales timeline (months)
- `downPaymentPct` - Down payment percentage
- `cashSalesPct` - Cash sales percentage

**Response (Success 200):**
```json
{
  "success": true,
  "report": {
    "project_name": "string",
    "city": "string",
    "report_type": "string",
    "cashflow": {
      "totalBUA": 0,
      "totalLandArea": 0,
      "totalRevenue": 0,
      "netRevenue": 0,
      "totalCost": 0,
      "grossProfit": 0,
      "netProfit": 0,
      "roi": 0,
      "roiAnnual": 0,
      "npv": 0,
      "paybackYears": 0
    },
    "viability": {
      "isViable": true,
      "reason": "string"
    },
    "benchmarks": {
      "cpl_meta": "string",
      "avg_margin": "string",
      "decision_cycle": "string"
    },
    "ai_analysis": "string"
  }
}
```

**Response (Errors):**
- `401 Unauthorized` - Missing or invalid authentication
- `400 Bad Request` - Missing required fields
- `500 Internal Server Error` - Calculation or AI error

**Implementation:** `app/api/intelligence/route.ts`

---

### Workspace API

#### GET /api/workspace

Get user workspace information.

**Authentication:** Required

**Response (Success 200):**
```json
{
  "id": "string",
  "name": "string",
  "plan": "STARTER | PROFESSIONAL | ENTERPRISE",
  "ownerId": "string",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "users": [
    {
      "id": "string",
      "email": "string",
      "name": "string | null",
      "role": "ADMIN | AGENCY | SALES | VIEWER",
      "workspaceId": "string",
      "createdAt": "ISO-8601"
    }
  ],
  "_count": {
    "reports": 0
  }
}
```

**Response (Errors):**
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Workspace not found
- `500 Internal Server Error` - Database error

**Implementation:** `app/api/workspace/route.ts`

---

### User API

#### POST /api/users/init

Initialize user and workspace.

**Authentication:** Required

**Request Body:**
```json
{
  "workspaceName": "string (optional)"
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "workspaceId": "string"
}
```

**Response (Errors):**
- `401 Unauthorized` - Missing or invalid authentication
- `400 Bad Request` - Invalid request
- `500 Internal Server Error` - Database error

**Implementation:** `app/api/users/init/route.ts`

---

### Demo API

#### POST /api/demo

Capture demo lead.

**Authentication:** Not required

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "phone": "string (required)",
  "company": "string (optional)",
  "sector": "string (optional)",
  "city": "string (optional)"
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Lead captured successfully",
  "saved_to_db": true
}
```

**Response (Errors):**
- `400 Bad Request` - Missing required fields
- `500 Internal Server Error` - Email or database error

**Implementation:** `app/api/demo/route.ts`

---

## Rate Limiting

### Rate Limit Headers

Rate-limited endpoints return these headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Response

When rate limit is exceeded:

```json
{
  "error": "Rate limit exceeded. Try again in {resetIn} seconds.",
  "resetIn": 3600
}
```

**Status Code:** 429 Too Many Requests

---

## Plan Limits

### Plan Enforcement

Research endpoints check monthly plan limits before processing.

### Plan Limit Response

When plan limit is exceeded:

```json
{
  "error": "Monthly plan limit reached ({used}/{limit} reports used this month on the {plan} plan). Upgrade your plan to continue.",
  "used": 20,
  "limit": 20,
  "plan": "STARTER"
}
```

**Status Code:** 403 Forbidden

### Plan Tiers

| Plan | Reports/Month | Status |
|------|---------------|--------|
| Starter | 20 | Default |
| Professional | 100 | Manual assignment |
| Agency | 300 | Manual assignment |
| Enterprise | Unlimited (fair-use) | Manual assignment |

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message description"
}
```

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Plan limit exceeded |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 502 | Bad Gateway - External service error |

---

## Search Quota

### Daily Search Quota

Research endpoints consume from a shared daily search quota.

**Default:** 150 searches/day

**Per-user fair-share:** 30 searches/day

### Quota Exhausted Response

```json
{
  "error": "Daily search quota exhausted ({used}/{limit} queries used today)"
}
```

**Status Code:** 502 Bad Gateway

---

## Caching

### Cache Behavior

Research endpoints cache results by input hash.

**Cache Key:** `research:acquisition:{hash}`

**TTL:** 24 hours (configurable)

**Cache Hit:** Returns cached result without API calls

**Cache Miss:** Executes full pipeline and caches result

---

## Webhooks

**Status:** Not implemented

No webhook endpoints are currently available.

---

## SDKs

**Status:** Not available

No official SDKs are currently provided. API is REST-only.

---

## API Versioning

**Current Version:** v1 (implicit)

**Versioning Strategy:** URL path versioning not implemented

**Breaking Changes:** Not communicated via versioning

---

## API Security

### Authentication Methods
- Supabase JWT token (Bearer token)

### Security Headers
- All endpoints require HTTPS in production
- CORS configured for allowed origins

### Data Privacy
- User data isolated via Row Level Security (RLS)
- No sensitive data in API responses
- Service role keys for admin operations only

---

## API Limitations

### Current Limitations
1. **No pagination** - All results returned in single response
2. **No bulk operations** - One report per request
3. **No async processing** - Synchronous only (no job queue)
4. **No webhook notifications** - No callback support
5. **No API keys** - JWT token auth only
6. **No rate limit customization** - Fixed limits per plan

### Enterprise Requirements (Not Implemented)
1. **Higher rate limits** - Custom limits per enterprise
2. **Dedicated endpoints** - Isolated infrastructure
3. **SLA guarantees** - Uptime commitments
4. **Priority processing** - Queue prioritization
5. **Advanced analytics** - Usage analytics API

---

## API Summary

The Eunoia API provides RESTful endpoints for research intelligence, real estate analysis, and user management. All endpoints require Supabase JWT authentication. Rate limiting and plan enforcement are applied to research endpoints. The API is production-ready but lacks enterprise features like webhooks, async processing, and advanced analytics.
