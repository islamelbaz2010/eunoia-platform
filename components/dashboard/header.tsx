'use client'
import Link from 'next/link'
import { Menu, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
export function Header({ title, subtitle, onMenuClick }: { title: string; subtitle?: string; onMenuClick?: () => void }) {
  const [email, setEmail] = useState<string | null>(null)
  useEffect(() => { createClient().auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null)) }, [])
  const initials = email ? email.charAt(0).toUpperCase() : '?'
  return (
    <header style={{height:56,borderBottom:'1px solid #e8e0d4',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',background:'rgba(248,246,241,0.95)',backdropFilter:'blur(12px)',position:'sticky',top:0,zIndex:10}}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <button onClick={onMenuClick} className="lg:hidden" style={{width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',color:'#9e8e7e',border:'none',background:'transparent',cursor:'pointer',borderRadius:8}}><Menu size={18} /></button>
        <div>
          <h1 style={{fontSize:14,fontWeight:600,color:'#1a1612',lineHeight:1.2}}>{title}</h1>
          {subtitle && <p style={{fontSize:11,color:'#9e8e7e'}}>{subtitle}</p>}
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <Link href="/dashboard/intelligence" style={{display:'flex',alignItems:'center',gap:6,background:'linear-gradient(135deg,#b8922a,#d4aa45)',color:'#fff',fontSize:12,fontWeight:700,padding:'7px 14px',borderRadius:10,textDecoration:'none'}}>
          <Plus size={13} strokeWidth={2.5} />New Report
        </Link>
        <div style={{width:34,height:34,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,background:'linear-gradient(135deg,#b8922a,#d4aa45)',color:'#fff',cursor:'default'}}>{initials}</div>
      </div>
    </header>
  )
}
