'use client'

import { AlertTriangle, AlertCircle, Info } from 'lucide-react'

interface RiskAlert {
  type: string
  message: string
  severity: 'high' | 'medium' | 'low'
  fix: string
}

interface RiskAlertsProps {
  items: RiskAlert[]
}

const SEVERITY_CONFIG = {
  high: { icon: AlertTriangle, bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', badge: 'bg-red-500/20 text-red-400' },
  medium: { icon: AlertCircle, bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-400' },
  low: { icon: Info, bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-400' },
}

export function RiskAlerts({ items }: RiskAlertsProps) {
  return (
    <div className="bg-surface border border-white/8 rounded-xl p-5">
      <h3 className="text-cream/60 text-xs font-semibold uppercase tracking-wider mb-4">
        Risk Alerts
      </h3>
      <div className="space-y-3">
        {items.map((alert, i) => {
          const severity = (alert.severity ?? 'medium') as keyof typeof SEVERITY_CONFIG
          const config = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.medium
          const Icon = config.icon

          return (
            <div key={i} className={`${config.bg} ${config.border} border rounded-lg p-4`}>
              <div className="flex items-start gap-3">
                <Icon size={16} className={`${config.text} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-cream text-sm font-medium">{alert.message}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${config.badge}`}>
                      {severity}
                    </span>
                  </div>
                  <div className="text-cream/50 text-xs">
                    <span className="font-medium text-cream/70">Fix: </span>{alert.fix}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
