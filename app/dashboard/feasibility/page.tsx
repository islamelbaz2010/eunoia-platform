'use client'

import { useState } from 'react'
import { Shell } from '@/components/dashboard/shell'
import { CitySelector } from '@/components/intelligence/city-selector'
import { ReportOutput } from '@/components/reports/report-output'

const FEASIBILITY_SECTORS = {
  restaurant: {
    ar: 'مطعم / كافيه', icon: '🍽️',
    inputs: [
      { key: 'avg_bill', label: 'متوسط الفاتورة (جنيه)', placeholder: '150' },
      { key: 'monthly_covers', label: 'عدد الكفرات الشهرية', placeholder: '800' },
      { key: 'cogs_pct', label: 'تكلفة الخامات %', placeholder: '30' },
      { key: 'monthly_rent', label: 'إيجار شهري (جنيه)', placeholder: '25000' },
      { key: 'staff_monthly', label: 'رواتب شهرية (جنيه)', placeholder: '40000' },
      { key: 'setup_cost', label: 'تكلفة التجهيز (جنيه)', placeholder: '500000' },
      { key: 'marketing_monthly', label: 'تسويق شهري (جنيه)', placeholder: '8000' },
      { key: 'delivery_pct', label: 'نسبة الديليفري %', placeholder: '40' },
    ]
  },
  retail: {
    ar: 'تجزئة / محل', icon: '🏪',
    inputs: [
      { key: 'aov', label: 'متوسط قيمة الطلب (جنيه)', placeholder: '350' },
      { key: 'monthly_orders', label: 'طلبات شهرياً', placeholder: '200' },
      { key: 'gross_margin_pct', label: 'هامش الربح الإجمالي %', placeholder: '45' },
      { key: 'inventory_cost', label: 'تكلفة المخزون الأولي (جنيه)', placeholder: '200000' },
      { key: 'monthly_rent', label: 'إيجار شهري (جنيه)', placeholder: '15000' },
      { key: 'staff_monthly', label: 'رواتب شهرية (جنيه)', placeholder: '20000' },
      { key: 'setup_cost', label: 'تكلفة التجهيز (جنيه)', placeholder: '150000' },
      { key: 'ecommerce_pct', label: 'نسبة المبيعات أونلاين %', placeholder: '20' },
    ]
  },
  clinic: {
    ar: 'عيادة / مركز طبي', icon: '🏥',
    inputs: [
      { key: 'specialty', label: 'التخصص', placeholder: 'أسنان / نساء / باطنة' },
      { key: 'session_price', label: 'سعر الجلسة (جنيه)', placeholder: '300' },
      { key: 'monthly_patients', label: 'مرضى شهرياً', placeholder: '150' },
      { key: 'doctor_salary', label: 'راتب الأطباء شهرياً (جنيه)', placeholder: '30000' },
      { key: 'equipment_cost', label: 'تكلفة المعدات (جنيه)', placeholder: '300000' },
      { key: 'monthly_rent', label: 'إيجار شهري (جنيه)', placeholder: '12000' },
      { key: 'staff_monthly', label: 'رواتب موظفين (جنيه)', placeholder: '15000' },
      { key: 'setup_cost', label: 'تكلفة التجهيز (جنيه)', placeholder: '200000' },
    ]
  },
  agency: {
    ar: 'وكالة / خدمات B2B', icon: '⚙️',
    inputs: [
      { key: 'service_type', label: 'نوع الخدمة', placeholder: 'تسويق / محاسبة / استشارات' },
      { key: 'avg_client_value', label: 'قيمة العميل شهرياً (جنيه)', placeholder: '8000' },
      { key: 'target_clients', label: 'عدد العملاء المستهدف (سنة 1)', placeholder: '15' },
      { key: 'retention_rate_pct', label: 'معدل الاحتفاظ % شهرياً', placeholder: '85' },
      { key: 'staff_monthly', label: 'رواتب شهرية (جنيه)', placeholder: '35000' },
      { key: 'tools_monthly', label: 'أدوات وبرامج شهرياً (جنيه)', placeholder: '5000' },
      { key: 'setup_cost', label: 'تكلفة الإعداد والتأسيس (جنيه)', placeholder: '50000' },
      { key: 'cac_budget', label: 'ميزانية اكتساب عملاء شهرياً (جنيه)', placeholder: '10000' },
    ]
  },
  manufacturing: {
    ar: 'تصنيع / مصنع', icon: '🏗️',
    inputs: [
      { key: 'product_type', label: 'نوع المنتج', placeholder: 'أثاث / ملابس / غذاء' },
      { key: 'monthly_capacity', label: 'الطاقة الإنتاجية شهرياً (وحدة)', placeholder: '1000' },
      { key: 'selling_price_unit', label: 'سعر البيع / وحدة (جنيه)', placeholder: '250' },
      { key: 'raw_material_pct', label: 'تكلفة الخامات % من الإيراد', placeholder: '45' },
      { key: 'equipment_cost', label: 'تكلفة المعدات (جنيه)', placeholder: '800000' },
      { key: 'staff_monthly', label: 'رواتب عمالة شهرياً (جنيه)', placeholder: '30000' },
      { key: 'rent_monthly', label: 'إيجار المصنع شهرياً (جنيه)', placeholder: '20000' },
      { key: 'utilities_monthly', label: 'مرافق وكهرباء شهرياً (جنيه)', placeholder: '15000' },
    ]
  },
  realestate: {
    ar: 'عقارات / تطوير عمراني', icon: '🏠',
    inputs: [
      { key: 'project_type', label: 'نوع المشروع', placeholder: 'وحدات سكنية / تجاري' },
      { key: 'land_cost', label: 'تكلفة الأرض (جنيه)', placeholder: '5000000' },
      { key: 'construction_cost_sqm', label: 'تكلفة البناء / م² (جنيه)', placeholder: '8000' },
      { key: 'total_sqm', label: 'إجمالي المساحة المبنية (م²)', placeholder: '2000' },
      { key: 'selling_price_sqm', label: 'سعر البيع / م² (جنيه)', placeholder: '25000' },
      { key: 'sales_pace_monthly', label: 'وتيرة المبيعات (وحدة/شهر)', placeholder: '3' },
      { key: 'marketing_budget', label: 'ميزانية التسويق الإجمالية (جنيه)', placeholder: '500000' },
      { key: 'payment_plan_years', label: 'سنوات خطة السداد', placeholder: '5' },
    ]
  },
  education: {
    ar: 'تعليم / مركز / كورسات', icon: '📚',
    inputs: [
      { key: 'edu_type', label: 'نوع المؤسسة', placeholder: 'مركز لغات / كورسات أونلاين' },
      { key: 'expected_students', label: 'طلاب متوقعون (سنة 1)', placeholder: '100' },
      { key: 'tuition_monthly', label: 'رسوم دراسية شهرية / طالب (جنيه)', placeholder: '800' },
      { key: 'teacher_salaries', label: 'رواتب المدرسين شهرياً (جنيه)', placeholder: '25000' },
      { key: 'monthly_rent', label: 'إيجار شهري (جنيه)', placeholder: '15000' },
      { key: 'setup_cost', label: 'تكلفة التجهيز (جنيه)', placeholder: '120000' },
      { key: 'marketing_monthly', label: 'ميزانية تسويق شهرية (جنيه)', placeholder: '6000' },
      { key: 'online_pct', label: 'نسبة أونلاين %', placeholder: '30' },
    ]
  },
  gym: {
    ar: 'جيم / فيتنس / رياضة', icon: '🏋️',
    inputs: [
      { key: 'membership_price', label: 'سعر الاشتراك الشهري (جنيه)', placeholder: '600' },
      { key: 'target_members', label: 'أعضاء مستهدفون (سنة 1)', placeholder: '200' },
      { key: 'class_sessions_monthly', label: 'جلسات كلاسات شهرياً', placeholder: '80' },
      { key: 'class_price', label: 'سعر الكلاس الواحد (جنيه)', placeholder: '80' },
      { key: 'equipment_cost', label: 'تكلفة المعدات (جنيه)', placeholder: '600000' },
      { key: 'monthly_rent', label: 'إيجار شهري (جنيه)', placeholder: '30000' },
      { key: 'staff_monthly', label: 'رواتب شهرية (جنيه)', placeholder: '25000' },
      { key: 'setup_cost', label: 'تكلفة تجهيز الصالة (جنيه)', placeholder: '300000' },
    ]
  },
  printing: {
    ar: 'طباعة / 3D Printing / ليزر', icon: '🖨️',
    inputs: [
      { key: 'service_type', label: 'نوع الخدمة', placeholder: '3D Printing / ليزر كات' },
      { key: 'monthly_orders', label: 'طلبات شهرياً', placeholder: '150' },
      { key: 'aov', label: 'متوسط قيمة الطلب (جنيه)', placeholder: '400' },
      { key: 'material_cost_pct', label: 'تكلفة الخامات % من الإيراد', placeholder: '35' },
      { key: 'equipment_cost', label: 'تكلفة المعدات (جنيه)', placeholder: '400000' },
      { key: 'monthly_rent', label: 'إيجار شهري (جنيه)', placeholder: '8000' },
      { key: 'staff_monthly', label: 'رواتب شهرية (جنيه)', placeholder: '12000' },
      { key: 'utilities_monthly', label: 'كهرباء وإنترنت شهرياً (جنيه)', placeholder: '5000' },
    ]
  },
} as const

