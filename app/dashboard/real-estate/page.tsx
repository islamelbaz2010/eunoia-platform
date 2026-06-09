'use client'
import { useState } from 'react'

type ReportType = 'feasibility' | 'campaign_roi' | 'market_entry' | 'lead_gen' | 'full_analysis'

const CITIES = [
  'القاهرة الجديدة','العاصمة الإدارية الجديدة','التجمع الخامس','التجمع الأول',
  '6 أكتوبر','الشيخ زايد','المعادي','مدينة نصر','الساحل الشمالي',
  'العين السخنة','الإسكندرية','الجيزة','أخرى',
]

const REPORT_CARDS = [
  { id:'feasibility' as ReportType,   icon:'📐', titleAr:'دراسة الجدوى العقارية',    titleEn:'Feasibility Study',       desc:'NPV · IRR · 3 سيناريوهات · تحليل حساسية · risk scorecard', time:'دقيقتان', badge:'الأعلى دقة', badgeColor:'#1A6B5A' },
  { id:'campaign_roi' as ReportType,  icon:'📊', titleAr:'تدقيق أداء الحملات',       titleEn:'Campaign ROI Audit',      desc:'CPL vs معايير مصر 2026 · تحليل القنوات · 3 تحسينات فورية',  time:'دقيقة',   badge:'الأكثر طلباً', badgeColor:'#C9922A' },
  { id:'market_entry' as ReportType,  icon:'🗺️', titleAr:'استخبارات دخول السوق',     titleEn:'Market Entry Intel',      desc:'جاذبية السوق · المنافسة · CPL المتوقع · خطة 90 يوم',        time:'دقيقتان', badge:null, badgeColor:null },
  { id:'lead_gen' as ReportType,      icon:'🎯', titleAr:'استخبارات توليد العملاء',   titleEn:'Lead Generation Intel',   desc:'جودة العملاء · معدل التأهيل · سكريبت واتساب',               time:'دقيقة',   badge:null, badgeColor:null },
  { id:'full_analysis' as ReportType, icon:'🏆', titleAr:'التحليل التسويقي الشامل',   titleEn:'Full Marketing Analysis', desc:'SWOT · أداء الحملات · الحضور الرقمي · خطة 90 يوم كاملة',   time:'3 دقائق', badge:'Premium', badgeColor:'#4A1042' },
]

// ── SHARED COMPONENTS ─────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, type='text', required=false, hint }:{
  label:string; value:string; onChange:(v:string)=>void
  placeholder?:string; type?:string; required?:boolean; hint?:string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-600">{label}{required && <span className="text-red-500 mr-1">*</span>}</label>
      {hint && <span className="text-xs text-gray-400 -mt-0.5">{hint}</span>}
      <input type={type} value={value} required={required} placeholder={placeholder}
        onChange={e=>onChange(e.target.value)}
        className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-200 transition-all" />
    </div>
  )
}

