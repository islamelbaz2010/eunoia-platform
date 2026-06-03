'use client'

import { useState } from 'react'
import { Shell } from '@/components/dashboard/shell'
import { ReportOutput } from '@/components/reports/report-output'
import type { ReportType } from '@/types/report.types'

// ─── Sector definitions ───────────────────────────────────────────────────────
const FEASIBILITY_SECTORS = [
  {
    key: 'residential',
    label: { ar: 'سكني', en: 'Residential' },
    icon: '🏠',
    inputs: [
      { key: 'units', label: { ar: 'عدد الوحدات', en: 'Number of Units' }, placeholder: 'e.g. 120' },
      { key: 'avgSize', label: { ar: 'متوسط المساحة (م²)', en: 'Avg Unit Size (sqm)' }, placeholder: 'e.g. 150' },
      { key: 'salePrice', label: { ar: 'سعر البيع المتوقع (EGP/م²)', en: 'Expected Sale Price (EGP/sqm)' }, placeholder: 'e.g. 45000' },
      { key: 'landCost', label: { ar: 'تكلفة الأرض (EGP)', en: 'Land Cost (EGP)' }, placeholder: 'e.g. 50000000' },
      { key: 'constructionSpec', label: { ar: 'مستوى التشطيب', en: 'Finish Level' }, placeholder: 'Basic / Medium / Premium' },
      { key: 'location', label: { ar: 'الموقع', en: 'Location' }, placeholder: 'e.g. New Cairo' },
    ],
  },
  {
    key: 'commercial',
    label: { ar: 'تجاري (مكاتب / محال)', en: 'Commercial (Offices / Retail)' },
    icon: '🏢',
    inputs: [
      { key: 'gla', label: { ar: 'المساحة الإجمالية للإيجار (م²)', en: 'Total GLA (sqm)' }, placeholder: 'e.g. 5000' },
      { key: 'rentPerSqm', label: { ar: 'إيجار شهري (EGP/م²)', en: 'Monthly Rent (EGP/sqm)' }, placeholder: 'e.g. 600' },
      { key: 'occupancy', label: { ar: 'معدل الإشغال المتوقع (%)', en: 'Expected Occupancy (%)' }, placeholder: 'e.g. 85' },
      { key: 'landCost', label: { ar: 'تكلفة الأرض (EGP)', en: 'Land Cost (EGP)' }, placeholder: 'e.g. 30000000' },
      { key: 'constructionSpec', label: { ar: 'مستوى التشطيب', en: 'Finish Level' }, placeholder: 'Basic / Medium / Premium' },
      { key: 'location', label: { ar: 'الموقع', en: 'Location' }, placeholder: 'e.g. Sheikh Zayed' },
    ],
  },
  {
    key: 'hotel',
    label: { ar: 'فندقي / سياحي', en: 'Hotel / Tourism' },
    icon: '🏨',
    inputs: [
      { key: 'rooms', label: { ar: 'عدد الغرف', en: 'Number of Rooms' }, placeholder: 'e.g. 200' },
      { key: 'adr', label: { ar: 'متوسط سعر الغرفة/الليلة (EGP)', en: 'Average Daily Rate (EGP)' }, placeholder: 'e.g. 3500' },
      { key: 'occupancy', label: { ar: 'معدل الإشغال المتوقع (%)', en: 'Expected Occupancy (%)' }, placeholder: 'e.g. 70' },
      { key: 'stars', label: { ar: 'تصنيف النجوم', en: 'Star Rating' }, placeholder: 'e.g. 5' },
      { key: 'landCost', label: { ar: 'تكلفة الأرض (EGP)', en: 'Land Cost (EGP)' }, placeholder: 'e.g. 80000000' },
      { key: 'location', label: { ar: 'الموقع', en: 'Location' }, placeholder: 'e.g. North Coast' },
    ],
  },
  {
    key: 'industrial',
    label: { ar: 'صناعي / لوجستي', en: 'Industrial / Logistics' },
    icon: '🏭',
    inputs: [
      { key: 'builtArea', label: { ar: 'مساحة المبنى (م²)', en: 'Built Area (sqm)' }, placeholder: 'e.g. 10000' },
      { key: 'rentPerSqm', label: { ar: 'إيجار شهري (EGP/م²)', en: 'Monthly Rent (EGP/sqm)' }, placeholder: 'e.g. 120' },
      { key: 'landCost', label: { ar: 'تكلفة الأرض (EGP)', en: 'Land Cost (EGP)' }, placeholder: 'e.g. 15000000' },
      { key: 'constructionSpec', label: { ar: 'مستوى التشطيب', en: 'Finish Level' }, placeholder: 'Basic / Medium' },
      { key: 'location', label: { ar: 'الموقع', en: 'Location' }, placeholder: 'e.g. 10th of Ramadan' },
    ],
  },
  {
    key: 'medical',
    label: { ar: 'طبي / رعاية صحية', en: 'Medical / Healthcare' },
    icon: '🏥',
    inputs: [
      { key: 'beds', label: { ar: 'عدد الأسرة / عيادات', en: 'Beds / Clinics' }, placeholder: 'e.g. 50' },
      { key: 'revenuePerBed', label: { ar: 'إيراد شهري متوقع/سرير (EGP)', en: 'Monthly Revenue/Bed (EGP)' }, placeholder: 'e.g. 15000' },
      { key: 'builtArea', label: { ar: 'مساحة المشروع (م²)', en: 'Project Area (sqm)' }, placeholder: 'e.g. 3000' },
      { key: 'landCost', label: { ar: 'تكلفة الأرض (EGP)', en: 'Land Cost (EGP)' }, placeholder: 'e.g. 20000000' },
      { key: 'constructionSpec', label: { ar: 'مستوى التشطيب', en: 'Finish Level' }, placeholder: 'Medium / Premium' },
      { key: 'location', label: { ar: 'الموقع', en: 'Location' }, placeholder: 'e.g. New Cairo' },
    ],
  },
  {
    key: 'education',
    label: { ar: 'تعليمي', en: 'Educational' },
    icon: '🏫',
    inputs: [
      { key: 'students', label: { ar: 'عدد الطلاب المتوقع', en: 'Expected Students' }, placeholder: 'e.g. 800' },
      { key: 'tuition', label: { ar: 'رسوم دراسية سنوية/طالب (EGP)', en: 'Annual Tuition/Student (EGP)' }, placeholder: 'e.g. 80000' },
      { key: 'builtArea', label: { ar: 'مساحة المشروع (م²)', en: 'Project Area (sqm)' }, placeholder: 'e.g. 8000' },
      { key: 'landCost', label: { ar: 'تكلفة الأرض (EGP)', en: 'Land Cost (EGP)' }, placeholder: 'e.g. 40000000' },
      { key: 'constructionSpec', label: { ar: 'مستوى التشطيب', en: 'Finish Level' }, placeholder: 'Medium / Premium' },
      { key: 'location', label: { ar: 'الموقع', en: 'Location' }, placeholder: 'e.g. New Cairo' },
    ],
  },
  {
    key: 'mixed_use',
    label: { ar: 'متعدد الاستخدامات', en: 'Mixed Use' },
    icon: '🏙️',
    inputs: [
      { key: 'residentialPct', label: { ar: 'نسبة الاستخدام السكني (%)', en: 'Residential Component (%)' }, placeholder: 'e.g. 60' },
      { key: 'commercialPct', label: { ar: 'نسبة الاستخدام التجاري (%)', en: 'Commercial Component (%)' }, placeholder: 'e.g. 40' },
      { key: 'totalArea', label: { ar: 'المساحة الإجمالية (م²)', en: 'Total Built Area (sqm)' }, placeholder: 'e.g. 20000' },
      { key: 'landCost', label: { ar: 'تكلفة الأرض (EGP)', en: 'Land Cost (EGP)' }, placeholder: 'e.g. 100000000' },
      { key: 'avgSalePrice', label: { ar: 'متوسط سعر البيع (EGP/م²)', en: 'Avg Sale Price (EGP/sqm)' }, placeholder: 'e.g. 40000' },
      { key: 'location', label: { ar: 'الموقع', en: 'Location' }, placeholder: 'e.g. Sheikh Zayed' },
    ],
  },
  {
    key: 'coastal',
    label: { ar: 'ساحلي / سياحي', en: 'Coastal / Resort' },
    icon: '🏖️',
    inputs: [
      { key: 'units', label: { ar: 'عدد الوحدات', en: 'Number of Units' }, placeholder: 'e.g. 200' },
      { key: 'salePrice', label: { ar: 'سعر البيع المتوقع (EGP/م²)', en: 'Expected Sale Price (EGP/sqm)' }, placeholder: 'e.g. 25000' },
      { key: 'avgSize', label: { ar: 'متوسط المساحة (م²)', en: 'Avg Unit Size (sqm)' }, placeholder: 'e.g. 90' },
      { key: 'landCost', label: { ar: 'تكلفة الأرض (EGP)', en: 'Land Cost (EGP)' }, placeholder: 'e.g. 60000000' },
      { key: 'constructionSpec', label: { ar: 'مستوى التشطيب', en: 'Finish Level' }, placeholder: 'Medium / Premium' },
      { key: 'location', label: { ar: 'الموقع', en: 'Location' }, placeholder: 'e.g. North Coast / Ain Sokhna' },
    ],
  },
  {
    key: 'retail_mall',
    label: { ar: 'مول تجاري', en: 'Retail Mall' },
    icon: '🛍️',
    inputs: [
      { key: 'gla', label: { ar: 'مساحة قابلة للإيجار (م²)', en: 'Gross Leasable Area (sqm)' }, placeholder: 'e.g. 15000' },
      { key: 'rentPerSqm', label: { ar: 'إيجار شهري (EGP/م²)', en: 'Monthly Rent (EGP/sqm)' }, placeholder: 'e.g. 500' },
      { key: 'occupancy', label: { ar: 'معدل الإشغال المتوقع (%)', en: 'Expected Occupancy (%)' }, placeholder: 'e.g. 90' },
      { key: 'landCost', label: { ar: 'تكلفة الأرض (EGP)', en: 'Land Cost (EGP)' }, placeholder: 'e.g. 70000000' },
      { key: 'constructionSpec', label: { ar: 'مستوى التشطيب', en: 'Finish Level' }, placeholder: 'Premium' },
      { key: 'location', label: { ar: 'الموقع', en: 'Location' }, placeholder: 'e.g. New Cairo' },
    ],
  },
] as const

