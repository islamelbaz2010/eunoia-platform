import Link from 'next/link'
import { TrendingUp, Target, Building2, LineChart, Zap, BarChart3, Brain, CheckCircle, ArrowRight } from 'lucide-react'

const STATS = [
  { icon: TrendingUp, value: '18%', label: 'Real Estate YoY Growth', sub: 'Egypt 2025 — prime residential', accent: '#16a34a' },
  { icon: Target, value: 'EGP 300–800', label: 'Benchmark CPL', sub: 'Cost per lead, residential projects', accent: '#b8922a' },
  { icon: Building2, value: 'EGP 2M–20M', label: 'Ticket Size Range', sub: 'Entry to luxury residential', accent: '#2563eb' },
  { icon: LineChart, value: '8–12%', label: 'Annual Yield', sub: 'Investor ROI, prime locations', accent: '#7c3aed' },
]

const INSIGHTS = [
  {
    title: 'Market Overview — Q2 2025',
    rows: [
      ['Market Size', 'EGP 600B+'],
      ['New Launches', '200+ projects'],
      ['New Capital Absorption', '65%'],
      ['Avg Price / sqm (New Capital)', 'EGP 12,000–18,000'],
      ['Standard Payment Plan', '10 years'],
      ['Broker Channel Share', '60–70% of sales'],
      ['Pre-sales Target (Month 1)', '30% of units'],
    ],
  },
  {
    title: 'Digital Advertising Benchmarks',
    rows: [
      ['Marketing Budget vs GDV', '2–4%'],
      ['CPL — Mid-range', 'EGP 300–500'],
      ['CPL — Luxury', 'EGP 500–1,200'],
      ['WhatsApp SLA for 3× conversion', '< 5 minutes'],
      ['Broker Activation (pre-launch)', '15–25 exclusive'],
      ['New Cairo CPL Premium', '+25%'],
      ['New Capital CPL Premium', '+20%'],
    ],
  },
]

const MISTAKES = [
  { n: '01', text: 'Launching with no landing page or pixel — leads disappear into WhatsApp with zero tracking' },
  { n: '02', text: 'Generic creative: "luxury units, call now" — no hook, no segment, no differentiation' },
  { n: '03', text: 'Responding to leads after 2 hours — 3× lower conversion vs < 5 minute SLA' },
  { n: '04', text: 'Skipping broker activation — forfeiting 60–70% of sales channel before launch day' },
  { n: '05', text: 'Spending 100% on Meta with no Google branded keywords — competitors steal your brand searches' },
  { n: '06', text: 'No retargeting — the 97% who saw your ad and didn\'t convert are abandoned forever' },
  { n: '07', text: 'Payment plan under 8 years — losing 40% of buyers who need longer horizons' },
  { n: '08', text: 'No ROI calculator — investor segment needs yield proof before booking a site visit' },
]

const REPORTS = [
  {
    icon: Zap,
    type: 'REAL_ESTATE_LAUNCH',
    title: 'Project Launch Strategy',
    titleAr: 'استراتيجية إطلاق المشروع',
    desc: 'Full go-to-market plan: phased channel strategy, content calendar, GDV-based budget, broker activation, KPIs, and launch readiness score.',
    accent: '#b8922a',
  },
  {
    icon: Target,
    type: 'REAL_ESTATE_LEADS',
    title: 'Lead Gen Intelligence',
    titleAr: 'تحليل توليد العملاء',
    desc: 'CPL benchmarking by location, funnel analysis, channel performance audit, creative recommendations, and 30-day action plan.',
    accent: '#16a34a',
  },
  {
    icon: BarChart3,
    type: 'REAL_ESTATE_FEASIBILITY',
    title: 'Investment Feasibility',
    titleAr: 'دراسة الجدوى الاستثمارية',
    desc: 'Financial projections, market analysis, risk assessment, and go/no-go recommendation with full marketing strategy brief.',
    accent: '#2563eb',
  },
  {
    icon: Brain,
    type: 'FULL_ANALYSIS',
    title: 'Full Marketing Analysis',
    titleAr: 'التحليل التسويقي الشامل',
    desc: 'Complete audit: brand positioning, paid performance, competitor mapping, content gaps, 90-day roadmap, and proposal.',
    accent: '#7c3aed',
  },
]

const INCLUDES = [
  'Egypt RE market benchmarks Q2 2025 — real CPL, GDV, absorption data',
  'Location-specific CPL adjustments (New Cairo, New Capital, 6th Oct)',
  'Phased channel strategy: pre-launch → soft launch → full launch',
  'Media budget breakdown with GDV% reasoning',
  'Broker activation playbook (WhatsApp kit + exclusivity model)',
  'Launch readiness score across 5 dimensions',
  'Content requirements: must-have vs high-impact assets',
  '90-day action plan with weekly milestones and KPIs',
]

