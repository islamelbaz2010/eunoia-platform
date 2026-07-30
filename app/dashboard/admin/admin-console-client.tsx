'use client'

import { useEffect, useState, useCallback } from 'react'
import type { UserPlan } from '@/types/plan.types'
import { PLAN_LABELS } from '@/types/plan.types'

interface AdminUser {
  id: string
  email: string | undefined
  created_at: string
  last_sign_in_at: string | null
  plan: UserPlan
  plan_updated_at: string | null
  usage_this_month: number
}

const PLANS: UserPlan[] = ['STARTER', 'PROFESSIONAL', 'AGENCY', 'ENTERPRISE']

const PLAN_COLORS: Record<UserPlan, string> = {
  STARTER: '#6b7280',
  PROFESSIONAL: '#2563eb',
  AGENCY: '#7c3aed',
  ENTERPRISE: '#b8922a',
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function AdminConsoleClient() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? `Request failed: ${res.status}`)
      }
      const data = await res.json() as AdminUser[]
      setUsers(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function handlePlanChange(userId: string, plan: UserPlan) {
    setUpdating(userId)
    setUpdateError(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? 'Update failed')
      }
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan, plan_updated_at: new Date().toISOString() } : u))
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setUpdating(null)
    }
  }

  const filtered = search
    ? users.filter(u => u.email?.toLowerCase().includes(search.toLowerCase()))
    : users

  const totalUsers = users.length
  const planCounts = PLANS.reduce<Record<string, number>>((acc, p) => {
    acc[p] = users.filter(u => u.plan === p).length
    return acc
  }, {})

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1612' }}>{totalUsers}</div>
          <div style={{ fontSize: 11, color: '#9e8e7e', marginTop: 4 }}>Total Users</div>
        </div>
        {PLANS.map(p => (
          <div key={p} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: PLAN_COLORS[p] }}>{planCounts[p] ?? 0}</div>
            <div style={{ fontSize: 11, color: '#9e8e7e', marginTop: 4 }}>{PLAN_LABELS[p]}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        style={{ width: '100%', marginBottom: 16, padding: '10px 14px', borderRadius: 9, border: '1.5px solid #e8e0d4', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#1a1612', boxSizing: 'border-box' }}
        placeholder="Search by email…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {updateError && (
        <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 9, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>
          {updateError}
        </div>
      )}

      {isLoading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#9e8e7e', fontSize: 13 }}>Loading users…</div>
      )}
      {error && !isLoading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</div>
          <button
            style={{ padding: '8px 18px', borderRadius: 9, background: '#b8922a', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
            onClick={load}
          >Retry</button>
        </div>
      )}

      {!isLoading && !error && (
        <div style={{ background: '#fff', border: '1px solid #e8e0d4', borderRadius: 14, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 100px 160px', gap: 12, padding: '10px 18px', background: '#faf5ef', borderBottom: '1px solid #e8e0d4', fontSize: 11, fontWeight: 700, color: '#9e8e7e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <div>Email</div>
            <div>Joined</div>
            <div>Usage/mo</div>
            <div>Plan</div>
            <div>Change Plan</div>
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: '40px 18px', textAlign: 'center', color: '#9e8e7e', fontSize: 13 }}>
              {search ? 'No users match that search.' : 'No users yet.'}
            </div>
          )}

          {filtered.map((u, i) => (
            <div
              key={u.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 80px 100px 160px',
                gap: 12,
                padding: '14px 18px',
                alignItems: 'center',
                borderBottom: i < filtered.length - 1 ? '1px solid #e8e0d4' : 'none',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1612', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email ?? '—'}</div>
                <div style={{ fontSize: 10, color: '#9e8e7e', marginTop: 2, fontFamily: 'monospace' }}>{u.id.slice(0, 8)}…</div>
              </div>
              <div style={{ fontSize: 12, color: '#6b6560' }}>{formatDate(u.created_at)}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: u.usage_this_month > 0 ? '#1a1612' : '#9e8e7e' }}>
                {u.usage_this_month}
              </div>
              <div>
                <span style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  background: PLAN_COLORS[u.plan] + '18',
                  color: PLAN_COLORS[u.plan],
                }}>{PLAN_LABELS[u.plan]}</span>
              </div>
              <div>
                <select
                  value={u.plan}
                  disabled={updating === u.id}
                  onChange={e => void handlePlanChange(u.id, e.target.value as UserPlan)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: '1.5px solid #e8e0d4',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#1a1612',
                    background: '#fff',
                    cursor: updating === u.id ? 'not-allowed' : 'pointer',
                    opacity: updating === u.id ? 0.5 : 1,
                    fontFamily: 'inherit',
                    width: '100%',
                  }}
                >
                  {PLANS.map(p => (
                    <option key={p} value={p}>{PLAN_LABELS[p]}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
