'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      setSuccess(true)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-surface border border-white/8 rounded-2xl p-8 shadow-xl text-center">
        <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-gold text-2xl">✓</span>
        </div>
        <h2 className="text-cream text-xl font-bold mb-2">Check your email</h2>
        <p className="text-cream/50 text-sm">
          We sent a confirmation link to <strong className="text-cream">{email}</strong>.
          Click it to activate your account.
        </p>
        <Link
          href="/login"
          className="inline-block mt-6 text-gold/80 hover:text-gold text-sm transition-colors"
        >
          ← Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-white/8 rounded-2xl p-8 shadow-xl">
      <h1 className="text-cream text-2xl font-bold mb-1">Create account</h1>
      <p className="text-cream/50 text-sm mb-6">Start generating AI marketing intelligence</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm text-cream/70 mb-1.5">
            Full name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoComplete="name"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-colors"
            placeholder="Mohamed Ahmed"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm text-cream/70 mb-1.5">
            Work email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-colors"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-cream/70 mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-colors"
            placeholder="Min. 8 characters"
          />
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
          {isLoading ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-xs text-cream/30 text-center">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-cream/40">
        Already have an account?{' '}
        <Link href="/login" className="text-gold/80 hover:text-gold transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
