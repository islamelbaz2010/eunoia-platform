'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AccountActions() {
  const router = useRouter()
  const [deletePhase, setDeletePhase] = useState<'idle' | 'confirm' | 'deleting'>('idle')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    setIsExporting(true)
    try {
      const res = await fetch('/api/account/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `eunoia-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // silent — browser will show a network error if it fails
    } finally {
      setIsExporting(false)
    }
  }

  async function handleDelete() {
    setDeletePhase('deleting')
    setDeleteError(null)
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? 'Deletion failed')
      }
      await createClient().auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Deletion failed')
      setDeletePhase('confirm')
    }
  }

  return (
    <div className="bg-surface border border-white/8 rounded-xl p-6 space-y-4">
      <h2 className="text-cream font-semibold">Data &amp; Account</h2>

      {/* Export */}
      <div>
        <p className="text-cream/40 text-sm mb-3">
          Download a copy of all your reports and research requests as a JSON file.
        </p>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-4 py-2 rounded-lg border border-white/10 text-cream/80 text-sm font-medium hover:border-gold/40 hover:text-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? 'Preparing…' : 'Download My Data'}
        </button>
      </div>

      <hr className="border-white/8" />

      {/* Delete */}
      <div>
        <p className="text-cream/40 text-sm mb-3">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>

        {deletePhase === 'idle' && (
          <button
            onClick={() => setDeletePhase('confirm')}
            className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:border-red-500/60 hover:text-red-300 transition-colors"
          >
            Delete Account
          </button>
        )}

        {(deletePhase === 'confirm' || deletePhase === 'deleting') && (
          <div className="space-y-3">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400/90 text-sm">
              Are you sure? All reports, research history, and account data will be permanently deleted.
            </div>
            {deleteError && (
              <div className="text-red-400 text-xs">{deleteError}</div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deletePhase === 'deleting'}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletePhase === 'deleting' ? 'Deleting…' : 'Yes, delete my account'}
              </button>
              <button
                onClick={() => { setDeletePhase('idle'); setDeleteError(null) }}
                disabled={deletePhase === 'deleting'}
                className="px-4 py-2 rounded-lg border border-white/10 text-cream/60 text-sm hover:text-cream transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
