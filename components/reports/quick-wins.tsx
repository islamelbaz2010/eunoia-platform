'use client'

interface QuickWin {
  action: string
  timeline?: string
  money_impact?: string
  expected_result?: string
  reasoning?: string
}

interface QuickWinsProps {
  items: QuickWin[]
}

export function QuickWins({ items }: QuickWinsProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">⚡</span>
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{color:'var(--gold)'}}>Quick Wins</h3>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border/50">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                 style={{background:'var(--gold-bg)',color:'var(--gold)',border:'1px solid var(--gold-border)'}}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground leading-snug mb-2">{item.action}</p>
              <div className="flex flex-wrap gap-2">
                {item.timeline && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30">
                    ⏱ {item.timeline}
                  </span>
                )}
                {item.money_impact && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/30">
                    💰 {item.money_impact}
                  </span>
                )}
                {item.expected_result && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                    → {item.expected_result}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
