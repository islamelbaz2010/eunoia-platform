'use client'
import Link from 'next/link'

const styles = `
  .ri-page { background: #FAF5EF; min-height: 100vh; font-family: 'Inter','Cairo','Segoe UI',sans-serif; }
  .ri-topbar { background: linear-gradient(135deg,#2D0A3E,#4A1042,#1A0520); padding: 18px 24px; }
  .ri-topbar-inner { max-width: 1000px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
  .ri-brand-tag { font-size: 10px; font-weight: 800; letter-spacing: 3px; color: rgba(255,255,255,0.3); text-transform: uppercase; margin-bottom: 3px; }
  .ri-brand-title { font-size: 20px; font-weight: 900; color: #fff; }
  .ri-brand-sub { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; }
  .ri-back-btn { background: rgba(255,255,255,0.1); border: 1.5px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; text-decoration: none; }
  .ri-back-btn:hover { background: rgba(255,255,255,0.18); color: #fff; }

  .ri-body { max-width: 1000px; margin: 0 auto; padding: 28px 16px; }
  .ri-intro { margin-bottom: 24px; }
  .ri-intro-title { font-size: 18px; font-weight: 800; color: #1A1018; margin-bottom: 6px; }
  .ri-intro-sub { font-size: 13px; color: #6B6560; line-height: 1.6; max-width: 640px; }

  .ri-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
  @media (max-width: 800px) { .ri-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 540px) { .ri-grid { grid-template-columns: 1fr; } }

  .ri-card { background: #fff; border: 1.5px solid #E8E2DA; border-radius: 14px; padding: 18px; text-decoration: none; display: block; transition: all 0.15s; position: relative; }
  .ri-card.live:hover { border-color: #7C3AED; box-shadow: 0 4px 16px rgba(124,58,237,0.1); transform: translateY(-2px); }
  .ri-card.soon { opacity: 0.6; cursor: default; }
  .ri-card-icon { font-size: 28px; margin-bottom: 10px; }
  .ri-card-title { font-size: 14px; font-weight: 800; color: #1A1018; margin-bottom: 4px; }
  .ri-card-desc { font-size: 12px; color: #9A9090; line-height: 1.5; }
  .ri-badge { position: absolute; top: 14px; right: 14px; font-size: 9px; font-weight: 800; letter-spacing: 0.06em; padding: 3px 8px; border-radius: 8px; text-transform: uppercase; }
  .ri-badge.live { background: #0D948818; color: #0D9488; }
  .ri-badge.soon { background: #F0E8EF; color: #4A1042; }
`

const LIVE_MODULES = [
  { href: '/dashboard/research/leads', icon: '🎯', title: 'Lead Finder', desc: 'Find target companies and decision-makers by industry, location, and company size.' },
  { href: '/dashboard/research/talent', icon: '🧑‍💼', title: 'Talent Finder', desc: 'Salary benchmarks, hiring demand, and candidate sourcing by job title and location.' },
]

const SOON_MODULES = [
  { icon: '🏢', title: 'Competitor Intelligence', desc: 'Deep-dive competitor positioning, pricing, and campaign analysis.' },
  { icon: '📈', title: 'Market Intelligence Research', desc: 'Custom market-sizing and opportunity research on demand.' },
  { icon: '📦', title: 'Supplier Intelligence', desc: 'Vendor and supplier discovery for procurement teams.' },
  { icon: '🧭', title: 'Recruitment Intelligence', desc: 'Full-cycle hiring pipeline research and market mapping.' },
]

export default function ResearchHubPage() {
  return (
    <>
      <style>{styles}</style>
      <div className="ri-page">
        <div className="ri-topbar">
          <div className="ri-topbar-inner">
            <div>
              <div className="ri-brand-tag">EUNOIA</div>
              <div className="ri-brand-title">Research Intelligence Hub</div>
              <div className="ri-brand-sub">AI-powered research modules for sales and hiring teams</div>
            </div>
            <Link className="ri-back-btn" href="/dashboard">&#8592; Back to Dashboard</Link>
          </div>
        </div>

        <div className="ri-body">
          <div className="ri-intro">
            <div className="ri-intro-title">Choose a research module</div>
            <p className="ri-intro-sub">
              Each module runs an AI research pass against your criteria and saves the result to your{' '}
              <Link href="/dashboard/reports" style={{ color: '#7C3AED', fontWeight: 700 }}>Report History</Link>,
              with CSV/Excel export. Results are AI-generated research — always verify before outreach.
            </p>
          </div>

          <div className="ri-grid">
            {LIVE_MODULES.map(m => (
              <Link key={m.href} href={m.href} className="ri-card live">
                <span className="ri-badge live">Live</span>
                <div className="ri-card-icon">{m.icon}</div>
                <div className="ri-card-title">{m.title}</div>
                <div className="ri-card-desc">{m.desc}</div>
              </Link>
            ))}
            {SOON_MODULES.map(m => (
              <div key={m.title} className="ri-card soon">
                <span className="ri-badge soon">Coming Soon</span>
                <div className="ri-card-icon">{m.icon}</div>
                <div className="ri-card-title">{m.title}</div>
                <div className="ri-card-desc">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
