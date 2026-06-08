'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/reset-password`,
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF5EF' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 32, maxWidth: 360, width: '100%', border: '1px solid #E8E2DA', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
            <h2 style={{ color: '#4A1042', marginBottom: 8 }}>Check your email</h2>
            <p style={{ color: '#9A9090', fontSize: 13 }}>Password reset link sent to <strong>{email}</strong></p>
            <Link href="/login" style={{ display: 'block', marginTop: 20, color: '#4A1042', fontSize: 13 }}>← Back to login</Link>
          </div>
        ) : (
          <>
            <h1 style={{ color: '#4A1042', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Reset Password</h1>
            <p style={{ color: '#9A9090', fontSize: 13, marginBottom: 24 }}>Enter your email to receive a reset link</p>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E8E2DA', borderRadius: 8, fontSize: 14, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '12px', background: '#4A1042', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <Link href="/login" style={{ display: 'block', marginTop: 16, color: '#9A9090', fontSize: 12, textAlign: 'center' }}>← Back to login</Link>
          </>
        )}
      </div>
    </div>
  )
}