function Select({ label, value, onChange, options, required=false, hint }:{
  label:string; value:string; onChange:(v:string)=>void
  options:{value:string;label:string}[]; required?:boolean; hint?:string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-600">{label}{required && <span className="text-red-500 mr-1">*</span>}</label>
      {hint && <span className="text-xs text-gray-400 -mt-0.5">{hint}</span>}
      <select value={value} required={required} onChange={e=>onChange(e.target.value)}
        className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-200 transition-all appearance-none">
        <option value="">اختر...</option>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function SectionTitle({ children }:{ children:React.ReactNode }) {
  return <div className="text-xs font-black text-purple-900 uppercase tracking-widest border-b border-purple-100 pb-1 mb-3">{children}</div>
}

function OptionalBox({ title, children }:{ title:string; children:React.ReactNode }) {
  return (
    <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
      <div className="text-xs font-bold text-gray-500 mb-3">✦ {title} — <span className="font-normal">اختياري، يرفع دقة التقرير</span></div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  )
}

function SubmitBtn({ loading }:{ loading:boolean }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full py-4 bg-gradient-to-l from-purple-950 to-purple-700 text-white rounded-xl font-black text-base hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20">
      {loading
        ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>جاري توليد التقرير...</>
        : '⚡ توليد التقرير الآن'}
    </button>
  )
}

// ── FEASIBILITY FORM ─────────────────────────────────────────────

function FeasibilityForm({ onSubmit, loading }:{ onSubmit:(d:Record<string,string>)=>void; loading:boolean }) {
  const [d, setD] = useState<Record<string,string>>({
    projectName:'', city:'', projectType:'وحدات سكنية',
    units:'', unitArea:'', landArea:'',
    sellPriceSqm:'', buildCostSqm:'', landCost:'',
    buildMonths:'24', salesMonths:'18', adminPct:'8',
    downPaymentPct:'20', finishLevel:'تشطيب متوسط (7,000–9,500 EGP/م²)',
    cashSalesPct:'30', landCostSqm:'',
    realSellSqm:'', realBuildSqm:'', realSalesPace:''
  })
  const f=(k:string,v:string)=>setD(p=>({...p,[k]:v}))

  return (
    <form onSubmit={e=>{e.preventDefault();onSubmit(d)}} className="space-y-5">
      <div>
        <SectionTitle>معلومات المشروع</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="اسم المشروع" value={d.projectName} onChange={v=>f('projectName',v)} placeholder="مثال: كمبوند النيل" required />
          <Select label="المدينة" value={d.city} onChange={v=>f('city',v)} required
            options={CITIES.map(c=>({value:c,label:c}))} />
          <Select label="نوع المشروع" value={d.projectType} onChange={v=>f('projectType',v)}
            options={[
              {value:'وحدات سكنية',label:'🏠 وحدات سكنية'},
              {value:'فيلات',label:'🏡 فيلات'},
              {value:'تاون هاوس',label:'🏘️ تاون هاوس'},
              {value:'عقار تجاري',label:'🏢 عقار تجاري'},
              {value:'مشروع مختلط',label:'🏙️ مشروع مختلط (سكني + تجاري)'},
              {value:'مخازن لوجستية',label:'🏭 مخازن / لوجستي'},
              {value:'فندق / سياحي',label:'🏨 فندق / سياحي'},
            ]} />
          <Field label="عدد الوحدات" type="number" value={d.units} onChange={v=>f('units',v)} placeholder="مثال: 200" required />
        </div>
      </div>

      <div>
        <SectionTitle>المساحات</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <Field label="مساحة الأرض الإجمالية (م²)" type="number" value={d.landArea} onChange={v=>f('landArea',v)} placeholder="مثال: 25000" required hint="إجمالي مساحة قطعة الأرض" />
          <Field label="متوسط مساحة الوحدة (م²)" type="number" value={d.unitArea} onChange={v=>f('unitArea',v)} placeholder="مثال: 120" required />
          <Field label="سعر بيع م² المتوقع (EGP)" type="number" value={d.sellPriceSqm} onChange={v=>f('sellPriceSqm',v)} placeholder="مثال: 50,000" required />
        </div>
      </div>

      <div>
        <SectionTitle>التكاليف</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="تكلفة الأرض الإجمالية (EGP)" type="number" value={d.landCost} onChange={v=>f('landCost',v)} placeholder="مثال: 50,000,000" required />
          <Field label="تكلفة الأرض / م² (EGP)" type="number" value={d.landCostSqm} onChange={v=>f('landCostSqm',v)} placeholder="مثال: 2,000" hint="سيتم الحساب تلقائياً إن تُرك فارغاً" />
          <Field label="تكلفة بناء م² (EGP)" type="number" value={d.buildCostSqm} onChange={v=>f('buildCostSqm',v)} placeholder="مثال: 22,000" required hint="بدون تشطيب" />
          <Select label="مستوى التشطيب" value={d.finishLevel} onChange={v=>f('finishLevel',v)}
            options={[
              {value:'بدون تشطيب (Core & Shell)',label:'بدون تشطيب (Core & Shell)'},
              {value:'تشطيب عادي (4,500–6,000 EGP/م²)',label:'تشطيب عادي — 4,500–6,000 EGP/م²'},
              {value:'تشطيب متوسط (7,000–9,500 EGP/م²)',label:'تشطيب متوسط — 7,000–9,500 EGP/م²'},
              {value:'تشطيب فاخر (11,000–16,000 EGP/م²)',label:'تشطيب فاخر — 11,000–16,000 EGP/م²'},
            ]} />
        </div>
      </div>

      <div>
        <SectionTitle>الجدول الزمني والمالي</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <Field label="مدة التنفيذ (شهور)" type="number" value={d.buildMonths} onChange={v=>f('buildMonths',v)} placeholder="24" />
          <Field label="مدة البيع المتوقعة (شهور)" type="number" value={d.salesMonths} onChange={v=>f('salesMonths',v)} placeholder="18" />
          <Field label="مصروفات إدارية وتسويقية %" type="number" value={d.adminPct} onChange={v=>f('adminPct',v)} placeholder="8" />
          <Field label="نسبة المقدم %" type="number" value={d.downPaymentPct} onChange={v=>f('downPaymentPct',v)} placeholder="20" />
          <Field label="نسبة البيع نقداً %" type="number" value={d.cashSalesPct} onChange={v=>f('cashSalesPct',v)} placeholder="30" />
        </div>
      </div>

      <OptionalBox title="مقارنة بالسوق">
        <Field label="سعر بيع م² في السوق (EGP)" type="number" value={d.realSellSqm} onChange={v=>f('realSellSqm',v)} placeholder="مثال: 48,000" />
        <Field label="تكلفة بناء م² في السوق (EGP)" type="number" value={d.realBuildSqm} onChange={v=>f('realBuildSqm',v)} placeholder="مثال: 21,000" />
        <Field label="معدل بيع مشاريع مشابهة (وحدة/شهر)" type="number" value={d.realSalesPace} onChange={v=>f('realSalesPace',v)} placeholder="مثال: 5" />
      </OptionalBox>

      <SubmitBtn loading={loading} />
    </form>
  )
}

// ── CAMPAIGN ROI FORM ────────────────────────────────────────────

function CampaignROIForm({ onSubmit, loading }:{ onSubmit:(d:Record<string,string>)=>void; loading:boolean }) {
  const [d, setD] = useState<Record<string,string>>({
    companyName:'', city:'', clientType:'developer',
    adSpend:'', cpl:'', leads:'', roas:'',
    metaSpend:'', googleSpend:'', tiktokSpend:''
  })
  const f=(k:string,v:string)=>setD(p=>({...p,[k]:v}))
  return (
    <form onSubmit={e=>{e.preventDefault();onSubmit(d)}} className="space-y-5">
      <div>
        <SectionTitle>بيانات الشركة</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="اسم الشركة" value={d.companyName} onChange={v=>f('companyName',v)} placeholder="مثال: Radix Development" required />
          <Select label="المدينة" value={d.city} onChange={v=>f('city',v)} required options={CITIES.map(c=>({value:c,label:c}))} />
          <Select label="نوع العميل" value={d.clientType} onChange={v=>f('clientType',v)} required
            options={[{value:'developer',label:'🏗️ مطور عقاري'},{value:'broker',label:'🤝 وسيط / بروكر'}]} />
          <Field label="إجمالي الإنفاق الإعلاني/شهر (EGP)" type="number" value={d.adSpend} onChange={v=>f('adSpend',v)} placeholder="مثال: 150,000" required />
        </div>
      </div>
      <div>
        <SectionTitle>مؤشرات الأداء الحالية</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <Field label="تكلفة العميل CPL (EGP)" type="number" value={d.cpl} onChange={v=>f('cpl',v)} placeholder="مثال: 950" required />
          <Field label="عدد العملاء/شهر" type="number" value={d.leads} onChange={v=>f('leads',v)} placeholder="مثال: 158" />
          <Field label="معدل العائد ROAS" type="number" value={d.roas} onChange={v=>f('roas',v)} placeholder="مثال: 2.1" />
        </div>
      </div>
      <OptionalBox title="توزيع الإنفاق على القنوات">
        <Field label="إنفاق Meta (EGP)" type="number" value={d.metaSpend} onChange={v=>f('metaSpend',v)} placeholder="مثال: 90,000" />
        <Field label="إنفاق Google (EGP)" type="number" value={d.googleSpend} onChange={v=>f('googleSpend',v)} placeholder="مثال: 45,000" />
        <Field label="إنفاق TikTok (EGP)" type="number" value={d.tiktokSpend} onChange={v=>f('tiktokSpend',v)} placeholder="مثال: 15,000" />
      </OptionalBox>
      <SubmitBtn loading={loading} />
    </form>
  )
}

// ── MARKET ENTRY FORM ────────────────────────────────────────────

function MarketEntryForm({ onSubmit, loading }:{ onSubmit:(d:Record<string,string>)=>void; loading:boolean }) {
  const [d, setD] = useState<Record<string,string>>({
    companyName:'', targetCity:'', clientType:'developer',
    budget:'', timeline:'6 أشهر'
  })
  const f=(k:string,v:string)=>setD(p=>({...p,[k]:v}))
  return (
    <form onSubmit={e=>{e.preventDefault();onSubmit(d)}} className="space-y-5">
      <div>
        <SectionTitle>بيانات الشركة</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="اسم الشركة" value={d.companyName} onChange={v=>f('companyName',v)} placeholder="مثال: XYZ Properties" required />
          <Select label="السوق المستهدف" value={d.targetCity} onChange={v=>f('targetCity',v)} required options={CITIES.map(c=>({value:c,label:c}))} />
          <Select label="نوع الشركة" value={d.clientType} onChange={v=>f('clientType',v)} required
            options={[{value:'developer',label:'🏗️ مطور عقاري'},{value:'broker',label:'🤝 وسيط / بروكر'}]} />
          <Field label="ميزانية التسويق الشهرية (EGP)" type="number" value={d.budget} onChange={v=>f('budget',v)} placeholder="مثال: 80,000" required />
        </div>
      </div>
      <div>
        <SectionTitle>الإطار الزمني</SectionTitle>
        <Select label="مدة الدخول للسوق" value={d.timeline} onChange={v=>f('timeline',v)}
          options={[
            {value:'3 أشهر',label:'⚡ 3 أشهر — دخول سريع'},
            {value:'6 أشهر',label:'📈 6 أشهر — دخول متوازن'},
            {value:'12 شهر',label:'🎯 12 شهر — دخول استراتيجي'},
            {value:'18+ شهر',label:'🏗️ 18+ شهر — بناء طويل المدى'},
          ]} />
      </div>
      <SubmitBtn loading={loading} />
    </form>
  )
}

// ── LEAD GEN FORM ────────────────────────────────────────────────

function LeadGenForm({ onSubmit, loading }:{ onSubmit:(d:Record<string,string>)=>void; loading:boolean }) {
  const [d, setD] = useState<Record<string,string>>({
    companyName:'', city:'', clientType:'developer',
    currentLeads:'', qualifiedPct:'', adSpend:'',
    cpl:'', avgDealValue:'', salesCycle:'90'
  })
  const f=(k:string,v:string)=>setD(p=>({...p,[k]:v}))
  return (
    <form onSubmit={e=>{e.preventDefault();onSubmit(d)}} className="space-y-5">
      <div>
        <SectionTitle>بيانات الشركة</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="اسم الشركة" value={d.companyName} onChange={v=>f('companyName',v)} placeholder="مثال: ABC Brokers" required />
          <Select label="المدينة" value={d.city} onChange={v=>f('city',v)} required options={CITIES.map(c=>({value:c,label:c}))} />
          <Select label="نوع العميل" value={d.clientType} onChange={v=>f('clientType',v)} required
            options={[{value:'developer',label:'🏗️ مطور عقاري'},{value:'broker',label:'🤝 وسيط / بروكر'}]} />
          <Field label="عدد العملاء المحتملين/شهر" type="number" value={d.currentLeads} onChange={v=>f('currentLeads',v)} placeholder="مثال: 200" required />
        </div>
      </div>
      <div>
        <SectionTitle>جودة العملاء الحالية</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <Field label="نسبة العملاء المؤهلين %" type="number" value={d.qualifiedPct} onChange={v=>f('qualifiedPct',v)} placeholder="مثال: 15" required hint="من يكملون رحلة الشراء" />
          <Field label="دورة المبيعات (أيام)" type="number" value={d.salesCycle} onChange={v=>f('salesCycle',v)} placeholder="90" />
          <Field label="متوسط قيمة الصفقة (EGP)" type="number" value={d.avgDealValue} onChange={v=>f('avgDealValue',v)} placeholder="مثال: 3,000,000" />
        </div>
      </div>
      <OptionalBox title="بيانات الإنفاق الإعلاني">
        <Field label="الإنفاق الإعلاني/شهر (EGP)" type="number" value={d.adSpend} onChange={v=>f('adSpend',v)} placeholder="مثال: 120,000" />
        <Field label="تكلفة العميل CPL (EGP)" type="number" value={d.cpl} onChange={v=>f('cpl',v)} placeholder="مثال: 600" />
      </OptionalBox>
      <SubmitBtn loading={loading} />
    </form>
  )
}

// ── FULL ANALYSIS FORM ───────────────────────────────────────────

function FullAnalysisForm({ onSubmit, loading }:{ onSubmit:(d:Record<string,string>)=>void; loading:boolean }) {
  const [d, setD] = useState<Record<string,string>>({
    companyName:'', city:'', clientType:'developer',
    website:'', fbPage:'', igPage:'', ttPage:'',
    adSpend:'', cpl:'', roas:'', leads:'',
    revenue:'', competitors:''
  })
  const f=(k:string,v:string)=>setD(p=>({...p,[k]:v}))
  return (
    <form onSubmit={e=>{e.preventDefault();onSubmit(d)}} className="space-y-5">
      <div>
        <SectionTitle>بيانات الشركة</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="اسم الشركة" value={d.companyName} onChange={v=>f('companyName',v)} placeholder="مثال: Palm Hills Developments" required />
          <Select label="المدينة" value={d.city} onChange={v=>f('city',v)} required options={CITIES.map(c=>({value:c,label:c}))} />
          <Select label="نوع الشركة" value={d.clientType} onChange={v=>f('clientType',v)} required
            options={[{value:'developer',label:'🏗️ مطور عقاري'},{value:'broker',label:'🤝 وسيط / بروكر'}]} />
          <Field label="المنافسون الرئيسيون" value={d.competitors} onChange={v=>f('competitors',v)} placeholder="مثال: SODIC، Emaar، Ora" />
        </div>
      </div>
      <OptionalBox title="روابط الحضور الرقمي">
        <Field label="الموقع الإلكتروني" value={d.website} onChange={v=>f('website',v)} placeholder="https://company.com" />
        <Field label="Facebook Page" value={d.fbPage} onChange={v=>f('fbPage',v)} placeholder="facebook.com/page" />
        <Field label="Instagram" value={d.igPage} onChange={v=>f('igPage',v)} placeholder="instagram.com/account" />
        <Field label="TikTok" value={d.ttPage} onChange={v=>f('ttPage',v)} placeholder="tiktok.com/@account" />
      </OptionalBox>
      <OptionalBox title="بيانات الحملات الإعلانية">
        <Field label="إنفاق إعلاني/شهر (EGP)" type="number" value={d.adSpend} onChange={v=>f('adSpend',v)} placeholder="مثال: 200,000" />
        <Field label="تكلفة العميل CPL (EGP)" type="number" value={d.cpl} onChange={v=>f('cpl',v)} placeholder="مثال: 800" />
        <Field label="معدل العائد ROAS" type="number" value={d.roas} onChange={v=>f('roas',v)} placeholder="مثال: 2.5" />
        <Field label="عدد العملاء/شهر" type="number" value={d.leads} onChange={v=>f('leads',v)} placeholder="مثال: 250" />
        <Field label="الإيرادات الشهرية (EGP)" type="number" value={d.revenue} onChange={v=>f('revenue',v)} placeholder="مثال: 5,000,000" />
      </OptionalBox>
      <SubmitBtn loading={loading} />
    </form>
  )
}

// ── ARABIC LABEL MAP ─────────────────────────────────────────────

const AR_LABELS: Record<string,string> = {
  total_revenue: 'إجمالي الإيرادات',
  total_cost: 'إجمالي التكاليف',
  gross_profit: 'إجمالي الربح',
  net_profit: 'صافي الربح',
  gross_margin_pct: 'هامش الربح الإجمالي',
  net_margin_pct: 'هامش الربح الصافي',
  total_investment: 'إجمالي الاستثمار',
  roi_pct: 'عائد الاستثمار ROI',
  payback_months: 'فترة الاسترداد',
  npv_assessment: 'تقييم صافي القيمة الحالية NPV',
  irr_estimate: 'معدل العائد الداخلي IRR',
  current_cpl: 'تكلفة العميل الحالية CPL',
  benchmark_cpl: 'المعيار CPL',
  cpl_gap_pct: 'الفجوة عن المعيار',
  cpl_status: 'تقييم CPL',
  monthly_leads: 'عدد العملاء/شهر',
  expected_leads_at_benchmark: 'العملاء المتوقعون عند المعيار',
  leads_gap: 'فجوة العملاء الشهرية',
  roas: 'معدل العائد ROAS',
  roas_benchmark: 'معيار ROAS',
  roas_status: 'تقييم ROAS',
  wasted_budget_estimate: 'الميزانية المهدرة (تقدير)',
  monthly_leads_gen: 'العملاء المحتملون/شهر',
  qualified_leads: 'العملاء المؤهلون',
  qualification_rate: 'معدل التأهيل',
  qualification_benchmark: 'معيار التأهيل',
  qualification_verdict: 'تقييم التأهيل',
  estimated_monthly_deals: 'الصفقات الشهرية المتوقعة',
  estimated_monthly_revenue: 'الإيرادات الشهرية المتوقعة',
  cac_current: 'تكلفة اكتساب العميل CAC',
  cac_benchmark: 'معيار CAC',
  ltv_cac_ratio: 'نسبة LTV/CAC',
}

function arLabel(key: string): string {
  return AR_LABELS[key] || key.replace(/_/g,' ')
}

// ── EXPORT FUNCTIONS ─────────────────────────────────────────────

function exportToPDF(reportTitle: string) {
  const printStyle = document.createElement('style')
  printStyle.id = 'print-style'
  printStyle.textContent = `
    @media print {
      body > *:not(#report-print-area) { display: none !important; }
      #report-print-area { display: block !important; position: fixed; top: 0; left: 0; width: 100%; }
      @page { margin: 15mm; size: A4; }
    }
  `
  document.head.appendChild(printStyle)
  document.title = reportTitle
  window.print()
  setTimeout(() => {
    const el = document.getElementById('print-style')
    if (el) document.head.removeChild(el)
    document.title = 'Eunoia Intelligence'
  }, 1000)
}

function exportToExcel(report: Record<string,unknown>, reportTitle: string) {
  const rows: string[][] = [
    ['تقرير Eunoia Zones Intelligence'],
    [reportTitle],
    ['تاريخ التقرير', new Date().toLocaleDateString('ar-EG')],
    [],
  ]

  function flatten(obj: Record<string,unknown>, prefix = '') {
    for (const [k, v] of Object.entries(obj)) {
      const label = prefix ? `${prefix} — ${arLabel(k)}` : arLabel(k)
      if (v === null || v === undefined) continue
      if (typeof v === 'object' && !Array.isArray(v)) {
        flatten(v as Record<string,unknown>, label)
      } else if (Array.isArray(v)) {
        rows.push([label])
        v.forEach((item, i) => {
          if (typeof item === 'object' && item !== null) {
            flatten(item as Record<string,unknown>, `${label} ${i+1}`)
          } else {
            rows.push([`  ${i+1}`, String(item)])
          }
        })
      } else {
        rows.push([label, String(v)])
      }
    }
  }

  flatten(report)

  const csvContent = rows.map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n')

  const bom = '﻿'
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${reportTitle}-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── REPORT RENDERER ──────────────────────────────────────────────

function KVGrid({ data }: { data: Record<string,string> }) {
  const entries = Object.entries(data).filter(([,v]) => v)
  if (!entries.length) return null
  return (
    <div className="grid grid-cols-2 gap-2">
      {entries.map(([k, v]) => (
        <div key={k} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">{arLabel(k)}</div>
          <div className="font-bold text-purple-900 text-sm leading-snug">{v}</div>
        </div>
      ))}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-100 px-4 py-2.5">
        <div className="text-xs font-black text-gray-600 uppercase tracking-wide">{title}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function ReportView({ report, onBack, onRegen }: {
  report: Record<string,unknown>
  onBack: () => void
  onRegen: () => void
}) {
  const conf = report.confidence_score as {pct?:number;label?:string;reason?:string} | undefined
  const confPct = conf?.pct ?? 0
  const verdict = report.verdict as string | undefined
  const verdictColor = verdict === 'مجدي' ? '#16a34a' : verdict === 'مجدي مشروط' ? '#d97706' : '#dc2626'
  const reportTitle = `${report.report_type as string} — ${(report.company || report.project_name || report.target_market || '') as string}`

  return (
    <div dir="rtl" className="space-y-4" id="report-print-area">
      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={onBack}
          className="flex-1 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
          ← تقرير جديد
        </button>
        <button onClick={onRegen}
          className="flex-1 py-2.5 bg-white border border-purple-200 text-purple-800 rounded-xl text-sm font-bold hover:bg-purple-50 transition-colors">
          🔄 إعادة التوليد
        </button>
        <button onClick={() => exportToPDF(reportTitle)}
          className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-colors">
          📄 PDF
        </button>
        <button onClick={() => exportToExcel(report, reportTitle)}
          className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-colors">
          📊 Excel
        </button>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-br from-purple-950 to-purple-700 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-xs font-bold tracking-widest text-white/40 mb-1">EUNOIA ZONES · INTELLIGENCE PLATFORM</div>
            <h2 className="text-xl font-black leading-snug">{report.report_type as string}</h2>
            <div className="text-white/60 text-sm mt-1">
              {(report.company || report.project_name || report.target_market || '') as string}
              {!!((report.city || '') as string) && <span className="mr-2 text-white/40">· {(report.city || '') as string}</span>}
            </div>
          </div>
          <div className="text-left mr-4">
            <div className="text-4xl font-black leading-none" style={{color: confPct >= 75 ? '#4ade80' : confPct >= 52 ? '#fcd34d' : '#f87171'}}>{confPct}%</div>
            <div className="text-xs text-white/50 mt-0.5">دقة التقرير</div>
          </div>
        </div>
        {conf?.reason && <div className="text-xs text-white/50 bg-white/10 rounded-lg p-2 mt-3">{conf.reason}</div>}
      </div>

      {/* Verdict */}
      {!!verdict && (
        <div className="rounded-xl p-4 border-2 flex items-center gap-3"
          style={{borderColor: verdictColor, background: verdictColor + '12'}}>
          <span className="text-3xl flex-shrink-0">
            {verdict === 'مجدي' ? '✅' : verdict === 'مجدي مشروط' ? '⚠️' : '❌'}
          </span>
          <div>
            <div className="font-black text-xl" style={{color: verdictColor}}>{verdict}</div>
            {!!(report.verdict_reason) && <div className="text-sm text-gray-700 mt-0.5 leading-relaxed">{report.verdict_reason as string}</div>}
          </div>
        </div>
      )}

      {/* Executive summary */}
      {!!(report.executive_summary) && (
        <Section title="الملخص التنفيذي">
          <p className="text-gray-800 text-sm leading-relaxed">{report.executive_summary as string}</p>
        </Section>
      )}

      {/* Financials */}
      {!!(report.financials) && (
        <Section title="المؤشرات المالية الرئيسية">
          <KVGrid data={report.financials as Record<string,string>} />
        </Section>
      )}

      {/* Scenarios */}
      {!!(report.scenarios) && (() => {
        const sc = report.scenarios as Record<string,Record<string,string>>
        return (
          <Section title="السيناريوهات الثلاثة">
            <div className="grid grid-cols-3 gap-3">
              {([
                {key:'optimistic', label:'متفائل 🌟', color:'#16a34a', bg:'#f0fdf4'},
                {key:'base',       label:'قاعدي 📊',  color:'#d97706', bg:'#fffbeb'},
                {key:'pessimistic',label:'متشائم ⚠️', color:'#dc2626', bg:'#fef2f2'},
              ] as const).map(s => (
                <div key={s.key} className="rounded-xl p-3 text-center border"
                  style={{background: s.bg, borderColor: s.color + '40'}}>
                  <div className="text-xs font-bold mb-2" style={{color: s.color}}>{s.label}</div>
                  <div className="font-black text-2xl mb-0.5" style={{color: s.color}}>{sc[s.key]?.roi_pct ?? '—'}</div>
                  <div className="text-xs text-gray-500">ROI</div>
                  <div className="text-xs text-gray-600 mt-1">⏱ {sc[s.key]?.payback_months ?? '—'} شهر</div>
                  {sc[s.key]?.net_profit && <div className="text-xs text-gray-500 mt-0.5">{sc[s.key].net_profit}</div>}
                </div>
              ))}
            </div>
          </Section>
        )
      })()}

      {/* Reality check */}
      {!!(report.reality_check) && (() => {
        const rc = report.reality_check as Array<Record<string,string>>
        return (
          <Section title="مقارنة افتراضاتك بالسوق">
            <div className="space-y-2">
              {rc.map((row, i) => {
                const color = row.assessment === 'منطقي' ? '#16a34a' : row.assessment === 'متفائل' ? '#d97706' : '#dc2626'
                return (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">{row.item}</div>
                      <div className="text-xs text-gray-400 mt-0.5">افتراضك: <span className="font-bold text-gray-600">{row.your_value}</span> · السوق: <span className="font-bold text-gray-600">{row.market_benchmark}</span></div>
                    </div>
                    <div className="text-xs font-black px-3 py-1 rounded-full text-white" style={{background: color}}>
                      {row.assessment}
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>
        )
      })()}

      {/* KPI Scorecard */}
      {!!(report.kpi_scorecard) && (
        <Section title="مؤشرات الأداء التسويقي">
          <KVGrid data={report.kpi_scorecard as Record<string,string>} />
        </Section>
      )}

      {/* Channel breakdown */}
      {!!(report.channel_breakdown) && (() => {
        const channels = report.channel_breakdown as Array<Record<string,string>>
        return (
          <Section title="تحليل القنوات الإعلانية">
            <div className="space-y-3">
              {channels.map((ch, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-sm text-gray-900">{ch.channel}</div>
                    <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      ch.performance?.includes('أفضل') ? 'bg-green-100 text-green-700' :
                      ch.performance?.includes('ضمن') ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>{ch.performance}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-2">
                    {ch.spend && <span>الإنفاق: <strong>{ch.spend}</strong></span>}
                    {ch.benchmark_cpl && <span>معيار CPL: <strong>{ch.benchmark_cpl}</strong></span>}
                    {ch.estimated_leads && <span>عملاء متوقعون: <strong>{ch.estimated_leads}</strong></span>}
                  </div>
                  {ch.recommendation && <div className="text-xs text-purple-700 bg-purple-50 rounded p-2">💡 {ch.recommendation}</div>}
                </div>
              ))}
            </div>
          </Section>
        )
      })()}

      {/* Market scores */}
      {!!(report.market_scores) && (() => {
        const ms = report.market_scores as Record<string,{score:number;max:number;label:string;reasoning:string}>
        return (
          <Section title="تقييم السوق">
            <div className="space-y-4">
              {Object.values(ms).map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-bold text-gray-800">{item.label}</span>
                    <span className="font-black text-purple-900">{item.score}<span className="text-gray-400 font-normal">/{item.max}</span></span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-2.5 rounded-full bg-gradient-to-l from-purple-600 to-purple-400 transition-all"
                      style={{width: `${(item.score/item.max)*100}%`}} />
                  </div>
                  {item.reasoning && <div className="text-xs text-gray-500 mt-1">{item.reasoning}</div>}
                </div>
              ))}
            </div>
          </Section>
        )
      })()}

      {/* Quick wins / optimizations */}
      {!!(report.quick_wins || report.optimizations || report.improvements || report.immediate_actions) && (() => {
        const items = (report.quick_wins || report.optimizations || report.improvements || report.immediate_actions) as Array<Record<string,string>>
        return (
          <Section title="⚡ الإجراءات الفورية">
            <div className="space-y-3">
              {items.slice(0,3).map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-900 font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-gray-900 leading-snug">{item.action}</div>
                    <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-x-3">
                      {item.timeline && <span>⏱ {item.timeline}</span>}
                      {item.impact && <span>📈 {item.impact}</span>}
                      {item.expected_cpl_reduction && <span>📉 {item.expected_cpl_reduction}</span>}
                      {item.effort && <span>💪 {item.effort}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )
      })()}

      {/* SWOT */}
      {!!(report.swot) && (() => {
        const sw = report.swot as Record<string,string[]>
        return (
          <Section title="تحليل SWOT">
            <div className="grid grid-cols-2 gap-2">
              {([
                {key:'strengths',     label:'💪 نقاط القوة',  color:'#16a34a', bg:'#f0fdf4'},
                {key:'weaknesses',    label:'⚠️ نقاط الضعف', color:'#dc2626', bg:'#fef2f2'},
                {key:'opportunities', label:'🚀 الفرص',       color:'#d97706', bg:'#fffbeb'},
                {key:'threats',       label:'🛡️ التهديدات',   color:'#7c3aed', bg:'#f5f3ff'},
              ] as const).map(s => (
                <div key={s.key} className="rounded-xl p-3" style={{background: s.bg}}>
                  <div className="text-xs font-black mb-2" style={{color: s.color}}>{s.label}</div>
                  <ul className="space-y-1.5">
                    {(sw[s.key] || []).slice(0,3).map((item:string, i:number) => (
                      <li key={i} className="text-xs text-gray-700 flex gap-1.5 leading-snug">
                        <span className="flex-shrink-0 mt-0.5" style={{color: s.color}}>▸</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        )
      })()}

      {/* Risk scorecard */}
      {!!(report.risk_scorecard) && (() => {
        const rs = report.risk_scorecard as {overall_risk:string;overall_score:number;dimensions:Array<{name:string;score:number;detail:string}>}
        const rColor = rs.overall_risk === 'Low' ? '#16a34a' : rs.overall_risk === 'Medium' ? '#d97706' : '#dc2626'
        return (
          <Section title="مؤشر المخاطر">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl mb-4">
              <div className="text-4xl font-black" style={{color: rColor}}>{rs.overall_score}</div>
              <div>
                <div className="font-black text-base" style={{color: rColor}}>
                  {rs.overall_risk === 'Low' ? 'مخاطر منخفضة' : rs.overall_risk === 'Medium' ? 'مخاطر متوسطة' : 'مخاطر عالية'}
                </div>
                <div className="text-xs text-gray-500">من 100 · كلما ارتفع زاد الخطر</div>
              </div>
            </div>
            <div className="space-y-3">
              {(rs.dimensions || []).map((dim, i) => {
                const dc = dim.score > 60 ? '#dc2626' : dim.score > 35 ? '#d97706' : '#16a34a'
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-gray-700">{dim.name}</span>
                      <span className="font-black" style={{color: dc}}>{dim.score}/100</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-2 rounded-full transition-all" style={{width:`${dim.score}%`, background: dc}} />
                    </div>
                    {dim.detail && <div className="text-xs text-gray-400 mt-0.5">{dim.detail}</div>}
                  </div>
                )
              })}
            </div>
          </Section>
        )
      })()}

      {/* 90-day strategy */}
      {!!(report.entry_strategy_90days || report.strategy_90days) && (() => {
        const plan = (report.entry_strategy_90days || report.strategy_90days) as Record<string,{title?:string;focus?:string;actions:string[];budget:string;kpi:string}>
        return (
          <Section title="خطة 90 يوم">
            <div className="space-y-3">
              {(['month1','month2','month3'] as const).map((m, i) => {
                const month = plan[m]
                if (!month) return null
                const label = month.title || month.focus || `الشهر ${i+1}`
                return (
                  <div key={m} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 bg-purple-50 px-4 py-2.5 border-b border-purple-100">
                      <div className="w-7 h-7 rounded-full bg-purple-700 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{i+1}</div>
                      <div className="font-bold text-sm text-purple-900">{label}</div>
                    </div>
                    <div className="p-3">
                      <ul className="space-y-1 mb-3">
                        {(month.actions || []).map((a:string, j:number) => (
                          <li key={j} className="text-xs text-gray-700 flex gap-1.5 leading-snug">
                            <span className="text-purple-400 flex-shrink-0 mt-0.5">▸</span><span>{a}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-4 text-xs border-t border-gray-100 pt-2">
                        {month.budget && <span className="text-amber-700 font-medium">💰 {month.budget}</span>}
                        {month.kpi && <span className="text-teal-700 font-medium">🎯 {month.kpi}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>
        )
      })()}

      {/* Sensitivity analysis */}
      {!!(report.sensitivity_analysis) && (() => {
        const sa = report.sensitivity_analysis as Array<Record<string,string>>
        return (
          <Section title="تحليل الحساسية">
            <div className="space-y-3">
              {sa.map((row, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-sm text-gray-800">{row.variable}</div>
                    <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      row.sensitivity === 'عالية' ? 'bg-red-100 text-red-700' :
                      row.sensitivity === 'متوسطة' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>{row.sensitivity}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    {row.impact_10pct_up && <span>↑ 10%: <strong className="text-green-700">{row.impact_10pct_up}</strong></span>}
                    {row.impact_10pct_down && <span>↓ 10%: <strong className="text-red-700">{row.impact_10pct_down}</strong></span>}
                    {row.impact_3months_more && <span>+3 شهور: <strong className="text-red-700">{row.impact_3months_more}</strong></span>}
                    {row.impact_3months_less && <span>-3 شهور: <strong className="text-green-700">{row.impact_3months_less}</strong></span>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )
      })()}

      {/* WhatsApp script */}
      {!!(report.whatsapp_script) && (() => {
        const ws = report.whatsapp_script as {opening:string;qualification_questions:string[];closing:string}
        return (
          <Section title="💬 سكريبت واتساب للتأهيل">
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-xs font-bold text-green-800 mb-1">رسالة الافتتاح</div>
                <div className="text-sm text-gray-700">{ws.opening}</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-xs font-bold text-blue-800 mb-2">أسئلة التأهيل</div>
                <ol className="space-y-1.5">
                  {(ws.qualification_questions || []).map((q:string, i:number) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="font-bold text-blue-600 flex-shrink-0">{i+1}.</span><span>{q}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="text-xs font-bold text-purple-800 mb-1">إغلاق الحوار</div>
                <div className="text-sm text-gray-700">{ws.closing}</div>
              </div>
            </div>
          </Section>
        )
      })()}

      {/* CPL intelligence */}
      {!!(report.cpl_intelligence) && (() => {
        const cpl = report.cpl_intelligence as Record<string,string>
        return (
          <Section title="ذكاء تكلفة العميل CPL">
            <KVGrid data={cpl} />
          </Section>
        )
      })()}

      {/* Marketing score breakdown */}
      {!!(report.score_breakdown) && (() => {
        const sb = report.score_breakdown as Record<string,{score:number;max:number;assessment:string}>
        return (
          <Section title="تقييم الأداء التسويقي الشامل">
            {!!(report.marketing_score) && (
              <div className="text-center mb-4 p-4 bg-purple-50 rounded-xl">
                <div className="text-5xl font-black text-purple-900">{report.marketing_score as number}</div>
                <div className="text-sm text-gray-500 mt-1">من 100 — نقاط التسويق الكلية</div>
              </div>
            )}
            <div className="space-y-3">
              {Object.entries(sb).map(([k, v], i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-gray-700">{arLabel(k)}</span>
                    <span className="font-black text-purple-900">{v.score}/{v.max}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-2 rounded-full bg-gradient-to-l from-purple-600 to-purple-400"
                      style={{width:`${(v.score/v.max)*100}%`}} />
                  </div>
                  {v.assessment && <div className="text-xs text-gray-500 mt-0.5">{v.assessment}</div>}
                </div>
              ))}
            </div>
          </Section>
        )
      })()}

      {/* Recommendation */}
      {!!(report.recommendation) && (
        <Section title="التوصية النهائية">
          <p className="text-gray-800 text-sm leading-relaxed font-medium">{report.recommendation as string}</p>
        </Section>
      )}

      {/* JSON toggle */}
      <details className="bg-gray-50 rounded-xl border border-gray-200">
        <summary className="p-4 text-sm font-bold text-gray-500 cursor-pointer hover:text-gray-700 select-none">
          عرض البيانات الكاملة (JSON) ▾
        </summary>
        <div className="p-4 pt-0">
          <pre className="text-xs text-gray-500 overflow-auto max-h-64 bg-white rounded-lg p-3 border border-gray-200 font-mono" dir="ltr">
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  )
}

// ── MAIN PAGE ────────────────────────────────────────────────────

export default function RealEstateIntelligencePage() {
  const [selected, setSelected]   = useState<ReportType | null>(null)
  const [loading, setLoading]     = useState(false)
  const [report, setReport]       = useState<Record<string,unknown> | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [lastForm, setLastForm]   = useState<Record<string,string> | null>(null)

  async function handleSubmit(formData: Record<string,string>) {
    setLoading(true); setError(null); setReport(null); setLastForm(formData)
    try {
      const res = await fetch('/api/intelligence', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({reportType: selected, formData})
      })
      const data = await res.json() as {report?: Record<string,unknown>; error?: string}
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setReport(data.report ?? null)
    } catch(e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  const card = REPORT_CARDS.find(c => c.id === selected)

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F3EE]">
      {/* Page header */}
      <div className="bg-gradient-to-l from-purple-950 via-purple-900 to-purple-800 text-white">
        <div className="max-w-2xl mx-auto px-5 py-6">
          <div className="text-xs font-black tracking-widest text-white/30 mb-1">EUNOIA ZONES</div>
          <h1 className="text-2xl font-black">محرك الاستخبارات العقارية</h1>
          <p className="text-sm text-white/50 mt-1">5 تقارير متخصصة · معايير السوق المصري 2026</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* Report type cards */}
        {!report && (
          <div className="space-y-2">
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest px-1 mb-3">اختر نوع التقرير</div>
            {REPORT_CARDS.map(c => (
              <button key={c.id} onClick={()=>{ setSelected(c.id); setError(null) }}
                className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                  selected === c.id
                    ? 'border-purple-700 bg-purple-50 shadow-md shadow-purple-100'
                    : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                }`}>
                <span className="text-3xl flex-shrink-0 leading-none">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-black text-gray-900">{c.titleAr}</span>
                    {c.badge && (
                      <span className="text-xs font-black px-2 py-0.5 rounded-full text-white" style={{background: c.badgeColor!}}>
                        {c.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 font-medium">{c.titleEn}</div>
                  <div className="text-xs text-gray-500 mt-1 leading-relaxed">{c.desc}</div>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">⏱ {c.time}</div>
              </button>
            ))}
          </div>
        )}

        {/* Form panel */}
        {selected && !report && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-l from-purple-50 to-white">
              <span className="text-2xl leading-none">{card?.icon}</span>
              <div className="flex-1">
                <div className="font-black text-gray-900">{card?.titleAr}</div>
                <div className="text-xs text-gray-400 font-medium">{card?.titleEn}</div>
              </div>
              <button onClick={()=>{ setSelected(null); setReport(null); setError(null) }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors text-lg font-bold">
                ×
              </button>
            </div>
            <div className="p-5">
              {selected === 'feasibility'   && <FeasibilityForm   onSubmit={handleSubmit} loading={loading} />}
              {selected === 'campaign_roi'  && <CampaignROIForm   onSubmit={handleSubmit} loading={loading} />}
              {selected === 'market_entry'  && <MarketEntryForm   onSubmit={handleSubmit} loading={loading} />}
              {selected === 'lead_gen'      && <LeadGenForm       onSubmit={handleSubmit} loading={loading} />}
              {selected === 'full_analysis' && <FullAnalysisForm  onSubmit={handleSubmit} loading={loading} />}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex gap-2 items-start">
                  <span className="flex-shrink-0">❌</span><span>{error}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report output */}
        {report && (
          <ReportView
            report={report}
            onBack={()=>{ setReport(null); setSelected(null); setError(null) }}
            onRegen={()=>{ if(lastForm) handleSubmit(lastForm) }}
          />
        )}

      </div>
    </div>
  )
}
