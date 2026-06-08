import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Marketing Intelligence | Eunoia Zones',
}

export default async function MarketIntelligencePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 24px',
        background: '#fff',
        borderBottom: '1px solid #E8E2DA',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: '#4A1042',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 10, fontWeight: 900,
          }}>EZ</div>
          <span style={{ fontWeight: 600, color: '#4A1042', fontSize: 14 }}>
            Marketing Intelligence Engine
          </span>
        </div>
        <span style={{ fontSize: 12, color: '#9A9090' }}>{user.email}</span>
      </div>

      <iframe
        src="https://halannews.com/"
        style={{ flex: 1, width: '100%', border: 'none' }}
        title="Eunoia Marketing Intelligence"
        allow="clipboard-write; clipboard-read"
      />
    </div>
  )
}
