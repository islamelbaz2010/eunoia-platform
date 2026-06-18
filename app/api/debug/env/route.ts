import { NextResponse } from 'next/server'

/**
 * TEMPORARY diagnostic endpoint for the SERPAPI_API_KEY "missing in
 * production despite being set in Vercel" investigation — see
 * SERPAPI_ROOT_CAUSE_ANALYSIS.md. Never returns the key itself, only its
 * presence, so it's safe to hit on a live deployment. Delete once the root
 * cause is confirmed and fixed.
 */
export async function GET() {
  return NextResponse.json({
    hasSerpApi: !!process.env.SERPAPI_API_KEY,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    nodeEnv: process.env.NODE_ENV,
  })
}
