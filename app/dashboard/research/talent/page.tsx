'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SECTORS } from '@core/data/sectors.data'
import { CITIES, COUNTRY_LABELS } from '@core/data/cities.data'
import { downloadCSV } from '@/lib/csv-export'
import { parsePlanLimitNotice, type PlanLimitNotice } from '@/lib/research/api-error'

const styles = `
  .ri-page { background: #FAF5EF; min-height: 100vh; font-family: 'Inter','Cairo','Segoe UI',sans-serif; }
  .ri-topbar { background: linear-gradient(135deg,#2D0A3E,#4A1042,#1A0520); padding: 18px 24px; }
  .ri-topbar-inner { max-width: 900px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
  .ri-brand-tag { font-size: 10px; font-weight: 800; letter-spacing: 3px; color: rgba(255,255,255,0.3); text-transform: uppercase; margin-bottom: 3px; }
  .ri-brand-title { font-size: 20px; font-weight: 900; color: #fff; }
  .ri-back-btn { background: rgba(255,255,255,0.1); border: 1.5px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; text-decoration: none; }
  .ri-back-btn:hover { background: rgba(255,255,255,0.18); color: #fff; }
  .ri-body { max-width: 900px; margin: 0 auto; padding: 24px 16px; }

  .ri-form-card { background: #fff; border: 1.5px solid #E8E2DA; border-radius: 14px; padding: 20px; margin-bottom: 20px; }
  .ri-form-title { font-size: 14px; font-weight: 800; color: #1A1018; margin-bottom: 14px; }
  .ri-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
  .ri-field { display: flex; flex-direction: column; gap: 5px; }
  .ri-label { font-size: 11px; font-weight: 700; color: #6B6560; }
  .ri-input, .ri-select { border: 1.5px solid #E8E2DA; border-radius: 9px; padding: 9px 12px; font-size: 13px; color: #1A1018; outline: none; font-family: inherit; background: #fff; }
  .ri-input:focus, .ri-select:focus { border-color: #7C3AED; box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
  .ri-submit-btn { width: 100%; background: linear-gradient(135deg,#2D0A3E,#4A1042); color: #fff; border: none; padding: 12px; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: pointer; font-family: inherit; transition: opacity 0.15s; }
  .ri-submit-btn:hover { opacity: 0.9; }
  .ri-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .ri-error { background: #FDE8E8; border: 1px solid #F0B4B4; color: #B91C1C; border-radius: 9px; padding: 10px 14px; font-size: 12px; margin-bottom: 16px; }
  .ri-plan-limit { background: #FFF8E8; border: 1px solid #F0DDA0; color: #6F4C08; border-radius: 12px; padding: 14px 16px; font-size: 12px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .ri-plan-limit strong { display: block; color: #3A2A08; font-size: 13px; margin-bottom: 3px; }
  .ri-plan-limit a { flex-shrink: 0; background: #4A1042; color: #fff; text-decoration: none; font-weight: 800; border-radius: 8px; padding: 8px 12px; }

  .ri-disclaimer { background: #FFF8E8; border: 1px solid #F0DDA0; color: #8A6310; border-radius: 9px; padding: 10px 14px; font-size: 12px; margin-bottom: 16px; line-height: 1.5; }
  .ri-summary { background: #fff; border: 1.5px solid #E8E2DA; border-radius: 12px; padding: 16px; margin-bottom: 16px; font-size: 13px; color: #3A3430; line-height: 1.6; }
  .ri-result-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 10px; flex-wrap: wrap; }
  .ri-conf { font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 10px; }
  .ri-actions { display: flex; gap: 8px; }
  .ri-action-btn { padding: 8px 14px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; border: 1.5px solid #E8E2DA; background: #fff; color: #6B6560; font-family: inherit; transition: all 0.15s; text-decoration: none; }
  .ri-action-btn:hover { border-color: #7C3AED; color: #7C3AED; }
  .ri-action-btn.green { background: #0D9488; color: #fff; border-color: #0D9488; }

  .ri-stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
  .ri-stat-card { background: #fff; border: 1.5px solid #E8E2DA; border-radius: 12px; padding: 16px; }
  .ri-stat-label { font-size: 11px; color: #9A9090; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
  .ri-stat-value { font-size: 20px; font-weight: 900; color: #4A1042; }
  .ri-stat-sub { font-size: 11px; color: #6B6560; margin-top: 4px; }
  .ri-demand-badge { display: inline-block; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 10px; margin-bottom: 4px; }

  .ri-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
  .ri-chip { font-size: 11px; background: #F0E8EF; color: #4A1042; padding: 4px 10px; border-radius: 8px; font-weight: 600; }

  .ri-section-title { font-size: 12px; font-weight: 800; color: #1A1018; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
  .ri-profile-list, .ri-source-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
  .ri-profile, .ri-source { background: #fff; border: 1.5px solid #E8E2DA; border-radius: 10px; padding: 12px 14px; }
  .ri-profile-name { font-size: 12px; font-weight: 800; color: #1A1018; margin-bottom: 4px; }
  .ri-profile-desc { font-size: 12px; color: #6B6560; line-height: 1.5; }
  .ri-source-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .ri-source-name { font-size: 12px; font-weight: 800; color: #1A1018; }
  .ri-source-notes { font-size: 11px; color: #9A9090; margin-top: 2px; }
  .ri-link-btn { font-size: 11px; font-weight: 700; color: #7C3AED; text-decoration: none; border: 1px solid #E0D0F5; padding: 5px 10px; border-radius: 8px; background: #FAF5FF; flex-shrink: 0; }
`

