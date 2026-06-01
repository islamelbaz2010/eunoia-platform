'use client'

import { useState, useCallback, useEffect } from 'react'
import type { WorkspaceWithMembers } from '@/types/workspace.types'

interface UseWorkspaceState {
  workspace: WorkspaceWithMembers | null
  isLoading: boolean
  error: string | null
}

interface UseWorkspaceReturn extends UseWorkspaceState {
  refresh(): Promise<void>
}

export function useWorkspace(): UseWorkspaceReturn {
  const [state, setState] = useState<UseWorkspaceState>({
    workspace: null,
    isLoading: true,
    error: null,
  })

  const refresh = useCallback(async (): Promise<void> => {
    setState(s => ({ ...s, isLoading: true, error: null }))

    try {
      const res = await fetch('/api/workspace')
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? `Request failed: ${res.status}`)
      }

      const workspace = await res.json() as WorkspaceWithMembers
      setState({ workspace, isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch workspace'
      setState(s => ({ ...s, isLoading: false, error: message }))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { ...state, refresh }
}
