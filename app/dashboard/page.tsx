import { Shell } from '@/components/dashboard/shell'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { Brain, FileText, TrendingUp, Clock, ArrowRight, Building2, Calendar, Zap, Target, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { REPORT_TYPE_LABELS } from '@services/ai-engine/prompt-builder'
const EXHIBITION = new Date('2026-06-05T09:00:00')
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const firstName = user?.email?.split('@')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })
  const daysUntil = Math.ceil((EXHIBITION.getTime() - Date.now()) / 86400000)
  const showBanner = daysUntil > 0 && daysUntil <= 7
  let totalReports=0, thisMonth=0
  let lastDate: Date|null=null, topType: string|null=null
  let recent: Array<{id:string;type:string;status:string;createdAt:Date;input:unknown}>=[]
  try {
    const dbUser = await prisma.user.findUnique({ where:{email:user?.email??''}, select:{workspaceId:true} })
    if (dbUser) {
      const wid=dbUser.workspaceId
      const som=new Date(); som.setDate(1); som.setHours(0,0,0,0)
      const [t,m,l,tg,r] = await prisma.$transaction([
        prisma.report.count({where:{workspaceId:wid}}),
        prisma.report.count({where:{workspaceId:wid,createdAt:{gte:som}}}),
        prisma.report.findFirst({where:{workspaceId:wid,status:'COMPLETED'},orderBy:{createdAt:'desc'},select:{createdAt:true}}),
        prisma.report.groupBy({by:['type'],where:{workspaceId:wid},_count:{type:true},orderBy:{_count:{type:'desc'}},take:1}),
        prisma.report.findMany({where:{workspaceId:wid},orderBy:{createdAt:'desc'},take:5,select:{id:true,type:true,status:true,createdAt:true,input:true}}),
      ])
      totalReports=t; thisMonth=m; lastDate=l?.createdAt??null; topType=tg[0]?.type??null; recent=r
    }
  } catch {}
  const lastLabel = lastDate ? lastDate.toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '—'
  const topLabel = topType ? (REPORT_TYPE_LABELS[topType as keyof typeof REPORT_TYPE_LABELS]?.en ?? topType) : '—'
  const STATS = [
    { label:'Total Reports', value:totalReports, icon:FileText, accent:'#b8922a' },
    { label:'This Month', value:thisMonth, icon:TrendingUp, accent:'#16a34a' },
    { label:'Last Report', value:lastLabel, icon:Clock, accent:'#2563eb' },
    { label:'Top Type', value:topLabel, icon:Brain, accent:'#7c3aed' },
  ]
  const RE = [
    { type:'REAL_ESTATE_LAUNCH', icon:Zap, label:'Launch Strategy', labelAr:'استراتيجية الإطلاق' },
    { type:'REAL_ESTATE_LEADS', icon:Target, label:'Lead Gen Intel', labelAr:'تحليل العملاء' },
    { type:'REAL_ESTATE_FEASIBILITY', icon:BarChart3, label:'Feasibility', labelAr:'دراسة الجدوى' },
  ]
  return (
    <Shell title="Dashboard" subtitle={`${greeting}, ${firstName}`}>
      <div style={{padding:24,display:'flex',flexDirection:'column',gap:24,maxWidth:1100,margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16}}>
          <div>
            <h2 style={{fontSize:26,fontWeight:700,color:'#1a1612',lineHeight:1.2}}>
              {greeting},{' '}
              <span style={{background:'linear-gradient(135deg,#b8922a,#d4aa45)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>{firstName}</span>
            </h2>
            <p style={{fontSize:13,color:'#9e8e7e',marginTop:4}}>{today}</p>
          </div>
          <Link href="/dashboard/intelligence" style={{display:'flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#b8922a,#d4aa45)',color:'#fff',fontSize:13,fontWeight:700,padding:'10px 18px',borderRadius:12,textDecoration:'none',whiteSpace:'nowrap',flexShrink:0}}>
            <Brain size={15} />Generate Report
          </Link>
        </div>
        {showBanner && (
          <div style={{borderRadius:14,border:'1px solid #e8d48a',background:'#fdf8ee',padding:'14px 18px',display:'flex',alignItems:'center',gap:16}}>
            <div style={{width:40,height:40,borderRadius:10,background:'rgba(184,146,42,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Calendar size={18} color="#b8922a" /></div>
            <div style={{flex:1}}>
              <p style={{fontSize:14,fontWeight:600,color:'#1a1612'}}>🏢 Real Estate Exhibition — {daysUntil} day{daysUntil!==1?'s':''} to go</p>
              <p style={{fontSize:12,color:'#9e8e7e',marginTop:2}}>Prepare your demo reports before June 5.</p>
            </div>
            <Link href="/dashboard/intelligence?type=OPPORTUNITY_SCORING" style={{fontSize:12,fontWeight:700,color:'#b8922a',textDecoration:'none',whiteSpace:'nowrap'}}>Run demo →</Link>
          </div>
        )}
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
          {STATS.map(({ label, value, icon:Icon, accent }) => (
            <div key={label} className="card" style={{padding:'18px 20px'}}>
              <div style={{width:36,height:36,borderRadius:10,background:`${accent}14`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12}}><Icon size={17} color={accent} /></div>
              <div style={{fontSize:22,fontWeight:700,color:'#1a1612',lineHeight:1}}>{value}</div>
              <div style={{fontSize:11,color:'#9e8e7e',marginTop:4}}>{label}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}><Building2 size={13} color="#b8922a" /><span style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.12em',color:'#9e8e7e',fontWeight:600}}>Real Estate Reports</span></div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
            {RE.map(({ type, icon:Icon, label, labelAr }) => (
              <Link key={type} href={`/dashboard/intelligence?type=${type}`} className="card" style={{padding:14,textDecoration:'none',display:'block'}}>
                <Icon size={15} color="#b8922a" style={{marginBottom:8}} />
                <div style={{fontSize:13,fontWeight:600,color:'#1a1612',marginBottom:2}}>{label}</div>
                <div style={{fontSize:10,color:'#9e8e7e'}}>{labelAr}</div>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.12em',color:'#9e8e7e',fontWeight:600,marginBottom:10}}>All Report Types</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
            {(Object.keys(REPORT_TYPE_LABELS) as Array<keyof typeof REPORT_TYPE_LABELS>).filter(t=>!['REAL_ESTATE_LAUNCH','REAL_ESTATE_LEADS','REAL_ESTATE_FEASIBILITY'].includes(t)).map(type => (
              <Link key={type} href={`/dashboard/intelligence?type=${type}`} className="card" style={{padding:'11px 14px',textDecoration:'none',display:'block'}}>
                <div style={{fontSize:12,fontWeight:500,color:'#6b5e4e'}}>{REPORT_TYPE_LABELS[type].en}</div>
                <div style={{fontSize:10,color:'#9e8e7e',marginTop:2}}>{REPORT_TYPE_LABELS[type].ar}</div>
              </Link>
            ))}
          </div>
        </div>
        {recent.length > 0 ? (
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <span style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.12em',color:'#9e8e7e',fontWeight:600}}>Recent Reports</span>
              <Link href="/dashboard/reports" style={{fontSize:12,color:'#b8922a',textDecoration:'none',display:'flex',alignItems:'center',gap:4}}>View all <ArrowRight size={11} /></Link>
            </div>
            <div style={{background:'#fff',border:'1px solid #e8e0d4',borderRadius:14,overflow:'hidden'}}>
              {recent.map((rep,i) => {
                const inp = rep.input as { companyName?:string }
                const lbl = REPORT_TYPE_LABELS[rep.type as keyof typeof REPORT_TYPE_LABELS]
                const dot = rep.status==='COMPLETED'?'#16a34a':rep.status==='FAILED'?'#dc2626':'#2563eb'
                return (
                  <Link key={rep.id} href={`/dashboard/reports/${rep.id}`} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 18px',textDecoration:'none',borderBottom:i<recent.length-1?'1px solid #e8e0d4':'none'}}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:dot,flexShrink:0}} />
                      <div>
                        <div style={{fontSize:13,fontWeight:500,color:'#1a1612'}}>{inp?.companyName??'Untitled'}</div>
                        <div style={{fontSize:11,color:'#9e8e7e'}}>{lbl?.en??rep.type}</div>
                      </div>
                    </div>
                    <ArrowRight size={13} color="#9e8e7e" />
                  </Link>
                )
              })}
            </div>
          </div>
        ) : (
          <div style={{background:'#fff',border:'1px solid #e8e0d4',borderRadius:16,padding:40,textAlign:'center'}}>
            <div style={{fontSize:44,marginBottom:12}}>📊</div>
            <h3 style={{fontSize:16,fontWeight:600,color:'#1a1612',marginBottom:6}}>No reports yet</h3>
            <p style={{fontSize:13,color:'#9e8e7e',marginBottom:20}}>Generate your first AI marketing intelligence report</p>
            <Link href="/dashboard/intelligence" style={{display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#b8922a,#d4aa45)',color:'#fff',fontSize:13,fontWeight:700,padding:'11px 22px',borderRadius:12,textDecoration:'none'}}>
              <Brain size={15} />Generate Report
            </Link>
          </div>
        )}
      </div>
    </Shell>
  )
}
