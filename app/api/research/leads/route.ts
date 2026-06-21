import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SECTORS, getSector } from '@core/data/sectors.data'
import { getCity } from '@core/data/cities.data'
import { checkRateLimit, rateLimitMessage } from '@/lib/research/rate-limit'
import { checkPlanLimit } from '@/lib/research/plan-enforcement'
import { PLAN_LABELS } from '@/types/plan.types'
import { linkedInCompanySearchUrl, linkedInPeopleSearchUrl } from '@/lib/research/sources'
import { companySizeQueryModifier } from '@/lib/research/company-size'
import { recommendDecisionMakerTitles } from '@/lib/research/decision-makers'
import { getResearchService, SearchProviderError, type ResearchResultItem } from '@/lib/research/acquisition'

interface LeadFinderInput {
  industry: string
  location: string
  companySize: string
  titles: string
}

/**
 * Falls back to the raw user-typed industry when it isn't a curated SECTORS
 * key (e.g. "Call Center"), so the search query stays specific instead of
 * degrading to the generic "Other" label. Also biases the query toward the
 * requested size bracket's terminology (e.g. "mid-size company") — a
 * relevance signal, not a guarantee every result matches that size.
 */
function buildLeadQuery(industry: string, sectorLabel: string, cityLabel: string, companySize: string): string {
  const industryTerm = sectorLabel === SECTORS.other.en ? industry : sectorLabel
  const sizeModifier = companySizeQueryModifier(companySize)
  const sizedIndustryTerm = sizeModifier ? `${sizeModifier} ${industryTerm}` : industryTerm
  return `${sizedIndustryTerm} companies in ${cityLabel}`
}

function aggregateConfidence(items: ResearchResultItem[]): { pct: number; label: 'High' | 'Medium' | 'Low'; reason: string } {
  if (items.length === 0) {
    return { pct: 0, label: 'Low', reason: 'No real sources were found for this search — nothing is shown rather than inventing a result.' }
  }
  const pct = Math.round(items.reduce((sum, i) => sum + i.confidenceScore, 0) / items.length)
  const label = pct >= 70 ? 'High' : pct >= 40 ? 'Medium' : 'Low'
  return { pct, label, reason: 'Evidence-based score from the Research Core Engine — derived from source type and taxonomy match, not AI-estimated.' }
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

    // `research_requests`/`reports`/`user_plans` aren't in the generated Supabase types yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const planCheck = await checkPlanLimit(sb, user.id)
    if (!planCheck.ok) {
      return NextResponse.json(
        {
          error: `Monthly plan limit reached (${planCheck.used}/${planCheck.limit} reports used this month on the ${PLAN_LABELS[planCheck.plan]} plan). Upgrade your plan to continue.`,
          used: planCheck.used,
          limit: planCheck.limit,
          plan: planCheck.plan,
        },
        { status: 403 }
      )
    }

    const sector = getSector(industry)
    const city = getCity(location)
    const input: LeadFinderInput = { industry, location, companySize, titles }

    const { data: reqRow } = await sb
      .from('research_requests')
      .insert({ user_id: user.id, module: 'lead_finder', status: 'submitted', input, credits_used: 1 })
      .select('id')
      .single()
    const requestId = reqRow?.id as string | undefined

    if (requestId) await sb.from('research_requests').update({ status: 'processing' }).eq('id', requestId)

    const query = buildLeadQuery(industry, sector.en, city.en, companySize)

    let result
    try {
      result = await getResearchService().run({
        query,
        sectorHint: sector === SECTORS.other ? undefined : industry,
        cityHint: city.key,
        companySizeHint: companySize,
        maxResults: 10,
        userId: user.id,
      })
    } catch (err) {
      const message = err instanceof SearchProviderError
        ? `Search provider error: ${err.message}`
        : (err instanceof Error ? err.message : 'Research engine failed')
      if (requestId) await sb.from('research_requests').update({ status: 'failed', error: message }).eq('id', requestId)
      return NextResponse.json({ error: message }, { status: 502 })
    }

    const decisionTitles = titles.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3)

    const companies = result.items.map(item => {
      const sizeForThisCompany = item.companySizeKey ?? companySize
      const seenTitles = new Set<string>()
      const decision_makers = decisionTitles
        .flatMap(title => recommendDecisionMakerTitles(title, sizeForThisCompany))
        .filter(rec => {
          const key = rec.title.toLowerCase()
          if (seenTitles.has(key)) return false
          seenTitles.add(key)
          return true
        })
        .map(rec => ({
          title: rec.title,
          reason: rec.reason,
          linkedin_search_url: linkedInPeopleSearchUrl(`${rec.title} ${item.title}`),
        }))

      return {
        name: item.title,
        sourceUrl: item.sourceUrl,
        sourceType: item.sourceType,
        confidenceScore: item.confidenceScore,
        summary: item.summary,
        linkedin_company_search_url: linkedInCompanySearchUrl(item.title),
        decision_makers,
      }
    })

    const confidence_score = aggregateConfidence(result.items)

    const reportData = {
      search_criteria: { industry: sector.en, location: city.en, company_size: companySize, titles },
      executive_summary: companies.length > 0
        ? `Found ${companies.length} real compan${companies.length === 1 ? 'y' : 'ies'} for "${query}" from ${result.totalSourcesFound} search results (${result.totalSourcesCollected} unique sources after dedup).`
        : `No real companies could be verified for "${query}". ${result.totalSourcesFound} search results were found but none passed source collection/normalization.`,
      research_summary: 'Every company below was discovered through Google Custom Search and a public source (company website, business directory, or public listing) — none are AI-generated. Confidence scores reflect source type and taxonomy match, not verified accuracy; always confirm details before outreach.',
      companies,
      outreach_disclaimer: 'This is evidence-based research from real public sources, not a verified contact database. Confirm company details and identify the right contact on LinkedIn before any outreach.',
      confidence_score,
      total_sources_found: result.totalSourcesFound,
      total_sources_collected: result.totalSourcesCollected,
      total_sources_validated: result.totalSourcesValidated,
      total_sources_deduped: result.totalSourcesDeduped,
      total_sources_expanded: result.totalSourcesExpanded,
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
