'use client'

import { useEffect, useState, useCallback } from 'react'
import { PILOT_CONFIG, ROOT_CAUSE_LABELS } from '@/lib/pilot/config'
import type {
  PilotSubmission, PilotMetrics, PilotStatus,
  PilotClientResponse, PilotConsultantRec, PilotDisagreeSeverity,
} from '@/lib/pilot/config'

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function recColor(rec: string | null): string {
  if (rec === 'proceed') return '#16a34a'
  if (rec === 'revise')  return '#d97706'
  if (rec === 'defer')   return '#7c3aed'
  if (rec === 'reject')  return '#dc2626'
  return '#6b7280'
}

function statusColor(s: PilotStatus): string {
  const m: Record<PilotStatus, string> = {
    pending:   '#6b7280',
    in_review: '#2563eb',
    delivered: '#16a34a',
    failed:    '#dc2626',
    corrected: '#d97706',
  }
  return m[s] ?? '#6b7280'
}

function metricStatus(value: number | null, target: number, higherBetter: boolean): '✅' | '⚠️' | '❌' {
  if (value === null) return '⚠️'
  if (higherBetter) return value >= target ? '✅' : value >= target * 0.875 ? '⚠️' : '❌'
  return value <= target ? '✅' : value <= target * 1.667 ? '⚠️' : '❌'
}

// ── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({ label, value, unit, status }: {
  label: string; value: string | number | null; unit?: string; status?: string
}) {
  return (
    <div className="card" style={{ padding: '14px 18px', minWidth: 130 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: '#1a1612' }}>
          {value ?? '—'}
        </span>
        {unit && <span style={{ fontSize: 12, color: '#9e8e7e' }}>{unit}</span>}
        {status && <span style={{ fontSize: 16 }}>{status}</span>}
      </div>
      <div style={{ fontSize: 11, color: '#9e8e7e', marginTop: 4 }}>{label}</div>
    </div>
  )
}

// ── Register Modal ────────────────────────────────────────────────────────────

interface RegisterForm {
  pilot_id: string
  report_id: string
  client_identifier: string
  project_location: string
  intake_at: string
}

