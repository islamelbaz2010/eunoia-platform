# Database

## Database Architecture Overview

Eunoia Platform uses a dual database strategy (technical debt):
1. **Supabase (PostgreSQL)** - Primary production database
2. **Prisma ORM** - Legacy workspace management (partially implemented)

## Supabase Database (Primary)

### Connection Details

**Provider:** PostgreSQL (managed by Supabase)

**Connection String:** `DATABASE_URL` environment variable

**Connection Pooling:** PgBouncer enabled

**Project ID:** mickjkhjjmskoswqatpl (from SQL files)

### Tables

#### auth.users (Supabase Managed)

**Purpose:** User authentication and identity

**Schema:** Managed by Supabase Auth

**Columns:**
- `id` (uuid, primary key)
- `email` (text, unique)
- `encrypted_password` (text)
- `email_confirmed_at` (timestamptz)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- Additional Supabase Auth columns

**Security:** Row Level Security (RLS) managed by Supabase

**Usage:** Primary user identity for all operations

---

#### reports

**Purpose:** Store generated research and intelligence reports

**Schema File:** `supabase/reports-table.sql`

**Columns:**
```sql
- id (uuid, primary key, default gen_random_uuid())
- user_id (uuid, references auth.users(id) on delete cascade)
- report_type (text, not null)
- company_name (text, nullable)
- city (text, nullable)
- report_data (jsonb, nullable)
- created_at (timestamptz, default now())
```

**Report Types:**
- `lead_finder` - Lead Finder reports
- `talent_finder` - Talent Finder reports
- `feasibility` - Real Estate feasibility studies
- `campaign_roi` - Campaign ROI audits
- `market_entry` - Market entry intelligence
- `lead_gen` - Lead generation intelligence
- `full_analysis` - Full marketing analysis

**Security:** Row Level Security (RLS) enabled
- Policy: "Users see own reports" - `auth.uid() = user_id`

**Indexes:** None visible (potential performance issue at scale)

**Usage:** Primary report storage for all live modules

---

#### research_requests

**Purpose:** Track research request lifecycle (queue/status pipeline)

**Schema File:** `supabase/research-tables.sql`

**Columns:**
```sql
- id (uuid, primary key, default gen_random_uuid())
- user_id (uuid, references auth.users(id) on delete cascade)
- module (text, not null)
  - Values: 'lead_finder', 'talent_finder', 'market_intelligence'
- status (text, not null, default 'draft')
  - Values: 'draft', 'submitted', 'processing', 'completed', 'failed'
- input (jsonb, not null)
- result_report_id (uuid, references reports(id) on delete set null)
- error (text, nullable)
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())
- credits_used (integer, not null, default 1)
```

**Security:** Row Level Security (RLS) enabled
- Policy: "Users see own research requests" - `auth.uid() = user_id`

**Indexes:**
- `research_requests_user_id_idx` on `user_id`

**Usage:** Request tracking for Research Intelligence Hub modules

**Design Note:** Schema designed for future queue/worker implementation without schema changes

---

#### user_plans

**Purpose:** Plan enforcement infrastructure (billing not connected)

**Schema File:** `supabase/plan-enforcement.sql`

**Columns:**
```sql
- user_id (uuid, primary key, references auth.users(id) on delete cascade)
- plan (text, not null, default 'STARTER')
  - Values: 'STARTER', 'PROFESSIONAL', 'AGENCY', 'ENTERPRISE'
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())
```

**Security:** Row Level Security (RLS) enabled
- Policy: "Users see own plan" - `auth.uid() = user_id`
- No insert/update policy for authenticated users (admin-only via service role)

**Usage:** Plan assignment and enforcement

**Billing Status:** NOT connected to payment processor
- Plan assignment is manual (admin action via service role key)
- No self-service upgrade flow
- No billing webhooks

---

#### demo_leads

**Purpose:** Demo lead capture for marketing

**Schema File:** `supabase/leads-table.sql`

