import { Shell } from '@/components/dashboard/shell'
import { checkPlanLimit, type PlanCheckResult } from '@/lib/research/plan-enforcement'
import { createClient } from '@/lib/supabase/server'
import { PLAN_LABELS } from '@/types/plan.types'
import { FileText, TrendingUp, Clock, ArrowRight, Sparkles, BarChart3 } from 'lucide-react'
import Link from 'next/link'

const TYPE_LABELS: Record<string, string> = {
  feasibility: 'Feasibility Study',
  campaign_roi: 'Campaign ROI Audit',
  market_entry: 'Market Entry Intel',
  lead_gen: 'Lead Generation Intel',
  full_analysis: 'Full Marketing Analysis',
  lead_finder: 'Lead Finder',
  talent_finder: 'Talent Finder',
}


export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const firstName = user?.email?.split('@')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  let totalReports = 0, thisMonth = 0
  let usage: PlanCheckResult = { ok: true, used: 0, limit: 20, plan: 'STARTER' }
  let recent: Array<{ id: string; report_type: string; company_name: string | null; city: string | null; created_at: string }> = []

  if (user) {
    const som = new Date(); som.setDate(1); som.setHours(0, 0, 0, 0)
    const [{ count: total }, { count: month }, { data: recentRows }] = await Promise.all([
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', som.toISOString()),
      supabase.from('reports').select('id, report_type, company_name, city, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    ])
    totalReports = total ?? 0
    thisMonth = month ?? 0
    recent = recentRows ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    usage = await checkPlanLimit(supabase as any, user.id)
  }

  const usageValue = usage.limit === -1 ? `${usage.used}/∞` : `${usage.used}/${usage.limit}`
  const usagePercent = usage.limit === -1 ? 0 : Math.min(100, Math.round((usage.used / usage.limit) * 100))

  const STATS = [
    { label: 'Total Assessments', value: totalReports, icon: FileText, accent: '#b8922a' },
    { label: 'This Month', value: thisMonth, icon: TrendingUp, accent: '#16a34a' },
    { label: `${PLAN_LABELS[usage.plan]} Usage`, value: usageValue, icon: BarChart3, accent: usagePercent >= 80 ? '#dc2626' : '#7c3aed' },
    { label: 'Last Assessment', value: recent[0] ? new Date(recent[0].created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—', icon: Clock, accent: '#2563eb' },
  ]

  return (
    <Shell title="Dashboard" subtitle={`${greeting}, ${firstName}`}>
      {usagePercent >= 80 && usage.limit !== -1 && (
        <div style={{
          background: usagePercent >= 100 ? '#fef2f2' : '#fffbeb',
          borderBottom: `1px solid ${usagePercent >= 100 ? '#fecaca' : '#fde68a'}`,
          color: usagePercent >= 100 ? '#dc2626' : '#92400e',
          fontSize: 13,
          fontWeight: 500,
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>{usagePercent >= 100 ? '🚫' : '⚠️'}</span>
          {usagePercent >= 100
            ? `You've used all ${usage.limit} reports on your ${PLAN_LABELS[usage.plan]} plan this month. `
            : `You've used ${usage.used} of ${usage.limit} reports (${usagePercent}%) on your ${PLAN_LABELS[usage.plan]} plan. `}
          <a href="/dashboard/settings" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>
            Upgrade plan
          </a>
        </div>
      )}
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1a1612', lineHeight: 1.2 }}>
              {greeting},{' '}
              <span style={{ background: 'linear-gradient(135deg,#b8922a,#d4aa45)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{firstName}</span>
            </h2>
            <p style={{ fontSize: 13, color: '#9e8e7e', marginTop: 4 }}>{today} · Decision Intelligence Platform</p>
          </div>
          <Link href="/dashboard/real-estate" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#b8922a,#d4aa45)', color: '#fff', fontSize: 13, fontWeight: 700, padding: '10px 18px', borderRadius: 12, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <Sparkles size={15} />New Assessment
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          {STATS.map(({ label, value, icon: Icon, accent }) => (
            <div key={label} className="card" style={{ padding: '18px 20px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><Icon size={17} color={accent} /></div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1612', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: '#9e8e7e', marginTop: 4 }}>{label}</div>
              {label.endsWith('Usage') && usage.limit !== -1 && (
                <div style={{ height: 6, background: '#f1eadf', borderRadius: 999, overflow: 'hidden', marginTop: 12 }}>
                  <div style={{ width: `${usagePercent}%`, height: '100%', background: accent, borderRadius: 999 }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {recent.length > 0 ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9e8e7e', fontWeight: 600 }}>Recent Assessments</span>
              <Link href="/dashboard/reports" style={{ fontSize: 12, color: '#b8922a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>View all <ArrowRight size={11} /></Link>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e8e0d4', borderRadius: 14, overflow: 'hidden' }}>
              {recent.map((rep, i) => (
                <Link key={rep.id} href="/dashboard/reports" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', textDecoration: 'none', borderBottom: i < recent.length - 1 ? '1px solid #e8e0d4' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1612' }}>{rep.company_name ?? 'Untitled'}</div>
                      <div style={{ fontSize: 11, color: '#9e8e7e' }}>{TYPE_LABELS[rep.report_type] ?? rep.report_type}{rep.city ? ` · ${rep.city}` : ''}</div>
                    </div>
                  </div>
                  <ArrowRight size={13} color="#9e8e7e" />
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e8e0d4', borderRadius: 16, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📊</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a1612', marginBottom: 6 }}>No assessments yet</h3>
            <p style={{ fontSize: 13, color: '#9e8e7e', marginBottom: 20 }}>Start your first assessment to receive your Decision Report.</p>
            <Link href="/dashboard/real-estate" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#b8922a,#d4aa45)', color: '#fff', fontSize: 13, fontWeight: 700, padding: '11px 22px', borderRadius: 12, textDecoration: 'none' }}>
              <Sparkles size={15} />New Assessment
            </Link>
          </div>
        )}
      </div>
    </Shell>
  )
}
