'use client'
import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
export function Shell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{display:'flex',height:'100vh',background:'#f8f6f1'}}>
      {open && <div onClick={() => setOpen(false)} style={{position:'fixed',inset:0,zIndex:40,background:'rgba(0,0,0,0.2)'}} className="lg:hidden" />}
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
        <Header title={title} subtitle={subtitle} onMenuClick={() => setOpen(o => !o)} />
        <main style={{flex:1,overflowY:'auto'}}>{children}</main>
      </div>
    </div>
  )
}
