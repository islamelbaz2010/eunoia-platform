import Link from 'next/link'
import { Brain, TrendingUp, BarChart3, Zap, Building2, Target, LineChart } from 'lucide-react'

const STAT_CARDS = [
  {
    icon: TrendingUp,
    value: '18%',
    label: 'Real Estate YoY Growth',
    sub: 'Egypt 2025 — prime residential',
    color: 'text-emerald-400',
    glow: 'rgba(52,211,153,0.10)',
  },
  {
    icon: Target,
    value: 'EGP 300–800',
    label: 'Benchmark CPL',
    sub: 'Cost per lead, residential projects',
    color: 'text-gold',
    glow: 'rgba(201,164,85,0.12)',
  },
  {
    icon: Building2,
    value: 'EGP 2M–20M',
    label: 'Ticket Size Range',
    sub: 'Entry to luxury residential',
    color: 'text-sky-400',
    glow: 'rgba(56,189,248,0.10)',
  },
  {
    icon: LineChart,
    value: '8–12%',
    label: 'Annual Yield',
    sub: 'Investor ROI, prime locations',
    color: 'text-purple-400',
    glow: 'rgba(192,132,252,0.10)',
  },
]

const REPORT_TYPES = [
  {
    icon: Zap,
    title: 'Project Launch Strategy',
    titleAr: 'استراتيجية إطلاق المشروع',
    desc: 'Full go-to-market plan: channel strategy, content calendar, budget allocation, KPIs, and launch readiness score.',
    color: 'text-gold',
  },
  {
    icon: Target,
    title: 'Lead Gen Intelligence',
    titleAr: 'تحليل توليد العملاء',
    desc: 'CPL benchmarking, funnel analysis, channel performance audit, creative recommendations, and 30-day action plan.',
    color: 'text-emerald-400',
  },
  {
    icon: BarChart3,
    title: 'Investment Feasibility',
    titleAr: 'دراسة الجدوى الاستثمارية',
    desc: 'Financial projections, market analysis, risk assessment, and go/no-go recommendation with marketing strategy brief.',
    color: 'text-sky-400',
  },
  {
    icon: Brain,
    title: 'Opportunity Scoring',
    titleAr: 'تقييم الفرصة التسويقية',
    desc: 'Preliminary AI assessment of market opportunity, competitive landscape, and investment recommendation.',
    color: 'text-purple-400',
  },
]

export default function MarketIntelligencePage() {
  return (
    <div className="min-h-screen bg-midnight text-cream flex flex-col">
      {/* Header */}
      <header className="border-b border-white/6 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="font-mono text-base font-bold tracking-[0.25em] uppercase text-gradient-gold">
            EUNOIA
          </div>
          <div className="text-cream/30 text-[10px] tracking-widest uppercase mt-0.5">
            Intelligence Platform
          </div>
        </div>
        <Link
          href="/login"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl gold-gradient text-midnight text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <Zap size={13} />
          Get Access
        </Link>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-16 space-y-20">

        {/* Hero */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/25 text-gold text-xs font-semibold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            Real Estate Developer Exhibition — June 2026
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight" style={{color: '#f5f0e8'}}>
            AI-Powered{' '}
            <span style={{background: 'linear-gradient(135deg, #c9a455, #e2bc6e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
              Marketing Intelligence
            </span>
            <br />
            <span style={{color: '#f5f0e8'}}>for Egyptian Real Estate</span>
          </h1>
          <p className="text-cream/50 text-lg max-w-2xl mx-auto leading-relaxed">
            Generate institutional-quality market analysis, launch strategies, and investment feasibility reports in under 60 seconds.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/login"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl gold-gradient text-midnight font-bold text-sm hover:opacity-90 transition-opacity"
            >
              <Zap size={15} />
              Generate Free Report
            </Link>
            <span className="text-cream/30 text-sm">No credit card required</span>
          </div>
        </section>

        {/* Market Stats */}
        <section>
          <h2 className="text-cream/40 text-xs font-semibold uppercase tracking-widest text-center mb-8">
            Egypt Real Estate Market — Key Benchmarks 2025
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STAT_CARDS.map(({ icon: Icon, value, label, sub, color, glow }) => (
              <div
                key={label}
                className="bg-surface border border-white/6 rounded-2xl p-5 relative overflow-hidden"
              >
                <div
                  className="absolute inset-0 pointer-events-none rounded-2xl"
                  style={{ background: `radial-gradient(circle at 20% 20%, ${glow}, transparent 70%)` }}
                />
                <div className={`${color} mb-3 relative`}>
                  <Icon size={20} />
                </div>
                <div className="relative" style={{color:'#f5f0e8', fontSize:'1.1rem', fontWeight:700, lineHeight:1.2, wordBreak:'break-word'}}>{value}</div>
                <div className="text-cream/70 text-xs font-medium mt-1 relative">{label}</div>
                <div className="text-cream/30 text-[10px] mt-0.5 relative">{sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Report Types */}
        <section>
          <h2 className="text-cream/40 text-xs font-semibold uppercase tracking-widest text-center mb-8">
            Available Intelligence Reports
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {REPORT_TYPES.map(({ icon: Icon, title, titleAr, desc, color }) => (
              <div
                key={title}
                className="bg-surface border border-white/6 hover:border-gold/30 rounded-2xl p-6 transition-colors group"
              >
                <div className={`${color} mb-4`}>
                  <Icon size={24} />
                </div>
                <div className="text-cream font-semibold text-base mb-0.5">{title}</div>
                <div className="text-cream/30 text-xs mb-3" dir="rtl">{titleAr}</div>
                <p className="text-cream/50 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="rounded-2xl border border-gold/30 bg-gold/5 p-10 text-center">
          <div className="text-3xl mb-4">🏢</div>
          <h2 className="text-cream text-2xl font-bold mb-3">
            Ready to generate your first report?
          </h2>
          <p className="text-cream/50 text-sm mb-8 max-w-md mx-auto">
            Join real estate developers using Eunoia to win clients with data-driven marketing intelligence.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl gold-gradient text-midnight font-bold text-sm hover:opacity-90 transition-opacity"
          >
            <Zap size={15} />
            Get Started — Free
          </Link>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/6 px-6 py-6 text-center">
        <div className="text-cream/20 text-xs">
          © 2026 Eunoia Intelligence Platform · Egypt Real Estate Marketing Intelligence
        </div>
      </footer>

      {/* Mobile floating CTA */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:hidden z-50">
        <Link
          href="/login"
          className="flex items-center gap-2 px-6 py-3 rounded-full gold-gradient text-midnight font-bold text-sm shadow-lg hover:opacity-90 transition-opacity"
        >
          <Zap size={14} />
          Generate Report
        </Link>
      </div>
    </div>
  )
}
