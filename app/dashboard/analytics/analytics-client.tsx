'use client'
import Link from 'next/link'

const styles = `
  .mi-page { background: #FAF5EF; min-height: 100vh; font-family: 'Inter','Cairo','Segoe UI',sans-serif; }
  .mi-topbar { background: linear-gradient(135deg,#2D0A3E,#4A1042,#1A0520); padding: 18px 24px; }
  .mi-topbar-inner { max-width: 1000px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
  .mi-brand-tag { font-size: 10px; font-weight: 800; letter-spacing: 3px; color: rgba(255,255,255,0.3); text-transform: uppercase; margin-bottom: 3px; }
  .mi-brand-title { font-size: 20px; font-weight: 900; color: #fff; }
  .mi-brand-sub { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; }
  .mi-back-btn { background: rgba(255,255,255,0.1); border: 1.5px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; text-decoration: none; }
  .mi-back-btn:hover { background: rgba(255,255,255,0.18); color: #fff; }

  .mi-body { max-width: 1000px; margin: 0 auto; padding: 24px 16px; }
  .mi-disclaimer { background: #FFF8E8; border: 1px solid #F0DDA0; color: #8A6310; border-radius: 9px; padding: 10px 14px; font-size: 12px; margin-bottom: 20px; line-height: 1.5; }

  .mi-stats-row { display: grid; grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); gap: 10px; margin-bottom: 24px; }
  .mi-stat-card { background: #fff; border: 1.5px solid #E8E2DA; border-radius: 12px; padding: 14px 16px; }
  .mi-stat-num { font-size: 28px; font-weight: 900; color: #4A1042; line-height: 1; }
  .mi-stat-label { font-size: 11px; color: #9A9090; margin-top: 4px; }

  .mi-module-bar { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
  .mi-module-chip { display: flex; align-items: center; gap: 6px; background: #fff; border: 1.5px solid #E8E2DA; border-radius: 20px; padding: 6px 14px; font-size: 12px; font-weight: 700; color: #4A1042; }
  .mi-module-count { background: #4A1042; color: #fff; border-radius: 10px; padding: '2px 7px'; font-size: 10px; }

  .mi-section { margin-bottom: 22px; }
  .mi-section-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .mi-section-icon { font-size: 18px; }
  .mi-section-title { font-size: 14px; font-weight: 800; color: #1A1018; }

  .mi-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
  @media (max-width: 640px) { .mi-grid { grid-template-columns: 1fr; } }
  .mi-card { background: #fff; border: 1.5px solid #E8E2DA; border-radius: 12px; padding: 14px 16px; }
  .mi-card-title { font-size: 12px; font-weight: 800; color: #4A1042; margin-bottom: 5px; }
  .mi-card-desc { font-size: 12px; color: #6B6560; line-height: 1.55; }
`

interface Insight { title: string; desc: string }
interface Section { icon: string; title: string; insights: Insight[] }

const SECTIONS: Section[] = [
  {
    icon: '🇪🇬',
    title: 'Egypt Market Trends',
    insights: [
      { title: 'Currency & inflation pressure', desc: 'EGP depreciation and elevated inflation keep continuing to push consumers toward value-conscious purchasing — pricing and payment-plan flexibility matter more than brand alone.' },
      { title: 'Digital adoption accelerating', desc: 'Mobile wallets, e-commerce, and social commerce keep gaining share, especially in Cairo, Giza, and Alexandria — businesses without a digital storefront are losing reach.' },
      { title: 'Young, urbanizing population', desc: 'A large under-35 population concentrated in expanding urban/New Cities corridors is the core demographic driving demand across retail, real estate, and services.' },
      { title: 'Foreign currency caution', desc: 'Import-dependent sectors face margin pressure from FX volatility — local sourcing and USD-pegged pricing are common mitigations.' },
    ],
  },
  {
    icon: '🏗️',
    title: 'Real Estate Market Trends',
    insights: [
      { title: 'New Administrative Capital & New Cities pull', desc: 'Government-led infrastructure investment continues to shift developer and buyer attention toward New Capital, New Cairo, 6th of October, and the North Coast.' },
      { title: 'Installment-driven sales', desc: 'Extended payment plans (7-10+ years) remain the primary demand lever in a high-interest-rate environment — cash buyers are a shrinking minority.' },
      { title: 'Mid-income segment under-served', desc: 'Most new supply targets upper-middle/luxury; affordable and mid-income housing remains a relative gap and opportunity zone.' },
      { title: 'Coastal & vacation home demand', desc: 'North Coast and Red Sea second-home demand has grown structurally, not just seasonally, as a hedge against EGP depreciation.' },
    ],
  },
  {
    icon: '📣',
    title: 'Marketing Industry Trends',
    insights: [
      { title: 'Performance marketing dominance', desc: 'Meta and Google remain the primary acquisition channels for SMEs and real estate; rising CPLs are pushing advertisers toward better targeting and creative testing rather than raw budget increases.' },
      { title: 'Arabic-first, vertical video content', desc: 'Short-form vertical video in colloquial Arabic consistently outperforms static creative across Instagram/TikTok/Facebook Reels for engagement and CPL.' },
      { title: 'Influencer & micro-creator shift', desc: 'Budget is shifting from large celebrity endorsements toward micro/mid-tier creators with higher perceived authenticity and lower cost-per-engagement.' },
      { title: 'WhatsApp as a sales channel', desc: 'WhatsApp Business is increasingly the default lead-to-close channel in Egypt, ahead of email and even phone calls for many SMEs.' },
    ],
  },
  {
    icon: '💡',
    title: 'Business Insights',
    insights: [
      { title: 'Cash flow discipline over growth-at-all-costs', desc: 'With high local interest rates, businesses that prioritize working-capital efficiency and recurring revenue are outperforming those chasing top-line growth alone.' },
      { title: 'B2B sales cycles lengthening', desc: 'Decision-makers are requiring more proof points (case studies, ROI data) before committing — sales teams that arm themselves with data close faster.' },
      { title: 'Talent retention is a margin lever', desc: 'Turnover in marketing/sales roles is expensive to replace; competitive, transparent compensation benchmarking is increasingly a retention tool, not just a hiring one.' },
    ],
  },
  {
    icon: '🚀',
    title: 'Growth Opportunities',
    insights: [
      { title: 'Underserved mid-market segment', desc: 'SMEs and mid-size developers are underserved by enterprise-grade research/intelligence tooling — a lightweight, affordable research product (like this platform) fills a real gap.' },
      { title: 'Outbound-as-a-service', desc: 'Packaging Lead Finder + Talent Finder output as a recurring research subscription (vs. one-off reports) creates a stickier, higher-LTV revenue model.' },
      { title: 'Vertical specialization', desc: 'Going deep on real estate + marketing-services verticals (rather than broad horizontal coverage) is a defensible wedge against generic AI research tools.' },
    ],
  },
]

