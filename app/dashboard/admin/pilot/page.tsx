import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin/auth'
import { Shell } from '@/components/dashboard/shell'
import { PilotDashboardClient } from './pilot-dashboard-client'

export const metadata = { title: 'Pilot Operations | Eunoia Admin' }

export default async function PilotDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdminEmail(user?.email)) redirect('/dashboard')

  return (
    <Shell title="Pilot Operations" subtitle="Controlled pilot — 20-submission validation">
      <PilotDashboardClient />
    </Shell>
  )
}