export default function MarketIntelligencePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8f6f1', color: '#1a1612', display: 'flex', flexDirection: 'column', fontFamily: '"Inter", system-ui, sans-serif' }}>

      {/* Sticky Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #e8e0d4', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(248,246,241,0.95)', backdropFilter: 'blur(12px)' }}>
        <div>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 14, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', background: 'linear-gradient(135deg,#b8922a,#d4aa45)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>EUNOIA</div>
          <div style={{ fontSize: 9, color: '#9e8e7e', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 1 }}>Intelligence Platform</div>
        </div>
        <Link href="/login" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#b8922a,#d4aa45)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 10, textDecoration: 'none' }}>
          <Zap size={13} />Get Access
        </Link>
      </header>

      <main style={{ flex: 1, maxWidth: 1000, margin: '0 auto', width: '100%', padding: '48px 24px 80px' }}>

        {/* Hero */}
        <section style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(184,146,42,0.1)', border: '1px solid rgba(184,146,42,0.25)', fontSize: 11, fontWeight: 600, color: '#b8922a', marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#b8922a', display: 'inline-block' }} />
            Real Estate Developer Exhibition — June 2026
          </div>
          <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 16, color: '#1a1612' }}>
            AI-Powered{' '}
            <span style={{ background: 'linear-gradient(135deg,#b8922a,#d4aa45)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Marketing Intelligence
            </span>
            <br />for Egyptian Real Estate
          </h1>
          <p style={{ fontSize: 16, color: '#6b5e4e', maxWidth: 560, margin: '0 auto 28px', lineHeight: 1.7 }}>
            Generate institutional-quality market analysis, launch strategies, and investment feasibility reports in under 60 seconds.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/login" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#b8922a,#d4aa45)', color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 28px', borderRadius: 12, textDecoration: 'none' }}>
              <Zap size={15} />Generate Free Report
            </Link>
            <span style={{ fontSize: 12, color: '#9e8e7e' }}>No credit card required</span>
          </div>
        </section>

        {/* Market Stats */}
        <section style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9e8e7e', fontWeight: 600, textAlign: 'center', marginBottom: 24 }}>Egypt Real Estate Market — Key Benchmarks 2025</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            {STATS.map(({ icon: Icon, value, label, sub, accent }) => (
              <div key={label} style={{ background: '#fff', border: '1px solid #e8e0d4', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={17} color={accent} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1612', lineHeight: 1.1, wordBreak: 'break-word' }}>{value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1612', marginTop: 4 }}>{label}</div>
                <div style={{ fontSize: 10, color: '#9e8e7e', marginTop: 2 }}>{sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Market Insights Tables */}
        <section style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9e8e7e', fontWeight: 600, marginBottom: 16 }}>Market Intelligence Data</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
            {INSIGHTS.map(({ title, rows }) => (
              <div key={title} style={{ background: '#fff', border: '1px solid #e8e0d4', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #e8e0d4', fontSize: 12, fontWeight: 700, color: '#1a1612' }}>{title}</div>
                {rows.map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: '1px solid #f2ede6' }}>
                    <span style={{ fontSize: 12, color: '#6b5e4e' }}>{k}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#b8922a' }}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Common Mistakes */}
        <section style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9e8e7e', fontWeight: 600, marginBottom: 8 }}>8 Mistakes Killing Your Campaign ROI</div>
          <p style={{ fontSize: 13, color: '#9e8e7e', marginBottom: 20 }}>Real estate developers in Egypt consistently lose leads and revenue to these preventable errors.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 10 }}>
            {MISTAKES.map(({ n, text }) => (
              <div key={n} style={{ background: '#fff', border: '1px solid #e8e0d4', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#b8922a', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.05em', flexShrink: 0, marginTop: 1 }}>{n}</span>
                <span style={{ fontSize: 12, color: '#6b5e4e', lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Report Types */}
        <section style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9e8e7e', fontWeight: 600, marginBottom: 20 }}>Available Intelligence Reports</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
            {REPORTS.map(({ icon: Icon, type, title, titleAr, desc, accent }) => (
              <Link key={type} href={`/login?next=/dashboard/intelligence?type=${type}`} style={{ background: '#fff', border: '1px solid #e8e0d4', borderRadius: 14, padding: '20px', textDecoration: 'none', display: 'block', transition: 'border-color 0.2s' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${accent}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={18} color={accent} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1612', marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 10, color: '#9e8e7e', marginBottom: 10, direction: 'rtl' as const, textAlign: 'right' as const }}>{titleAr}</div>
                <p style={{ fontSize: 12, color: '#6b5e4e', lineHeight: 1.6 }}>{desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, fontSize: 12, fontWeight: 600, color: accent }}>
                  Generate report <ArrowRight size={12} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* What's Included */}
        <section style={{ marginBottom: 56 }}>
          <div style={{ border: '1px solid #e8d48a', borderRadius: 16, padding: '28px 24px', background: '#fdf8ee' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#9e8e7e', fontWeight: 600, marginBottom: 16 }}>What Every Report Includes</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 10 }}>
              {INCLUDES.map((item) => (
                <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <CheckCircle size={14} color="#b8922a" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: '#6b5e4e', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section style={{ background: 'linear-gradient(135deg,#b8922a,#d4aa45)', borderRadius: 16, padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏢</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Ready to generate your first report?</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
            Join real estate developers using Eunoia to win clients with data-driven marketing intelligence.
          </p>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#b8922a', fontSize: 14, fontWeight: 700, padding: '12px 28px', borderRadius: 12, textDecoration: 'none' }}>
            <Zap size={15} />Get Started — Free
          </Link>
        </section>

      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e8e0d4', padding: '20px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#9e8e7e' }}>© 2026 Eunoia Intelligence Platform · Egypt Real Estate Marketing Intelligence</div>
      </footer>

      {/* Mobile Floating CTA */}
      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }} className="md:hidden">
        <Link href="/login" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#b8922a,#d4aa45)', color: '#fff', fontSize: 13, fontWeight: 700, padding: '12px 24px', borderRadius: 999, textDecoration: 'none', boxShadow: '0 4px 20px rgba(184,146,42,0.4)', whiteSpace: 'nowrap' }}>
          <Zap size={14} />Generate Report
        </Link>
      </div>

    </div>
  )
}
