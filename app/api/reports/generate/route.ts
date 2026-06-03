import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { getOrchestrator } from '@services/ai-engine/orchestrator'
import type { ReportType } from '@services/ai-engine/prompt-builder'
import { isValidReportType } from '@services/ai-engine/prompt-builder'
import { getSector } from '@core/data/sectors.data'
import { getCity } from '@core/data/cities.data'
import { getBranch } from '@core/data/branches.data'
import type { PromptContext } from '@services/ai-engine/prompts/types'
import type { ReportInput } from '@/types/report.types'

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW = 3600

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Prisma user — must have completed onboarding
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      include: { workspace: true },
    })
    if (!dbUser) {
      return NextResponse.json(
        { error: 'Please complete onboarding before generating reports.' },
        { status: 403 }
      )
    }

    // 3. Validate body
    const body = await req.json() as { type?: unknown; input?: unknown }
    const { type, input } = body

    if (!type || typeof type !== 'string' || !isValidReportType(type)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    const reportInput = input as ReportInput

    if (!reportInput?.companyName?.trim() || !reportInput?.sectorKey || !reportInput?.cityKey) {
      return NextResponse.json(
        { error: 'companyName, sectorKey, and cityKey are required' },
        { status: 400 }
      )
    }

    const sector = getSector(reportInput.sectorKey)
    const city = getCity(reportInput.cityKey)
    const branch = getBranch(reportInput.branchKey ?? 'egypt')

    if (!branch) {
      return NextResponse.json({ error: 'Invalid branch' }, { status: 400 })
    }

    // 4. Rate limit check BEFORE creating report record
    const rateLimitKey = `ratelimit:reports:${dbUser.workspaceId}`
    let rateLimitResetIn = RATE_LIMIT_WINDOW
    try {
      const { getRedis } = await import('@/lib/redis/client')
      const redisClient = getRedis()
      const current = await redisClient.get<number>(rateLimitKey)
      const count = typeof current === 'number' ? current : parseInt(String(current ?? '0'), 10) || 0
      if (count >= RATE_LIMIT_MAX) {
        try {
          const ttl = await redisClient.ttl(rateLimitKey)
          rateLimitResetIn = ttl > 0 ? ttl : RATE_LIMIT_WINDOW
        } catch {
          rateLimitResetIn = RATE_LIMIT_WINDOW
        }
        const mins = Math.ceil(rateLimitResetIn / 60)
        return NextResponse.json(
          {
            error: `Rate limit exceeded: ${RATE_LIMIT_MAX} reports per hour. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`,
            resetIn: rateLimitResetIn,
          },
          { status: 429 }
        )
      }
    } catch {
      // Redis unavailable — allow through (fail open for availability)
    }

    // 5. Create report with QUEUED status
    const report = await prisma.report.create({
      data: {
        type: type as ReportType,
        status: 'QUEUED',
        input: reportInput as object,
        userId: dbUser.id,
        workspaceId: dbUser.workspaceId,
      },
    })

    // 6. Build prompt context
    const ctx: PromptContext = {
      companyName: reportInput.companyName,
      sector,
      sectorKey: reportInput.sectorKey,
      city,
      branch,
      size: (reportInput.size ?? 'small') as PromptContext['size'],
      stage: (reportInput.stage ?? 'growth') as PromptContext['stage'],
      websiteUrl: reportInput.website,
      language: reportInput.language ?? 'ar',
      competitors: reportInput.competitors?.map(c => ({ name: c.name, link: c.url })) ?? [],
      ads: reportInput.ads as PromptContext['ads'],
      social: reportInput.social as PromptContext['social'],
      sales: reportInput.sales as PromptContext['sales'],
      projectType: reportInput.projectType,
      projectLocation: reportInput.projectLocation,
      projectSize: reportInput.projectSize,
    }

    // 7. Mark PROCESSING and generate
    await prisma.report.update({ where: { id: report.id }, data: { status: 'PROCESSING' } })

    try {
      const orchestrator = getOrchestrator()
      const result = await orchestrator.generate(type, ctx, {
        workspaceId: dbUser.workspaceId,
        userId: dbUser.id,
        reportId: report.id,
      })

      // 8. Save completed report
      const completed = await prisma.report.update({
        where: { id: report.id },
        data: {
          status: 'COMPLETED',
          output: result.data as object,
          completedAt: new Date(),
        },
      })

      await prisma.apiUsage.create({
        data: {
          userId: dbUser.id,
          provider: result.provider,
          model: result.model,
          tokens: result.usage.totalTokens,
          cost: result.usage.totalTokens * 0.0000006,
          reportId: report.id,
        },
      }).catch(() => {})

      return NextResponse.json({ id: completed.id, status: 'COMPLETED' })
    } catch (aiError) {
      const errMsg = aiError instanceof Error ? aiError.message : 'AI generation failed'
      await prisma.report.update({
        where: { id: report.id },
        data: { status: 'FAILED', error: errMsg },
      })
      return NextResponse.json({ error: errMsg }, { status: 500 })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
