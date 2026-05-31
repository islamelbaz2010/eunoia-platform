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

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json() as { type?: unknown; input?: unknown }
    const { type, input } = body

    if (!type || typeof type !== 'string' || !isValidReportType(type)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    const reportInput = input as ReportInput

    if (!reportInput?.companyName || !reportInput?.sectorKey || !reportInput?.cityKey) {
      return NextResponse.json({ error: 'companyName, sectorKey, and cityKey are required' }, { status: 400 })
    }

    const sector = getSector(reportInput.sectorKey)
    const city = getCity(reportInput.cityKey)
    const branch = getBranch(reportInput.branchKey ?? 'egypt')

    if (!sector || !city || !branch) {
      return NextResponse.json({ error: 'Invalid sector, city, or branch' }, { status: 400 })
    }

    // Get or create DB user
    let dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
    if (!dbUser) {
      // Auto-provision workspace for new user
      const workspace = await prisma.workspace.create({
        data: { name: `${user.email?.split('@')[0] ?? 'My'} Workspace`, plan: 'STARTER', ownerId: user.id },
      })
      dbUser = await prisma.user.create({
        data: { id: user.id, email: user.email!, name: user.email?.split('@')[0], workspaceId: workspace.id },
      })
    }

    // Create report record with QUEUED status
    const report = await prisma.report.create({
      data: {
        type: type as ReportType,
        status: 'QUEUED',
        input: reportInput as object,
        userId: dbUser.id,
        workspaceId: dbUser.workspaceId,
      },
    })

    // Build prompt context
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
    }

    // Mark as processing
    await prisma.report.update({ where: { id: report.id }, data: { status: 'PROCESSING' } })

    try {
      const orchestrator = getOrchestrator()
      const result = await orchestrator.generate(type, ctx, {
        workspaceId: dbUser.workspaceId,
        userId: dbUser.id,
        reportId: report.id,
      })

      // Save completed report
      const completed = await prisma.report.update({
        where: { id: report.id },
        data: {
          status: 'COMPLETED',
          output: result.data as object,
          completedAt: new Date(),
        },
      })

      // Track API usage
      await prisma.apiUsage.create({
        data: {
          userId: dbUser.id,
          provider: result.provider,
          model: result.model,
          tokens: result.usage.totalTokens,
          cost: result.usage.totalTokens * 0.0000006,
          reportId: report.id,
        },
      }).catch(() => {}) // Non-fatal

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
