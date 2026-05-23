import { apiDownload, apiJson, ApiClientError } from '@/lib/api/client'

describe('api client', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('parses JSON responses and sends credentials with generated device id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiJson<{ ok: boolean }>('/api/health')

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith('/api/health', expect.objectContaining({
      credentials: 'include',
      headers: expect.objectContaining({
        'content-type': 'application/json',
        'x-mac-address': expect.stringMatching(/^02:/),
      }),
    }))
  })

  it('reuses the same mock device id across requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await apiJson('/api/one')
    await apiJson('/api/two')

    const firstHeaders = fetchMock.mock.calls[0][1].headers
    const secondHeaders = fetchMock.mock.calls[1][1].headers
    expect(firstHeaders['x-mac-address']).toBe(secondHeaders['x-mac-address'])
    expect(localStorage.getItem('deviceMacAddress')).toBe(firstHeaders['x-mac-address'])
  })

  it('throws typed errors for failed JSON responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Forbidden' }),
    }))

    await expect(apiJson('/api/admin')).rejects.toMatchObject({
      name: 'ApiClientError',
      status: 403,
      message: 'Forbidden',
    } satisfies Partial<ApiClientError>)
  })

  it('returns blob download responses without parsing JSON', async () => {
    const response = {
      ok: true,
      blob: async () => new Blob(['report']),
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

    await expect(apiDownload('/api/reports/export')).resolves.toBe(response)
  })
})
