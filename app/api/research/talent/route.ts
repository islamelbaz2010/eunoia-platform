import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSector } from '@core/data/sectors.data'
import { getCity } from '@core/data/cities.data'
import { checkRateLimit, rateLimitMessage } from '@/lib/research/rate-limit'
import { buildCandidateSources, computeConfidence, COUNTRY_CURRENCY } from '@/lib/research/sources'

interface TalentFinderInput {
  jobTitle: string
  location: string
  industry: string
  experience: string
  skills: string
}

interface AIResponse {
  market_overview: string
  salary_min: number
  salary_max: number
  salary_period: 'month' | 'year'
  salary_notes: string
  hiring_demand_level: 'High' | 'Medium' | 'Low'
  hiring_demand_trend: string
  hiring_demand_notes: string
  suggested_keywords: string[]
  suggested_profiles: Array<{ archetype: string; background: string }>
}

function buildPrompt(input: TalentFinderInput, sectorLabel: string, cityLabel: string, currency: string): string {
  return `You are a talent acquisition / compensation research analyst.

Job title: ${input.jobTitle}
Location: ${cityLabel}
Industry: ${sectorLabel}
Experience level: ${input.experience}
Required skills: ${input.skills}

Rules:
- Estimate a realistic salary range for this role in this location, in ${currency}, based on general market knowledge. Be explicit this is an estimate, not a verified figure.
- Do not invent specific named candidates, emails, or phone numbers. "suggested_profiles" must describe candidate ARCHETYPES (background/profile pattern), not real individuals.
- hiring_demand_level must be exactly "High", "Medium", or "Low".

Respond with ONLY valid JSON, no markdown, in this exact shape:
{
  "market_overview": "2-3 sentences on this talent market",
  "salary_min": 0,
  "salary_max": 0,
  "salary_period": "month",
  "salary_notes": "1 sentence caveat on what drives variation",
  "hiring_demand_level": "Medium",
  "hiring_demand_trend": "1 short phrase, e.g. growing/stable/declining",
  "hiring_demand_notes": "1-2 sentences",
  "suggested_keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"],
  "suggested_profiles": [
    {"archetype": "profile pattern label", "background": "1-2 sentences on typical background/experience"}
  ]
}`
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => null) as Partial<TalentFinderInput> | null
    const jobTitle = body?.jobTitle?.trim()
    const location = body?.location?.trim()
    const industry = body?.industry?.trim()
    const experience = body?.experience?.trim()
    const skills = body?.skills?.trim()

    if (!jobTitle || !location || !industry || !experience || !skills) {
      return NextResponse.json({ error: 'jobTitle, location, industry, experience, and skills are required' }, { status: 400 })
    }

    const rate = await checkRateLimit(`ratelimit:research:talent:${user.id}`)
    if (!rate.ok) {
      return NextResponse.json({ error: rateLimitMessage(rate.resetIn), resetIn: rate.resetIn }, { status: 429 })
    }

    const sector = getSector(industry)
    const city = getCity(location)
    const currency = COUNTRY_CURRENCY[city.country] ?? 'USD'
    const input: TalentFinderInput = { jobTitle, location, industry, experience, skills }

    // `research_requests`/`reports` aren't in the generated Supabase types yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any
    const { data: reqRow } = await sb
      .from('research_requests')
      .insert({ user_id: user.id, module: 'talent_finder', status: 'submitted', input })
      .select('id')
      .single()
    const requestId = reqRow?.id as string | undefined

    if (requestId) await sb.from('research_requests').update({ status: 'processing' }).eq('id', requestId)

    let ai: AIResponse
    try {
      const { default: OpenAI } = await import('openai')
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 2500,
        temperature: 0.4,
        messages: [
          { role: 'system', content: 'You are a precise talent market research analyst. Always respond with ONLY valid JSON. Never use markdown code blocks. Start directly with { and end with }.' },
          { role: 'user', content: buildPrompt(input, sector.en, city.en, currency) },
        ],
      })
      const raw = completion.choices[0]?.message?.content ?? ''
      const cleaned = raw.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim()
      const start = cleaned.indexOf('{')
      const end = cleaned.lastIndexOf('}')
      ai = JSON.parse(start !== -1 ? cleaned.substring(start, end + 1) : cleaned) as AIResponse
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI generation failed'
      if (requestId) await sb.from('research_requests').update({ status: 'failed', error: message }).eq('id', requestId)
      return NextResponse.json({ error: message }, { status: 500 })
    }

    const salaryMin = Math.max(0, Math.round(ai.salary_min ?? 0))
    const salaryMaxRaw = Math.max(0, Math.round(ai.salary_max ?? 0))
    const salaryMax = Math.max(salaryMin, salaryMaxRaw)
    const candidate_sources = buildCandidateSources(city.country, jobTitle, city.en)

    const filled = [jobTitle, location, industry, experience, skills].filter(Boolean).length
    const confidence_score = computeConfidence(filled, 5, (ai.suggested_profiles ?? []).length)

    const reportData = {
      search_criteria: { job_title: jobTitle, location: city.en, industry: sector.en, experience, skills },
      executive_summary: ai.market_overview ?? '',
      market_overview: ai.market_overview ?? '',
      salary_range: {
        min: salaryMin,
        max: salaryMax,
        currency,
        period: ai.salary_period === 'year' ? 'year' : 'month',
        notes: ai.salary_notes ?? '',
      },
      hiring_demand: {
        level: ['High', 'Medium', 'Low'].includes(ai.hiring_demand_level) ? ai.hiring_demand_level : 'Medium',
        trend: ai.hiring_demand_trend ?? '',
        notes: ai.hiring_demand_notes ?? '',
      },
      candidate_sources,
      suggested_keywords: (ai.suggested_keywords ?? []).slice(0, 8),
      suggested_profiles: (ai.suggested_profiles ?? []).slice(0, 6),
      estimate_disclaimer: 'Salary range and demand level are AI-generated estimates from general market knowledge, not verified payroll data.',
      confidence_score,
    }

    const { data: reportRow, error: reportErr } = await sb
      .from('reports')
      .insert({
        user_id: user.id,
        report_type: 'talent_finder',
        company_name: `${jobTitle} talent — ${city.en}`,
        city: city.en,
        report_data: reportData,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (requestId) await sb.from('research_requests').update({ status: 'completed', result_report_id: reportRow?.id ?? null }).eq('id', requestId)
    if (reportErr) console.error('[research/talent] DB error:', reportErr.message)

    return NextResponse.json({ success: true, report: reportData })
  } catch (err) {
    console.error('[research/talent] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
