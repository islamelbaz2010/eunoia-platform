'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SectorSelector } from '@/components/intelligence/sector-selector'
import { CitySelector } from '@/components/intelligence/city-selector'
import { CompetitorInput } from '@/components/intelligence/competitor-input'
import type { CompetitorEntry } from '@/components/intelligence/competitor-input'
import { REPORT_TYPE_LABELS, type ReportType } from '@services/ai-engine/prompt-builder'
import { BRANCHES } from '@core/data/branches.data'
import { getCity } from '@core/data/cities.data'
import type { ReportInput } from '@/types/report.types'

const REPORT_TYPES = Object.keys(REPORT_TYPE_LABELS) as ReportType[]

const SIZE_OPTIONS = [
  { value: 'small', label: 'Small (1-20 staff)' },
  { value: 'medium', label: 'Medium (21-50 staff)' },
  { value: 'large', label: 'Large (51-200 staff)' },
  { value: 'enterprise', label: 'Enterprise (200+)' },
]

const STAGE_OPTIONS = [
  { value: 'startup', label: 'Startup (0-1 year)' },
  { value: 'growth', label: 'Growth (1-3 years)' },
  { value: 'established', label: 'Established (3-7 years)' },
  { value: 'scaling', label: 'Scaling (7+ years)' },
]