type FeasibilitySector = keyof typeof FEASIBILITY_SECTORS

export default function FeasibilityPage() {
  const [sector, setSector] = useState<FeasibilitySector | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [cityKey, setCityKey] = useState('')
  const [branch, setBranch] = useState<'egypt' | 'dubai'>('egypt')
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedSector = sector ? FEASIBILITY_SECTORS[sector] : null
  const canGenerate = sector && companyName.trim() && cityKey

  async function handleGenerate() {
    if (!canGenerate) return
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: 'REAL_ESTATE_FEASIBILITY',
          companyName,
          sector: sector,
          city: cityKey,
          branch,
          extra: JSON.stringify({ sectorType: sector, inputs }),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل في التحليل')
      setReport(data.reportData ?? data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  if (report) {
    return (
      <Shell title="دراسة الجدوى" subtitle={companyName}>
        <div className="p-6 lg:p-8 max-w-4xl mx-auto">
          <button onClick={() => setReport(null)} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← عودة للنموذج
          </button>
          <ReportOutput data={report} type="REAL_ESTATE_FEASIBILITY" />
        </div>
      </Shell>
    )
  }

  return (
    <Shell title="دراسة الجدوى" subtitle="تحليل مالي شامل لمشروعك">
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">

        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{color:'var(--gold)'}}>① اختر مجال مشروعك</p>
          <div className="grid grid-cols-3 gap-3">
            {(Object.entries(FEASIBILITY_SECTORS) as [FeasibilitySector, typeof FEASIBILITY_SECTORS[FeasibilitySector]][]).map(([key, s]) => (
              <button key={key} type="button" onClick={() => { setSector(key); setInputs({}) }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all ${sector === key ? 'border-gold/50' : 'border-border text-foreground/70 hover:bg-muted/30'}`}
                style={sector === key ? {background:'var(--gold-bg)',borderColor:'var(--gold-border)',color:'var(--gold)'} : {}}>
                <span className="text-2xl">{s.icon}</span>
                <span className="text-xs font-semibold leading-tight">{s.ar}</span>
              </button>
            ))}
          </div>
        </div>

        {sector && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider" style={{color:'var(--gold)'}}>② معلومات أساسية</p>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">اسم المشروع / الشركة *</label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="مثال: كافيه المنارة"
                className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">المدينة *</label>
                <CitySelector value={cityKey} onChange={setCityKey} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">السوق</label>
                <div className="flex gap-2 h-10">
                  {(['egypt','dubai'] as const).map(b => (
                    <button key={b} type="button" onClick={() => setBranch(b)}
                      className={`flex-1 rounded-lg text-xs font-semibold border transition-all ${branch===b?'':'border-border text-muted-foreground hover:bg-muted/30'}`}
                      style={branch===b?{background:'var(--gold-bg)',borderColor:'var(--gold-border)',color:'var(--gold)'}:{}}>
                      {b==='egypt'?'🇪🇬 مصر':'🇦 الإمارات'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {sector && selectedSector && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider" style={{color:'var(--gold)'}}>③ {selectedSector.icon} بيانات {selectedSector.ar}</p>
            <div className="grid grid-cols-2 gap-4">
              {selectedSector.inputs.map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{field.label}</label>
                  <input type="text" value={inputs[field.key]??''} onChange={e => setInputs(prev=>({...prev,[field.key]:e.target.value}))} placeholder={field.placeholder}
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none text-sm transition-colors" />
                </div>
              ))}
            </div>
          </div>
        )}

        {sector && (
          <button type="button" onClick={handleGenerate} disabled={!canGenerate||loading}
            className="w-full py-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            style={{background:'linear-gradient(135deg,#b8922a,#d4aa45)',color:'#fff'}}>
            {loading?'⏳ جاري التحليل المالي...':'✨ توليد دراسة الجدوى'}
          </button>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-xl p-4 text-sm text-red-700 dark:text-red-300 text-right">{error}</div>
        )}

      </div>
    </Shell>
  )
}
