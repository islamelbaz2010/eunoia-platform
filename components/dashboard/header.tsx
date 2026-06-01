import { Bell, Menu } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  onMenuClick?: () => void
}

export function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  return (
    <header className="h-14 border-b border-white/8 flex items-center justify-between px-4 lg:px-6 bg-midnight/95 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          className="lg:hidden w-8 h-8 rounded-lg text-cream/40 hover:text-cream hover:bg-white/5 flex items-center justify-center transition-colors"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-cream font-semibold text-base leading-tight">{title}</h1>
          {subtitle && <p className="text-cream/40 text-xs">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
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
