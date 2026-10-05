import { api } from './api'
import { isDemoAuth } from './authService'
import { parseProjects } from './workspaceValidation'

export const projectService = {
  async list(signal?: AbortSignal) {
    if (import.meta.env.DEV && isDemoAuth) return (await import('./demoWorkspaceService')).demoWorkspaceService.projects()
    return parseProjects(await api<unknown>('/projects', { signal }))
  },
}
