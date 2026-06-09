'use client'
import { useState } from 'react'
import { Building2, TrendingUp, Target, BarChart3, Users, Zap, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// ── REPORT TYPES ──────────────────────────────────────────────────
const REPORT_TYPES = [
  {
    id: 'feasibility',
    icon: Building2,
    title: 'دراسة الجدوى',
    titleEn: 'Feasibility Study',
    desc: 'تحليل مالي شامل: إيرادات، تكاليف، ROI، سيناريوهات، تحليل حساسية',
    accent: '#b8922a',
    fields: [
      { key: 'projectName', label: 'اسم المشروع', placeholder: 'مثال: مشروع النور السكني', required: true },
      { key: 'city', label: 'المدينة / الموقع', placeholder: 'مثال: القاهرة الجديدة', required: true },
      { key: 'projectType', label: 'نوع المشروع', placeholder: 'سكني / تجاري / مختلط', required: true },
      { key: 'units', label: 'عدد الوحدات', placeholder: '50', required: true, type: 'number' },
      { key: 'unitArea', label: 'متوسط مساحة الوحدة (م²)', placeholder: '150', required: true, type: 'number' },
      { key: 'sellPriceSqm', label: 'سعر البيع / م² (EGP)', placeholder: '15000', required: true, type: 'number' },
      { key: 'buildCostSqm', label: 'تكلفة البناء / م² (EGP)', placeholder: '8000', required: true, type: 'number' },
      { key: 'landCost', label: 'تكلفة الأرض الإجمالية (EGP)', placeholder: '20000000', required: true, type: 'number' },
      { key: 'landCostSqm', label: 'تكلفة الأرض / م² (EGP)', placeholder: '5000', type: 'number' },
      { key: 'buildMonths', label: 'مدة البناء (شهر)', placeholder: '24', required: true, type: 'number' },
      { key: 'salesMonths', label: 'مدة البيع المتوقعة (شهر)', placeholder: '36', required: true, type: 'number' },
      { key: 'adminPct', label: 'نسبة الإدارة والتسويق %', placeholder: '8', type: 'number' },
      { key: 'downPaymentPct', label: 'نسبة المقدم %', placeholder: '10', type: 'number' },
      { key: 'finishLevel', label: 'مستوى التشطيب', placeholder: 'خام / نصف تشطيب / كامل' },
      { key: 'cashSalesPct', label: 'نسبة مبيعات كاش %', placeholder: '20', type: 'number' },
      { key: 'realSellSqm', label: 'سعر السوق الفعلي / م² (اختياري)', placeholder: 'اترك فارغاً إذا غير معروف' },
      { key: 'realBuildSqm', label: 'تكلفة بناء السوق / م² (اختياري)', placeholder: 'للمقارنة' },
      { key: 'realSalesPace', label: 'معدل البيع السوقي (وحدة/شهر)', placeholder: 'مشاريع مشابهة' },
    ],
  },
  {
    id: 'campaign_roi',
    icon: BarChart3,
    title: 'تدقيق أداء الحملات',
    titleEn: 'Campaign ROI Audit',
    desc: 'تحليل CPL ومقارنته بمعايير السوق، تحسينات الأداء، توقعات العائد',
    accent: '#16a34a',
    fields: [
      { key: 'companyName', label: 'اسم الشركة', placeholder: 'مثال: شركة النور للتطوير', required: true },
      { key: 'city', label: 'المدينة', placeholder: 'القاهرة الجديدة', required: true },
      { key: 'clientType', label: 'نوع العميل', placeholder: 'developer / broker', required: true },
      { key: 'adSpend', label: 'إجمالي الإنفاق الإعلاني / شهر (EGP)', placeholder: '50000', required: true, type: 'number' },
      { key: 'cpl', label: 'تكلفة اللid الحالية CPL (EGP)', placeholder: '600', required: true, type: 'number' },
      { key: 'leads', label: 'عدد الليدز / شهر', placeholder: '83', required: true, type: 'number' },
      { key: 'metaSpend', label: 'إنفاق Meta Ads (EGP)', placeholder: '30000', type: 'number' },
      { key: 'googleSpend', label: 'إنفاق Google Ads (EGP)', placeholder: '15000', type: 'number' },
      { key: 'tiktokSpend', label: 'إنفاق TikTok Ads (EGP)', placeholder: '5000', type: 'number' },
      { key: 'roas', label: 'ROAS الحالي', placeholder: '4.5' },
    ],
  },
  {
    id: 'market_entry',
    icon: Target,
    title: 'دخول السوق الجديد',
    titleEn: 'Market Entry Intelligence',
    desc: 'تقييم السوق، SWOT، استراتيجية 90 يوم، CPL متوقع لأي مدينة مصرية',
    accent: '#2563eb',
    fields: [
      { key: 'companyName', label: 'اسم الشركة', placeholder: 'مثال: شركة الأهلي للتطوير', required: true },
      { key: 'targetCity', label: 'السوق المستهدف', placeholder: 'مثال: الساحل الشمالي', required: true },
      { key: 'clientType', label: 'نوع الشركة', placeholder: 'developer / broker', required: true },
      { key: 'budget', label: 'ميزانية الدخول / شهر (EGP)', placeholder: '80000', required: true, type: 'number' },
      { key: 'timeline', label: 'الجدول الزمني للدخول', placeholder: 'مثال: 6 أشهر' },
    ],
  },
  {
    id: 'lead_gen',
    icon: Users,
    title: 'استخبارات توليد الليدز',
    titleEn: 'Lead Gen Intelligence',
    desc: 'تحليل جودة الليدز، إطار التأهيل، سكريبت WhatsApp، تحسينات الفانل',
    accent: '#7c3aed',
    fields: [
      { key: 'companyName', label: 'اسم الشركة', placeholder: 'مثال: بروكر النور', required: true },
      { key: 'city', label: 'المدينة', placeholder: 'القاهرة الجديدة', required: true },
      { key: 'clientType', label: 'نوع الشركة', placeholder: 'developer / broker', required: true },
      { key: 'currentLeads', label: 'عدد الليدز الحالية / شهر', placeholder: '120', required: true, type: 'number' },
      { key: 'qualifiedPct', label: 'نسبة الليدز المؤهلة %', placeholder: '15', required: true, type: 'number' },
      { key: 'adSpend', label: 'الإنفاق الإعلاني / شهر (EGP)', placeholder: '40000', required: true, type: 'number' },
      { key: 'cpl', label: 'تكلفة الليد CPL (EGP)', placeholder: '333', required: true, type: 'number' },
      { key: 'avgDealValue', label: 'متوسط قيمة الصفقة (EGP)', placeholder: '3000000', type: 'number' },
      { key: 'salesCycle', label: 'دورة المبيعات (يوم)', placeholder: '90', type: 'number' },
    ],
  },
  {
    id: 'full_analysis',
    icon: TrendingUp,
    title: 'التحليل التسويقي الشامل',
    titleEn: 'Full Marketing Analysis',
    desc: 'تحليل 360°: هوية رقمية، أداء حملات، منافسة، SWOT، خطة 90 يوم',
    accent: '#dc2626',
    fields: [
      { key: 'companyName', label: 'اسم الشركة', placeholder: 'مثال: شركة الرؤية للتطوير', required: true },
      { key: 'city', label: 'المدينة', placeholder: 'القاهرة الجديدة', required: true },
      { key: 'clientType', label: 'نوع الشركة', placeholder: 'developer / broker', required: true },
      { key: 'website', label: 'الموقع الإلكتروني', placeholder: 'https://example.com' },
      { key: 'fbPage', label: 'صفحة Facebook', placeholder: 'https://facebook.com/page' },
      { key: 'igPage', label: 'حساب Instagram', placeholder: '@username' },
      { key: 'ttPage', label: 'حساب TikTok', placeholder: '@username' },
      { key: 'adSpend', label: 'الإنفاق الإعلاني / شهر (EGP)', placeholder: '60000', type: 'number' },
      { key: 'cpl', label: 'تكلفة الليد CPL (EGP)', placeholder: '500', type: 'number' },
      { key: 'roas', label: 'ROAS', placeholder: '4' },
      { key: 'leads', label: 'عدد الليدز / شهر', placeholder: '120', type: 'number' },
      { key: 'revenue', label: 'الإيراد الشهري (EGP)', placeholder: '2000000', type: 'number' },
      { key: 'competitors', label: 'المنافسون الرئيسيون', placeholder: 'مثال: بالم هيلز، مدينتي، لافيستا' },
    ],
  },
]

const CITIES = ['القاهرة الجديدة', 'العاصمة الإدارية', '6 أكتوبر', 'الشيخ زايد', 'المعادي', 'الساحل الشمالي', 'العين السخنة', 'الإسكندرية', 'أخرى']

// ── REPORT RENDERER ──────────────────────────────────────────────
function ScoreBar({ score, max = 100, accent = '#b8922a' }: { score: number; max?: number; accent?: string }) {
  const pct = Math.min(100, Math.round((score / max) * 100))
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: accent }} />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color: accent, minWidth: 36 }}>{score}/{max}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-muted/40 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function KVRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-right ml-4" style={accent ? { color: accent } : {}}>{value}</span>
    </div>
  )
}

