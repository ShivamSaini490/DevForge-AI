import { create } from 'zustand'
import { authService } from '../services/authService'
import { ApiError } from '../services/api'
import type { LoginCredentials, RegisterCredentials, User } from '../types/auth'
interface AuthState {
  user: User | null
  initialized: boolean
  loading: boolean
  error: string | null
  initialize: () => Promise<void>
  login: (credentials: LoginCredentials) => Promise<boolean>
  register: (credentials: RegisterCredentials) => Promise<boolean>
  logout: () => Promise<void>
  clearError: () => void
}
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.'
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null, initialized: false, loading: false, error: null,
  initialize: async () => {
    if (get().initialized || get().loading) return
    set({ loading: true })
    try { set({ user: await authService.me(), error: null }) }
    catch (error) { set({ user: null, error: error instanceof ApiError && error.status === 401 ? null : errorMessage(error) }) }
    finally { set({ loading: false, initialized: true }) }
  },
  login: async (credentials) => {
    if (get().loading) return false
    set({ loading: true, error: null })
    try { set({ user: await authService.login(credentials), initialized: true }); return true }
    catch (error) { set({ error: errorMessage(error) }); return false }
    finally { set({ loading: false }) }
  },
  register: async (credentials) => {
    if (get().loading) return false
    set({ loading: true, error: null })
    try { set({ user: await authService.register(credentials), initialized: true }); return true }
    catch (error) { set({ error: errorMessage(error) }); return false }
    finally { set({ loading: false }) }
  },
  logout: async () => {
    if (get().loading) return
    set({ loading: true, error: null })
    try { await authService.logout() }
    catch { set({ error: 'Signed out locally, but the server session could not be ended. Please retry when connected.' }) }
    finally { set({ user: null, loading: false, initialized: true }) }
  },
  clearError: () => set({ error: null }),
}))
