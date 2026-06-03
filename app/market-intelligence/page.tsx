'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  TrendingUp, Target, Building2, LineChart,
  Zap, BarChart3, Brain, CheckCircle, ArrowRight,
  Users, PieChart,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Logo } from '@/components/logo'
import { FadeIn } from '@/components/motion/fade-in'

const STATS = [
  { icon: TrendingUp, value: '18%',        label: 'Real Estate YoY Growth', sub: 'Egypt 2025 — prime residential',  accent: '#16a34a' },
  { icon: Target,     value: 'EGP 300–800', label: 'Benchmark CPL',          sub: 'Cost per lead, residential',       accent: '#b8922a' },
  { icon: Building2,  value: 'EGP 2M–20M', label: 'Ticket Size Range',       sub: 'Entry to luxury residential',      accent: '#2563eb' },
  { icon: LineChart,  value: '8–12%',       label: 'Annual Yield',            sub: 'Investor ROI, prime locations',    accent: '#7c3aed' },
]

const REPORTS = [
  {
    icon: Zap,
    type: 'REAL_ESTATE_LAUNCH',
    title: 'Project Launch Strategy',
    titleAr: 'استراتيجية إطلاق المشروع',
    desc: 'Full go-to-market plan: phased channel strategy, GDV-based media budget, broker activation, content brief, and launch readiness score.',
    accent: '#b8922a',
  },
  {
    icon: Target,
    type: 'REAL_ESTATE_LEADS',
    title: 'Lead Gen Intelligence',
    titleAr: 'تحليل توليد العملاء المحتملين',
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
    desc: 'Complete brand audit: paid performance, competitor mapping, content gaps, 90-day growth roadmap, and tailored proposal.',
    accent: '#7c3aed',
  },
  {
    icon: Users,
    type: 'COMPETITOR',
    title: 'Competitor Intelligence',
    titleAr: 'تحليل المنافسين',
    desc: 'Real competitor names, ad library estimates, content strategy audit, blue ocean segment, and differentiation positioning map.',
    accent: '#dc2626',
  },
  {
    icon: PieChart,
    type: 'CAMPAIGN',
    title: 'Campaign ROI Audit',
    titleAr: 'تدقيق أداء الحملات',
    desc: 'Channel-by-channel performance review, wasted spend identification, creative scoring, and media mix optimisation plan.',
    accent: '#0891b2',
  },
]

const INSIGHTS = [
  {
    title: 'Market Overview — Q2 2025',
    rows: [
      ['Market Size',                  'EGP 600B+'],
      ['YoY Growth',                   '18%'],
      ['New Launches',                 '200+ projects'],
      ['New Capital Absorption',       '65%'],
      ['Avg Price/sqm (New Capital)',  'EGP 12,000–18,000'],
      ['Standard Payment Plan',        '10 years'],
      ['Broker Channel Share',         '60–70% of sales'],
    ],
  },
  {
    title: 'Digital Advertising Benchmarks',
    rows: [
      ['Marketing Budget vs GDV',      '2–4%'],
      ['CPL — Mid-range',              'EGP 300–500'],
      ['CPL — Luxury',                 'EGP 500–1,200'],
      ['WhatsApp SLA → 3× conversion', '< 5 minutes'],
      ['Broker Activation Pre-launch', '15–25 exclusive'],
      ['New Cairo CPL Premium',        '+25%'],
      ['New Capital CPL Premium',      '+20%'],
    ],
  },
]

const MISTAKES = [
  { n: '01', text: 'Launching with no landing page or pixel — leads disappear into WhatsApp with zero tracking.' },
  { n: '02', text: 'Generic creative: "luxury units, call now" — no hook, no segment, no differentiation.' },
  { n: '03', text: 'Responding to leads after 2 hours — 3× lower conversion vs < 5 minute WhatsApp SLA.' },
  { n: '04', text: 'Skipping broker activation — forfeiting 60–70% of the sales channel before launch day.' },
  { n: '05', text: 'Spending 100% on Meta with no Google branded — competitors steal your brand searches.' },
  { n: '06', text: 'No retargeting — the 97% who saw your ad but didn\'t convert are abandoned forever.' },
  { n: '07', text: 'Payment plan under 8 years — losing 40% of buyers who need longer horizons to qualify.' },
  { n: '08', text: 'No ROI calculator — investor segment needs yield proof before booking a site visit.' },
]