const MODULE_LABELS: Record<string, string> = {
  lead_finder: '🎯 Lead Finder',
  talent_finder: '🧑‍💼 Talent Finder',
  market_intelligence: '📊 Market Intelligence',
}

export interface UserStats {
  totalResearch: number
  thisMonth: number
  moduleCounts: Record<string, number>
  topCities: Array<{ city: string; count: number }>
}

export function AnalyticsClient({ stats }: { stats: UserStats | null }) {
  const hasActivity = stats && stats.totalResearch > 0

  return (
    <>
      <style>{styles}</style>
      <div className="mi-page">
        <div className="mi-topbar">
          <div className="mi-topbar-inner">
            <div>
              <div className="mi-brand-tag">EUNOIA INTELLIGENCE</div>
              <div className="mi-brand-title">Market Intelligence Hub</div>
              <div className="mi-brand-sub">Your research activity + curated Egypt market insights</div>
            </div>
            <Link className="mi-back-btn" href="/dashboard">&#8592; Back to Dashboard</Link>
          </div>
        </div>

        <div className="mi-body">
          {/* Live user stats */}
          {hasActivity ? (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9A9090', fontWeight: 700, marginBottom: 10 }}>
                Your Research Activity
              </div>
              <div className="mi-stats-row">
                <div className="mi-stat-card">
                  <div className="mi-stat-num">{stats.totalResearch}</div>
                  <div className="mi-stat-label">Total Searches</div>
                </div>
                <div className="mi-stat-card">
                  <div className="mi-stat-num">{stats.thisMonth}</div>
                  <div className="mi-stat-label">This Month</div>
                </div>
                {stats.topCities.slice(0, 2).map(({ city, count }) => (
                  <div key={city} className="mi-stat-card">
                    <div className="mi-stat-num">{count}</div>
                    <div className="mi-stat-label">Searches · {city}</div>
                  </div>
                ))}
              </div>
              {Object.keys(stats.moduleCounts).length > 0 && (
                <div className="mi-module-bar">
                  {Object.entries(stats.moduleCounts).map(([mod, count]) => (
                    <div key={mod} className="mi-module-chip">
                      {MODULE_LABELS[mod] ?? mod}
                      <span style={{ background: '#4A1042', color: '#fff', borderRadius: 10, padding: '2px 7px', fontSize: 10 }}>{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 9, padding: '10px 14px', fontSize: 12, marginBottom: 20, color: '#0369a1' }}>
              ℹ️ No research activity yet. Run a{' '}
              <Link href="/dashboard/research/leads" style={{ color: '#0369a1', fontWeight: 700 }}>Lead Finder</Link> or{' '}
              <Link href="/dashboard/research/talent" style={{ color: '#0369a1', fontWeight: 700 }}>Talent Finder</Link> search to see your activity stats here.
            </div>
          )}

          {/* Curated market insights disclaimer */}
          <div className="mi-disclaimer">
            &#9888; The curated insights below are periodically-updated market knowledge — not a live data feed.
            For account-specific research, use the <Link href="/dashboard/research" style={{ color: '#8A6310', fontWeight: 700 }}>Research Intelligence Hub</Link>.
          </div>

          {SECTIONS.map(section => (
            <div key={section.title} className="mi-section">
              <div className="mi-section-head">
                <span className="mi-section-icon">{section.icon}</span>
                <span className="mi-section-title">{section.title}</span>
              </div>
              <div className="mi-grid">
                {section.insights.map(insight => (
                  <div key={insight.title} className="mi-card">
                    <div className="mi-card-title">{insight.title}</div>
                    <div className="mi-card-desc">{insight.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
