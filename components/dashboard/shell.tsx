'use client'
import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'

export function Shell({ children, title, subtitle }: {
  children: React.ReactNode
  title: string
  subtitle?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex h-screen bg-background">
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
        />
      )}
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header title={title} subtitle={subtitle} onMenuClick={() => setOpen(o => !o)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
