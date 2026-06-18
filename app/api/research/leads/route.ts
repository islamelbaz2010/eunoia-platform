import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSector } from '@core/data/sectors.data'
import { getCity } from '@core/data/cities.data'
import { checkRateLimit, rateLimitMessage } from '@/lib/research/rate-limit'
import { linkedInCompanySearchUrl, linkedInPeopleSearchUrl, computeConfidence } from '@/lib/research/sources'

interface LeadFinderInput {
  industry: string
  location: string
  companySize: string
  titles: string
}

interface AICompany {
  name: string
  description?: string
  why_fit?: string
  estimated_size?: string
  public_sources?: string[]
  decision_maker_titles?: string[]
  lead_score?: number
}

interface AIResponse {
  executive_summary: string
  research_summary: string
  companies: AICompany[]
}

function buildPrompt(input: LeadFinderInput, sectorLabel: string, cityLabel: string): string {
  return `You are a B2B sales research analyst. Based on general industry knowledge, identify target companies for a B2B lead generation campaign.

Industry: ${sectorLabel}
Location: ${cityLabel}
Target company size: ${input.companySize}
Decision maker titles to target: ${input.titles}

Rules:
- Only name real, specific companies if you have genuine knowledge of them operating in this industry/location. Otherwise describe a realistic company ARCHETYPE (e.g. "mid-size logistics provider in [location] with 50-200 employees") instead of inventing a fake company name.
- Never invent or guess specific contact names, emails, phone numbers, or LinkedIn profile URLs — leave those out entirely. The platform constructs search links separately from company/title names.
- For each company/archetype, list any publicly knowable signals (industry segment, approximate size, why it fits) as "public_sources" — general signals, not fabricated URLs.
- lead_score is your 0-100 estimate of how well this target matches the brief.
- Return 6-10 companies/archetypes.

Respond with ONLY valid JSON, no markdown, in this exact shape:
{
  "executive_summary": "2-3 sentence overview of this market segment",
  "research_summary": "1 paragraph on where/how to find these companies and what messaging angle would work",
  "companies": [
    {
      "name": "company name or archetype label",
      "description": "1-2 sentences",
      "why_fit": "why this matches the brief",
      "estimated_size": "e.g. 50-200 employees",
      "public_sources": ["signal 1", "signal 2"],
      "decision_maker_titles": ["title 1", "title 2"],
      "lead_score": 75
    }
  ]
}`
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => null) as Partial<LeadFinderInput> | null
    const industry = body?.industry?.trim()
    const location = body?.location?.trim()
    const companySize = body?.companySize?.trim()
    const titles = body?.titles?.trim()

    if (!industry || !location || !companySize || !titles) {
      return NextResponse.json({ error: 'industry, location, companySize, and titles are required' }, { status: 400 })
    }

    const rate = await checkRateLimit(`ratelimit:research:leads:${user.id}`)
    if (!rate.ok) {
      return NextResponse.json({ error: rateLimitMessage(rate.resetIn), resetIn: rate.resetIn }, { status: 429 })
    }

    const sector = getSector(industry)
    const city = getCity(location)
    const input: LeadFinderInput = { industry, location, companySize, titles }

    // `research_requests`/`reports` aren't in the generated Supabase types yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any
    const { data: reqRow } = await sb
      .from('research_requests')
      .insert({ user_id: user.id, module: 'lead_finder', status: 'submitted', input })
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
        max_tokens: 3000,
        temperature: 0.4,
        messages: [
          { role: 'system', content: 'You are a precise B2B research analyst. Always respond with ONLY valid JSON. Never use markdown code blocks. Start directly with { and end with }.' },
          { role: 'user', content: buildPrompt(input, sector.en, city.en) },
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

    const companies = (ai.companies ?? []).slice(0, 10).map(c => ({
      name: c.name,
      description: c.description ?? '',
      why_fit: c.why_fit ?? '',
      estimated_size: c.estimated_size ?? '',
      public_sources: c.public_sources ?? [],
      lead_score: Math.max(0, Math.min(100, Math.round(c.lead_score ?? 50))),
      linkedin_company_search_url: linkedInCompanySearchUrl(c.name),
      decision_makers: (c.decision_maker_titles ?? []).slice(0, 3).map(title => ({
        title,
        linkedin_search_url: linkedInPeopleSearchUrl(`${title} ${c.name}`),
      })),
    }))

    const filled = [industry, location, companySize, titles].filter(Boolean).length
    const confidence_score = computeConfidence(filled, 4, companies.length)

    const reportData = {
      search_criteria: { industry: sector.en, location: city.en, company_size: companySize, titles },
      executive_summary: ai.executive_summary ?? '',
      research_summary: ai.research_summary ?? '',
      companies,
      outreach_disclaimer: 'This is AI-generated research, not a verified contact database. Confirm company details and identify the right contact on LinkedIn before any outreach.',
      confidence_score,
    }

    const { data: reportRow, error: reportErr } = await sb
      .from('reports')
      .insert({
        user_id: user.id,
        report_type: 'lead_finder',
        company_name: `${sector.en} leads — ${city.en}`,
        city: city.en,
        report_data: reportData,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (requestId) await sb.from('research_requests').update({ status: 'completed', result_report_id: reportRow?.id ?? null }).eq('id', requestId)
    if (reportErr) console.error('[research/leads] DB error:', reportErr.message)

    return NextResponse.json({ success: true, report: reportData })
  } catch (err) {
    console.error('[research/leads] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
