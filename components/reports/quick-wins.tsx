'use client'

import { Zap } from 'lucide-react'

interface QuickWin {
  action: string
  timeline: string
  money_impact: string
  expected_result: string
}

interface QuickWinsProps {
  items: QuickWin[]
}

export function QuickWins({ items }: QuickWinsProps) {
  return (
    <div className="bg-surface border border-white/8 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={14} className="text-gold" />
        <h3 className="text-cream/60 text-xs font-semibold uppercase tracking-wider">
          Quick Wins
        </h3>
      </div>
      <div className="space-y-3">
        {items.map((win, i) => (
          <div key={i} className="bg-gold/5 border border-gold/10 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-cream text-sm font-medium flex-1">{win.action}</p>
              <span className="text-gold text-xs font-semibold shrink-0 bg-gold/10 px-2 py-0.5 rounded-full">
                {win.timeline}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <div className="text-cream/50 text-xs">
                💰 {win.money_impact}
              </div>
              <div className="text-cream/50 text-xs">
                📈 {win.expected_result}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
