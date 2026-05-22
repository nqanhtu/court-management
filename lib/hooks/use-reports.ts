import { useQuery } from '@tanstack/react-query'

import { apiJson } from '@/lib/api/client'
import type { BorrowItemDto, BorrowSlipDto, FileDto } from '@/lib/api/types'
import { queryKeys } from '@/src/lib/query-keys'

type RecentBorrowSlip = BorrowSlipDto & {
  items: (BorrowItemDto & {
    file: FileDto
  })[]
}

interface ReportStats {
  totalBorrows: number
  activeBorrows: number
  overdueBorrows: number
  returnedRate: number
  recentBorrows: RecentBorrowSlip[]
}

const emptyStats: ReportStats = {
  totalBorrows: 0,
  activeBorrows: 0,
  overdueBorrows: 0,
  returnedRate: 0,
  recentBorrows: [],
}

export function useReportStats() {
  const query = useQuery({
    queryKey: queryKeys.reports.stats,
    queryFn: () => apiJson<ReportStats>('/api/reports/stats'),
  })

  return {
    stats: query.data || emptyStats,
    isLoading: query.isLoading,
    isError: query.error,
  }
}
