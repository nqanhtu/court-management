import useSWR from 'swr'
import { BorrowSlipWithDetails } from '@/lib/types/borrow'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useBorrowSlips() {
    const { data, error, isLoading, mutate } = useSWR<BorrowSlipWithDetails[]>(
        '/api/borrow',
        fetcher
    )

    return {
        borrowSlips: data || [],
        isLoading,
        isError: error,
        mutate
    }
}
