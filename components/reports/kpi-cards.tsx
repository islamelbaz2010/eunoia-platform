'use client'

interface KpiItem {
  label: string
  value: string | number
  sub?: string
  variant?: 'highlight' | 'accent' | 'good' | 'alert' | 'default'
}

interface KpiCardsProps {
  items: KpiItem[]
  title?: string
}

export function KpiCards({ items, title }: KpiCardsProps) {
  if (!items || items.length === 0) return null

  const getColors = (variant?: string) => {
    switch(variant) {
      case 'highlight': return { bg: 'rgba(184,146,42,0.08)', border: 'var(--gold-border)', value: 'var(--gold)' }
      case 'accent': return { bg: 'rgba(184,146,42,0.05)', border: 'var(--gold-border)', value: 'var(--gold)' }
      case 'good': return { bg: 'rgba(22,163,74,0.06)', border: 'rgba(22,163,74,0.2)', value: '#16a34a' }
      case 'alert': return { bg: 'rgba(220,38,38,0.06)', border: 'rgba(220,38,38,0.2)', value: '#dc2626' }
      default: return { bg: 'var(--muted)', border: 'var(--border)', value: 'var(--foreground)' }
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      {title && (
        <div className="flex items-center gap-2 mb-5">
          <span className="text-lg">📊</span>
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{color:'var(--gold)'}}>{title}</h3>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item, i) => {
          const colors = getColors(item.variant)
          return (
            <div
              key={i}
              className="rounded-xl p-4 text-center border"
              style={{background: colors.bg, borderColor: colors.border}}
            >
              <div className="text-xs text-muted-foreground font-semibold mb-2 leading-tight">
                {item.label}
              </div>
              <div className="text-lg font-bold leading-tight" style={{color: colors.value}}>
                {item.value}
              </div>
              {item.sub && (
                <div className="text-[10px] text-muted-foreground mt-1">{item.sub}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
