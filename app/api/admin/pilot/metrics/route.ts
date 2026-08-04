import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin/auth'
import { PILOT_CONFIG, ROOT_CAUSE_LABELS } from '@/lib/pilot/config'
import type { PilotMetrics, PilotStatus } from '@/lib/pilot/config'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdminEmail(user?.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ab = admin as any

    const [{ data: submissions }, { data: learningEntries }] = await Promise.all([
      ab.from('pilot_submissions').select(`
        id, pilot_id, status, client_response,
        system_recommendation, system_confidence, system_trust_score,
        intake_at, submitted_at, delivered_at,
        review:pilot_reviews (
          consultant_recommendation, agreement, disagree_severity,
          narrative_correction_count, time_spent_minutes
        )
      `).order('pilot_id', { ascending: true }),
      ab.from('pilot_learning_log').select('primary_root_cause, severity'),
    ])

    const subs = (submissions ?? []) as Array<{
      id: string
      pilot_id: string
      status: PilotStatus
      client_response: string | null
      system_recommendation: string | null
      system_confidence: number | null
      system_trust_score: number | null
      intake_at: string | null
      submitted_at: string
      delivered_at: string | null
      review: {
        consultant_recommendation: string
        agreement: boolean
        disagree_severity: string | null
        narrative_correction_count: number
        time_spent_minutes: number | null
      } | null
    }>

    // ── Counts by status ──────────────────────────────────────────
    const byStatus = {
      pending: 0, in_review: 0, delivered: 0, failed: 0, corrected: 0,
    } as Record<PilotStatus, number>
    for (const s of subs) byStatus[s.status] = (byStatus[s.status] ?? 0) + 1

    // ── Reviews ───────────────────────────────────────────────────
    const reviewed = subs.filter(s => s.review !== null)
    const reviews_completed = reviewed.length

    // Recommendation accuracy: agreement / reviewed
    const agreements = reviewed.filter(s => s.review?.agreement === true).length
    const recommendation_accuracy_pct = reviews_completed > 0
      ? Math.round((agreements / reviews_completed) * 100)
      : null

    // Critical disagreements
    const critical_disagreements = reviewed.filter(
      s => s.review?.agreement === false && s.review?.disagree_severity === 'critical'
    ).length

    // False positives: system=proceed but consultant≠proceed
    const systemProceed = reviewed.filter(s => s.system_recommendation === 'proceed')
    const false_positive_count = systemProceed.filter(
      s => s.review?.consultant_recommendation !== 'proceed'
    ).length
    const false_positive_pct = systemProceed.length > 0
      ? Math.round((false_positive_count / systemProceed.length) * 100)
      : null

    // False negatives: system=revise but consultant=proceed
    const systemRevise = reviewed.filter(s => s.system_recommendation === 'revise')
    const false_negative_count = systemRevise.filter(
      s => s.review?.consultant_recommendation === 'proceed'
    ).length
    const false_negative_pct = systemRevise.length > 0
      ? Math.round((false_negative_count / systemRevise.length) * 100)
      : null

    // ── Client acceptance ─────────────────────────────────────────
    const delivered = subs.filter(s => s.client_response !== null)
    const accepted = delivered.filter(s => s.client_response === 'accept').length
    const client_acceptance_pct = delivered.length > 0
      ? Math.round((accepted / delivered.length) * 100)
      : null

    // ── Averages ──────────────────────────────────────────────────
    const confs = subs.filter(s => s.system_confidence !== null).map(s => s.system_confidence!)
    const avg_confidence = confs.length > 0
      ? Math.round(confs.reduce((a, b) => a + b, 0) / confs.length * 10) / 10
      : null

    const trusts = subs.filter(s => s.system_trust_score !== null).map(s => s.system_trust_score!)
    const avg_trust_score = trusts.length > 0
      ? Math.round(trusts.reduce((a, b) => a + b, 0) / trusts.length * 10) / 10
      : null

    const times = subs
      .filter(s => s.intake_at && s.delivered_at)
      .map(s => (new Date(s.delivered_at!).getTime() - new Date(s.intake_at!).getTime()) / (1000 * 3600))
    const avg_decision_time_hours = times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length * 10) / 10
      : null

    const revisions = reviewed.map(s => s.review?.narrative_correction_count ?? 0)
    const avg_narrative_revisions = revisions.length > 0
      ? Math.round(revisions.reduce((a, b) => a + b, 0) / revisions.length * 10) / 10
      : null

    // ── API success rate ──────────────────────────────────────────
    const totalAttempted = subs.length
    const failedCount = byStatus.failed
    const api_success_rate_pct = totalAttempted > 0
      ? Math.round(((totalAttempted - failedCount) / totalAttempted) * 100)
      : null

    // ── Root cause distribution ───────────────────────────────────
    const causeMap = new Map<string, number>()
    for (const e of (learningEntries ?? []) as Array<{ primary_root_cause: string }>) {
      causeMap.set(e.primary_root_cause, (causeMap.get(e.primary_root_cause) ?? 0) + 1)
    }
    const top_root_causes = Array.from(causeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cause, count]) => ({
        cause,
        label: ROOT_CAUSE_LABELS[cause as keyof typeof ROOT_CAUSE_LABELS] ?? cause,
        count,
      }))

    // ── Recommendation distribution ───────────────────────────────
    const recommendation_distribution = {
      proceed: subs.filter(s => s.system_recommendation === 'proceed').length,
      revise:  subs.filter(s => s.system_recommendation === 'revise').length,
      error:   subs.filter(s => s.system_recommendation === 'error' || s.system_recommendation === null).length,
    }

    // ── Next available pilot ID ───────────────────────────────────
    const usedIds = new Set(subs.map(s => s.pilot_id))
    const next_pilot_id = PILOT_CONFIG.IDS.find(id => !usedIds.has(id)) ?? null

    const metrics: PilotMetrics = {
      total: subs.length,
      by_status: byStatus,
      reviews_completed,
      recommendation_accuracy_pct,
      client_acceptance_pct,
      false_positive_count,
      false_negative_count,
      false_positive_pct,
      false_negative_pct,
      critical_disagreements,
      avg_confidence,
      avg_trust_score,
      avg_decision_time_hours,
      avg_narrative_revisions,
      api_success_rate_pct,
      top_root_causes,
      recommendation_distribution,
      next_pilot_id,
    }

    return NextResponse.json(metrics)
  } catch (err) {
    console.error('[pilot/metrics GET]', err)
    return NextResponse.json({ error: 'Failed to compute metrics' }, { status: 500 })
  }
}
