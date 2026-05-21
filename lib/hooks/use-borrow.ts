import { apiFetch } from '@/lib/api/client';
import useSWR from 'swr'
import { BorrowSlipWithDetails } from '@/lib/types/borrow'

const fetcher = async (url: string) => {
    const response = await apiFetch(url)
    const data = await response.json().catch(() => null)

    if (!response.ok) {
        throw new Error(data?.error || data?.message || `API request failed with status ${response.status}`)
    }

    if (!Array.isArray(data)) {
        throw new Error(data?.error || data?.message || 'Borrow API did not return a list')
    }

    return data as BorrowSlipWithDetails[]
}

export function useBorrowSlips() {
    const { data, error, isLoading, mutate } = useSWR<BorrowSlipWithDetails[]>(
        '/api/borrow',
        fetcher
    )

    return {
        borrowSlips: Array.isArray(data) ? data : [],
        isLoading,
        isError: error,
        mutate
    }
}
