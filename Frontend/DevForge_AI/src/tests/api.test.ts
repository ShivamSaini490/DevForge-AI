import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '../services/api'
afterEach(() => vi.unstubAllGlobals())
describe('HTTP client', () => {
  it('sends JSON with credentials and handles empty logout responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(api('/auth/logout', { method: 'POST' })).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'POST', credentials: 'include' }))
  })
  it('uses safe status messages instead of displaying server internals', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('secret stack trace', { status: 500 })))
    await expect(api('/auth/me')).rejects.toThrow('Something went wrong on the server.')
  })
  it('turns a dropped connection into a useful error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))
    await expect(api('/auth/me')).rejects.toThrow('Unable to reach the server.')
  })
  it('rejects malformed successful responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>not JSON</html>')))
    await expect(api('/auth/me')).rejects.toThrow('unexpected response')
  })
})
