'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { SectorSelector } from '@/components/intelligence/sector-selector'
import { CitySelector } from '@/components/intelligence/city-selector'
import { CompetitorInput } from '@/components/intelligence/competitor-input'
import type { CompetitorEntry } from '@/components/intelligence/competitor-input'
import { REPORT_TYPE_LABELS, type ReportType } from '@services/ai-engine/prompt-builder'
import { BRANCHES } from '@core/data/branches.data'
import { getCity } from '@core/data/cities.data'
import type { ReportInput } from '@/types/report.types'

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

const REPORT_GROUPS = [
  {
    label: { ar: 'التقارير الأساسية', en: 'Core Reports' },
    icon: '📊',
    types: ['PRELIMINARY', 'FULL_ANALYSIS', 'OPPORTUNITY_SCORING', 'EXECUTIVE_SUMMARY'] as const,
  },
  {
    label: { ar: 'تنافسي وسوق', en: 'Competitive & Market' },
    icon: '🎯',
    types: ['COMPETITOR', 'PRICING', 'TREND_RESEARCH', 'MARKET_ENTRY'] as const,
  },
  {
    label: { ar: 'حملات ومحتوى', en: 'Campaigns & Content' },
    icon: '📣',
    types: ['CAMPAIGN', 'MEDIA_MIX', 'CONTENT_SEO', 'SOCIAL_AUDIT'] as const,
  },
  {
    label: { ar: 'عملاء ونمو', en: 'Customers & Growth' },
    icon: '📈',
    types: ['CLV_RETENTION', 'LEAD_QUALITY', 'CUSTOMER_JOURNEY'] as const,
  },
  {
    label: { ar: 'استراتيجية', en: 'Strategy' },
    icon: '💡',
    types: ['BRAND_AWARENESS', 'B2B_STRATEGY', 'PRODUCT_LAUNCH', 'DIGITAL_READINESS'] as const,
  },
  {
    label: { ar: 'العقارات 🏢', en: 'Real Estate 🏢' },
    icon: '🏢',
    types: ['REAL_ESTATE_LAUNCH', 'REAL_ESTATE_LEADS', 'REAL_ESTATE_FEASIBILITY'] as const,
  },
] as const

// Auto-show data sections per report type
const TYPE_SECTIONS: Record<ReportType, { ads: boolean; social: boolean; sales: boolean }> = {
  COMPETITOR:          { ads: false, social: false, sales: false },
  CAMPAIGN:            { ads: true,  social: true,  sales: false },
  PRICING:             { ads: true,  social: false, sales: true  },
  FULL_ANALYSIS:       { ads: true,  social: true,  sales: true  },
  CLV_RETENTION:       { ads: false, social: false, sales: true  },
  TREND_RESEARCH:      { ads: false, social: false, sales: false },
  MEDIA_MIX:           { ads: true,  social: true,  sales: false },
  OPPORTUNITY_SCORING:     { ads: false, social: false, sales: false },
  REAL_ESTATE_LAUNCH:      { ads: true,  social: true,  sales: false },
  REAL_ESTATE_LEADS:       { ads: true,  social: true,  sales: false },
  REAL_ESTATE_FEASIBILITY: { ads: false, social: false, sales: false },
  PRELIMINARY:       { ads: false, social: false, sales: false },
  DETAILED:          { ads: true,  social: false, sales: false },
  CONTENT_SEO:       { ads: false, social: true,  sales: false },
  BRAND_AWARENESS:   { ads: false, social: true,  sales: false },
  EXECUTIVE_SUMMARY: { ads: false, social: false, sales: false },
  SENTIMENT:         { ads: false, social: false, sales: false },
  CRISIS:            { ads: false, social: false, sales: false },
  SOCIAL_AUDIT:      { ads: false, social: true,  sales: false },
  LEAD_QUALITY:      { ads: true,  social: false, sales: true  },
  MARKET_ENTRY:      { ads: false, social: false, sales: false },
  ECOMMERCE_GROWTH:  { ads: true,  social: true,  sales: true  },
  SEASONAL:          { ads: false, social: false, sales: false },
  CUSTOMER_JOURNEY:  { ads: true,  social: true,  sales: true  },
  ANNUAL_BUDGET:     { ads: true,  social: false, sales: true  },
  REBRANDING:        { ads: false, social: true,  sales: false },
  B2B_STRATEGY:      { ads: true,  social: false, sales: true  },
  PRODUCT_LAUNCH:    { ads: false, social: false, sales: false },
  DIGITAL_READINESS: { ads: false, social: true,  sales: false },
  INFLUENCER:        { ads: false, social: true,  sales: false },
}