function RegisterModal({ nextId, onClose, onCreated }: {
  nextId: string | null
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState<RegisterForm>({
    pilot_id: nextId ?? '',
    report_id: '',
    client_identifier: '',
    project_location: '',
    intake_at: new Date().toISOString().slice(0, 16),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/pilot/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          intake_at: form.intake_at ? new Date(form.intake_at).toISOString() : null,
        }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? `Error ${res.status}`)
      }
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register')
    } finally {
      setSaving(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1.5px solid #e8e0d4', fontSize: 13, fontFamily: 'inherit',
    outline: 'none', background: '#fff', color: '#1a1612', boxSizing: 'border-box',
    marginTop: 4,
  }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#6b6560', display: 'block', marginTop: 12 }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 440, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1612', margin: '0 0 4px 0' }}>Register Pilot Submission</h3>
        <p style={{ fontSize: 12, color: '#9e8e7e', margin: '0 0 16px 0' }}>Link an existing report to a pilot submission record.</p>

        <form onSubmit={e => void handleSubmit(e)}>
          <label style={lbl}>Pilot ID *</label>
          <select value={form.pilot_id} onChange={e => setForm(f => ({ ...f, pilot_id: e.target.value }))}
            style={{ ...inp, cursor: 'pointer' }} required>
            <option value="">Select…</option>
            {PILOT_CONFIG.IDS.map(id => <option key={id} value={id}>{id}</option>)}
          </select>

          <label style={lbl}>Report ID (UUID from reports table) *</label>
          <input value={form.report_id} onChange={e => setForm(f => ({ ...f, report_id: e.target.value }))}
            style={inp} placeholder="e.g. 3f2a…" required />

          <label style={lbl}>Client Identifier *</label>
          <input value={form.client_identifier} onChange={e => setForm(f => ({ ...f, client_identifier: e.target.value }))}
            style={inp} placeholder="Internal reference" required />

          <label style={lbl}>Project Location</label>
          <input value={form.project_location} onChange={e => setForm(f => ({ ...f, project_location: e.target.value }))}
            style={inp} placeholder="e.g. New Cairo, East Compound" />

          <label style={lbl}>Intake Date/Time *</label>
          <input type="datetime-local" value={form.intake_at} onChange={e => setForm(f => ({ ...f, intake_at: e.target.value }))}
            style={inp} required />

          {error && (
            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 12 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose}
              style={{ padding: '8px 18px', borderRadius: 9, border: '1.5px solid #e8e0d4', background: '#fff', color: '#6b6560', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: '8px 18px', borderRadius: 9, border: 'none', background: '#b8922a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
              {saving ? 'Registering…' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Review Modal ──────────────────────────────────────────────────────────────

interface ReviewForm {
  reviewer_name: string
  consultant_recommendation: PilotConsultantRec | ''
  agreement: boolean
  confidence_level: string
  disagree_root_cause: string
  disagree_severity: PilotDisagreeSeverity | ''
  disagree_reason: string
  defer_assessment: string
  financing_assessment: string
  narrative_approved: boolean
  narrative_correction_count: number
  time_spent_minutes: number | ''
  lessons_learned: string
  safe_without_review: boolean
}

const BLANK_REVIEW: ReviewForm = {
  reviewer_name: '', consultant_recommendation: '', agreement: true,
  confidence_level: '', disagree_root_cause: '', disagree_severity: '',
  disagree_reason: '', defer_assessment: '', financing_assessment: '',
  narrative_approved: true, narrative_correction_count: 0,
  time_spent_minutes: '', lessons_learned: '', safe_without_review: false,
}

function ReviewModal({ sub, onClose, onSaved }: {
  sub: PilotSubmission; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState<ReviewForm>(() => {
    if (!sub.review) return BLANK_REVIEW
    const r = sub.review
    return {
      reviewer_name:               r.reviewer_name ?? '',
      consultant_recommendation:   r.consultant_recommendation ?? '',
      agreement:                   r.agreement,
      confidence_level:            r.confidence_level ?? '',
      disagree_root_cause:         r.disagree_root_cause ?? '',
      disagree_severity:           (r.disagree_severity ?? '') as PilotDisagreeSeverity | '',
      disagree_reason:             r.disagree_reason ?? '',
      defer_assessment:            r.defer_assessment ?? '',
      financing_assessment:        r.financing_assessment ?? '',
      narrative_approved:          r.narrative_approved ?? true,
      narrative_correction_count:  r.narrative_correction_count ?? 0,
      time_spent_minutes:          r.time_spent_minutes ?? '',
      lessons_learned:             r.lessons_learned ?? '',
      safe_without_review:         r.safe_without_review ?? false,
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.consultant_recommendation) { setError('Consultant recommendation is required'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/admin/pilot/submissions/${sub.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          time_spent_minutes: form.time_spent_minutes !== '' ? Number(form.time_spent_minutes) : null,
          confidence_level: form.confidence_level || null,
          disagree_root_cause: form.disagree_root_cause || null,
          disagree_severity: form.disagree_severity || null,
        }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? `Error ${res.status}`)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally { setSaving(false) }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '7px 11px', borderRadius: 7,
    border: '1.5px solid #e8e0d4', fontSize: 12, fontFamily: 'inherit',
    outline: 'none', background: '#fff', color: '#1a1612', boxSizing: 'border-box', marginTop: 3,
  }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#6b6560', display: 'block', marginTop: 10 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '32px 16px' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 520, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1612', margin: '0 0 2px 0' }}>
          Consultant Review — {sub.pilot_id}
        </h3>
        <p style={{ fontSize: 12, color: '#9e8e7e', margin: '0 0 16px 0' }}>
          System: <strong style={{ color: recColor(sub.system_recommendation) }}>{sub.system_recommendation ?? '—'}</strong>
          {' '}| Confidence: <strong>{sub.system_confidence ?? '—'}</strong>
        </p>

        <form onSubmit={e => void handleSubmit(e)}>
          <label style={lbl}>Reviewer Name *</label>
          <input value={form.reviewer_name} onChange={e => setForm(f => ({ ...f, reviewer_name: e.target.value }))} style={inp} required />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <div>
              <label style={{ ...lbl, marginTop: 0 }}>Consultant Recommendation *</label>
              <select value={form.consultant_recommendation} onChange={e => setForm(f => ({ ...f, consultant_recommendation: e.target.value as PilotConsultantRec }))} style={{ ...inp, marginTop: 3, cursor: 'pointer' }} required>
                <option value="">Select…</option>
                {(['proceed', 'revise', 'defer', 'reject'] as const).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ ...lbl, marginTop: 0 }}>Agreement with System?</label>
              <select value={form.agreement ? 'yes' : 'no'} onChange={e => setForm(f => ({ ...f, agreement: e.target.value === 'yes' }))} style={{ ...inp, marginTop: 3, cursor: 'pointer' }}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          <label style={lbl}>Confidence in Final Recommendation</label>
          <select value={form.confidence_level} onChange={e => setForm(f => ({ ...f, confidence_level: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
            <option value="">—</option>
            {(['very_high', 'high', 'medium', 'low'] as const).map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>

          {!form.agreement && (
            <>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', marginTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>DISAGREEMENT DETAILS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ ...lbl, marginTop: 0, color: '#dc2626' }}>Root Cause *</label>
                    <select value={form.disagree_root_cause} onChange={e => setForm(f => ({ ...f, disagree_root_cause: e.target.value }))} style={{ ...inp, marginTop: 3, cursor: 'pointer' }} required={!form.agreement}>
                      <option value="">Select…</option>
                      {Object.entries(ROOT_CAUSE_LABELS).map(([k, v]) => <option key={k} value={k}>{k}: {v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...lbl, marginTop: 0, color: '#dc2626' }}>Severity *</label>
                    <select value={form.disagree_severity} onChange={e => setForm(f => ({ ...f, disagree_severity: e.target.value as PilotDisagreeSeverity }))} style={{ ...inp, marginTop: 3, cursor: 'pointer' }} required={!form.agreement}>
                      <option value="">Select…</option>
                      {(['critical', 'major', 'minor', 'cosmetic'] as const).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <label style={{ ...lbl, marginTop: 8 }}>Reason</label>
                <textarea value={form.disagree_reason} onChange={e => setForm(f => ({ ...f, disagree_reason: e.target.value }))} style={{ ...inp, height: 60, resize: 'vertical' }} />
              </div>
            </>
          )}

          <label style={lbl}>Was defer assessed? (notes)</label>
          <input value={form.defer_assessment} onChange={e => setForm(f => ({ ...f, defer_assessment: e.target.value }))} style={inp} placeholder="Defer not appropriate / Defer IS appropriate (reason)" />

          <label style={lbl}>Financing gap assessment</label>
          <input value={form.financing_assessment} onChange={e => setForm(f => ({ ...f, financing_assessment: e.target.value }))} style={inp} placeholder="Confirmed / Override false alarm / Override correct block" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 10 }}>
            <div>
              <label style={{ ...lbl, marginTop: 0 }}>Narrative approved?</label>
              <select value={form.narrative_approved ? 'yes' : 'no'} onChange={e => setForm(f => ({ ...f, narrative_approved: e.target.value === 'yes' }))} style={{ ...inp, marginTop: 3, cursor: 'pointer' }}>
                <option value="yes">Yes</option>
                <option value="no">No (needs corrections)</option>
              </select>
            </div>
            <div>
              <label style={{ ...lbl, marginTop: 0 }}>Corrections count</label>
              <input type="number" min="0" value={form.narrative_correction_count} onChange={e => setForm(f => ({ ...f, narrative_correction_count: parseInt(e.target.value) || 0 }))} style={inp} />
            </div>
            <div>
              <label style={{ ...lbl, marginTop: 0 }}>Time spent (min)</label>
              <input type="number" min="0" value={form.time_spent_minutes} onChange={e => setForm(f => ({ ...f, time_spent_minutes: e.target.value === '' ? '' : parseInt(e.target.value) }))} style={inp} />
            </div>
          </div>

          <label style={lbl}>Would delivery have been safe without consultant review?</label>
          <select value={form.safe_without_review ? 'yes' : 'no'} onChange={e => setForm(f => ({ ...f, safe_without_review: e.target.value === 'yes' }))} style={{ ...inp, cursor: 'pointer' }}>
            <option value="no">No — review was necessary</option>
            <option value="yes">Yes — system output was correct and complete</option>
          </select>

          <label style={lbl}>Lessons learned</label>
          <textarea value={form.lessons_learned} onChange={e => setForm(f => ({ ...f, lessons_learned: e.target.value }))} style={{ ...inp, height: 60, resize: 'vertical' }} />

          {error && (
            <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 12 }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 9, border: '1.5px solid #e8e0d4', background: '#fff', color: '#6b6560', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: '8px 18px', borderRadius: 9, border: 'none', background: '#b8922a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
              {saving ? 'Saving…' : sub.review ? 'Update Review' : 'Save Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Dashboard ──────────────────────────────────────────────────────────

export function PilotDashboardClient() {
  const [submissions, setSubmissions] = useState<PilotSubmission[]>([])
  const [metrics, setMetrics] = useState<PilotMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRegister, setShowRegister] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<PilotSubmission | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [subsRes, metRes] = await Promise.all([
        fetch('/api/admin/pilot/submissions'),
        fetch('/api/admin/pilot/metrics'),
      ])
      if (!subsRes.ok || !metRes.ok) throw new Error('Failed to load pilot data')
      const [subs, met] = await Promise.all([subsRes.json(), metRes.json()]) as [PilotSubmission[], PilotMetrics]
      setSubmissions(subs)
      setMetrics(met)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  async function updateStatus(id: string, status: PilotStatus) {
    setUpdating(id)
    const patch: Record<string, unknown> = { status }
    if (status === 'delivered') patch.delivered_at = new Date().toISOString()
    try {
      await fetch(`/api/admin/pilot/submissions/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      await load()
    } finally { setUpdating(null) }
  }

  async function updateClientResponse(id: string, client_response: PilotClientResponse) {
    setUpdating(id)
    try {
      await fetch(`/api/admin/pilot/submissions/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_response }),
      })
      await load()
    } finally { setUpdating(null) }
  }

  const T = PILOT_CONFIG.TARGETS

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* ── Progress Bar ───────────────────────────────────────────── */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1612' }}>
            Pilot Progress: {metrics?.total ?? 0} / {PILOT_CONFIG.MAX_SUBMISSIONS} submissions
          </span>
          {metrics?.next_pilot_id && (
            <span style={{ fontSize: 12, color: '#9e8e7e' }}>Next: {metrics.next_pilot_id}</span>
          )}
        </div>
        <div style={{ height: 8, background: '#e8e0d4', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${((metrics?.total ?? 0) / PILOT_CONFIG.MAX_SUBMISSIONS) * 100}%`,
            background: 'linear-gradient(90deg, #b8922a, #d4a843)',
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* ── Metrics Row ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        <MetricCard label="Total" value={metrics?.total ?? 0} />
        <MetricCard label="Pending Review" value={metrics?.by_status.pending ?? 0} />
        <MetricCard label="Delivered" value={metrics?.by_status.delivered ?? 0} />
        <MetricCard label="Rec. Accuracy" value={metrics?.recommendation_accuracy_pct ?? null} unit="%" status={metricStatus(metrics?.recommendation_accuracy_pct ?? null, T.RECOMMENDATION_ACCURACY_MIN_PCT, true)} />
        <MetricCard label="Client Acceptance" value={metrics?.client_acceptance_pct ?? null} unit="%" status={metricStatus(metrics?.client_acceptance_pct ?? null, T.CLIENT_ACCEPTANCE_MIN_PCT, true)} />
        <MetricCard label="False Positives" value={metrics?.false_positive_pct ?? null} unit="%" status={metricStatus(metrics?.false_positive_pct ?? null, T.FALSE_POSITIVE_MAX_PCT, false)} />
        <MetricCard label="Critical Disagree" value={metrics?.critical_disagreements ?? 0} status={metrics?.critical_disagreements === 0 ? '✅' : '❌'} />
        <MetricCard label="Avg Confidence" value={metrics?.avg_confidence ?? null} />
      </div>

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1612', margin: 0 }}>Submissions</h2>
        <button
          onClick={() => setShowRegister(true)}
          disabled={(metrics?.total ?? 0) >= PILOT_CONFIG.MAX_SUBMISSIONS}
          style={{
            padding: '8px 18px', borderRadius: 9, border: 'none',
            background: '#b8922a', color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: (metrics?.total ?? 0) >= PILOT_CONFIG.MAX_SUBMISSIONS ? 'not-allowed' : 'pointer',
            opacity: (metrics?.total ?? 0) >= PILOT_CONFIG.MAX_SUBMISSIONS ? 0.5 : 1,
            fontFamily: 'inherit',
          }}
        >
          + Register Submission
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#9e8e7e', fontSize: 13 }}>Loading…</div>}
      {error && <div style={{ textAlign: 'center', padding: 40, color: '#dc2626', fontSize: 13 }}>{error}</div>}

      {!loading && !error && (
        <div style={{ background: '#fff', border: '1px solid #e8e0d4', borderRadius: 14, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '90px 100px 90px 90px 90px 90px 110px 110px 110px',
            gap: 8, padding: '10px 16px',
            background: '#faf5ef', borderBottom: '1px solid #e8e0d4',
            fontSize: 10, fontWeight: 700, color: '#9e8e7e', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <div>Pilot ID</div>
            <div>Client</div>
            <div>System Rec</div>
            <div>Confidence</div>
            <div>Consult Rec</div>
            <div>Agreement</div>
            <div>Status</div>
            <div>Client Resp.</div>
            <div>Actions</div>
          </div>

          {submissions.length === 0 && (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: '#9e8e7e', fontSize: 13 }}>
              No submissions registered yet. Click &quot;Register Submission&quot; to begin.
            </div>
          )}

          {submissions.map((sub, i) => (
            <div key={sub.id} style={{
              display: 'grid',
              gridTemplateColumns: '90px 100px 90px 90px 90px 90px 110px 110px 110px',
              gap: 8, padding: '12px 16px', alignItems: 'center',
              borderBottom: i < submissions.length - 1 ? '1px solid #e8e0d4' : 'none',
              background: sub.review?.agreement === false ? '#fffbf5' : '#fff',
            }}>
              {/* Pilot ID */}
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1612', fontFamily: 'monospace' }}>
                {sub.pilot_id}
              </div>

              {/* Client */}
              <div style={{ fontSize: 11, color: '#6b6560', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sub.client_identifier}>
                {sub.client_identifier}
              </div>

              {/* System Recommendation */}
              <div style={{ fontSize: 12, fontWeight: 600, color: recColor(sub.system_recommendation) }}>
                {sub.system_recommendation ?? '—'}
              </div>

              {/* Confidence */}
              <div style={{ fontSize: 12, color: '#1a1612' }}>
                {sub.system_confidence != null ? `${sub.system_confidence}` : '—'}
              </div>

              {/* Consultant Recommendation */}
              <div style={{ fontSize: 12, fontWeight: 600, color: recColor(sub.review?.consultant_recommendation ?? null) }}>
                {sub.review?.consultant_recommendation ?? '—'}
              </div>

              {/* Agreement */}
              <div style={{ fontSize: 13 }}>
                {sub.review == null ? '—' : sub.review.agreement ? '✅' : `❌ ${sub.review.disagree_severity ?? ''}`}
              </div>

              {/* Status */}
              <div>
                <select
                  value={sub.status}
                  disabled={updating === sub.id}
                  onChange={e => void updateStatus(sub.id, e.target.value as PilotStatus)}
                  style={{
                    padding: '5px 8px', borderRadius: 7, border: `1.5px solid ${statusColor(sub.status)}20`,
                    background: `${statusColor(sub.status)}12`,
                    color: statusColor(sub.status), fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', width: '100%',
                    outline: 'none',
                  }}
                >
                  {(['pending', 'in_review', 'delivered', 'failed', 'corrected'] as PilotStatus[]).map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              {/* Client Response */}
              <div>
                <select
                  value={sub.client_response ?? ''}
                  disabled={updating === sub.id}
                  onChange={e => void updateClientResponse(sub.id, e.target.value as PilotClientResponse)}
                  style={{
                    padding: '5px 8px', borderRadius: 7, border: '1.5px solid #e8e0d4',
                    background: '#fff', color: '#1a1612', fontSize: 11,
                    cursor: 'pointer', fontFamily: 'inherit', width: '100%', outline: 'none',
                  }}
                >
                  <option value="">—</option>
                  <option value="accept">✅ Accept</option>
                  <option value="query">⚠️ Query</option>
                  <option value="reject">❌ Reject</option>
                </select>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => setReviewTarget(sub)}
                  style={{
                    padding: '5px 10px', borderRadius: 7, border: '1.5px solid #e8e0d4',
                    background: sub.review ? '#faf5ef' : '#b8922a',
                    color: sub.review ? '#6b6560' : '#fff',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {sub.review ? 'Edit Review' : 'Add Review'}
                </button>
                {sub.report_id && (
                  <a
                    href={`/dashboard/reports`}
                    title="View in reports"
                    style={{
                      padding: '5px 8px', borderRadius: 7, border: '1.5px solid #e8e0d4',
                      background: '#fff', color: '#6b6560', fontSize: 11,
                      fontWeight: 600, textDecoration: 'none',
                    }}
                  >↗</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Top Root Causes ────────────────────────────────────────── */}
      {metrics && metrics.top_root_causes.length > 0 && (
        <div className="card" style={{ padding: '16px 20px', marginTop: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a1612', margin: '0 0 12px 0' }}>Top Disagreement Root Causes</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {metrics.top_root_causes.map(rc => (
              <div key={rc.cause} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px', borderRadius: 20,
                background: '#faf5ef', border: '1px solid #e8e0d4',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#b8922a', fontFamily: 'monospace' }}>{rc.cause}</span>
                <span style={{ fontSize: 11, color: '#6b6560' }}>{rc.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1612' }}>{rc.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Exit Criteria Quick Check ─────────────────────────────── */}
      {metrics && metrics.reviews_completed >= 5 && (
        <div className="card" style={{ padding: '16px 20px', marginTop: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a1612', margin: '0 0 12px 0' }}>Exit Criteria Status</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
            {[
              { label: 'P1 — Rec Accuracy ≥80%', val: metrics.recommendation_accuracy_pct, target: T.RECOMMENDATION_ACCURACY_MIN_PCT, higher: true },
              { label: 'P2 — Client Accept ≥70%', val: metrics.client_acceptance_pct, target: T.CLIENT_ACCEPTANCE_MIN_PCT, higher: true },
              { label: 'P3 — False Pos ≤15%', val: metrics.false_positive_pct, target: T.FALSE_POSITIVE_MAX_PCT, higher: false },
              { label: 'P4 — False Neg ≤20%', val: metrics.false_negative_pct, target: T.FALSE_NEGATIVE_MAX_PCT, higher: false },
              { label: 'P5 — Critical Disagree = 0', val: metrics.critical_disagreements, target: 0, higher: false },
            ].map(c => (
              <div key={c.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 8, background: '#faf5ef' }}>
                <span style={{ fontSize: 11, color: '#6b6560' }}>{c.label}</span>
                <span style={{ fontSize: 14 }}>{metricStatus(c.val, c.target, c.higher)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {showRegister && (
        <RegisterModal
          nextId={metrics?.next_pilot_id ?? null}
          onClose={() => setShowRegister(false)}
          onCreated={() => { setShowRegister(false); void load() }}
        />
      )}

      {reviewTarget && (
        <ReviewModal
          sub={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSaved={() => { setReviewTarget(null); void load() }}
        />
      )}
    </div>
  )
}
