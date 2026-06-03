'use client'
import { useState, useEffect } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'

export function Shell({ children, title, subtitle }: {
  children: React.ReactNode; title: string; subtitle?: string
}) {
  const [open, setOpen] = useState(true)

  // Default closed on mobile, open on desktop
  useEffect(() => {
    setOpen(window.innerWidth >= 1024)
  }, [])

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Overlay for mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar — slides in/out */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
        transition-all duration-300 ease-in-out flex-shrink-0
        ${open ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'}
      `}>
        <Sidebar open={open} onClose={() => setOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setOpen(o => !o)}
          sidebarOpen={open}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
