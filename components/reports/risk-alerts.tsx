'use client'

interface RiskItem {
  type?: string
  risk?: string
  message?: string
  severity?: string
  likelihood?: string
  fix?: string
  mitigation?: string
  impact?: string
}

interface RiskAlertsProps {
  items: RiskItem[]
}

export function RiskAlerts({ items }: RiskAlertsProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">⚠️</span>
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{color:'var(--gold)'}}>Risk Factors</h3>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => {
          const severity = (item.severity ?? item.likelihood ?? 'medium').toLowerCase()
          const isHigh = severity === 'high'
          const isMed = severity === 'medium' || severity === 'med'
          const color = isHigh ? '#dc2626' : isMed ? 'var(--gold)' : '#16a34a'
          const bg = isHigh ? 'rgba(220,38,38,0.06)' : isMed ? 'var(--gold-bg)' : 'rgba(22,163,74,0.06)'
          const border = isHigh ? 'rgba(220,38,38,0.2)' : isMed ? 'var(--gold-border)' : 'rgba(22,163,74,0.2)'

          return (
            <div key={i} className="rounded-xl p-4 border" style={{background: bg, borderColor: border}}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm font-medium text-foreground leading-snug">
                  {item.risk ?? item.message ?? `Risk ${i + 1}`}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold shrink-0 capitalize"
                      style={{background: bg, color, border: `1px solid ${border}`}}>
                  {severity}
                </span>
              </div>
              {(item.fix ?? item.mitigation) && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold">Fix: </span>{item.fix ?? item.mitigation}
                </p>
              )}
              {item.impact && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-semibold">Impact: </span>{item.impact}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