interface CandidateSource { platform: string; url: string; notes: string }
interface SuggestedProfile { archetype: string; background: string }
interface TalentReport {
  search_criteria: { job_title: string; location: string; industry: string; experience: string; skills: string }
  executive_summary: string
  market_overview: string
  salary_range: { min: number; max: number; currency: string; period: string; notes: string }
  hiring_demand: { level: string; trend: string; notes: string }
  candidate_sources: CandidateSource[]
  suggested_keywords: string[]
  suggested_profiles: SuggestedProfile[]
  estimate_disclaimer: string
  confidence_score: { pct: number; label: string; reason: string }
}

const EXPERIENCE_LEVELS = ['0-2 years', '3-5 years', '6-10 years', '10+ years']

export default function TalentFinderPage() {
  const [jobTitle, setJobTitle] = useState('')
  const [location, setLocation] = useState('')
  const [industry, setIndustry] = useState('')
  const [experience, setExperience] = useState(EXPERIENCE_LEVELS[1])
  const [skills, setSkills] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [planLimit, setPlanLimit] = useState<PlanLimitNotice | null>(null)
  const [report, setReport] = useState<TalentReport | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setJobTitle(params.get('jobTitle') ?? '')
    setLocation(params.get('location') ?? '')
    setIndustry(params.get('industry') ?? '')
    setExperience(params.get('experience') ?? EXPERIENCE_LEVELS[1])
    setSkills(params.get('skills') ?? '')
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!jobTitle.trim() || !location || !industry || !skills.trim()) {
      setError('Please fill in job title, location, industry, and skills.')
      return
    }
    setLoading(true)
    setError(null)
    setPlanLimit(null)
    try {
      const res = await fetch('/api/research/talent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, location, industry, experience, skills }),
      })
      const data = await res.json()
      if (!res.ok) {
        const notice = parsePlanLimitNotice(data)
        if (notice) {
          setPlanLimit(notice)
          return
        }
        throw new Error(data.error ?? `Request failed: ${res.status}`)
      }
      setReport(data.report as TalentReport)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function exportCSV() {
    if (!report) return
    const rows: Array<Array<string | number>> = [
      ['Eunoia Research Intelligence — Talent Finder'],
      [`Job Title: ${report.search_criteria.job_title}`, `Location: ${report.search_criteria.location}`, `Industry: ${report.search_criteria.industry}`],
      [`Salary range: ${report.salary_range.min}-${report.salary_range.max} ${report.salary_range.currency}/${report.salary_range.period}`],
      [`Hiring demand: ${report.hiring_demand.level} (${report.hiring_demand.trend})`],
      [],
      ['Suggested Keywords', report.suggested_keywords.join(', ')],
      [],
      ['Candidate Source', 'URL', 'Notes'],
      ...report.candidate_sources.map(s => [s.platform, s.url, s.notes]),
      [],
      ['Suggested Profile', 'Background'],
      ...report.suggested_profiles.map(p => [p.archetype, p.background]),
    ]
    downloadCSV(`talent-finder-${report.search_criteria.job_title}-${Date.now()}.csv`, rows)
  }

  const confColor = report && report.confidence_score.pct >= 70 ? '#0D9488' : '#F0A020'
  const demandColor = report?.hiring_demand.level === 'High' ? '#0D9488' : report?.hiring_demand.level === 'Low' ? '#D4183D' : '#F0A020'

  return (
    <>
      <style>{styles}</style>
      <div className="ri-page">
        <div className="ri-topbar">
          <div className="ri-topbar-inner">
            <div>
              <div className="ri-brand-tag">RESEARCH INTELLIGENCE</div>
              <div className="ri-brand-title">Talent Finder</div>
            </div>
            <Link className="ri-back-btn" href="/dashboard/research">&#8592; Back to Hub</Link>
          </div>
        </div>

        <div className="ri-body">
          <form className="ri-form-card" onSubmit={handleSubmit}>
            <div className="ri-form-title">Research a talent market</div>
            {error && <div className="ri-error">{error}</div>}
            {planLimit && (
              <div className="ri-plan-limit">
                <div>
                  <strong>{planLimit.planLabel} plan limit reached</strong>
                  <span>{planLimit.used}/{planLimit.limit} reports used this month. Upgrade to continue researching without interruption.</span>
                </div>
                <Link href="/dashboard/settings">Upgrade</Link>
              </div>
            )}
            <div className="ri-form-grid">
              <div className="ri-field">
                <label className="ri-label">Job Title</label>
                <input className="ri-input" placeholder="e.g. Performance Marketing Manager" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required />
              </div>
              <div className="ri-field">
                <label className="ri-label">Location</label>
                <select className="ri-select" value={location} onChange={e => setLocation(e.target.value)} required>
                  <option value="">Select city…</option>
                  {Object.entries(CITIES).map(([country, cities]) => (
                    <optgroup key={country} label={COUNTRY_LABELS[country as keyof typeof COUNTRY_LABELS].en}>
                      {cities.map(c => <option key={c.key} value={c.key}>{c.en}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="ri-field">
                <label className="ri-label">Industry</label>
                <select className="ri-select" value={industry} onChange={e => setIndustry(e.target.value)} required>
                  <option value="">Select industry…</option>
                  {Object.entries(SECTORS).map(([key, s]) => (
                    <option key={key} value={key}>{s.en}</option>
                  ))}
                </select>
              </div>
              <div className="ri-field">
                <label className="ri-label">Experience</label>
                <select className="ri-select" value={experience} onChange={e => setExperience(e.target.value)}>
                  {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="ri-field" style={{ marginBottom: 14 }}>
              <label className="ri-label">Required Skills</label>
              <input className="ri-input" placeholder="e.g. Meta Ads, Google Ads, Arabic copywriting" value={skills} onChange={e => setSkills(e.target.value)} required />
            </div>
            <button className="ri-submit-btn" type="submit" disabled={loading}>
              {loading ? 'Researching…' : 'Find Talent Market'}
            </button>
          </form>

          {report && (
            <>
              <div className="ri-disclaimer">&#9888; {report.estimate_disclaimer}</div>

              <div className="ri-result-head">
                <span className="ri-conf" style={{ background: confColor + '18', color: confColor }}>
                  Confidence: {report.confidence_score.pct}% ({report.confidence_score.label})
                </span>
                <div className="ri-actions">
                  <button className="ri-action-btn green" onClick={exportCSV}>&#128202; Export CSV / Excel</button>
                  <Link href="/dashboard/reports" className="ri-action-btn">View in Report History</Link>
                </div>
              </div>

              <div className="ri-summary">{report.market_overview}</div>

              <div className="ri-stats-row">
                <div className="ri-stat-card">
                  <div className="ri-stat-label">Salary Range</div>
                  <div className="ri-stat-value">{report.salary_range.min.toLocaleString()}–{report.salary_range.max.toLocaleString()} {report.salary_range.currency}</div>
                  <div className="ri-stat-sub">per {report.salary_range.period} · {report.salary_range.notes}</div>
                </div>
                <div className="ri-stat-card">
                  <div className="ri-stat-label">Hiring Demand</div>
                  <div className="ri-demand-badge" style={{ background: demandColor + '18', color: demandColor }}>{report.hiring_demand.level} · {report.hiring_demand.trend}</div>
                  <div className="ri-stat-sub">{report.hiring_demand.notes}</div>
                </div>
              </div>

              <div className="ri-section-title">Suggested Search Keywords</div>
              <div className="ri-chips">
                {report.suggested_keywords.map((k, i) => <span key={i} className="ri-chip">{k}</span>)}
              </div>

              <div className="ri-section-title">Suggested Candidate Profiles</div>
              <div className="ri-profile-list">
                {report.suggested_profiles.map((p, i) => (
                  <div key={i} className="ri-profile">
                    <div className="ri-profile-name">{p.archetype}</div>
                    <div className="ri-profile-desc">{p.background}</div>
                  </div>
                ))}
              </div>

              <div className="ri-section-title">Candidate Sources</div>
              <div className="ri-source-list">
                {report.candidate_sources.map((s, i) => (
                  <div key={i} className="ri-source">
                    <div className="ri-source-row">
                      <div>
                        <div className="ri-source-name">{s.platform}</div>
                        <div className="ri-source-notes">{s.notes}</div>
                      </div>
                      <a className="ri-link-btn" href={s.url} target="_blank" rel="noopener noreferrer">Open ↗</a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
