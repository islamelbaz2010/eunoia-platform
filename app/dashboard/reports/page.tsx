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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: failedRequests, error: failedError } = await (supabase as any)
    .from('research_requests')
    .select('id, module, input, error, created_at')
    .eq('user_id', user.id)
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(10)

  if (failedError) console.error('[reports] failed requests fetch error:', failedError.message)

  return (
    <ReportsClient
      reports={reports || []}
      failedRequests={failedRequests || []}
      userEmail={user.email || ''}
    />
  )
}
