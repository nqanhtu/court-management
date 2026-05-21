import { apiFetch } from '@/lib/api/client';
import useSWR from 'swr'
import type { BorrowItemDto, BorrowSlipDto, FileDto } from '@/lib/api/types'

const fetcher = (url: string) => apiFetch(url).then(r => r.json())

type RecentBorrowSlip = BorrowSlipDto & {
    items: (BorrowItemDto & {
        file: FileDto;
    })[];
}

interface ReportStats {
    totalBorrows: number;
    activeBorrows: number;
    overdueBorrows: number;
    returnedRate: number;
    recentBorrows: RecentBorrowSlip[];
}

export function useReportStats() {
    const { data, error, isLoading } = useSWR<ReportStats>(
        '/api/reports/stats',
        fetcher
    )

    return {
        stats: data || {
            totalBorrows: 0,
            activeBorrows: 0,
            overdueBorrows: 0,
            returnedRate: 0,
            recentBorrows: []
        },
        isLoading,
        isError: error
    }
}
