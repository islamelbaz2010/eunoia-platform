import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasSerpApi: !!process.env.SERPAPI_API_KEY,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasSupabase: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    nodeEnv: process.env.NODE_ENV,
  })
}