**Columns:**
```sql
- id (uuid, default gen_random_uuid(), primary key)
- name (text, not null)
- phone (text, nullable)
- email (text, not null)
- company (text, nullable)
- sector (text, nullable)
- city (text, nullable)
- report_data (jsonb, nullable)
- created_at (timestamptz, default now())
```

**Security:** Row Level Security (RLS) enabled
- Policy: "Service role can insert/select" - Bypasses RLS for service role

**Usage:** Demo request capture from landing page

---

## Prisma Database (Legacy)

### Connection Details

**Provider:** PostgreSQL

**Connection String:** `DATABASE_URL` and `DIRECT_URL` environment variables

**Schema File:** `prisma/schema.prisma`

**Status:** LEGACY - Partially implemented, not fully integrated

### Models

#### User

**Purpose:** Workspace user management (legacy)

**Status:** LEGACY - Not used by live routes

**Schema:**
```prisma
model User {
  id           String     @id @default(cuid())
  email        String     @unique
  name         String?
  passwordHash String?
  role         Role       @default(VIEWER)
  workspaceId  String
  workspace    Workspace  @relation(fields: [workspaceId], references: [id])
  reports      Report[]
  apiUsages    ApiUsage[]
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}
```

**Roles:**
- ADMIN
- AGENCY
- SALES
- VIEWER

**Usage:** Legacy workspace management, not integrated with Supabase auth

---

#### Workspace

**Purpose:** Workspace management (legacy)

**Status:** LEGACY - Partially used by /api/workspace endpoint

**Schema:**
```prisma
model Workspace {
  id        String   @id @default(cuid())
  name      String
  plan      Plan     @default(STARTER)
  ownerId   String
  users     User[]
  reports   Report[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Plans:**
- STARTER
- PROFESSIONAL
- ENTERPRISE

**Usage:** Partially used by workspace API, not integrated with live research routes

---

#### Report (LEGACY)

**Purpose:** Legacy report storage (retired)

**Status:** LEGACY - No longer written to by any route

**Schema:**
```prisma
model Report {
  id          String       @id @default(cuid())
  type        ReportType
  status      ReportStatus @default(QUEUED)
  input       Json
  output      Json?
  error       String?
  userId      String
  workspaceId String
  user        User         @relation(fields: [userId], references: [id])
  workspace   Workspace    @relation(fields: [workspaceId], references: [id])
  createdAt   DateTime     @default(now())
  completedAt DateTime?
  updatedAt   DateTime     @updatedAt
}
```

**Report Types:** 30 types (COMPETITOR, PRICING, CAMPAIGN, etc.)

**Status:** Kept for historical data, not used by live routes

**Note:** Current reports stored in Supabase `reports` table instead

---

#### ApiUsage (LEGACY)

**Purpose:** Legacy usage tracking for retired AI engine

**Status:** LEGACY - No longer written to by any route

**Schema:**
```prisma
model ApiUsage {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  provider    String
  model       String
  tokens      Int
  cost        Float
  reportId    String?
  createdAt   DateTime @default(now())
}
```

**Status:** Kept for historical data, not used by live routes

**Note:** Current usage tracking via `research_requests.credits_used`

---

## Database Relationships

### Supabase Relationships

```
auth.users (1) ──< (N) reports
auth.users (1) ──< (N) research_requests
auth.users (1) ──< (1) user_plans
research_requests (N) ──> (1) reports (via result_report_id)
```

### Prisma Relationships (Legacy)

```
Workspace (1) ──< (N) User
Workspace (1) ──< (N) Report
User (1) ──< (N) Report
User (1) ──< (N) ApiUsage
```

## Row Level Security (RLS)

### Enabled Tables
- `reports` - User isolation
- `research_requests` - User isolation
- `user_plans` - User read-only, admin write via service role
- `demo_leads` - Service role bypass

### RLS Policies

#### reports
```sql
CREATE POLICY "Users see own reports" ON reports
  FOR ALL USING (auth.uid() = user_id);
