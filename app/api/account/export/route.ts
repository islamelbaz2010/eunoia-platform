import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const [
    { data: reports },
    { data: research },
    { data: planRow },
  ] = await Promise.all([
    sb.from('reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    sb.from('research_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    sb.from('user_plans').select('*').eq('user_id', user.id).maybeSingle(),
  ])

  const payload = {
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    plan: planRow ?? { plan: 'STARTER' },
    reports: reports ?? [],
    research_requests: research ?? [],
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="eunoia-data-export-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}