type SectorKey = typeof FEASIBILITY_SECTORS[number]['key']

// ─── Component ────────────────────────────────────────────────────────────────
export default function FeasibilityPage() {
  const [sector, setSector] = useState<SectorKey | null>(null)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedSector = FEASIBILITY_SECTORS.find(s => s.key === sector)

  function handleSectorSelect(key: SectorKey) {
    setSector(key)
    setInputs({})
    setResult(null)
    setError(null)
  }

  async function handleGenerate() {
    if (!sector || !companyName.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const extra = JSON.stringify({ sectorType: sector, inputs })
      const body = {
        type: 'REAL_ESTATE_FEASIBILITY' as ReportType,
        input: {
          companyName: companyName.trim(),
          sectorKey: 'real_estate',
          cityKey: 'cairo',
          branchKey: 'main',
          language: 'ar',
          extra,
        },
      }

      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Generation failed')
      setResult(json.output ?? json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Shell title="Feasibility Study" subtitle="9-sector investment feasibility analysis with Egypt 2025 benchmarks">
      {!result ? (
        <div className="space-y-8">
          {/* Sector grid */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              اختر نوع المشروع — Select Project Type
            </h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {FEASIBILITY_SECTORS.map(s => (
                <button
                  key={s.key}
                  onClick={() => handleSectorSelect(s.key)}
                  className="flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all"
                  style={
                    sector === s.key
                      ? { background: 'var(--gold-bg)', borderColor: 'var(--gold-border)', color: 'var(--gold)' }
                      : { borderColor: 'var(--border)' }
                  }
                >
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-[11px] font-medium leading-tight">{s.label.ar}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{s.label.en}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic inputs */}
          {selectedSector && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <h3 className="text-sm font-semibold">
                {selectedSector.icon} {selectedSector.label.ar} — {selectedSector.label.en}
              </h3>

              {/* Company name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  اسم الشركة / المطور — Company / Developer Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Emaar Misr"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold transition-colors"
                />
              </div>

              {/* Sector-specific inputs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {selectedSector.inputs.map(inp => (
                  <div key={inp.key} className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      {inp.label.ar} — {inp.label.en}
                    </label>
                    <input
                      type="text"
                      value={inputs[inp.key] ?? ''}
                      onChange={e => setInputs(prev => ({ ...prev, [inp.key]: e.target.value }))}
                      placeholder={inp.placeholder}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold transition-colors"
                    />
                  </div>
                ))}
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading || !companyName.trim()}
                className="w-full rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-50"
                style={{ background: 'var(--gold)', color: '#fff' }}
              >
                {loading ? 'جاري التحليل...' : 'توليد دراسة الجدوى — Generate Feasibility Study'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => { setResult(null); setError(null) }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to form
          </button>
          <ReportOutput data={result} type={'REAL_ESTATE_FEASIBILITY' as ReportType} />
        </div>
      )}
    </Shell>
  )
}