```

#### research_requests
```sql
CREATE POLICY "Users see own research requests" ON research_requests
  FOR ALL USING (auth.uid() = user_id);
```

#### user_plans
```sql
CREATE POLICY "Users see own plan" ON user_plans
  FOR select using (auth.uid() = user_id);
-- No insert/update policy - admin-only via service role
```

#### demo_leads
```sql
CREATE POLICY "Service role can insert" ON demo_leads
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can select" ON demo_leads
  FOR SELECT USING (true);
```

## Database Performance

### Current State
- **Connection Pooling:** PgBouncer enabled (Supabase)
- **Indexes:** Limited (only `research_requests_user_id_idx`)
- **Query Optimization:** Basic
- **Monitoring:** Not implemented

### Performance Concerns
1. **Missing indexes** on `reports.user_id` and `reports.created_at`
2. **No query analysis** - Slow query log not configured
3. **No read replicas** - Single database instance
4. **No connection monitoring** - Connection pool health unknown

### Scaling Considerations
- **Read replicas** needed for high read volume
- **Partitioning** needed for large `reports` table
- **Materialized views** for analytics queries
- **Connection pooling tuning** for high concurrency

## Database Backups

### Supabase Backups
- **Automatic backups:** Managed by Supabase
- **Point-in-time recovery:** Available (Supabase feature)
- **Backup retention:** Configured in Supabase dashboard
- **Backup verification:** Not visible in repository

### Prisma Backups
- **Status:** Not configured
- **Migration tracking:** Prisma migrations exist but not applied to production

## Database Migrations

### Supabase Migrations
**Files:** `supabase/*.sql`

**Execution:** Manual via Supabase SQL Editor

**Version Control:** SQL files tracked in Git

**Rollback:** Manual process

**Migration History:**
1. `reports-table.sql` - Report storage
2. `research-tables.sql` - Research request tracking
3. `leads-table.sql` - Demo lead capture
4. `plan-enforcement.sql` - Plan management
5. `usage-tracking.sql` - Credits tracking

### Prisma Migrations
**Status:** Not visible in repository structure

**Migration Directory:** Not present

**Schema Management:** Direct schema edits only

## Database Security

### Encryption
- **In transit:** TLS/HTTPS (Supabase managed)
- **At rest:** Encrypted (Supabase managed)

### Access Control
- **Authentication:** Supabase Auth
- **Authorization:** Row Level Security (RLS)
- **Service Role:** Admin operations bypass RLS

### Secrets Management
- **Database URL:** Environment variable
- **Service Role Key:** Environment variable
- **Anon Key:** Environment variable (public)

### Data Privacy
- **User isolation:** RLS ensures users only see their data
- **No PII in logs:** Sensitive data not logged
- **GDPR compliance:** Not explicitly implemented

## Database Technical Debt

### Critical Issues
1. **Dual database strategy** - Supabase + Prisma complexity
2. **No automated migrations** - Manual SQL execution
3. **Missing indexes** - Performance risk at scale
4. **No monitoring** - No visibility into performance
5. **Legacy models** - Retired Report/ApiUsage not removed

### Reconciliation Needed
- Prisma User/Workspace models vs Supabase auth.users
- Prisma Report model vs Supabase reports table
- Prisma plan limits vs Supabase user_plans table
- Decision point: Migrate to Supabase-only or maintain dual system

### Recommended Actions
1. Choose single database strategy (Supabase recommended)
2. Add indexes on high-traffic columns
3. Implement automated migrations
4. Add database monitoring
5. Remove legacy Prisma models if not used

## Database Summary

Eunoia Platform uses Supabase PostgreSQL as the primary production database with Row Level Security for user isolation. The schema includes tables for reports, research requests, plan enforcement, and demo leads. A legacy Prisma schema exists but is not fully integrated with live routes. Critical technical debt includes the dual database strategy, missing indexes, and lack of monitoring. The database is functional for current scale but requires optimization for enterprise-level growth.
