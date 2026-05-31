import { Bell, Search } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-14 border-b border-white/8 flex items-center justify-between px-6 bg-midnight/95 backdrop-blur sticky top-0 z-10">
      <div>
        <h1 className="text-cream font-semibold text-base leading-tight">{title}</h1>
        {subtitle && <p className="text-cream/40 text-xs">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <button
          aria-label="Search"
          className="w-8 h-8 rounded-lg text-cream/40 hover:text-cream hover:bg-white/5 flex items-center justify-center transition-colors"
        >
          <Search size={16} />
        </button>
        <button
          aria-label="Notifications"
          className="w-8 h-8 rounded-lg text-cream/40 hover:text-cream hover:bg-white/5 flex items-center justify-center transition-colors relative"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-gold" />
        </button>
      </div>
    </header>
  )
}
