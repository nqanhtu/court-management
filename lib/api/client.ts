const SAME_ORIGIN = 'same-origin'

export function apiUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || SAME_ORIGIN
  if (baseUrl === SAME_ORIGIN) return path
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

function getDeviceMacAddress() {
  if (typeof window === 'undefined') return null; // Prevent SSR errors
  
  try {
    let mac = localStorage.getItem('deviceMacAddress');
    if (!mac) {
      // Generate a pseudo-MAC address for browser identification
      const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      mac = `02:${hex()}:${hex()}:${hex()}:${hex()}:${hex()}`.toUpperCase();
      localStorage.setItem('deviceMacAddress', mac);
    }
    return mac;
  } catch {
    return null; // Handle incognito mode / disabled storage
  }
}

export function apiFetch(input: string, init?: RequestInit) {
  const macAddress = getDeviceMacAddress();
  const defaultHeaders: HeadersInit = macAddress ? { 'x-mac-address': macAddress } : {};

  return fetch(apiUrl(input), {
    ...init,
    credentials: 'include',
    headers: {
      ...defaultHeaders,
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
