import useSWR from 'swr'
import { SearchParams } from '@/lib/actions/files'
import { Prisma } from '@/app/generated/prisma/client'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useFiles(params: SearchParams) {
    const queryString = new URLSearchParams()
    if (params.query) queryString.set('q', params.query)
    if (params.type && params.type !== 'all') queryString.set('type', params.type)
    if (params.year) queryString.set('year', params.year.toString())
    if (params.limit) queryString.set('limit', params.limit.toString())
    if (params.offset) queryString.set('offset', params.offset.toString())

    const { data, error, isLoading, mutate } = useSWR<{ files: (Prisma.FileGetPayload<{ include: { box: true } }>)[], total: number }>(
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
    const { data, error, isLoading, mutate } = useSWR<Prisma.FileGetPayload<{ include: { box: true, borrowItems: { include: { borrowSlip: true } }, documents: true } }>>(
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
