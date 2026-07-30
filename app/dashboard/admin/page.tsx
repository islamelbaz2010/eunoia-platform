import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin/auth'
import { Shell } from '@/components/dashboard/shell'
import { AdminConsoleClient } from './admin-console-client'

export default async function AdminConsolePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!isAdminEmail(user?.email)) {
    redirect('/dashboard')
  }

  return (
    <Shell title="Admin Console" subtitle="User management and plan administration">
      <AdminConsoleClient />
    </Shell>
  )
}
