'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SECTORS = [
  { key: 'real_estate', ar: 'عقارات', en: 'Real Estate', icon: '🏢' },
  { key: 'restaurant', ar: 'مطعم / كافيه', en: 'Restaurant / Cafe', icon: '🍽' },
  { key: 'retail', ar: 'تجارة / محل', en: 'Retail', icon: '🛍' },
  { key: 'medical', ar: 'طبي / صحة', en: 'Medical', icon: '🏥' },
  { key: 'services', ar: 'خدمات / وكالة', en: 'Services / Agency', icon: '⚙' },
  { key: 'education', ar: 'تعليم', en: 'Education', icon: '📚' },
  { key: 'tech', ar: 'تكنولوجيا', en: 'Technology', icon: '💻' },
  { key: 'manufacturing', ar: 'تصنيع', en: 'Manufacturing', icon: '🏭' },
]

const CITIES = ['القاهرة الجديدة', 'الشيخ زايد', '6 أكتوبر', 'المعادي', 'مدينة نصر', 'الزمالك', 'الإسكندرية', 'المنصورة', 'طنطا', 'أخرى']

export default function DemoPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1 fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  // Step 2 fields
  const [company, setCompany] = useState('')
  const [sector, setSector] = useState('')
  const [city, setCity] = useState('')
  const [competitor1, setCompetitor1] = useState('')
  const [competitor2, setCompetitor2] = useState('')
  const [website, setWebsite] = useState('')

  async function handleSubmit() {
    if (!company || !sector || !city) {
      setError('من فضلك أكمل الحقول المطلوبة')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, company, sector, city, competitor1, competitor2, website }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'حدث خطأ')
      setStep(3)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1] flex flex-col" dir="rtl">
      {/* Header */}
      <div className="border-b border-border bg-white/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div>
          <div className="font-mono text-xs tracking-[0.25em] uppercase font-bold" style={{color:'#b8922a'}}>EUNOIA</div>
          <div className="text-[9px] tracking-wider text-gray-400 uppercase">Intelligence Platform</div>
        </div>
        <div className="text-xs text-gray-400">🏢 Real Estate Developer Exhibition — June 5, 2026</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= s ? 'text-white' : 'bg-gray-100 text-gray-400'
                }`} style={step >= s ? {background:'#b8922a'} : {}}>
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && <div className={`w-8 h-px ${step > s ? 'bg-gold' : 'bg-gray-200'}`} style={step > s ? {background:'#b8922a'} : {}} />}
              </div>
            ))}
          </div>

          {/* STEP 1: Personal info */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">احصل على تقريرك المجاني 🎁</h1>
                <p className="text-sm text-gray-500">تقرير ذكاء اصطناعي عن مشروعك — مجاناً من Eunoia Zones</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">الاسم *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="اسمك الكريم"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">رقم الموبايل *</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="01xxxxxxxxx" type="tel"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">البريد الإلكتروني * (هيوصله التقرير)</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" type="email"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                </div>
              </div>
              <button
                onClick={() => {
                  if (!name || !phone || !email) { setError('من فضلك أكمل جميع الحقول'); return }
                  setError('')
                  setStep(2)
                }}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
                style={{background:'linear-gradient(135deg,#b8922a,#d4aa45)'}}
              >
                التالي ←
              </button>
              {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            </div>
          )}

          {/* STEP 2: Business info */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">بيانات مشروعك 🏢</h1>
                <p className="text-sm text-gray-500">كل ما تدخله يزيد دقة التقرير</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">اسم الشركة / المشروع *</label>
                  <input value={company} onChange={e => setCompany(e.target.value)} placeholder="مثال: مجمع النور العقاري"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">القطاع *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SECTORS.map(s => (
                      <button key={s.key} type="button" onClick={() => setSector(s.key)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-right ${
                          sector === s.key ? 'border-yellow-400 font-bold' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                        style={sector === s.key ? {background:'rgba(184,146,42,0.08)', color:'#b8922a'} : {}}>
                        <span>{s.icon}</span>{s.ar}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">المدينة *</label>
                  <select value={city} onChange={e => setCity(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 bg-white">
                    <option value="">اختر المدينة...</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">المنافس الرئيسي الأول (اختياري)</label>
                  <input value={competitor1} onChange={e => setCompetitor1(e.target.value)} placeholder="مثال: بالم هيلز"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">المنافس الثاني (اختياري)</label>
                  <input value={competitor2} onChange={e => setCompetitor2(e.target.value)} placeholder="مثال: مدينتي"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">الموقع الإلكتروني (اختياري)</label>
                  <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yoursite.com" type="url"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                </div>
              </div>
              {error && <p className="text-red-500 text-xs text-center">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                  → رجوع
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{background:'linear-gradient(135deg,#b8922a,#d4aa45)', flex: 2}}>
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري إنشاء التقرير...
                    </>
                  ) : '✨ احصل على تقريرك المجاني'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Success */}
          {step === 3 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-5">
              <div className="text-5xl">🎉</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">تقريرك في الطريق!</h1>
                <p className="text-sm text-gray-500 leading-relaxed">
                  تم إنشاء تقريرك بنجاح وسيصلك على إيميل <span className="font-bold text-gray-700">{email}</span> خلال دقائق قليلة.
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-right">
                <p className="text-xs font-bold text-amber-800 mb-2">🚀 هل تريد تقريراً أعمق؟</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  التقرير المجاني هو لمحة سريعة. التقرير الكامل يشمل 22 قسماً، تحليل منافسين، خطة تسويقية، وتوصيات فورية.
                </p>
                <p className="text-xs font-bold text-amber-800 mt-2">تكلم فريق Eunoia على الـ stand الآن ←</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
