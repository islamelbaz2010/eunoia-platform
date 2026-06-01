'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { SECTORS } from '@core/data/sectors.data'
import type { SectorKey } from '@core/data/sectors.data'

interface SectorSelectorProps {
  value: string
  onChange(key: SectorKey): void
  language?: 'ar' | 'en'
}

export function SectorSelector({ value, onChange, language = 'en' }: SectorSelectorProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const entries = Object.entries(SECTORS) as Array<[SectorKey, (typeof SECTORS)[SectorKey]]>

  const filtered = query.trim()
    ? entries.filter(([, s]) =>
        s.en.toLowerCase().includes(query.toLowerCase()) ||
        s.ar.includes(query)
      )
    : entries

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedSector = value ? SECTORS[value as SectorKey] : null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-left flex items-center justify-between focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-colors"
      >
        <span className={selectedSector ? 'text-cream' : 'text-cream/30'}>
          {selectedSector
            ? language === 'ar' ? selectedSector.ar : selectedSector.en
            : 'Select sector…'}
        </span>
        <ChevronDown size={16} className={`text-cream/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1.5 w-full bg-[#1a2030] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-white/8">
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
              <Search size={14} className="text-cream/30 shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search sectors…"
                className="flex-1 bg-transparent text-cream text-sm placeholder:text-cream/30 outline-none"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-cream/30 text-sm">No results</div>
            ) : (
              filtered.map(([key, sector]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { onChange(key); setOpen(false); setQuery('') }}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center justify-between ${
                    value === key ? 'text-gold' : 'text-cream/70'
                  }`}
                >
                  <span>{language === 'ar' ? sector.ar : sector.en}</span>
                  {language === 'en' && <span className="text-cream/30 text-xs">{sector.ar}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
