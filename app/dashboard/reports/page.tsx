import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportsClient from './reports-client'

export const metadata = {
  title: 'Report History | Eunoia Intelligence',
}

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: reports, error } = await supabase
    .from('reports')
    .select('id, report_type, company_name, city, created_at, report_data')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) console.error('[reports] fetch error:', error.message)

  return <ReportsClient reports={reports || []} userEmail={user.email || ''} />
}
