'use client'

const DIM_LABELS: Record<string, string> = {
  digital_presence: 'Digital Presence',
  content_quality: 'Content Quality',
  paid_performance: 'Paid Performance',
  brand_strength: 'Brand Strength',
  competitive_position: 'Competitive Position',
}

interface ScoreCardProps {
  dimensions: Record<string, number>
}

export function ScoreCard({ dimensions }: ScoreCardProps) {
  const entries = Object.entries(dimensions)

  return (
    <div className="bg-surface border border-white/8 rounded-xl p-5">
      <h3 className="text-cream/60 text-xs font-semibold uppercase tracking-wider mb-4">
        Score Breakdown
      </h3>
      <div className="space-y-3">
        {entries.map(([key, score]) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-cream/70 text-sm">{DIM_LABELS[key] ?? key}</span>
              <span className="text-cream text-sm font-semibold">{score}/100</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  score >= 70 ? 'bg-emerald-400' :
                  score >= 50 ? 'bg-gold' :
                  'bg-red-400'
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