const INCLUDES = [
  'Egypt RE market benchmarks Q2 2025 — real CPL, GDV%, and absorption data',
  'Location-specific CPL adjustments (New Cairo +25%, New Capital +20%, 6th Oct -10%)',
  'Phased channel strategy: pre-launch → soft launch → full launch with budgets',
  'Media budget breakdown with GDV percentage justification',
  'Broker activation playbook — WhatsApp kit + exclusivity model',
  'Launch readiness score across 5 weighted dimensions',
  'Content requirements: must-have vs high-impact asset list',
  '90-day action plan with weekly milestones and KPIs',
]

export default function MarketIntelligencePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Sticky Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-border/50 backdrop-blur-xl bg-background/80">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <Logo />
          <Link href="/login">
            <Button variant="gold" size="sm" className="gap-1.5">
              <Zap size={13} />Get Access
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Animated orbs */}
        <motion.div
          className="absolute top-16 left-1/3 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(184,146,42,0.18), transparent 70%)', filter: 'blur(80px)' }}
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,170,69,0.12), transparent 70%)', filter: 'blur(80px)' }}
          animate={{ x: [0, -40, 0], y: [0, 25, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <FadeIn>
            <Badge variant="gold" className="mb-7 gap-2 px-4 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse inline-block" />
              Real Estate Developer Exhibition — June 2026
            </Badge>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.1] tracking-tight mb-6">
              AI-Powered{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #b8922a 0%, #d4aa45 45%, #b8922a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Marketing Intelligence
              </span>
              <br />
              for Egyptian Real Estate
            </h1>
          </FadeIn>

          <FadeIn delay={0.18}>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Generate institutional-quality market analysis, launch strategies, and investment feasibility
              reports in under 60 seconds — backed by Egypt RE benchmarks 2025.
            </p>
          </FadeIn>

          <FadeIn delay={0.26}>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/login">
                <Button variant="gold" size="lg" className="gap-2 rounded-xl shadow-lg shadow-gold/20">
                  <Zap size={16} />Generate Free Report
                </Button>
              </Link>
              <span className="text-muted-foreground text-sm">No credit card required</span>
            </div>
          </FadeIn>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
            {STATS.map(({ icon: Icon, value, label, sub, accent }, i) => (
              <FadeIn key={label} delay={0.34 + i * 0.08}>
                <Card className="p-5 text-left hover:border-gold/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-default">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: `${accent}18` }}
                  >
                    <Icon size={16} style={{ color: accent }} />
                  </div>
                  <div className="text-xl font-bold text-foreground leading-tight break-words">{value}</div>
                  <div className="text-xs font-semibold text-foreground/80 mt-1">{label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reports ─────────────────────────────────────── */}
      <section className="py-24 bg-muted/40">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
              Available Intelligence Reports
            </p>
            <h2 className="font-serif text-3xl font-bold text-foreground">
              Six Lenses on Your Market
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {REPORTS.map(({ icon: Icon, type, title, titleAr, desc, accent }, i) => (
              <FadeIn key={type} delay={i * 0.07}>
                <Link href={`/login?next=/dashboard/intelligence?type=${type}`} className="block no-underline group h-full">
                  <Card className="p-6 h-full group-hover:border-gold/35 group-hover:shadow-lg group-hover:-translate-y-1.5 transition-all duration-300">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: `${accent}15` }}
                    >
                      <Icon size={19} style={{ color: accent }} />
                    </div>
                    <div className="font-semibold text-foreground text-sm mb-1">{title}</div>
                    <div
                      className="text-[10px] text-muted-foreground mb-3 text-right"
                      dir="rtl"
                    >
                      {titleAr}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-gold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Generate report <ArrowRight size={11} />
                    </div>
                  </Card>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benchmarks ──────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
              Data-Backed Intelligence
            </p>
            <h2 className="font-serif text-3xl font-bold text-foreground">
              Egypt RE 2025 Benchmarks
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-6">
            {INSIGHTS.map(({ title, rows }, i) => (
              <FadeIn key={title} delay={i * 0.12}>
                <Card className="overflow-hidden">
                  <div className="px-5 py-4 border-b border-border bg-muted/30">
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  </div>
                  {rows.map(([k, v], j) => (
                    <div
                      key={k}
                      className={`flex justify-between items-center px-5 py-3 ${j < rows.length - 1 ? 'border-b border-border/40' : ''}`}
                    >
                      <span className="text-sm text-muted-foreground">{k}</span>
                      <span className="text-sm font-bold text-gold">{v}</span>
                    </div>
                  ))}
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mistakes ────────────────────────────────────── */}
      <section className="py-24 bg-muted/40">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Why Campaigns Fail
            </p>
          </FadeIn>
          <FadeIn delay={0.06} className="mb-4">
            <h2 className="font-serif text-3xl font-bold text-foreground">
              8 Mistakes Killing Your Campaign ROI
            </h2>
          </FadeIn>
          <FadeIn delay={0.1} className="mb-12">
            <p className="text-muted-foreground text-sm max-w-xl">
              Real estate developers in Egypt consistently lose leads and revenue to these preventable errors.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 gap-4">
            {MISTAKES.map(({ n, text }, i) => (
              <FadeIn key={n} delay={i * 0.06}>
                <Card className="p-5 flex gap-4 items-start hover:border-border hover:shadow-sm transition-all">
                  <span className="text-[11px] font-bold text-gold font-mono tracking-wider shrink-0 mt-0.5 pt-0.5">
                    {n}
                  </span>
                  <span className="text-sm text-muted-foreground leading-relaxed">{text}</span>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Includes + CTA ──────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <FadeIn>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                Every Report Includes
              </p>
              <h2 className="font-serif text-3xl font-bold text-foreground mb-8">
                Institutional Depth.<br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #b8922a, #d4aa45)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  60-Second Delivery.
                </span>
              </h2>
              <ul className="space-y-3.5">
                {INCLUDES.map((item) => (
                  <li key={item} className="flex gap-3 items-start">
                    <CheckCircle size={15} className="text-gold shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </FadeIn>

            <FadeIn delay={0.15}>
              <Card
                className="p-8 border-gold-border text-center"
                style={{ background: 'linear-gradient(145deg, #fdf8ee, #fff8e8)' }}
              >
                <div className="text-4xl mb-5">🏢</div>
                <h3 className="font-serif text-2xl font-bold text-foreground mb-3">
                  Ready to generate your first report?
                </h3>
                <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                  Join real estate developers using Eunoia to win clients with data-driven marketing intelligence.
                </p>
                <Link href="/login" className="block">
                  <Button
                    variant="gold"
                    size="lg"
                    className="w-full gap-2 rounded-xl shadow-lg shadow-gold/20"
                  >
                    <Zap size={16} />Get Started — Free
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground mt-4">No credit card required</p>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-xs text-muted-foreground text-center">
            © 2026 Eunoia Intelligence Platform · Egypt Real Estate Marketing Intelligence
          </p>
          <Link href="/login">
            <Button variant="outline" size="sm" className="gap-1.5">
              Sign in <ArrowRight size={11} />
            </Button>
          </Link>
        </div>
      </footer>

      {/* Mobile Floating CTA */}
      <div className="fixed bottom-6 inset-x-0 flex justify-center md:hidden z-50 pointer-events-none">
        <Link href="/login" className="pointer-events-auto">
          <Button
            variant="gold"
            size="lg"
            className="rounded-full gap-2 shadow-xl shadow-gold/30 px-7"
          >
            <Zap size={15} />Generate Report
          </Button>
        </Link>
      </div>

    </div>
  )
}
