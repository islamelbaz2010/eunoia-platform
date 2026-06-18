import { NextResponse } from 'next/server'

/**
 * TEMPORARY diagnostic endpoint for the SERPAPI_API_KEY "missing in
 * production despite being set in Vercel" investigation — see
 * SERPAPI_ROOT_CAUSE_ANALYSIS.md. Never returns the key itself, only its
 * presence/length, so it's safe to hit on a live deployment. Delete once
 * the root cause is confirmed and fixed.
 */
export async function GET() {
  const key = process.env.SERPAPI_API_KEY
  return NextResponse.json({
    hasSerpApiKey: Boolean(key && key.trim().length > 0),
    keyLength: key?.length ?? 0,
    runtime: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
  })
}
