import { api } from './api'
import type { LoginCredentials, RegisterCredentials, User } from '../types/auth'
export const isDemoAuth = import.meta.env.DEV && import.meta.env.VITE_AUTH_MODE === 'demo'
function parseUser(value: unknown): User {
  if (!value || typeof value !== 'object' || !('id' in value) || typeof value.id !== 'string'
    || !('name' in value) || typeof value.name !== 'string' || !('email' in value) || typeof value.email !== 'string') {
    throw new Error('The server returned an invalid account. Please try again.')
  }
  return { id: value.id, name: value.name, email: value.email }
}
const demo = () => import('./demoAuthService')
export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    if (isDemoAuth) return (await demo()).demoAuthService.login(credentials)
    return parseUser(await api('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }))
  },
  async register(credentials: RegisterCredentials): Promise<User> {
    if (isDemoAuth) return (await demo()).demoAuthService.register(credentials)
    return parseUser(await api('/auth/register', { method: 'POST', body: JSON.stringify(credentials) }))
  },
  async me(): Promise<User> {
    if (isDemoAuth) return (await demo()).demoAuthService.me()
    return parseUser(await api('/auth/me'))
  },
  async logout(): Promise<void> {
    if (isDemoAuth) return (await demo()).demoAuthService.logout()
    await api<void>('/auth/logout', { method: 'POST' })
  },
}
