import { api } from './api'
import { isDemoAuth } from './authService'
import { parseProjects } from './workspaceValidation'
import { parseProjectDetails } from './taskValidation'
import type { CreateProjectInput } from '../types/workspace'
import { normalizeProjectInput, validateProjectInput } from '../utils/projectValidation'

export const projectService = {
  async create(input: CreateProjectInput, signal?: AbortSignal) {
    const payload = normalizeProjectInput(input)
    const errors = validateProjectInput(payload)
    if (Object.keys(errors).length) throw new Error(Object.values(errors)[0])
    if (import.meta.env.DEV && isDemoAuth) return (await import('./demoWorkspaceService')).demoWorkspaceService.createProject(payload, signal)
    return parseProjectDetails(await api<unknown>('/projects', { method: 'POST', body: JSON.stringify(payload), signal }))
  },
  async get(id: string, signal?: AbortSignal) {
    if (import.meta.env.DEV && isDemoAuth) return (await import('./demoWorkspaceService')).demoWorkspaceService.project(id)
    const project = parseProjectDetails(await api<unknown>(`/projects/${encodeURIComponent(id)}`, { signal }))
    if (project.id !== id) throw new Error('The server returned a different project. Please try again.')
    return project
  },
  async list(signal?: AbortSignal) {
    if (import.meta.env.DEV && isDemoAuth) return (await import('./demoWorkspaceService')).demoWorkspaceService.projects()
    return parseProjects(await api<unknown>('/projects', { signal }))
  },
}
