'use client'
import { useState } from 'react'
import Link from 'next/link'
import { SECTORS } from '@core/data/sectors.data'
import { CITIES, COUNTRY_LABELS } from '@core/data/cities.data'
import { downloadCSV } from '@/lib/csv-export'

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

  .ri-disclaimer { background: #FFF8E8; border: 1px solid #F0DDA0; color: #8A6310; border-radius: 9px; padding: 10px 14px; font-size: 12px; margin-bottom: 16px; line-height: 1.5; }
  .ri-summary { background: #fff; border: 1.5px solid #E8E2DA; border-radius: 12px; padding: 16px; margin-bottom: 16px; font-size: 13px; color: #3A3430; line-height: 1.6; }
  .ri-result-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 10px; flex-wrap: wrap; }
  .ri-conf { font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 10px; }
  .ri-actions { display: flex; gap: 8px; }
  .ri-action-btn { padding: 8px 14px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; border: 1.5px solid #E8E2DA; background: #fff; color: #6B6560; font-family: inherit; transition: all 0.15s; }
  .ri-action-btn:hover { border-color: #7C3AED; color: #7C3AED; }
  .ri-action-btn.green { background: #0D9488; color: #fff; border-color: #0D9488; }

  .ri-company-list { display: flex; flex-direction: column; gap: 10px; }
  .ri-company { background: #fff; border: 1.5px solid #E8E2DA; border-radius: 12px; padding: 14px 16px; }
  .ri-company-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
  .ri-company-name { font-size: 13px; font-weight: 800; color: #1A1018; }
  .ri-score { font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 10px; background: #F0E8EF; color: #4A1042; flex-shrink: 0; }
  .ri-company-desc { font-size: 12px; color: #6B6560; line-height: 1.5; margin-bottom: 8px; }
  .ri-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
  .ri-chip { font-size: 10px; background: #FAF5EF; color: #6B6560; padding: 3px 8px; border-radius: 8px; border: 1px solid #E8E2DA; }
  .ri-link-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .ri-link-btn { font-size: 11px; font-weight: 700; color: #7C3AED; text-decoration: none; border: 1px solid #E0D0F5; padding: 5px 10px; border-radius: 8px; background: #FAF5FF; }
  .ri-source-url { display: block; font-size: 11px; color: #7C3AED; word-break: break-all; margin-bottom: 8px; text-decoration: none; }
  .ri-source-url:hover { text-decoration: underline; }
  .ri-empty { background: #fff; border: 1.5px dashed #E8E2DA; border-radius: 12px; padding: 24px; text-align: center; font-size: 13px; color: #6B6560; }
`

interface DecisionMaker { title: string; linkedin_search_url: string }
type SourceType = 'company_website' | 'business_directory' | 'public_listing'
interface Company {
  name: string; sourceUrl: string; sourceType: SourceType
  confidenceScore: number; summary: string
  linkedin_company_search_url: string
  decision_makers: DecisionMaker[]
}
interface LeadReport {
  search_criteria: { industry: string; location: string; company_size: string; titles: string }
  executive_summary: string; research_summary: string; companies: Company[]
  outreach_disclaimer: string
  confidence_score: { pct: number; label: string; reason: string }
  total_sources_found?: number
  total_sources_collected?: number
}

const SIZES = ['1-10', '11-50', '51-200', '201-500', '500+']
const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  company_website: 'Company Website',
  business_directory: 'Business Directory',
  public_listing: 'Public Listing',
}

export default function LeadFinderPage() {
  const [industry, setIndustry] = useState('')
  const [location, setLocation] = useState('')
  const [companySize, setCompanySize] = useState(SIZES[1])
  const [titles, setTitles] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<LeadReport | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!industry || !location || !titles.trim()) {
      setError('Please fill in industry, location, and decision-maker titles.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/research/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, location, companySize, titles }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`)
      setReport(data.report as LeadReport)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function exportCSV() {
    if (!report) return
    const rows: Array<Array<string | number>> = [
      ['Eunoia Research Intelligence — Lead Finder'],
      [`Industry: ${report.search_criteria.industry}`, `Location: ${report.search_criteria.location}`, `Size: ${report.search_criteria.company_size}`],
      [],
      ['Company', 'Confidence Score', 'Source Type', 'Source URL', 'Summary', 'LinkedIn Search', 'Decision Maker Titles'],
      ...report.companies.map(c => [
        c.name, c.confidenceScore, SOURCE_TYPE_LABELS[c.sourceType] ?? c.sourceType, c.sourceUrl, c.summary,
        c.linkedin_company_search_url,
        c.decision_makers.map(d => d.title).join('; '),
      ]),
    ]
    downloadCSV(`lead-finder-${report.search_criteria.industry}-${Date.now()}.csv`, rows)
  }

  const confColor = report && report.confidence_score.pct >= 70 ? '#0D9488' : '#F0A020'

  return (
    <>
      <style>{styles}</style>
      <div className="ri-page">
        <div className="ri-topbar">
          <div className="ri-topbar-inner">
            <div>
              <div className="ri-brand-tag">RESEARCH INTELLIGENCE</div>
              <div className="ri-brand-title">Lead Finder</div>
            </div>
            <Link className="ri-back-btn" href="/dashboard/research">&#8592; Back to Hub</Link>
          </div>
        </div>

        <div className="ri-body">
          <form className="ri-form-card" onSubmit={handleSubmit}>
            <div className="ri-form-title">Find target companies</div>
            {error && <div className="ri-error">{error}</div>}
            <div className="ri-form-grid">
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
                <label className="ri-label">Company Size</label>
                <select className="ri-select" value={companySize} onChange={e => setCompanySize(e.target.value)}>
                  {SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                </select>
              </div>
              <div className="ri-field">
                <label className="ri-label">Decision Maker Titles</label>
                <input className="ri-input" placeholder="e.g. CEO, Marketing Director" value={titles} onChange={e => setTitles(e.target.value)} required />
              </div>
            </div>
            <button className="ri-submit-btn" type="submit" disabled={loading}>
              {loading ? 'Researching…' : 'Find Leads'}
            </button>
          </form>

          {report && (
            <>
              <div className="ri-disclaimer">&#9888; {report.outreach_disclaimer}</div>

              <div className="ri-result-head">
                <span className="ri-conf" style={{ background: confColor + '18', color: confColor }}>
                  Confidence: {report.confidence_score.pct}% ({report.confidence_score.label})
                </span>
                <div className="ri-actions">
                  <button className="ri-action-btn green" onClick={exportCSV}>&#128202; Export CSV / Excel</button>
                  <Link href="/dashboard/reports" className="ri-action-btn">View in Report History</Link>
                </div>
              </div>

              <div className="ri-summary">
                <strong>Summary:</strong> {report.executive_summary}
                <br /><br />
                {report.research_summary}
              </div>

              <div className="ri-company-list">
                {report.companies.length === 0 ? (
                  <div className="ri-empty">No real companies were found for this search. Try a different industry or location — nothing is fabricated to fill this list.</div>
                ) : (
                  report.companies.map((c, i) => (
                    <div key={i} className="ri-company">
                      <div className="ri-company-head">
                        <span className="ri-company-name">{c.name}</span>
                        <span className="ri-score">{c.confidenceScore}% confidence</span>
                      </div>
                      <div className="ri-company-desc">{c.summary}</div>
                      <div className="ri-chips">
                        <span className="ri-chip">{SOURCE_TYPE_LABELS[c.sourceType] ?? c.sourceType}</span>
                      </div>
                      <a className="ri-source-url" href={c.sourceUrl} target="_blank" rel="noopener noreferrer">{c.sourceUrl}</a>
                      <div className="ri-link-row">
                        <a className="ri-link-btn" href={c.linkedin_company_search_url} target="_blank" rel="noopener noreferrer">Search company on LinkedIn ↗</a>
                        {c.decision_makers.map((d, j) => (
                          <a key={j} className="ri-link-btn" href={d.linkedin_search_url} target="_blank" rel="noopener noreferrer">Search {d.title} ↗</a>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