function InputField({ label, required, children, hint }: {
  label: string
  required?: boolean
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div>
      <label className="block text-sm text-cream/70 mb-1.5">
        {label}
        {required && <span className="text-gold ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-cream/30 text-xs mt-1">{hint}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-white/8 rounded-xl p-5 space-y-4">
      <h3 className="text-cream/60 text-xs font-semibold uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  )
}

export function ReportForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultType = (searchParams.get('type') as ReportType) ?? 'OPPORTUNITY_SCORING'

  const [reportType, setReportType] = useState<ReportType>(defaultType)
  const [companyName, setCompanyName] = useState('')
  const [sectorKey, setSectorKey] = useState('')
  const [cityKey, setCityKey] = useState('')
  const [website, setWebsite] = useState('')
  const [size, setSize] = useState('small')
  const [stage, setStage] = useState('growth')
  const [competitors, setCompetitors] = useState<CompetitorEntry[]>([])

  // Ads data
  const [showAds, setShowAds] = useState(false)
  const [adsBudget, setAdsBudget] = useState('')
  const [adsMetaSpend, setAdsMetaSpend] = useState('')
  const [adsGoogleSpend, setAdsGoogleSpend] = useState('')
  const [adsTiktokSpend, setAdsTiktokSpend] = useState('')
  const [adsRoas, setAdsRoas] = useState('')
  const [adsCpl, setAdsCpl] = useState('')
  const [adsLeads, setAdsLeads] = useState('')
  const [adsCtr, setAdsCtr] = useState('')

  // Social data
  const [showSocial, setShowSocial] = useState(false)
  const [igFollowers, setIgFollowers] = useState('')
  const [igEng, setIgEng] = useState('')
  const [fbFollowers, setFbFollowers] = useState('')
  const [ttFollowers, setTtFollowers] = useState('')

  // Sales data
  const [showSales, setShowSales] = useState(false)
  const [revenue, setRevenue] = useState('')
  const [convRate, setConvRate] = useState('')
  const [aov, setAov] = useState('')
  const [cac, setCac] = useState('')
  const [returning, setReturning] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!companyName.trim() || !sectorKey || !cityKey) {
      setError('Company name, sector, and city are required.')
      return
    }

    setIsLoading(true)

    const city = getCity(cityKey)
    const branchData = city
      ? (Object.values(BRANCHES).find(b => b.countryKeys.includes(city.country)) ?? BRANCHES.egypt)
      : BRANCHES.egypt
    const branchKey = Object.entries(BRANCHES).find(([, v]) => v === branchData)?.[0] ?? 'egypt'

    const input: ReportInput = {
      companyName: companyName.trim(),
      sectorKey,
      cityKey,
      branchKey,
      size,
      stage,
      website: website.trim() || undefined,
      competitors: competitors.filter(c => c.name.trim()).map(c => ({ name: c.name.trim(), url: c.url })),
      ads: showAds ? {
        budget: adsBudget || undefined,
        metaSpend: adsMetaSpend || undefined,
        googleSpend: adsGoogleSpend || undefined,
        tiktokSpend: adsTiktokSpend || undefined,
        roas: adsRoas || undefined,
        cpl: adsCpl || undefined,
        leads: adsLeads || undefined,
        ctr: adsCtr || undefined,
      } : undefined,
      social: showSocial ? {
        igFollowers: igFollowers || undefined,
        igEng: igEng || undefined,
        fbFollowers: fbFollowers || undefined,
        ttFollowers: ttFollowers || undefined,
      } : undefined,
      sales: showSales ? {
        revenue: revenue || undefined,
        convRate: convRate || undefined,
        aov: aov || undefined,
        cac: cac || undefined,
        returning: returning || undefined,
      } : undefined,
    }

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: reportType, input }),
      })

      const data = await res.json() as { id?: string; error?: string }

      if (!res.ok || !data.id) {
        throw new Error(data.error ?? 'Failed to generate report')
      }

      router.push(`/dashboard/reports/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }, [
    companyName, sectorKey, cityKey, size, stage, website, competitors,
    showAds, adsBudget, adsMetaSpend, adsGoogleSpend, adsTiktokSpend, adsRoas, adsCpl, adsLeads, adsCtr,
    showSocial, igFollowers, igEng, fbFollowers, ttFollowers,
    showSales, revenue, convRate, aov, cac, returning,
    reportType, router,
  ])

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Report type */}
      <Section title="Report Type">
        <div className="grid grid-cols-2 gap-2">
          {REPORT_TYPES.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setReportType(type)}
              className={`text-left px-3 py-2.5 rounded-lg text-sm transition-colors border ${
                reportType === type
                  ? 'border-gold/40 bg-gold/5 text-gold'
                  : 'border-white/8 text-cream/60 hover:text-cream hover:border-white/15'
              }`}
            >
              {REPORT_TYPE_LABELS[type].en}
            </button>
          ))}
        </div>
      </Section>

      {/* Company info */}
      <Section title="Company Information">
        <InputField label="Company Name" required>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            required
            placeholder="e.g. Ahmed Clinics"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-colors"
          />
        </InputField>

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Sector" required>
            <SectorSelector value={sectorKey} onChange={setSectorKey} />
          </InputField>
          <InputField label="City" required>
            <CitySelector value={cityKey} onChange={setCityKey} />
          </InputField>
        </div>

        <InputField label="Website" hint="Optional — helps with competitive analysis">
          <input
            type="url"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            placeholder="https://yourwebsite.com"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-colors"
          />
        </InputField>

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Business Size">
            <select
              value={size}
              onChange={e => setSize(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream focus:outline-none focus:border-gold/60 transition-colors"
            >
              {SIZE_OPTIONS.map(o => (
                <option key={o.value} value={o.value} className="bg-[#1a2030]">{o.label}</option>
              ))}
            </select>
          </InputField>
          <InputField label="Business Stage">
            <select
              value={stage}
              onChange={e => setStage(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream focus:outline-none focus:border-gold/60 transition-colors"
            >
              {STAGE_OPTIONS.map(o => (
                <option key={o.value} value={o.value} className="bg-[#1a2030]">{o.label}</option>
              ))}
            </select>
          </InputField>
        </div>

        <InputField label="Known Competitors" hint="Add up to 5 competitors for better analysis">
          <CompetitorInput competitors={competitors} onChange={setCompetitors} />
        </InputField>
      </Section>

      {/* Ads data — optional */}
      <div className="bg-surface border border-white/8 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAds(v => !v)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/3 transition-colors"
        >
          <div>
            <div className="text-cream text-sm font-medium">📊 Ad Campaign Data</div>
            <div className="text-cream/40 text-xs">Optional — improves confidence to 85%+</div>
          </div>
          <span className="text-cream/40 text-xs">{showAds ? 'Hide ▲' : 'Add ▼'}</span>
        </button>

        {showAds && (
          <div className="px-5 pb-5 space-y-4 border-t border-white/8">
            <div className="grid grid-cols-2 gap-4 pt-4">
              <InputField label="Total Monthly Budget (EGP)">
                <input type="number" value={adsBudget} onChange={e => setAdsBudget(e.target.value)} placeholder="e.g. 20000" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label="Meta Spend (EGP)">
                <input type="number" value={adsMetaSpend} onChange={e => setAdsMetaSpend(e.target.value)} placeholder="e.g. 12000" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label="Google Spend (EGP)">
                <input type="number" value={adsGoogleSpend} onChange={e => setAdsGoogleSpend(e.target.value)} placeholder="e.g. 5000" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label="TikTok Spend (EGP)">
                <input type="number" value={adsTiktokSpend} onChange={e => setAdsTiktokSpend(e.target.value)} placeholder="e.g. 3000" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label="Blended ROAS">
                <input type="number" step="0.1" value={adsRoas} onChange={e => setAdsRoas(e.target.value)} placeholder="e.g. 3.5" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label="Cost Per Lead (EGP)">
                <input type="number" value={adsCpl} onChange={e => setAdsCpl(e.target.value)} placeholder="e.g. 250" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label="Monthly Leads">
                <input type="number" value={adsLeads} onChange={e => setAdsLeads(e.target.value)} placeholder="e.g. 80" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label="CTR (%)">
                <input type="number" step="0.01" value={adsCtr} onChange={e => setAdsCtr(e.target.value)} placeholder="e.g. 1.8" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
            </div>
          </div>
        )}
      </div>

      {/* Social data — optional */}
      <div className="bg-surface border border-white/8 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSocial(v => !v)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/3 transition-colors"
        >
          <div>
            <div className="text-cream text-sm font-medium">📱 Social Media Data</div>
            <div className="text-cream/40 text-xs">Optional — enables social presence analysis</div>
          </div>
          <span className="text-cream/40 text-xs">{showSocial ? 'Hide ▲' : 'Add ▼'}</span>
        </button>

        {showSocial && (
          <div className="px-5 pb-5 space-y-4 border-t border-white/8">
            <div className="grid grid-cols-2 gap-4 pt-4">
              <InputField label="Instagram Followers">
                <input type="number" value={igFollowers} onChange={e => setIgFollowers(e.target.value)} placeholder="e.g. 12000" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label="Instagram Engagement (%)">
                <input type="number" step="0.1" value={igEng} onChange={e => setIgEng(e.target.value)} placeholder="e.g. 3.2" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label="Facebook Followers">
                <input type="number" value={fbFollowers} onChange={e => setFbFollowers(e.target.value)} placeholder="e.g. 8500" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label="TikTok Followers">
                <input type="number" value={ttFollowers} onChange={e => setTtFollowers(e.target.value)} placeholder="e.g. 5000" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
            </div>
          </div>
        )}
      </div>

      {/* Sales data — optional */}
      <div className="bg-surface border border-white/8 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSales(v => !v)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/3 transition-colors"
        >
          <div>
            <div className="text-cream text-sm font-medium">💰 Sales Performance Data</div>
            <div className="text-cream/40 text-xs">Optional — enables CLV and revenue analysis</div>
          </div>
          <span className="text-cream/40 text-xs">{showSales ? 'Hide ▲' : 'Add ▼'}</span>
        </button>

        {showSales && (
          <div className="px-5 pb-5 space-y-4 border-t border-white/8">
            <div className="grid grid-cols-2 gap-4 pt-4">
              <InputField label="Monthly Revenue (EGP)">
                <input type="number" value={revenue} onChange={e => setRevenue(e.target.value)} placeholder="e.g. 150000" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label="Conversion Rate (%)">
                <input type="number" step="0.1" value={convRate} onChange={e => setConvRate(e.target.value)} placeholder="e.g. 12" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label="Avg. Order Value (EGP)">
                <input type="number" value={aov} onChange={e => setAov(e.target.value)} placeholder="e.g. 2500" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label="Customer Acquisition Cost (EGP)">
                <input type="number" value={cac} onChange={e => setCac(e.target.value)} placeholder="e.g. 800" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label="Returning Customer Rate (%)">
                <input type="number" step="0.1" value={returning} onChange={e => setReturning(e.target.value)} placeholder="e.g. 35" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !companyName || !sectorKey || !cityKey}
        className="w-full bg-gold hover:bg-gold-light text-midnight font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isLoading ? '⏳ Generating report… (30-60 seconds)' : '✨ Generate Intelligence Report'}
      </button>
    </form>
  )
}
