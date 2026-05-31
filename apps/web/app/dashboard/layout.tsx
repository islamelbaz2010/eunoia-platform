import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if Prisma user exists; if not, redirect to onboarding
  try {
    const dbUser = await prisma.user.findUnique({ where: { email: user.email ?? '' } })
    if (!dbUser && user.email) {
      redirect('/dashboard/onboarding')
    }
  } catch {
    // DB not connected in dev — allow through
  }

  return <>{children}</>
}
