'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()
  const [workspaceName, setWorkspaceName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
        body: JSON.stringify({
          workspaceName: workspaceName.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Failed to set up workspace')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
              {isLoading ? 'Setting up…' : 'Continue to Dashboard →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
