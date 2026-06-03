'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Brain, FileText, Settings, TrendingUp, LogOut, X, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
const NAV = [
  { href:'/dashboard', label:'Dashboard', icon:BarChart3, exact:true },
  { href:'/dashboard/intelligence', label:'New Report', icon:Brain },
  { href:'/dashboard/reports', label:'Reports', icon:FileText },
  { href:'/dashboard/analytics', label:'Analytics', icon:TrendingUp },
  { href:'/dashboard/settings', label:'Settings', icon:Settings },
]
const RE = [
  { type:'REAL_ESTATE_LAUNCH', label:'Launch Strategy' },
  { type:'REAL_ESTATE_LEADS', label:'Lead Gen Intel' },
  { type:'REAL_ESTATE_FEASIBILITY', label:'Feasibility' },
]
export function Sidebar({ open=false, onClose }: { open?:boolean; onClose?:()=>void }) {
  const pathname = usePathname()
  const router = useRouter()
  const showExh = new Date() < new Date('2026-06-06T00:00:00')
  async function handleSignOut() { const s=createClient(); await s.auth.signOut(); router.push('/login'); router.refresh() }
  return (
    <aside style={{position:'fixed',top:0,bottom:0,left:0,zIndex:50,width:256,display:'flex',flexDirection:'column',background:'#fff',borderRight:'1px solid #e8e0d4',transition:'transform 0.3s ease',transform:open?'translateX(0)':undefined}} className={`lg:relative lg:translate-x-0 ${open?'translate-x-0':'-translate-x-full lg:translate-x-0'}`}>
      <div style={{padding:'20px 20px 16px',borderBottom:'1px solid #e8e0d4',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Link href="/dashboard" onClick={onClose} style={{textDecoration:'none'}}>
          <div style={{fontFamily:'monospace',fontSize:11,letterSpacing:'0.28em',textTransform:'uppercase',fontWeight:700,color:'#b8922a'}}>EUNOIA</div>
          <div style={{height:1,background:'linear-gradient(90deg,#b8922a,#d4aa45,transparent)',margin:'4px 0'}} />
          <div style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',color:'#9e8e7e'}}>Intelligence Platform</div>
        </Link>
        <button className="lg:hidden" onClick={onClose} style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',color:'#9e8e7e',border:'none',background:'transparent',cursor:'pointer',borderRadius:8}}><X size={15} /></button>
      </div>
      <nav style={{flex:1,padding:'12px 10px',overflowY:'auto'}}>
        <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:2}}>
          {NAV.map(({ href, label, icon:Icon, exact }) => {
            const active = exact ? pathname===href : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link href={href} onClick={onClose} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:10,fontSize:13,fontWeight:500,textDecoration:'none',color:active?'#b8922a':'#6b5e4e',background:active?'#fdf8ee':'transparent',borderLeft:active?'2px solid #b8922a':'2px solid transparent',transition:'all 0.15s'}}>
                  <Icon size={15} />{label}
                </Link>
              </li>
            )
          })}
        </ul>
        <div style={{marginTop:20}}>
          <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.15em',color:'#c4b49a',fontWeight:600,padding:'0 12px',marginBottom:6}}>Real Estate</div>
          <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:2}}>
            {RE.map(({ type, label }) => (
              <li key={type}>
                <Link href={`/dashboard/intelligence?type=${type}`} onClick={onClose} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 12px',borderRadius:8,fontSize:12,color:'#9e8e7e',textDecoration:'none',transition:'all 0.15s'}}>
                  <Building2 size={12} />{label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      {showExh && (
        <div style={{margin:'0 10px 10px',borderRadius:12,border:'1px solid #e8d48a',background:'#fdf8ee',padding:12}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',background:'#b8922a',color:'#fff',padding:'2px 8px',borderRadius:99}}>LIVE</span>
            <span style={{fontSize:10,color:'#9e8e7e'}}>Jun 5, 2026</span>
          </div>
          <p style={{fontSize:11,color:'#6b5e4e',lineHeight:1.5}}>Real Estate Developer Exhibition</p>
          <Link href="/dashboard/intelligence?type=OPPORTUNITY_SCORING" onClick={onClose} style={{display:'block',marginTop:8,fontSize:11,fontWeight:700,color:'#b8922a',textDecoration:'none',textAlign:'center'}}>Run demo →</Link>
        </div>
      )}
      <div style={{borderTop:'1px solid #e8e0d4',padding:'10px 10px 12px'}}>
        <button onClick={handleSignOut} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',width:'100%',borderRadius:10,fontSize:13,fontWeight:500,color:'#9e8e7e',background:'transparent',border:'none',cursor:'pointer'}}>
          <LogOut size={15} />Sign out
        </button>
      </div>
    </aside>
  )
}
