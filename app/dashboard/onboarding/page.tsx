'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const TOUR_STEPS = [
  {
    icon: '🏗️',
    title: 'Real Estate Intelligence',
    desc: 'Run feasibility studies, campaign ROI audits, and market entry analysis for any property or real estate project in Egypt.',
    href: '/dashboard/real-estate',
    cta: 'Start a Feasibility Study',
  },
  {
    icon: '🎯',
    title: 'Lead Finder',
    desc: 'Discover and rank companies in any industry that match your ideal customer profile — with scored leads ready for outreach.',
    href: '/dashboard/research/leads',
    cta: 'Find Leads Now',
  },
  {
    icon: '🧑‍💼',
    title: 'Talent Finder',
    desc: 'Get salary benchmarks, role availability, and qualified candidate profiles for any position in the Egyptian market.',
    href: '/dashboard/research/talent',
    cta: 'Explore Talent Market',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<'setup' | 'tour'>('setup')
  const [workspaceName, setWorkspaceName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTour, setActiveTour] = useState(0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const res = await fetch('/api/users/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceName: workspaceName.trim() || undefined }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Failed to set up workspace')
      }

      setStep('tour')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center">
            <span className="text-midnight font-bold text-lg">E</span>
          </div>
          <div>
            <div className="text-cream font-semibold">Eunoia</div>
            <div className="text-cream/40 text-xs">Intelligence Platform</div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {['Setup', 'Quick tour'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                (i === 0 && step === 'setup') || (i === 1 && step === 'tour')
                  ? 'bg-gold text-midnight'
                  : i === 0 && step === 'tour'
                    ? 'bg-gold/30 text-gold'
                    : 'bg-white/10 text-cream/40'
              }`}>{i === 0 && step === 'tour' ? '✓' : i + 1}</div>
              <span className={`text-xs ${step === (i === 0 ? 'setup' : 'tour') ? 'text-cream/70' : 'text-cream/30'}`}>{label}</span>
              {i < 1 && <div className="w-8 h-px bg-white/10" />}
            </div>
          ))}
        </div>

        {step === 'setup' && (
          <div className="bg-surface border border-white/8 rounded-2xl p-8 shadow-xl">
            <h1 className="text-cream text-2xl font-bold mb-1">Set up your workspace</h1>
            <p className="text-cream/50 text-sm mb-6">
              Give your workspace a name to get started. You can change this later.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="workspaceName" className="block text-sm text-cream/70 mb-1.5">
                  Workspace name
                </label>
                <input
                  id="workspaceName"
                  type="text"
                  value={workspaceName}
                  onChange={e => setWorkspaceName(e.target.value)}
                  autoFocus
                  placeholder="e.g. Ahmed Clinics Marketing"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-colors"
                />
                <p className="text-cream/30 text-xs mt-1">Leave blank to use your email as the workspace name.</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gold hover:bg-gold-light text-midnight font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Setting up…' : 'Continue →'}
              </button>
            </form>
          </div>
        )}

        {step === 'tour' && (
          <div className="bg-surface border border-white/8 rounded-2xl p-8 shadow-xl">
            <h1 className="text-cream text-2xl font-bold mb-1">Welcome to Eunoia 👋</h1>
            <p className="text-cream/50 text-sm mb-6">
              Here&apos;s what you can do. Pick where to start — or go to your dashboard.
            </p>

            <div className="space-y-3 mb-6">
              {TOUR_STEPS.map((s, i) => (
                <button
                  key={s.href}
                  onClick={() => setActiveTour(i)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: `1.5px solid ${activeTour === i ? 'rgba(184,146,42,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    background: activeTour === i ? 'rgba(184,146,42,0.08)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.4 }}>{s.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: activeTour === i ? '#b8922a' : '#f5f0e8', marginBottom: 4 }}>{s.title}</div>
                      <div style={{ fontSize: 12, color: 'rgba(245,240,232,0.5)', lineHeight: 1.5 }}>{s.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Link
                href={TOUR_STEPS[activeTour].href}
                style={{
                  flex: 1,
                  display: 'block',
                  textAlign: 'center',
                  padding: '11px 16px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg,#b8922a,#d4aa45)',
                  color: '#1a1612',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                {TOUR_STEPS[activeTour].cta}
              </Link>
              <Link
                href="/dashboard"
                style={{
                  padding: '11px 16px',
                  borderRadius: 10,
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  color: 'rgba(245,240,232,0.5)',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
