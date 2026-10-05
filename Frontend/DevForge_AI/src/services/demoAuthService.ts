import { ApiError } from './api'
import type { LoginCredentials, RegisterCredentials, User } from '../types/auth'
// Development fixture only. Accounts and session reset on page reload; nothing is persisted.
const accounts = new Map<string, { user: User; password: string }>([
  ['demo@devforge.ai', { user: { id: 'demo', name: 'Alex Morgan', email: 'demo@devforge.ai' }, password: 'DevForge123!' }],
])
let currentUser: User | null = null
const delay = () => new Promise((resolve) => setTimeout(resolve, 450))
export const demoAuthService = {
  async login({ email, password }: LoginCredentials) {
    await delay()
    const account = accounts.get(email.toLowerCase())
    if (!account || account.password !== password) throw new ApiError('Your email or password is incorrect. Please try again.', 401)
    currentUser = account.user
    return currentUser
  },
  async register({ name, email, password }: RegisterCredentials) {
    await delay()
    const normalizedEmail = email.toLowerCase()
    if (accounts.has(normalizedEmail)) throw new ApiError('An account with this email already exists. Please sign in.', 409)
    currentUser = { id: crypto.randomUUID(), name, email: normalizedEmail }
    accounts.set(normalizedEmail, { user: currentUser, password })
    return currentUser
  },
  async me() { await delay(); if (!currentUser) throw new ApiError('Please sign in.', 401); return currentUser },
  async logout() { await delay(); currentUser = null },
}
