import { api } from './api'
import { isDemoAuth } from './authService'
import { parseAgentConfig } from './taskValidation'

export const agentService = {
  async config(signal?: AbortSignal) {
    if (import.meta.env.DEV && isDemoAuth) return (await import('./demoWorkspaceService')).demoWorkspaceService.config()
    return parseAgentConfig(await api<unknown>('/agents/config', { signal }))
  },
}
