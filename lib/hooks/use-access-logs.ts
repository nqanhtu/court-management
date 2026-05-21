import { apiFetch } from '@/lib/api/client'
import useSWR from 'swr'
import type { UserAccessEvent, UserAccessLogDto, UserAccessLogSummaryDto } from '@/lib/api/types'

const fetcher = (url: string) => apiFetch(url).then((response) => response.json())

interface UseAccessLogsParams {
  query?: string
  userId?: string
  event?: string
  limit?: number
  offset?: number
}

type AccessLogsResponse = {
  logs: UserAccessLogDto[]
  total: number
  summary: UserAccessLogSummaryDto
}

const emptySummary: UserAccessLogSummaryDto = {
  totalLogins: 0,
  totalLogouts: 0,
  activeUsers: 0,
  lastAccessAt: null,
}

export function useAccessLogs(params: UseAccessLogsParams) {
  const queryString = new URLSearchParams()
  if (params.query) queryString.set('q', params.query)
  if (params.userId && params.userId !== 'ALL') queryString.set('userId', params.userId)
  if (params.event && params.event !== 'ALL') queryString.set('event', params.event as UserAccessEvent)
  if (params.limit) queryString.set('limit', params.limit.toString())
  if (params.offset) queryString.set('offset', params.offset.toString())

  const { data, error, isLoading, mutate } = useSWR<AccessLogsResponse>(
    `/api/admin/access-logs?${queryString.toString()}`,
    fetcher
  )

  return {
    logs: data?.logs || [],
    total: data?.total || 0,
    summary: data?.summary || emptySummary,
    isLoading,
    isError: error,
    mutate,
  }
}