const RE_TYPES: ReportType[] = ['REAL_ESTATE_LAUNCH', 'REAL_ESTATE_LEADS', 'REAL_ESTATE_FEASIBILITY']

const PROJECT_TYPE_OPTIONS = [
  'Residential — Apartment',
  'Residential — Villa / Townhouse',
  'Residential — Compound',
  'Commercial — Office',
  'Commercial — Retail',
  'Mixed Use',
  'Tourism / Resort',
  'Administrative',
]

const PROGRESS_STAGES = [
  'Submitting request…',
  'AI is analysing your business context…',
  'Building intelligence report — this takes 30–60 seconds…',
  'Writing final sections and recommendations…',
]

function InputField({ label, required, children, hint }: {
  label: string
  required?: boolean
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div>
      <label className="block text-sm text-foreground/80 mb-1.5">
        {label}
        {required && <span className="text-gold ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-muted-foreground text-xs mt-1">{hint}</p>}
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div>
        <h3 className="text-foreground text-xs font-bold uppercase tracking-wider">{title}</h3>
        {subtitle && <p className="text-muted-foreground text-xs mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export function ReportForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultType = (searchParams.get('type') as ReportType) ?? 'OPPORTUNITY_SCORING'

  const [selectedTypes, setSelectedTypes] = useState<ReportType[]>([defaultType])
  const reportType = selectedTypes[0] // keep for backward compat with TYPE_SECTIONS
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    REPORT_GROUPS.forEach(g => {
      init[g.icon] = g.types.some(t => (t as string) === defaultType)
    })
    return init
  })
  const [language, setLanguage] = useState<'ar' | 'en'>('ar')
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

  // Real estate project details
  const [projectType, setProjectType] = useState('')
  const [projectLocation, setProjectLocation] = useState('')
  const [projectSize, setProjectSize] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [progressStage, setProgressStage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const toggleType = useCallback((type: ReportType) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.length > 1 ? prev.filter(t => t !== type) : prev
        : [...prev, type]
    )
  }, [])

  // Auto-show sections when report type changes
  useEffect(() => {
    const config = TYPE_SECTIONS[selectedTypes[0]]
    if (config.ads) setShowAds(true)
    if (config.social) setShowSocial(true)
    if (config.sales) setShowSales(true)
  }, [selectedTypes])

  // Advance progress stages while loading
  useEffect(() => {
    if (isLoading) {
      setProgressStage(0)
      let stage = 0
      progressTimerRef.current = setInterval(() => {
        stage = Math.min(stage + 1, PROGRESS_STAGES.length - 1)
        setProgressStage(stage)
      }, 8000)
    } else {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      setProgressStage(0)
    }
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    }
  }, [isLoading])

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
      language,
      website: website.trim() || undefined,
      competitors: competitors.filter(c => c.name.trim()).map(c => ({ name: c.name.trim(), url: c.url })),
      projectType: projectType || undefined,
      projectLocation: projectLocation || undefined,
      projectSize: projectSize || undefined,
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

    const generatedIds: string[] = []

    try {
      for (const type of selectedTypes) {
        const res = await fetch('/api/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, input }),
        })

        const data = await res.json() as { id?: string; error?: string; resetIn?: number }

        if (res.status === 429) {
          const mins = data.resetIn ? Math.ceil(data.resetIn / 60) : 60
          throw new Error(
            language === 'ar'
              ? `لقد وصلت للحد الأقصى. حاول مرة أخرى خلال ${mins} دقيقة.`
              : `Rate limit reached. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`
          )
        }

        if (!res.ok || !data.id) throw new Error(data.error ?? 'Failed to generate report')
        generatedIds.push(data.id)
      }

      // Navigate to first report (others visible in reports list)
      router.push(`/dashboard/reports/${generatedIds[0]}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }, [
    companyName, sectorKey, cityKey, size, stage, language, website, competitors,
    showAds, adsBudget, adsMetaSpend, adsGoogleSpend, adsTiktokSpend, adsRoas, adsCpl, adsLeads, adsCtr,
    showSocial, igFollowers, igEng, fbFollowers, ttFollowers,
    showSales, revenue, convRate, aov, cac, returning,
    projectType, projectLocation, projectSize,
    selectedTypes, router,
  ])

  const isAr = language === 'ar'

  return (
    <form onSubmit={handleSubmit} className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Language toggle */}
      <div className="flex justify-end gap-1">
        {(['en', 'ar'] as const).map(lang => (
          <button
            key={lang}
            type="button"
            onClick={() => setLanguage(lang)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              language === lang
                ? 'bg-gold/10 text-gold border border-gold/30'
                : 'text-muted-foreground hover:text-foreground border border-transparent'
            }`}
          >
            {lang === 'ar' ? 'عربي' : 'EN'}
          </button>
        ))}
      </div>

      {/* Report type */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <div>
          <h3 className="text-foreground text-xs font-bold uppercase tracking-wider">نوع التقرير</h3>
          <p className="text-muted-foreground text-xs mt-0.5">اختر واحد أو أكثر</p>
        </div>
        <div className="space-y-2">
          {REPORT_GROUPS.map(group => {
            const groupActive = group.types.some(t => selectedTypes.includes(t as ReportType))
            const groupOpen = openGroups[group.icon] ?? false
            return (
              <div key={group.icon} className="border border-border rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenGroups(prev => ({...prev, [group.icon]: !prev[group.icon]}))}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-all ${
                    groupActive
                      ? 'text-foreground bg-gold/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                  style={groupActive ? {background:'var(--gold-bg)'} : {}}
                >
                  <div className="flex items-center gap-2">
                    <span>{group.icon}</span>
                    <span>{isAr ? group.label.ar : group.label.en}</span>
                    {groupActive && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{background:'var(--gold)', color:'#fff'}}>
                        {group.types.filter(t => selectedTypes.includes(t as ReportType)).length}
                      </span>
                    )}
                  </div>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${groupOpen ? 'rotate-180' : ''}`} />
                </button>
                {groupOpen && (
                  <div className="border-t border-border p-2 grid grid-cols-2 gap-1.5">
                    {group.types.map(type => {
                      const active = selectedTypes.includes(type as ReportType)
                      const idx = selectedTypes.indexOf(type as ReportType)
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleType(type as ReportType)}
                          className={`relative text-right px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                            active
                              ? 'font-bold shadow-sm'
                              : 'border-border/40 text-foreground/60 hover:text-foreground hover:bg-muted/20 hover:border-border'
                          }`}
                          style={active ? {
                            background:'var(--gold-bg)',
                            color:'var(--gold)',
                            borderColor:'var(--gold-border)'
                          } : {}}
                        >
                          {active && (
                            <span className="absolute top-1 left-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black"
                                  style={{background:'var(--gold)', color:'#fff'}}>
                              {idx + 1}
                            </span>
                          )}
                          <span className="block truncate">
                            {isAr ? REPORT_TYPE_LABELS[type as ReportType].ar : REPORT_TYPE_LABELS[type as ReportType].en}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {selectedTypes.length > 1 && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold"
               style={{background:'var(--gold-bg)', color:'var(--gold)', border:'1px solid var(--gold-border)'}}>
            <span>⚡</span>
            <span>{isAr ? `سيتم توليد ${selectedTypes.length} تقارير بنفس البيانات` : `${selectedTypes.length} reports will be generated`}</span>
          </div>
        )}
      </div>

      {/* Company info */}
      <Section title={isAr ? 'معلومات الشركة' : 'Company Information'}>
        <InputField label={isAr ? 'اسم الشركة' : 'Company Name'} required>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            required
            placeholder={isAr ? 'مثال: عيادات أحمد' : 'e.g. Ahmed Clinics'}
            className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-colors"
          />
        </InputField>

        <div className="grid grid-cols-2 gap-4">
          <InputField label={isAr ? 'القطاع' : 'Sector'} required>
            <SectorSelector value={sectorKey} onChange={setSectorKey} language={language} />
          </InputField>
          <InputField label={isAr ? 'المدينة' : 'City'} required>
            <CitySelector value={cityKey} onChange={setCityKey} language={language} />
          </InputField>
        </div>

        <InputField label={isAr ? 'الموقع الإلكتروني' : 'Website'} hint={isAr ? 'اختياري — يساعد في التحليل التنافسي' : 'Optional — helps with competitive analysis'}>
          <input
            type="url"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            placeholder="https://yourwebsite.com"
            className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-colors"
          />
        </InputField>

        <div className="grid grid-cols-2 gap-4">
          <InputField label={isAr ? 'حجم الشركة' : 'Business Size'}>
            <select
              value={size}
              onChange={e => setSize(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-gold/60 transition-colors"
            >
              {SIZE_OPTIONS.map(o => (
                <option key={o.value} value={o.value} className="bg-background">{o.label}</option>
              ))}
            </select>
          </InputField>
          <InputField label={isAr ? 'مرحلة الشركة' : 'Business Stage'}>
            <select
              value={stage}
              onChange={e => setStage(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-gold/60 transition-colors"
            >
              {STAGE_OPTIONS.map(o => (
                <option key={o.value} value={o.value} className="bg-background">{o.label}</option>
              ))}
            </select>
          </InputField>
        </div>

        <InputField label={isAr ? 'المنافسون' : 'Known Competitors'} hint={isAr ? 'أضف حتى 5 منافسين لتحليل أفضل' : 'Add up to 5 competitors for better analysis'}>
          <CompetitorInput competitors={competitors} onChange={setCompetitors} />
        </InputField>
      </Section>

      {/* Project Details — only for real estate types */}
      {RE_TYPES.includes(reportType) && (
        <Section title={isAr ? 'تفاصيل المشروع العقاري' : 'Real Estate Project Details'}>
          <InputField label={isAr ? 'نوع المشروع' : 'Project Type'}>
            <select
              value={projectType}
              onChange={e => setProjectType(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-gold/60 transition-colors"
            >
              <option value="" className="bg-background">{isAr ? '— اختر نوع المشروع —' : '— Select project type —'}</option>
              {PROJECT_TYPE_OPTIONS.map(opt => (
                <option key={opt} value={opt} className="bg-background">{opt}</option>
              ))}
            </select>
          </InputField>
          <div className="grid grid-cols-2 gap-4">
            <InputField label={isAr ? 'موقع المشروع' : 'Project Location'} hint={isAr ? 'مثال: الشيخ زايد، أكتوبر، التجمع الخامس' : 'e.g. Sheikh Zayed, New Capital, North Coast'}>
              <input
                type="text"
                value={projectLocation}
                onChange={e => setProjectLocation(e.target.value)}
                placeholder={isAr ? 'الشيخ زايد، أكتوبر' : 'Sheikh Zayed, New Capital'}
                className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors"
              />
            </InputField>
            <InputField label={isAr ? 'حجم المشروع' : 'Project Scale'} hint={isAr ? 'مثال: 200 وحدة، 50 فيلا' : 'e.g. 200 units, 50 villas, 5,000 sqm'}>
              <input
                type="text"
                value={projectSize}
                onChange={e => setProjectSize(e.target.value)}
                placeholder={isAr ? '200 وحدة سكنية' : '200 residential units'}
                className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors"
              />
            </InputField>
          </div>
        </Section>
      )}

      {/* Ads data — optional */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAds(v => !v)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/20 transition-colors"
        >
          <div>
            <div className="text-foreground text-sm font-medium">
              📊 {isAr ? 'بيانات الإعلانات' : 'Ad Campaign Data'}
            </div>
            <div className="text-muted-foreground text-xs">
              {isAr ? 'اختياري — يرفع دقة التحليل إلى 85%+' : 'Optional — improves confidence to 85%+'}
            </div>
          </div>
          <span className="text-muted-foreground text-xs">{showAds ? '▲' : '▼'}</span>
        </button>

        {showAds && (
          <div className="px-5 pb-5 space-y-4 border-t border-border">
            <div className="grid grid-cols-2 gap-4 pt-4">
              <InputField label={isAr ? 'الميزانية الشهرية (جنيه)' : 'Total Monthly Budget (EGP)'}>
                <input type="number" value={adsBudget} onChange={e => setAdsBudget(e.target.value)} placeholder="20000" className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'إنفاق ميتا (جنيه)' : 'Meta Spend (EGP)'}>
                <input type="number" value={adsMetaSpend} onChange={e => setAdsMetaSpend(e.target.value)} placeholder="12000" className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'إنفاق جوجل (جنيه)' : 'Google Spend (EGP)'}>
                <input type="number" value={adsGoogleSpend} onChange={e => setAdsGoogleSpend(e.target.value)} placeholder="5000" className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'إنفاق تيك توك (جنيه)' : 'TikTok Spend (EGP)'}>
                <input type="number" value={adsTiktokSpend} onChange={e => setAdsTiktokSpend(e.target.value)} placeholder="3000" className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'العائد على الإنفاق (ROAS)' : 'Blended ROAS'}>
                <input type="number" step="0.1" value={adsRoas} onChange={e => setAdsRoas(e.target.value)} placeholder="3.5" className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'تكلفة اللييد (جنيه)' : 'Cost Per Lead (EGP)'}>
                <input type="number" value={adsCpl} onChange={e => setAdsCpl(e.target.value)} placeholder="250" className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'عدد الليدز شهرياً' : 'Monthly Leads'}>
                <input type="number" value={adsLeads} onChange={e => setAdsLeads(e.target.value)} placeholder="80" className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'نسبة النقر (CTR %)' : 'CTR (%)'}>
                <input type="number" step="0.01" value={adsCtr} onChange={e => setAdsCtr(e.target.value)} placeholder="1.8" className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
            </div>
          </div>
        )}
      </div>

      {/* Social data — optional */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSocial(v => !v)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/20 transition-colors"
        >
          <div>
            <div className="text-foreground text-sm font-medium">
              📱 {isAr ? 'بيانات السوشيال ميديا' : 'Social Media Data'}
            </div>
            <div className="text-muted-foreground text-xs">
              {isAr ? 'اختياري — يتيح تحليل الحضور الرقمي' : 'Optional — enables social presence analysis'}
            </div>
          </div>
          <span className="text-muted-foreground text-xs">{showSocial ? '▲' : '▼'}</span>
        </button>

        {showSocial && (
          <div className="px-5 pb-5 space-y-4 border-t border-border">
            <div className="grid grid-cols-2 gap-4 pt-4">
              <InputField label={isAr ? 'متابعو إنستجرام' : 'Instagram Followers'}>
                <input type="number" value={igFollowers} onChange={e => setIgFollowers(e.target.value)} placeholder="12000" className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'معدل التفاعل إنستجرام (%)' : 'Instagram Engagement (%)'}>
                <input type="number" step="0.1" value={igEng} onChange={e => setIgEng(e.target.value)} placeholder="3.2" className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'متابعو فيسبوك' : 'Facebook Followers'}>
                <input type="number" value={fbFollowers} onChange={e => setFbFollowers(e.target.value)} placeholder="8500" className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'متابعو تيك توك' : 'TikTok Followers'}>
                <input type="number" value={ttFollowers} onChange={e => setTtFollowers(e.target.value)} placeholder="5000" className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
            </div>
          </div>
        )}
      </div>

      {/* Sales data — optional */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSales(v => !v)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/20 transition-colors"
        >
          <div>
            <div className="text-foreground text-sm font-medium">
              💰 {isAr ? 'بيانات المبيعات' : 'Sales Performance Data'}
            </div>
            <div className="text-muted-foreground text-xs">
              {isAr ? 'اختياري — يتيح تحليل CLV والإيرادات' : 'Optional — enables CLV and revenue analysis'}
            </div>
          </div>
          <span className="text-muted-foreground text-xs">{showSales ? '▲' : '▼'}</span>
        </button>

        {showSales && (
          <div className="px-5 pb-5 space-y-4 border-t border-border">
            <div className="grid grid-cols-2 gap-4 pt-4">
              <InputField label={isAr ? 'الإيراد الشهري (جنيه)' : 'Monthly Revenue (EGP)'}>
                <input type="number" value={revenue} onChange={e => setRevenue(e.target.value)} placeholder="150000" className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'معدل التحويل (%)' : 'Conversion Rate (%)'}>
                <input type="number" step="0.1" value={convRate} onChange={e => setConvRate(e.target.value)} placeholder="12" className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'متوسط قيمة الطلب (جنيه)' : 'Avg. Order Value (EGP)'}>
                <input type="number" value={aov} onChange={e => setAov(e.target.value)} placeholder="2500" className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'تكلفة اكتساب العميل (جنيه)' : 'Customer Acquisition Cost (EGP)'}>
                <input type="number" value={cac} onChange={e => setCac(e.target.value)} placeholder="800" className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'نسبة العملاء العائدين (%)' : 'Returning Customer Rate (%)'}>
                <input type="number" step="0.1" value={returning} onChange={e => setReturning(e.target.value)} placeholder="35" className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors" />
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

      {isLoading ? (
        <div className="w-full bg-surface border border-border rounded-xl p-5 text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            <span className="text-gold text-sm font-medium">
              {PROGRESS_STAGES[progressStage]}
            </span>
          </div>
          <div className="flex justify-center gap-1.5">
            {PROGRESS_STAGES.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i <= progressStage ? 'bg-gold w-6' : 'bg-muted/30 w-3'
                }`}
              />
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            {isAr ? 'الرجاء الانتظار، لا تغلق الصفحة' : 'Please wait — do not close this page'}
          </p>
        </div>
      ) : (
        <button
          type="submit"
          disabled={!companyName || !sectorKey || !cityKey}
          className="w-full bg-gold hover:bg-gold-light text-midnight font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {selectedTypes.length > 1
            ? (isAr ? `⚡ توليد ${selectedTypes.length} تقارير الآن` : `⚡ Generate ${selectedTypes.length} Reports`)
            : (isAr ? '⚡ توليد التقرير الآن' : '⚡ Generate Report')}
        </button>
      )}
    </form>
  )
}
