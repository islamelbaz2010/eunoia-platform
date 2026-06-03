'use client'
import { useState } from 'react'

interface ChecklistItem {
  item: string
  status: boolean
}

interface AuditChecklistProps {
  items: ChecklistItem[]
}

export function AuditChecklist({ items }: AuditChecklistProps) {
  const [checked, setChecked] = useState<boolean[]>(items.map(i => i.status))
  const done = checked.filter(Boolean).length
  const pct = Math.round((done / items.length) * 100)

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-lg">✅</span>
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{color:'var(--gold)'}}>Launch Checklist</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">{done}/{items.length}</div>
          <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:'var(--gold)'}} />
          </div>
          <div className="text-xs font-bold" style={{color:'var(--gold)'}}>{pct}%</div>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setChecked(prev => { const n = [...prev]; n[i] = !n[i]; return n })}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:bg-muted/40"
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              checked[i] ? 'border-emerald-500 bg-emerald-500' : 'border-border'
            }`}>
              {checked[i] && <span className="text-white text-xs">✓</span>}
            </div>
            <span className={`text-sm leading-snug transition-colors ${
              checked[i] ? 'line-through text-muted-foreground' : 'text-foreground/80'
            }`}>
              {item.item}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
