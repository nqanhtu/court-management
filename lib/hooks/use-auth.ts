import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export interface SessionData {
    id: string
    username: string
    role: string
    fullName: string
}

export function useSession() {
    const { data, error, isLoading, mutate } = useSWR<SessionData | null>(
        '/api/auth/session',
        fetcher
    )

    return {
        session: data,
        isLoading,
        isError: error,
        isAuthenticated: !!data,
        mutate
    }
}
