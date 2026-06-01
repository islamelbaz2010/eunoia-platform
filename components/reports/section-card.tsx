'use client'

interface SectionCardProps {
  title: string
  data: Record<string, unknown>
}

function renderValue(value: unknown, depth = 0): React.ReactNode {
  if (value === null || value === undefined) return '—'

  if (typeof value === 'string') {
    return <span className="text-cream/80">{value}</span>
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return <span className="text-gold font-medium">{String(value)}</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '—'
    // Array of strings/primitives
    if (typeof value[0] !== 'object') {
      return (
        <ul className="space-y-1 mt-1">
          {value.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-cream/70">
              <span className="text-gold/60 shrink-0 mt-0.5">•</span>
              <span>{String(item)}</span>
            </li>
          ))}
        </ul>
      )
    }
    // Array of objects
    return (
      <div className="space-y-3 mt-1">
        {value.map((item, i) => (
          <div key={i} className="bg-white/3 rounded-lg p-3 text-sm">
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
        <div className="space-y-1 text-sm">
          {entries.map(([k, v]) => (
            <div key={k}>
              <span className="text-cream/40">{k}: </span>
              {renderValue(v, depth + 1)}
            </div>
          ))}
        </div>
      )
    }
    return (
      <div className="space-y-2 mt-1">
        {entries.map(([k, v]) => (
          <div key={k}>
            <div className="text-cream/40 text-xs font-medium capitalize mb-0.5">
              {k.replace(/_/g, ' ')}
            </div>
            <div>{renderValue(v, depth + 1)}</div>
          </div>
        ))}
      </div>
    )
  }

  return <span className="text-cream/60">{String(value)}</span>
}

export function SectionCard({ title, data }: SectionCardProps) {
  const entries = Object.entries(data)

  return (
    <div className="bg-surface border border-white/8 rounded-xl p-5">
      <h3 className="text-cream/60 text-xs font-semibold uppercase tracking-wider mb-4">
        {title}
      </h3>
      <div className="space-y-4">
        {entries.map(([key, value]) => (
          <div key={key}>
            <div className="text-cream/50 text-xs font-medium capitalize mb-1">
              {key.replace(/_/g, ' ')}
            </div>
            <div>{renderValue(value)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
