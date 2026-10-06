import { api } from './api'
import { isDemoAuth } from './authService'
import { parseTasks } from './workspaceValidation'
import { parseTaskDetails, parseTaskDiff, parseTaskTests } from './taskValidation'
import type { CreateTaskInput } from '../types/workspace'

async function taskRequest(id: string, action: '' | '/start' | '/cancel', signal?: AbortSignal) {
  if (import.meta.env.DEV && isDemoAuth) {
    const { demoWorkspaceService: demo } = await import('./demoWorkspaceService')
    return action ? demo.transition(id, action === '/start' ? 'start' : 'cancel') : demo.task(id)
  }
  const task = parseTaskDetails(await api<unknown>(`/tasks/${encodeURIComponent(id)}${action}`, { method: action ? 'POST' : 'GET', signal }))
  if (task.id !== id) throw new Error('The server returned a different task. Please refresh the details.')
  return task
}

export const taskService = {
  get: (id: string, signal?: AbortSignal) => taskRequest(id, '', signal),
  start: (id: string, signal?: AbortSignal) => taskRequest(id, '/start', signal),
  cancel: (id: string, signal?: AbortSignal) => taskRequest(id, '/cancel', signal),
  async create(projectId: string, input: CreateTaskInput, signal?: AbortSignal) {
    if (import.meta.env.DEV && isDemoAuth) return (await import('./demoWorkspaceService')).demoWorkspaceService.createTask(projectId, input)
    const task = parseTaskDetails(await api<unknown>(`/projects/${encodeURIComponent(projectId)}/tasks`, { method: 'POST', body: JSON.stringify(input), signal }))
    if (task.projectId !== projectId) throw new Error('The server returned a task for a different project. Please check project history before retrying.')
    return task
  },
  async diff(id: string, signal?: AbortSignal) {
    if (import.meta.env.DEV && isDemoAuth) { await (await import('./demoWorkspaceService')).demoWorkspaceService.task(id); return { files: [] } }
    return parseTaskDiff(await api<unknown>(`/tasks/${encodeURIComponent(id)}/diff`, { signal }))
  },
  async tests(id: string, signal?: AbortSignal) {
    if (import.meta.env.DEV && isDemoAuth) { await (await import('./demoWorkspaceService')).demoWorkspaceService.task(id); return { status: 'not_run' as const, passed: 0, failed: 0, output: '' } }
    return parseTaskTests(await api<unknown>(`/tasks/${encodeURIComponent(id)}/tests`, { signal }))
  },
  async list(signal?: AbortSignal) {
    if (import.meta.env.DEV && isDemoAuth) return (await import('./demoWorkspaceService')).demoWorkspaceService.tasks()
    return parseTasks(await api<unknown>('/tasks', { signal }))
  },
}
