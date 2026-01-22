import useSWR from 'swr'
import { UserModel } from '@/app/generated/prisma/models'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useUsers() {
    const { data, error, isLoading, mutate } = useSWR<UserModel[]>(
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
