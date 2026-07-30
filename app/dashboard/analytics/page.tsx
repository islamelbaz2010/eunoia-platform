import { createClient } from '@/lib/supabase/server'
import { AnalyticsClient, type UserStats } from './analytics-client'

export default async function MarketIntelligencePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let stats: UserStats | null = null

  if (user) {
    const som = new Date()
    som.setDate(1); som.setHours(0, 0, 0, 0)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const [{ data: allRows }, { data: monthRows }, { data: reportRows }] = await Promise.all([
      sb.from('research_requests').select('module').eq('user_id', user.id),
      sb.from('research_requests').select('id').eq('user_id', user.id).gte('created_at', som.toISOString()),
      sb.from('reports').select('city').eq('user_id', user.id),
    ])

    const moduleCounts: Record<string, number> = {}
    for (const row of allRows ?? []) {
      moduleCounts[row.module] = (moduleCounts[row.module] ?? 0) + 1
    }

    const cityMap: Record<string, number> = {}
    for (const row of reportRows ?? []) {
      if (row.city) cityMap[row.city] = (cityMap[row.city] ?? 0) + 1
    }
    const topCities = Object.entries(cityMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([city, count]) => ({ city, count }))

    stats = {
      totalResearch: (allRows ?? []).length,
      thisMonth: (monthRows ?? []).length,
      moduleCounts,
      topCities,
    }
  }

  return <AnalyticsClient stats={stats} />
}
