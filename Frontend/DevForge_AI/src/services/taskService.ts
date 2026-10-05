import { api } from './api'
import { isDemoAuth } from './authService'
import { parseTasks } from './workspaceValidation'

export const taskService = {
  async list(signal?: AbortSignal) {
    if (import.meta.env.DEV && isDemoAuth) return (await import('./demoWorkspaceService')).demoWorkspaceService.tasks()
    return parseTasks(await api<unknown>('/tasks', { signal }))
  },
}
