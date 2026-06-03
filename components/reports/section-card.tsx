'use client'
import React from 'react'

interface SectionCardProps {
  title: string
  data: Record<string, unknown>
  icon?: string
}

function renderValue(value: unknown, depth = 0): React.ReactNode {
  if (value === null || value === undefined) return '—'

  if (typeof value === 'string') {
    return <span className="text-foreground/80 leading-relaxed">{value}</span>
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return <span className="font-semibold" style={{color:'var(--gold)'}}>{String(value)}</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '—'
    if (typeof value[0] !== 'object') {
      return (
        <ul className="space-y-2 mt-1">
          {value.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/75 leading-relaxed">
              <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full" style={{background:'var(--gold)'}} />
              <span>{String(item)}</span>
            </li>
          ))}
        </ul>
      )
    }
    return (
      <div className="space-y-3 mt-1">
        {value.map((item, i) => (
          <div key={i} className="bg-muted/40 rounded-xl p-4 text-sm border border-border/50">
            {renderValue(item, depth + 1)}
          </div>
        ))}
      </div>
    )
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (depth >= 2) {
      return (
        <div className="space-y-1.5 text-sm">
          {entries.map(([k, v]) => (
            <div key={k} className="flex items-start gap-2">
              <span className="text-muted-foreground capitalize min-w-0 shrink-0">{k.replace(/_/g, ' ')}:</span>
              <span className="text-foreground/80">{renderValue(v, depth + 1)}</span>
            </div>
          ))}
        </div>
      )
    }
    return (
      <div className="space-y-4 mt-1">
        {entries.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[160px,1fr] gap-3 items-start py-3 border-b border-border/50 last:border-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground capitalize">
              {k.replace(/_/g, ' ')}
            </span>
            <div className="text-sm">{renderValue(v, depth + 1)}</div>
          </div>
        ))}
      </div>
    )
  }

  return <span className="text-foreground/80">{String(value)}</span>
}

export function SectionCard({ title, data, icon }: SectionCardProps) {
  const entries = Object.entries(data)
  if (entries.length === 0) return null

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border bg-muted/20">
        {icon && <span className="text-lg">{icon}</span>}
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>

      {/* Content */}
      <div className="px-6 py-5">
        {entries.length === 1 && typeof entries[0][1] !== 'object' ? (
          <div className="text-sm">{renderValue(entries[0][1])}</div>
        ) : (
          <div className="space-y-0">
            {entries.map(([k, v]) => (
              <div key={k} className="py-3 border-b border-border/50 last:border-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 capitalize">
                  {k.replace(/_/g, ' ')}
                </div>
                <div className="text-sm">{renderValue(v)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
