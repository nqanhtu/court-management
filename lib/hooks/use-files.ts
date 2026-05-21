import { apiFetch } from '@/lib/api/client';
import useSWR from 'swr'
import type { FileDto } from '@/lib/api/types'
export interface SearchParams {
  query?: string
  type?: string
  year?: number
  status?: string
  judgmentNumber?: string
  party?: string
  warehouse?: string
  line?: string
  shelf?: string
  slot?: string
  limit?: number
  offset?: number
}
const fetcher = (url: string) => apiFetch(url).then(r => r.json())

export function useFiles(params: SearchParams) {
    const queryString = new URLSearchParams()
    if (params.query) queryString.set('q', params.query)
    if (params.type && params.type !== 'all') queryString.set('type', params.type)
    if (params.year) queryString.set('year', params.year.toString())
    if (params.status && params.status !== 'all') queryString.set('status', params.status)
    if (params.judgmentNumber) queryString.set('judgmentNumber', params.judgmentNumber)
    if (params.party) queryString.set('party', params.party)
    if (params.warehouse) queryString.set('warehouse', params.warehouse)
    if (params.line) queryString.set('line', params.line)
    if (params.shelf) queryString.set('shelf', params.shelf)
    if (params.slot) queryString.set('slot', params.slot)
    if (params.limit) queryString.set('limit', params.limit.toString())
    if (params.offset) queryString.set('offset', params.offset.toString())

    const { data, error, isLoading, mutate } = useSWR<{ files: FileDto[], total: number }>(
        `/api/files?${queryString.toString()}`,
        fetcher
    )

    return {
        files: data?.files || [],
        total: data?.total || 0,
        isLoading,
        isError: error,
        mutate
    }
}

export function useFile(id: string) {
    const { data, error, isLoading, mutate } = useSWR<FileDto>(
        id ? `/api/files/${id}` : null,
        fetcher
    )

    return {
        file: data,
        isLoading,
        isError: error,
        mutate
    }
}

export function useFileStats() {
    const { data, error, isLoading } = useSWR<{ total: number, borrowed: number, overdue: number, byType: { type: string, _count: number }[] }>(
        '/api/files/stats',
        fetcher
    )

    return {
        stats: data || { total: 0, borrowed: 0, overdue: 0, byType: [] },
        isLoading,
        isError: error
    }
}