function ReportRenderer({ report, reportType }: { report: Record<string, unknown>; reportType: string }) {
  const getString = (val: unknown): string =>
    typeof val === 'string' ? val : typeof val === 'number' ? String(val) : JSON.stringify(val)

  const getObj = (val: unknown): Record<string, unknown> =>
    (val && typeof val === 'object' && !Array.isArray(val)) ? val as Record<string, unknown> : {}

  const getArr = (val: unknown): unknown[] => Array.isArray(val) ? val : []

  const has = (v: unknown): boolean => v != null && v !== ''

  const conf = getObj(report.confidence_score)

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-foreground">{getString(report.report_type || report.company || report.project_name)}</h2>
          {!!report.city && <p className="text-sm text-muted-foreground mt-0.5">{getString(report.city)}</p>}
        </div>
        {conf.pct !== undefined && (
          <div className="text-center bg-muted/50 rounded-xl px-4 py-2 border border-border shrink-0">
            <div className="text-2xl font-black text-gold">{getString(conf.pct)}%</div>
            <div className="text-[10px] text-muted-foreground">Confidence</div>
          </div>
        )}
      </div>

      {/* Verdict (feasibility) */}
      {!!report.verdict && (
        <div className={`px-4 py-3 rounded-xl border text-center font-bold text-sm ${
          getString(report.verdict).includes('مجدي') && !getString(report.verdict).includes('غير')
            ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-400'
            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400'
        }`}>
          {getString(report.verdict)} — {getString(report.verdict_reason || '')}
        </div>
      )}

      {/* Executive Summary */}
      {!!report.executive_summary && (
        <div className="bg-muted/30 border border-border rounded-xl p-4">
          <p className="text-sm text-foreground leading-relaxed">{getString(report.executive_summary)}</p>
        </div>
      )}

      {/* Marketing Score */}
      {report.marketing_score !== undefined && (
        <Section title="درجة التسويق الإجمالية">
          <div className="text-4xl font-black text-gold mb-3 text-center">{getString(report.marketing_score)}<span className="text-lg text-muted-foreground">/100</span></div>
          {!!report.score_breakdown && Object.entries(getObj(report.score_breakdown)).map(([k, v]) => {
            const dim = getObj(v)
            return (
              <div key={k} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
                  <span className="font-semibold">{getString(dim.score)}/100</span>
                </div>
                <ScoreBar score={Number(dim.score) || 0} />
                {!!dim.assessment && <p className="text-xs text-muted-foreground mt-1">{getString(dim.assessment)}</p>}
              </div>
            )
          })}
        </Section>
      )}

      {/* Financials */}
      {!!report.financials && (
        <Section title="الملخص المالي">
          {Object.entries(getObj(report.financials)).map(([k, v]) => (
            <KVRow key={k} label={k.replace(/_/g, ' ')} value={getString(v)}
              accent={k.includes('profit') || k.includes('roi') ? '#16a34a' : undefined} />
          ))}
        </Section>
      )}

      {/* Scenarios */}
      {!!report.scenarios && (
        <Section title="السيناريوهات الثلاثة">
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(getObj(report.scenarios)).map(([key, val]) => {
              const s = getObj(val)
              const isPositive = getString(s.verdict || '').includes('مجدي') && !getString(s.verdict || '').includes('غير')
              return (
                <div key={key} className={`rounded-lg p-3 border text-center ${isPositive ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'}`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{key}</div>
                  <div className="text-sm font-bold">{getString(s.roi_pct)} ROI</div>
                  <div className="text-xs text-muted-foreground">{getString(s.payback_months)} شهر</div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* KPI Scorecard */}
      {!!report.kpi_scorecard && (
        <Section title="مؤشرات الأداء">
          {Object.entries(getObj(report.kpi_scorecard)).map(([k, v]) => (
            <KVRow key={k} label={k.replace(/_/g, ' ')} value={getString(v)} />
          ))}
        </Section>
      )}

      {/* Pipeline Health */}
      {!!report.pipeline_health && (
        <Section title="صحة خط المبيعات">
          {Object.entries(getObj(report.pipeline_health)).map(([k, v]) => (
            <KVRow key={k} label={k.replace(/_/g, ' ')} value={getString(v)} />
          ))}
        </Section>
      )}

      {/* Market Scores */}
      {!!report.market_scores && (
        <Section title="تقييم السوق">
          {Object.entries(getObj(report.market_scores)).map(([k, val]) => {
            const s = getObj(val)
            return (
              <div key={k} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{getString(s.label || k)}</span>
                  <span>{getString(s.score)}/{getString(s.max || 10)}</span>
                </div>
                <ScoreBar score={Number(s.score) || 0} max={Number(s.max) || 10} />
                {!!s.reasoning && <p className="text-xs text-muted-foreground mt-1">{getString(s.reasoning)}</p>}
              </div>
            )
          })}
        </Section>
      )}

      {/* SWOT */}
      {!!report.swot && (
        <Section title="تحليل SWOT">
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'strengths', label: 'نقاط القوة', color: '#16a34a' },
              { key: 'weaknesses', label: 'نقاط الضعف', color: '#dc2626' },
              { key: 'opportunities', label: 'الفرص', color: '#2563eb' },
              { key: 'threats', label: 'التهديدات', color: '#f59e0b' },
            ].map(({ key, label, color }) => (
              <div key={key} className="rounded-lg p-3 border border-border">
                <div className="text-[11px] font-bold mb-2" style={{ color }}>{label}</div>
                {getArr(getObj(report.swot)[key]).map((item, i) => (
                  <div key={i} className="text-xs text-muted-foreground flex gap-1.5 mb-1">
                    <span style={{ color }}>•</span>{getString(item)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Channel Breakdown */}
      {!!report.channel_breakdown && (
        <Section title="تفصيل القنوات الإعلانية">
          {getArr(report.channel_breakdown).map((ch, i) => {
            const c = getObj(ch)
            return (
              <div key={i} className="mb-4 pb-4 border-b border-border/40 last:border-0 last:mb-0 last:pb-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold">{getString(c.channel)}</span>
                  <span className="text-xs text-muted-foreground">إنفاق: {getString(c.spend)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{getString(c.recommendation)}</p>
              </div>
            )
          })}
        </Section>
      )}

      {/* Quick Wins */}
      {!!(report.quick_wins || report.optimizations || report.improvements || report.immediate_actions) && (
        <Section title="⚡ أهم الإجراءات الفورية">
          {getArr(report.quick_wins || report.optimizations || report.improvements || report.immediate_actions).map((item, i) => {
            const w = getObj(item)
            const action = getString(w.action || w.action || '')
            const impact = getString(w.impact || w.expected_impact || w.expected_cpl_reduction || w.money_impact || '')
            const timeline = getString(w.timeline || '')
            return (
              <div key={i} className="flex gap-3 py-2.5 border-b border-border/40 last:border-0">
                <div className="w-6 h-6 rounded-full bg-gold/10 text-gold font-bold text-xs flex items-center justify-center shrink-0">{i + 1}</div>
                <div>
                  <p className="text-sm text-foreground">{action}</p>
                  <div className="flex gap-3 mt-0.5">
                    {timeline && <span className="text-[11px] text-muted-foreground">{timeline}</span>}
                    {impact && <span className="text-[11px] text-gold font-medium">{impact}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </Section>
      )}

      {/* WhatsApp Script */}
      {!!report.whatsapp_script && (
        <Section title="سكريبت WhatsApp للتأهيل">
          {(() => {
            const ws = getObj(report.whatsapp_script)
            return (
              <div className="space-y-3">
                {!!ws.opening && (
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div className="text-[10px] font-bold text-green-600 mb-1">الرسالة الأولى</div>
                    <p className="text-sm">{getString(ws.opening)}</p>
                  </div>
                )}
                {!!ws.qualification_questions && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">أسئلة التأهيل</div>
                    {getArr(ws.qualification_questions).map((q, i) => (
                      <div key={i} className="flex gap-2 text-sm mb-1">
                        <span className="text-gold font-bold">{i + 1}.</span>{getString(q)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </Section>
      )}

      {/* 90-Day Plan */}
      {!!(report.strategy_90days || report.entry_strategy_90days || report.plan_90_days) && (
        <Section title="خطة 90 يوم">
          {(() => {
            const plan = getObj(report.strategy_90days || report.entry_strategy_90days || report.plan_90_days)
            return Object.entries(plan).map(([month, val]) => {
              const m = getObj(val)
              return (
                <div key={month} className="mb-4">
                  <div className="text-xs font-bold text-gold mb-1">{month.replace('month', 'الشهر ')} {!!m.focus && `— ${getString(m.focus)}`}</div>
                  {getArr(m.actions || []).map((a, i) => (
                    <div key={i} className="flex gap-2 text-sm text-muted-foreground mb-0.5">
                      <span className="text-gold">•</span>{getString(a)}
                    </div>
                  ))}
                  {!!m.kpi && <div className="text-xs text-muted-foreground mt-1">KPI: {getString(m.kpi)}</div>}
                </div>
              )
            })
          })()}
        </Section>
      )}

      {/* Reality Check */}
      {!!report.reality_check && (
        <Section title="مقارنة بالسوق">
          {getArr(report.reality_check).map((row, i) => {
            const r = getObj(row)
            const isGood = getString(r.assessment).includes('منطقي')
            return (
              <div key={i} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
                <span className="text-sm text-muted-foreground">{getString(r.item)}</span>
                <div className="text-right">
                  <div className="text-xs font-semibold">{getString(r.your_value)}</div>
                  <div className="text-[10px] text-muted-foreground">معيار: {getString(r.market_benchmark)}</div>
                  <span className={`text-[10px] font-bold ${isGood ? 'text-green-600' : 'text-amber-500'}`}>{getString(r.assessment)}</span>
                </div>
              </div>
            )
          })}
        </Section>
      )}

      {/* CPL Intelligence */}
      {!!report.cpl_intelligence && (
        <Section title="توقعات تكاليف الإعلان">
          {Object.entries(getObj(report.cpl_intelligence)).map(([k, v]) => (
            <KVRow key={k} label={k.replace(/_/g, ' ')} value={getString(v)} />
          ))}
        </Section>
      )}

      {/* Recommendation */}
      {!!report.recommendation && (
        <div className="bg-gold/5 border border-gold/20 rounded-xl p-4">
          <div className="text-xs font-bold text-gold mb-1">التوصية النهائية</div>
          <p className="text-sm text-foreground">{getString(report.recommendation)}</p>
        </div>
      )}

      {/* Raw JSON fallback for unseen fields */}
      <details className="text-left">
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">عرض البيانات الكاملة (JSON)</summary>
        <pre className="mt-2 text-[10px] bg-muted/30 rounded-lg p-3 overflow-auto max-h-64">{JSON.stringify(report, null, 2)}</pre>
      </details>
    </div>
  )
}

// ── MAIN PAGE ────────────────────────────────────────────────────
export default function RealEstatePage() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState<Record<string, unknown> | null>(null)

  const selectedReport = REPORT_TYPES.find(r => r.id === selectedType)

  function handleField(key: string, value: string) {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    if (!selectedType || !selectedReport) return
    const missing = selectedReport.fields.filter(f => f.required && !formData[f.key])
    if (missing.length > 0) {
      setError(`من فضلك أكمل: ${missing.map(f => f.label).join('، ')}`)
      return
    }
    setLoading(true)
    setError('')
    setReport(null)
    try {
      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType: selectedType, formData }),
      })
      const data = await res.json() as { success?: boolean; report?: Record<string, unknown>; error?: string }
      if (!res.ok || !data.success) throw new Error(data.error ?? 'حدث خطأ')
      setReport(data.report ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">تقارير الذكاء العقاري</h1>
        <p className="text-sm text-muted-foreground">5 تقارير متخصصة — معايير مصر العقارية 2026</p>
      </div>

      {/* Report Type Cards */}
      {!report && (
        <div className="grid sm:grid-cols-2 gap-3">
          {REPORT_TYPES.map(rt => {
            const Icon = rt.icon
            const isSelected = selectedType === rt.id
            return (
              <button
                key={rt.id}
                onClick={() => { setSelectedType(rt.id); setFormData({}); setError('') }}
                className={`text-right p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-gold bg-gold/5 shadow-sm'
                    : 'border-border hover:border-border hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${rt.accent}18` }}>
                    <Icon size={15} style={{ color: rt.accent }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{rt.title}</div>
                    <div className="text-[10px] text-muted-foreground">{rt.titleEn}</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{rt.desc}</p>
              </button>
            )
          })}
        </div>
      )}

      {/* Form */}
      {selectedType && selectedReport && !report && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">{selectedReport.title}</h2>
            <button onClick={() => { setSelectedType(null); setFormData({}) }} className="text-xs text-muted-foreground hover:text-foreground">
              ← تغيير النوع
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {selectedReport.fields.map(field => (
              <div key={field.key} className={field.key === 'competitors' || field.key === 'finishLevel' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  {field.label}{field.required && <span className="text-red-500 mr-0.5">*</span>}
                </label>
                {field.key === 'city' ? (
                  <select
                    value={formData[field.key] ?? ''}
                    onChange={e => handleField(field.key, e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-gold transition-colors"
                  >
                    <option value="">اختر المدينة...</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : field.key === 'clientType' ? (
                  <select
                    value={formData[field.key] ?? ''}
                    onChange={e => handleField(field.key, e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-gold transition-colors"
                  >
                    <option value="">اختر النوع...</option>
                    <option value="developer">مطور عقاري</option>
                    <option value="broker">وسيط / بروكر</option>
                  </select>
                ) : field.key === 'targetCity' ? (
                  <select
                    value={formData[field.key] ?? ''}
                    onChange={e => handleField(field.key, e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-gold transition-colors"
                  >
                    <option value="">اختر السوق المستهدف...</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <input
                    type={field.type ?? 'text'}
                    value={formData[field.key] ?? ''}
                    onChange={e => handleField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-gold transition-colors"
                  />
                )}
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="gold"
            className="w-full gap-2"
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" />جاري إنشاء التقرير...</>
            ) : (
              <><Zap size={14} />إنشاء التقرير الآن</>
            )}
          </Button>
        </Card>
      )}

      {/* Report Result */}
      {report && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">نتيجة التقرير</h2>
            <button
              onClick={() => { setReport(null); setFormData({}) }}
              className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
            >
              ← تقرير جديد
            </button>
          </div>
          <ReportRenderer report={report} reportType={selectedType ?? ''} />
        </div>
      )}
    </div>
  )
}
