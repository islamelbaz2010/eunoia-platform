'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { ALL_CITIES, COUNTRY_LABELS } from '@core/data/cities.data'
import type { CityData, CountryKey } from '@core/data/cities.data'

interface CitySelectorProps {
  value: string
  onChange(key: string): void
  language?: 'ar' | 'en'
}

export function CitySelector({ value, onChange, language = 'en' }: CitySelectorProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const filtered: CityData[] = query.trim()
    ? ALL_CITIES.filter(c =>
        c.en.toLowerCase().includes(query.toLowerCase()) ||
        c.ar.includes(query) ||
        c.country.toLowerCase().includes(query.toLowerCase())
      )
    : ALL_CITIES

  // Group by country when not filtering
  const grouped = query.trim()
    ? null
    : filtered.reduce<Record<string, CityData[]>>((acc, city) => {
        if (!acc[city.country]) acc[city.country] = []
        acc[city.country].push(city)
        return acc
      }, {})

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedCity = value ? ALL_CITIES.find(c => c.key === value) : null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-left flex items-center justify-between focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-colors"
      >
        <span className={selectedCity ? 'text-foreground' : 'text-muted-foreground'}>
          {selectedCity
            ? `${language === 'ar' ? selectedCity.ar : selectedCity.en}`
            : 'Select city…'}
        </span>
        <ChevronDown size={16} className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1.5 w-full bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <Search size={14} className="text-muted-foreground shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search cities…"
                className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground outline-none"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {query.trim() ? (
              filtered.length === 0 ? (
                <div className="px-4 py-3 text-muted-foreground text-sm">No results</div>
              ) : (
                filtered.map(city => (
                  <button
                    key={city.key}
                    type="button"
                    onClick={() => { onChange(city.key); setOpen(false); setQuery('') }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors flex items-center justify-between ${
                      value === city.key ? 'bg-gold/10 text-foreground font-semibold' : 'text-foreground'
                    }`}
                  >
                    <span>{language === 'ar' ? city.ar : city.en}</span>
                    <span className="text-muted-foreground text-xs">{COUNTRY_LABELS[city.country as CountryKey]?.en ?? city.country}</span>
                  </button>
                ))
              )
            ) : grouped ? (
              Object.entries(grouped).map(([country, cities]) => (
                <div key={country}>
                  <div className="px-4 py-1.5 text-muted-foreground text-xs font-semibold uppercase tracking-wider bg-muted/30">
                    {COUNTRY_LABELS[country as CountryKey]?.en ?? country}
                  </div>
                  {cities.map(city => (
                    <button
                      key={city.key}
                      type="button"
                      onClick={() => { onChange(city.key); setOpen(false) }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors ${
                        value === city.key ? 'bg-gold/10 text-foreground font-semibold' : 'text-foreground'
                      }`}
                    >
                      {language === 'ar' ? city.ar : city.en}
                    </button>
                  ))}
                </div>
              ))
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
