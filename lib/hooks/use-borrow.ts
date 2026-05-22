import { useQuery } from '@tanstack/react-query'

import { apiJson } from '@/lib/api/client'
import { BorrowSlipWithDetails } from '@/lib/types/borrow'
import { queryKeys } from '@/src/lib/query-keys'

export function useBorrowSlips() {
  const query = useQuery({
    queryKey: queryKeys.borrow.list,
    queryFn: async () => {
      const data = await apiJson<unknown>('/api/borrow')
      if (!Array.isArray(data)) throw new Error('Borrow API did not return a list')
      return data as BorrowSlipWithDetails[]
    },
  })

  return {
    borrowSlips: Array.isArray(query.data) ? query.data : [],
    isLoading: query.isLoading,
    isError: query.error,
    mutate: query.refetch,
  }
}
