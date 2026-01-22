import useSWR from 'swr'
import { BorrowSlipModel, FileModel, BorrowItemModel } from '@/app/generated/prisma/models'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type RecentBorrowSlip = BorrowSlipModel & {
    items: (BorrowItemModel & {
        file: FileModel;
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
