const DEFAULT_API_URL = 'http://localhost:3001'

export function apiUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL
  if (/^https?:\/\//.test(path)) return path
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

export function apiFetch(input: string, init?: RequestInit) {
  return fetch(apiUrl(input), {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.headers || {}),
    },
  })
}

export async function swrFetcher<T>(url: string): Promise<T> {
  const response = await apiFetch(url)
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }
  return await response.json() as T
}
