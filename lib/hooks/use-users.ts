import { apiFetch } from '@/lib/api/client';
import useSWR from 'swr'
import type { UserDto } from '@/lib/api/types'

const fetcher = (url: string) => apiFetch(url).then(r => r.json())

export function useUsers() {
    const { data, error, isLoading, mutate } = useSWR<UserDto[]>(
        '/api/users',
        fetcher
    )

    return {
        users: data || [],
        isLoading,
        isError: error,
        mutate
    }
}
