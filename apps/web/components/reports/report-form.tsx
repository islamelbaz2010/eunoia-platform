'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
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

// Auto-show data sections per report type
const TYPE_SECTIONS: Record<ReportType, { ads: boolean; social: boolean; sales: boolean }> = {
  COMPETITOR:          { ads: false, social: false, sales: false },
  CAMPAIGN:            { ads: true,  social: true,  sales: false },
  PRICING:             { ads: true,  social: false, sales: true  },
  FULL_ANALYSIS:       { ads: true,  social: true,  sales: true  },
  CLV_RETENTION:       { ads: false, social: false, sales: true  },
  TREND_RESEARCH:      { ads: false, social: false, sales: false },
  MEDIA_MIX:           { ads: true,  social: true,  sales: false },
  OPPORTUNITY_SCORING: { ads: false, social: false, sales: false },
}

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

  const [isLoading, setIsLoading] = useState(false)
  const [progressStage, setProgressStage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-show sections when report type changes
  useEffect(() => {
    const config = TYPE_SECTIONS[reportType]
    if (config.ads) setShowAds(true)
    if (config.social) setShowSocial(true)
    if (config.sales) setShowSales(true)
  }, [reportType])

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

      const data = await res.json() as { id?: string; error?: string; resetIn?: number }

      if (res.status === 429) {
        const mins = data.resetIn ? Math.ceil(data.resetIn / 60) : 60
        throw new Error(
          language === 'ar'
            ? `لقد وصلت للحد الأقصى (5 تقارير/ساعة). حاول مرة أخرى خلال ${mins} دقيقة.`
            : `Rate limit reached (5 reports/hour). Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`
        )
      }

      if (!res.ok || !data.id) {
        throw new Error(data.error ?? 'Failed to generate report')
      }

      router.push(`/dashboard/reports/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }, [
    companyName, sectorKey, cityKey, size, stage, language, website, competitors,
    showAds, adsBudget, adsMetaSpend, adsGoogleSpend, adsTiktokSpend, adsRoas, adsCpl, adsLeads, adsCtr,
    showSocial, igFollowers, igEng, fbFollowers, ttFollowers,
    showSales, revenue, convRate, aov, cac, returning,
    reportType, router,
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
                : 'text-cream/40 hover:text-cream border border-transparent'
            }`}
          >
            {lang === 'ar' ? 'عربي' : 'EN'}
          </button>
        ))}
      </div>

      {/* Report type */}
      <Section title={isAr ? 'نوع التقرير' : 'Report Type'}>
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
              {isAr ? REPORT_TYPE_LABELS[type].ar : REPORT_TYPE_LABELS[type].en}
            </button>
          ))}
        </div>
      </Section>

      {/* Company info */}
      <Section title={isAr ? 'معلومات الشركة' : 'Company Information'}>
        <InputField label={isAr ? 'اسم الشركة' : 'Company Name'} required>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            required
            placeholder={isAr ? 'مثال: عيادات أحمد' : 'e.g. Ahmed Clinics'}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-colors"
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
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-colors"
          />
        </InputField>

        <div className="grid grid-cols-2 gap-4">
          <InputField label={isAr ? 'حجم الشركة' : 'Business Size'}>
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
          <InputField label={isAr ? 'مرحلة الشركة' : 'Business Stage'}>
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

        <InputField label={isAr ? 'المنافسون' : 'Known Competitors'} hint={isAr ? 'أضف حتى 5 منافسين لتحليل أفضل' : 'Add up to 5 competitors for better analysis'}>
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
            <div className="text-cream text-sm font-medium">
              📊 {isAr ? 'بيانات الإعلانات' : 'Ad Campaign Data'}
            </div>
            <div className="text-cream/40 text-xs">
              {isAr ? 'اختياري — يرفع دقة التحليل إلى 85%+' : 'Optional — improves confidence to 85%+'}
            </div>
          </div>
          <span className="text-cream/40 text-xs">{showAds ? '▲' : '▼'}</span>
        </button>

        {showAds && (
          <div className="px-5 pb-5 space-y-4 border-t border-white/8">
            <div className="grid grid-cols-2 gap-4 pt-4">
              <InputField label={isAr ? 'الميزانية الشهرية (جنيه)' : 'Total Monthly Budget (EGP)'}>
                <input type="number" value={adsBudget} onChange={e => setAdsBudget(e.target.value)} placeholder="20000" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'إنفاق ميتا (جنيه)' : 'Meta Spend (EGP)'}>
                <input type="number" value={adsMetaSpend} onChange={e => setAdsMetaSpend(e.target.value)} placeholder="12000" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'إنفاق جوجل (جنيه)' : 'Google Spend (EGP)'}>
                <input type="number" value={adsGoogleSpend} onChange={e => setAdsGoogleSpend(e.target.value)} placeholder="5000" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'إنفاق تيك توك (جنيه)' : 'TikTok Spend (EGP)'}>
                <input type="number" value={adsTiktokSpend} onChange={e => setAdsTiktokSpend(e.target.value)} placeholder="3000" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'العائد على الإنفاق (ROAS)' : 'Blended ROAS'}>
                <input type="number" step="0.1" value={adsRoas} onChange={e => setAdsRoas(e.target.value)} placeholder="3.5" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'تكلفة اللييد (جنيه)' : 'Cost Per Lead (EGP)'}>
                <input type="number" value={adsCpl} onChange={e => setAdsCpl(e.target.value)} placeholder="250" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'عدد الليدز شهرياً' : 'Monthly Leads'}>
                <input type="number" value={adsLeads} onChange={e => setAdsLeads(e.target.value)} placeholder="80" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'نسبة النقر (CTR %)' : 'CTR (%)'}>
                <input type="number" step="0.01" value={adsCtr} onChange={e => setAdsCtr(e.target.value)} placeholder="1.8" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
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
            <div className="text-cream text-sm font-medium">
              📱 {isAr ? 'بيانات السوشيال ميديا' : 'Social Media Data'}
            </div>
            <div className="text-cream/40 text-xs">
              {isAr ? 'اختياري — يتيح تحليل الحضور الرقمي' : 'Optional — enables social presence analysis'}
            </div>
          </div>
          <span className="text-cream/40 text-xs">{showSocial ? '▲' : '▼'}</span>
        </button>

        {showSocial && (
          <div className="px-5 pb-5 space-y-4 border-t border-white/8">
            <div className="grid grid-cols-2 gap-4 pt-4">
              <InputField label={isAr ? 'متابعو إنستجرام' : 'Instagram Followers'}>
                <input type="number" value={igFollowers} onChange={e => setIgFollowers(e.target.value)} placeholder="12000" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'معدل التفاعل إنستجرام (%)' : 'Instagram Engagement (%)'}>
                <input type="number" step="0.1" value={igEng} onChange={e => setIgEng(e.target.value)} placeholder="3.2" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'متابعو فيسبوك' : 'Facebook Followers'}>
                <input type="number" value={fbFollowers} onChange={e => setFbFollowers(e.target.value)} placeholder="8500" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'متابعو تيك توك' : 'TikTok Followers'}>
                <input type="number" value={ttFollowers} onChange={e => setTtFollowers(e.target.value)} placeholder="5000" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
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
            <div className="text-cream text-sm font-medium">
              💰 {isAr ? 'بيانات المبيعات' : 'Sales Performance Data'}
            </div>
            <div className="text-cream/40 text-xs">
              {isAr ? 'اختياري — يتيح تحليل CLV والإيرادات' : 'Optional — enables CLV and revenue analysis'}
            </div>
          </div>
          <span className="text-cream/40 text-xs">{showSales ? '▲' : '▼'}</span>
        </button>

        {showSales && (
          <div className="px-5 pb-5 space-y-4 border-t border-white/8">
            <div className="grid grid-cols-2 gap-4 pt-4">
              <InputField label={isAr ? 'الإيراد الشهري (جنيه)' : 'Monthly Revenue (EGP)'}>
                <input type="number" value={revenue} onChange={e => setRevenue(e.target.value)} placeholder="150000" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'معدل التحويل (%)' : 'Conversion Rate (%)'}>
                <input type="number" step="0.1" value={convRate} onChange={e => setConvRate(e.target.value)} placeholder="12" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'متوسط قيمة الطلب (جنيه)' : 'Avg. Order Value (EGP)'}>
                <input type="number" value={aov} onChange={e => setAov(e.target.value)} placeholder="2500" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'تكلفة اكتساب العميل (جنيه)' : 'Customer Acquisition Cost (EGP)'}>
                <input type="number" value={cac} onChange={e => setCac(e.target.value)} placeholder="800" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
              </InputField>
              <InputField label={isAr ? 'نسبة العملاء العائدين (%)' : 'Returning Customer Rate (%)'}>
                <input type="number" step="0.1" value={returning} onChange={e => setReturning(e.target.value)} placeholder="35" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition-colors" />
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
        <div className="w-full bg-surface border border-white/8 rounded-xl p-5 text-center space-y-3">
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
                  i <= progressStage ? 'bg-gold w-6' : 'bg-white/10 w-3'
                }`}
              />
            ))}
          </div>
          <p className="text-cream/30 text-xs">
            {isAr ? 'الرجاء الانتظار، لا تغلق الصفحة' : 'Please wait — do not close this page'}
          </p>
        </div>
      ) : (
        <button
          type="submit"
          disabled={!companyName || !sectorKey || !cityKey}
          className="w-full bg-gold hover:bg-gold-light text-midnight font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isAr ? '✨ توليد تقرير الذكاء التسويقي' : '✨ Generate Intelligence Report'}
        </button>
      )}
    </form>
  )
}
