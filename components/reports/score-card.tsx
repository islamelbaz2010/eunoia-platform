'use client'

const DIM_LABELS: Record<string, { label: string; icon: string }> = {
  digital_presence:    { label: 'Digital Presence',    icon: '🌐' },
  content_quality:     { label: 'Content Quality',     icon: '✍️' },
  paid_performance:    { label: 'Paid Performance',    icon: '📣' },
  brand_strength:      { label: 'Brand Strength',      icon: '💎' },
  competitive_position:{ label: 'Competitive Position',icon: '🎯' },
}

interface ScoreCardProps {
  dimensions: Record<string, number>
}

export function ScoreCard({ dimensions }: ScoreCardProps) {
  const entries = Object.entries(dimensions)

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">📊</span>
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{color:'var(--gold)'}}>Score Breakdown</h3>
      </div>
      <div className="space-y-4">
        {entries.map(([key, score]) => {
          const meta = DIM_LABELS[key] ?? { label: key.replace(/_/g, ' '), icon: '•' }
          const color = score >= 70 ? '#16a34a' : score >= 50 ? 'var(--gold)' : '#dc2626'
          const bgColor = score >= 70 ? 'rgba(22,163,74,0.15)' : score >= 50 ? 'var(--gold-bg)' : 'rgba(220,38,38,0.15)'
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{meta.icon}</span>
                  <span className="text-sm font-medium text-foreground">{meta.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{color}}>{score}/100</span>
                  <div className="px-2 py-0.5 rounded-full text-xs font-bold"
                       style={{background: bgColor, color}}>
                    {score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor'}
                  </div>
                </div>
              </div>
              <div className="h-2.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${score}%`, background: `linear-gradient(90deg,${color},${color}aa)` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
