'use client'

interface SectionCardProps {
  title: string
  data: Record<string, unknown>
}

function renderValue(value: unknown, depth = 0): React.ReactNode {
  if (value === null || value === undefined) return '—'

  if (typeof value === 'string') {
    return <span className="text-cream/80 leading-relaxed">{value}</span>
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return <span className="text-[#c9a962] font-semibold">{String(value)}</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '—'
    if (typeof value[0] !== 'object') {
      return (
        <ul className="space-y-2 mt-1">
          {value.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[15px] text-cream/75 leading-relaxed">
              <span className="text-[#c9a962]/70 shrink-0 mt-0.5">•</span>
              <span>{String(item)}</span>
            </li>
          ))}
        </ul>
      )
    }
    return (
      <div className="space-y-3 mt-1">
        {value.map((item, i) => (
          <div key={i} className="bg-white/4 rounded-xl p-4 text-[15px] border border-white/6">
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
        <div className="space-y-1.5 text-[15px]">
          {entries.map(([k, v]) => (
            <div key={k}>
              <span className="text-cream/40">{k.replace(/_/g, ' ')}: </span>
              {renderValue(v, depth + 1)}
            </div>
          ))}
        </div>
      )
    }
    return (
      <div className="space-y-3 mt-1">
        {entries.map(([k, v]) => (
          <div key={k}>
            <div className="text-cream/50 text-xs font-semibold uppercase tracking-wide mb-1">
              {k.replace(/_/g, ' ')}
            </div>
            <div className="text-[15px]">{renderValue(v, depth + 1)}</div>
          </div>
        ))}
      </div>
    )
  }

  return <span className="text-cream/70">{String(value)}</span>
}

export function SectionCard({ title, data }: SectionCardProps) {
  const entries = Object.entries(data)

  return (
    <div className="bg-surface border border-white/10 rounded-2xl p-6">
      <h3 className="text-[#c9a962] text-base font-bold mb-5">
        {title}
      </h3>
      <div className="space-y-5">
        {entries.map(([key, value]) => (
          <div key={key}>
            <div className="text-cream/50 text-xs font-semibold uppercase tracking-wide mb-2">
              {key.replace(/_/g, ' ')}
            </div>
            <div>{renderValue(value)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
