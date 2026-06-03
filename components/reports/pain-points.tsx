'use client'

interface PainPoint {
  level: 'high' | 'med' | 'low'
  title: string
  detail: string
}

interface PainPointsProps {
  items: PainPoint[]
}

export function PainPoints({ items }: PainPointsProps) {
  if (!items || items.length === 0) return null

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">🔍</span>
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{color:'var(--gold)'}}>
          Pain Points المكتشفة
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((p, i) => {
          const isHigh = p.level === 'high'
          const isMed = p.level === 'med'
          const color = isHigh ? '#dc2626' : isMed ? 'var(--gold)' : '#16a34a'
          const bg = isHigh ? 'rgba(220,38,38,0.06)' : isMed ? 'var(--gold-bg)' : 'rgba(22,163,74,0.06)'
          const border = isHigh ? 'rgba(220,38,38,0.2)' : isMed ? 'var(--gold-border)' : 'rgba(22,163,74,0.2)'
          const label = isHigh ? '🔴 مشكلة كبيرة' : isMed ? '🟡 متوسط' : '🟢 منخفض'
          return (
            <div
              key={i}
              className="rounded-xl p-4 border"
              style={{background: bg, borderColor: border}}
            >
              <div className="text-xs font-bold mb-2" style={{color}}>{label}</div>
              <div className="text-sm font-semibold text-foreground mb-1">{p.title}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{p.detail}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
