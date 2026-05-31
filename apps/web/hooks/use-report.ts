'use client'

import { useState, useCallback } from 'react'
import type { Report, ReportInput, ReportListItem } from '@/types/report.types'
import type { ReportType } from '@services/ai-engine/prompt-builder'

interface UseReportState {
  report: Report | null
  isLoading: boolean
  isGenerating: boolean
  error: string | null
}

interface UseReportReturn extends UseReportState {
  generate(type: ReportType, input: ReportInput): Promise<Report | null>
  fetchReport(id: string): Promise<void>
  reset(): void
}

export function useReport(): UseReportReturn {
  const [state, setState] = useState<UseReportState>({
    report: null,
    isLoading: false,
    isGenerating: false,
    error: null,
  })

  const generate = useCallback(async (type: ReportType, input: ReportInput): Promise<Report | null> => {
    setState(s => ({ ...s, isGenerating: true, error: null }))

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, input }),
      })

      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? `Request failed: ${res.status}`)
      }

      const report = await res.json() as Report
      setState(s => ({ ...s, report, isGenerating: false }))
      return report
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate report'
      setState(s => ({ ...s, isGenerating: false, error: message }))
      return null
    }
  }, [])

  const fetchReport = useCallback(async (id: string): Promise<void> => {
    setState(s => ({ ...s, isLoading: true, error: null }))

    try {
      const res = await fetch(`/api/reports/${id}`)

      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? `Request failed: ${res.status}`)
      }

      const report = await res.json() as Report
      setState(s => ({ ...s, report, isLoading: false }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch report'
      setState(s => ({ ...s, isLoading: false, error: message }))
    }
  }, [])

  const reset = useCallback(() => {
    setState({ report: null, isLoading: false, isGenerating: false, error: null })
  }, [])

  return { ...state, generate, fetchReport, reset }
}

interface UseReportListState {
  reports: ReportListItem[]
  isLoading: boolean
  error: string | null
  page: number
  totalPages: number
}

interface UseReportListReturn extends UseReportListState {
  fetchReports(page?: number): Promise<void>
  nextPage(): void
  prevPage(): void
}

export function useReportList(): UseReportListReturn {
  const [state, setState] = useState<UseReportListState>({
    reports: [],
    isLoading: false,
    error: null,
    page: 1,
    totalPages: 1,
  })

  const fetchReports = useCallback(async (page = 1): Promise<void> => {
    setState(s => ({ ...s, isLoading: true, error: null }))

    try {
      const res = await fetch(`/api/reports?page=${page}&limit=20`)
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)

      const data = await res.json() as { reports: ReportListItem[]; totalPages: number; page: number }
      setState(s => ({ ...s, reports: data.reports, totalPages: data.totalPages, page: data.page, isLoading: false }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch reports'
      setState(s => ({ ...s, isLoading: false, error: message }))
    }
  }, [])

  const nextPage = useCallback(() => {
    setState(s => {
      if (s.page < s.totalPages) {
        void fetchReports(s.page + 1)
        return { ...s, page: s.page + 1 }
      }
      return s
    })
  }, [fetchReports])

  const prevPage = useCallback(() => {
    setState(s => {
      if (s.page > 1) {
        void fetchReports(s.page - 1)
        return { ...s, page: s.page - 1 }
      }
      return s
    })
  }, [fetchReports])

  return { ...state, fetchReports, nextPage, prevPage }
}
