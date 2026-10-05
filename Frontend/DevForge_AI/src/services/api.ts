export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) { super(message); this.name = 'ApiError'; this.status = status }
}
const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body) headers.set('Content-Type', 'application/json')
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options, headers, credentials: 'include', signal: options.signal ?? AbortSignal.timeout(15000),
    })
  } catch {
    throw new ApiError('Unable to reach the server. Check your connection and try again.', 0)
  }
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: 'Your email or password is incorrect. Please try again.',
      403: 'You do not have permission to do that.',
      409: 'An account with this email already exists. Please sign in.',
      422: 'Check your details and try again.',
      429: 'Too many attempts. Please wait a moment and try again.',
    }
    throw new ApiError(messages[response.status] || 'Something went wrong on the server. Please try again.', response.status)
  }
  if (response.status === 204) return undefined as T
  try { return await response.json() as T }
  catch { throw new ApiError('The server returned an unexpected response. Please try again.', response.status) }
}
