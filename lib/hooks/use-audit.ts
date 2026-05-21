import { apiFetch } from '@/lib/api/client';
import useSWR from 'swr'
import type { AuditLogDto, UserDto } from '@/lib/api/types'

const fetcher = (url: string) => apiFetch(url).then(r => r.json())

export type AuditLogWithUser = AuditLogDto & {
    user: UserDto;
}

interface UseAuditParams {
    query?: string
    action?: string
    limit?: number
    offset?: number
}

export function useAudit(params: UseAuditParams) {
    const queryString = new URLSearchParams()
    if (params.query) queryString.set('q', params.query)
    if (params.action && params.action !== 'ALL') queryString.set('action', params.action)
    if (params.limit) queryString.set('limit', params.limit.toString())
    if (params.offset) queryString.set('offset', params.offset.toString())

    const { data, error, isLoading, mutate } = useSWR<{ logs: AuditLogWithUser[], total: number }>(
        `/api/audit?${queryString.toString()}`,
        fetcher
    )

    return {
        logs: data?.logs || [],
        total: data?.total || 0,
        isLoading,
        isError: error,
        mutate
    }
}
