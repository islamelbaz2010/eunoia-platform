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
    <div className="bg-surface border border-white/10 rounded-2xl p-6">
      <h3 className="text-[#c9a962] text-base font-bold mb-5">
        Score Breakdown
      </h3>
      <div className="space-y-4">
        {entries.map(([key, score]) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#faf9f7] text-[15px] font-medium">
                {DIM_LABELS[key] ?? key.replace(/_/g, ' ')}
              </span>
              <span
                className={`text-sm font-bold ${
                  score >= 70 ? 'text-emerald-400' :
                  score >= 50 ? 'text-[#c9a962]' :
                  'text-red-400'
                }`}
              >
                {score}/100
              </span>
            </div>
            <div className="h-3 bg-white/8 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  score >= 70 ? 'bg-emerald-400' :
                  score >= 50 ? 'bg-[#c9a962]' :
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
