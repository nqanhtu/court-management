import { useQuery } from '@tanstack/react-query'
import { apiJson } from '@/lib/api/client'
import type { AutocompleteSuggestions } from '@/lib/api/types'
import { queryKeys } from '@/src/lib/query-keys'

export function useAutocompleteSuggestions() {
  const query = useQuery({
    queryKey: queryKeys.files.autocompleteSuggestions,
    queryFn: () => apiJson<AutocompleteSuggestions>('/api/files/autocomplete-suggestions'),
  })

  return {
    suggestions: query.data || { types: [], retentions: [], titles: [] },
    isLoading: query.isLoading,
    isError: query.error,
  }
}
