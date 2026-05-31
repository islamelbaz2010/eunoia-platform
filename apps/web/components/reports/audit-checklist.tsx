'use client'

import { useState } from 'react'
import { CheckSquare, Square } from 'lucide-react'

interface ChecklistItem {
  item: string
  status: boolean
}

interface AuditChecklistProps {
  items: ChecklistItem[]
}

export function AuditChecklist({ items }: AuditChecklistProps) {
  const [checked, setChecked] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(items.map((it, i) => [i, it.status]))
  )

  const doneCount = Object.values(checked).filter(Boolean).length

  function toggle(i: number) {
    setChecked(prev => ({ ...prev, [i]: !prev[i] }))
  }

  return (
    <div className="bg-surface border border-white/8 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-cream/60 text-xs font-semibold uppercase tracking-wider">
          Audit Checklist
        </h3>
        <span className="text-xs text-cream/40">
          {doneCount}/{items.length} done
        </span>
      </div>

      <div className="mb-3">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all"
            style={{ width: `${(doneCount / items.length) * 100}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            onClick={() => toggle(i)}
            className="flex items-start gap-3 cursor-pointer group"
          >
            {checked[i] ? (
              <CheckSquare size={16} className="text-gold shrink-0 mt-0.5" />
            ) : (
              <Square size={16} className="text-cream/20 group-hover:text-cream/40 shrink-0 mt-0.5 transition-colors" />
            )}
            <span className={`text-sm transition-colors ${checked[i] ? 'text-cream/40 line-through' : 'text-cream/70'}`}>
              {item.item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
