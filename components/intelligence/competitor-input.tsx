'use client'

import { Plus, Trash2 } from 'lucide-react'

export interface CompetitorEntry {
  name: string
  url?: string
}

interface CompetitorInputProps {
  competitors: CompetitorEntry[]
  onChange(competitors: CompetitorEntry[]): void
  max?: number
}

export function CompetitorInput({ competitors, onChange, max = 5 }: CompetitorInputProps) {
  function add() {
    if (competitors.length < max) {
      onChange([...competitors, { name: '' }])
    }
  }

  function update(index: number, field: keyof CompetitorEntry, value: string) {
    const updated = competitors.map((c, i) =>
      i === index ? { ...c, [field]: value } : c
    )
    onChange(updated)
  }

  function remove(index: number) {
    onChange(competitors.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {competitors.map((competitor, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={competitor.name}
            onChange={e => update(i, 'name', e.target.value)}
            placeholder={`Competitor ${i + 1} name`}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-cream text-sm placeholder:text-cream/30 focus:outline-none focus:border-gold/40 transition-colors"
          />
          <input
            type="url"
            value={competitor.url ?? ''}
            onChange={e => update(i, 'url', e.target.value)}
            placeholder="Website (optional)"
            className="w-48 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-cream text-sm placeholder:text-cream/30 focus:outline-none focus:border-gold/40 transition-colors"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="w-8 h-8 flex items-center justify-center text-cream/30 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/5"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {competitors.length < max && (
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 text-sm text-cream/40 hover:text-cream transition-colors py-1"
        >
          <Plus size={14} />
          Add competitor
        </button>
      )}
    </div>
  )
}
