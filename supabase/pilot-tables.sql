-- Pilot Infrastructure — Eunoia Platform Controlled Pilot v1.0
-- Run this in Supabase SQL Editor (Project ID: mickjkhjjmskoswqatpl)
--
-- Three new tables + two new columns on existing `reports` table.
-- All tables are admin-only: RLS is enabled, no policies for regular users.
-- Admin operations use the service-role key which bypasses RLS.
-- Run-once safe: all statements use IF NOT EXISTS / IF EXISTS guards.

-- ──────────────────────────────────────────────────────────────────
-- 1. Persist DI engine output on the reports table
--    The decisionReport (system recommendation + confidence + fired
--    rules) is currently lost after the API response. These two
--    columns make it queryable for pilot review and metrics.
-- ──────────────────────────────────────────────────────────────────

alter table reports add column if not exists decision_report jsonb;
alter table reports add column if not exists trust_score integer;

-- ──────────────────────────────────────────────────────────────────
-- 2. pilot_submissions
--    One row per controlled pilot submission. Created by the admin
--    after the submission has been processed, linking the pilot record
--    to the existing research_requests + reports rows.
-- ──────────────────────────────────────────────────────────────────

create table if not exists pilot_submissions (
  id                      uuid        primary key default gen_random_uuid(),

  -- Pilot identity
  pilot_id                text        not null unique,  -- 'PILOT-01' through 'PILOT-20'

  -- Links to existing pipeline tables
  report_id               uuid        references reports(id) on delete set null,
  research_request_id     uuid        references research_requests(id) on delete set null,

  -- Client information (internal reference — no PII beyond identifier)
  client_identifier       text        not null,
  project_location        text,

  -- System output (denormalised from reports.decision_report at creation)
  system_recommendation   text        check (system_recommendation in ('proceed', 'revise', 'error')),
  system_confidence       integer     check (system_confidence between 0 and 100),
  system_trust_score      integer     check (system_trust_score between 0 and 100),

  -- Submission lifecycle
  status                  text        not null default 'pending'
                          check (status in ('pending', 'in_review', 'delivered', 'failed', 'corrected')),

  -- Client response (recorded after delivery)
  client_response         text        check (client_response in ('accept', 'query', 'reject')),
  client_response_notes   text,

  -- Timing
  intake_at               timestamptz,
  submitted_at            timestamptz default now(),
  delivered_at            timestamptz,

  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

create index if not exists pilot_submissions_pilot_id_idx    on pilot_submissions(pilot_id);
create index if not exists pilot_submissions_report_id_idx   on pilot_submissions(report_id);
create index if not exists pilot_submissions_status_idx      on pilot_submissions(status);

alter table pilot_submissions enable row level security;
-- No select/insert/update policy for regular users.
-- Admins read and write via service-role key (bypasses RLS).

-- ──────────────────────────────────────────────────────────────────
-- 3. pilot_reviews
--    One row per completed consultant review. Captures the key fields
--    from the Consultant Review Sheet (CONSULTANT_REVIEW_TEMPLATE.md).
--    The full signed-off markdown sheet is retained by the analyst;
--    this table stores the structured fields required for metrics.
-- ──────────────────────────────────────────────────────────────────

create table if not exists pilot_reviews (
  id                          uuid        primary key default gen_random_uuid(),
  pilot_submission_id         uuid        not null references pilot_submissions(id) on delete cascade,

  -- Reviewer
  reviewer_name               text        not null,

  -- Core recommendation
  consultant_recommendation   text        not null
                              check (consultant_recommendation in ('proceed', 'revise', 'defer', 'reject')),
  agreement                   boolean     not null,
  confidence_level            text        check (confidence_level in ('very_high', 'high', 'medium', 'low')),

  -- Disagreement detail (required when agreement = false)
  disagree_root_cause         text,   -- 'RC-01' through 'RC-10'
  disagree_severity           text    check (disagree_severity in ('critical', 'major', 'minor', 'cosmetic')),
  disagree_reason             text,

  -- Qualitative assessments
  defer_assessment            text,       -- free text from Section F of review sheet
  financing_assessment        text,       -- free text from Section E
  narrative_approved          boolean,
  narrative_correction_count  integer     not null default 0,

  -- Advisory rule checks (Section D — stored as structured JSON)
  -- { com: 'consistent|inconsistent|unknown', ops: ..., str: ..., exe: ..., rsk: ..., lgl: ... }
  advisory_checks             jsonb,

  -- Timing and meta
  time_spent_minutes          integer,
  lessons_learned             text,
  safe_without_review         boolean,    -- Section K: would delivery have been safe without consultant?

  created_at                  timestamptz default now(),
  updated_at                  timestamptz default now()
);

create unique index if not exists pilot_reviews_unique_per_submission
  on pilot_reviews(pilot_submission_id);   -- one review per submission

create index if not exists pilot_reviews_agreement_idx      on pilot_reviews(agreement);
create index if not exists pilot_reviews_severity_idx       on pilot_reviews(disagree_severity);

alter table pilot_reviews enable row level security;
-- No user-facing policies. Admin access via service-role.

-- ──────────────────────────────────────────────────────────────────
-- 4. pilot_learning_log
--    One row per learning event (disagreement, client query/reject,
--    narrative correction, API failure, advisory flag).
--    Primary source for the Learning Loop aggregation (LEARNING_LOOP.md).
-- ──────────────────────────────────────────────────────────────────

create table if not exists pilot_learning_log (
  id                          uuid        primary key default gen_random_uuid(),
  pilot_submission_id         uuid        references pilot_submissions(id) on delete set null,

  event_type                  text        not null
                              check (event_type in (
                                'disagreement', 'client_query', 'client_reject',
                                'narrative_correction', 'api_failure', 'advisory_flag'
                              )),

  primary_root_cause          text        not null,   -- 'RC-01' through 'RC-10'
  secondary_root_cause        text,                   -- optional secondary

  severity                    text        not null
                              check (severity in ('critical', 'major', 'minor', 'cosmetic')),

  system_output               text,                   -- what system produced
  correct_output              text,                   -- what the correct answer was
  prevention_note             text,                   -- what would have prevented this

  engineering_ticket_required boolean     not null default false,
  ticket_description          text,

  created_at                  timestamptz default now()
);

create index if not exists pilot_learning_log_submission_idx    on pilot_learning_log(pilot_submission_id);
create index if not exists pilot_learning_log_root_cause_idx    on pilot_learning_log(primary_root_cause);
create index if not exists pilot_learning_log_severity_idx      on pilot_learning_log(severity);
create index if not exists pilot_learning_log_event_type_idx    on pilot_learning_log(event_type);

alter table pilot_learning_log enable row level security;
-- No user-facing policies. Admin access via service-role.
