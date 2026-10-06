import { beforeEach, describe, expect, it, vi } from 'vitest'
import { projectService } from '../services/projectService'
import { taskService } from '../services/taskService'
import { api } from '../services/api'
import { parseProjects, parseTasks } from '../services/workspaceValidation'

vi.mock('../services/authService', () => ({ isDemoAuth: false }))
vi.mock('../services/api', () => ({ api: vi.fn() }))
beforeEach(() => vi.resetAllMocks())

describe('workspace API boundary', () => {
  it('requests projects and tasks from the API with cancellation signals', async () => {
    vi.mocked(api).mockResolvedValue([])
    const signal = new AbortController().signal
    expect(await projectService.list(signal)).toEqual([])
    expect(await taskService.list(signal)).toEqual([])
    expect(api).toHaveBeenCalledWith('/projects', { signal })
    expect(api).toHaveBeenCalledWith('/tasks', { signal })
  })
  it('rejects malformed project responses rather than crashing a card', () => {
    for (const response of [null, {}, [{ id: 'one' }], [{ id: 'one', name: 'Project', description: '', repository: null, recentTaskCount: -1, updatedAt: 'invalid' }]]) {
      expect(() => parseProjects(response)).toThrow('invalid projects')
    }
  })
  it('rejects unsupported task statuses and invalid dates', () => {
    const task = { id: 'one', projectId: 'project', projectName: 'Project', title: 'A task', status: 'running', updatedAt: '2026-10-05T10:00:00Z' }
    expect(parseTasks([task])).toEqual([task])
    expect(() => parseTasks([{ ...task, status: 'unknown' }])).toThrow('invalid tasks')
    expect(() => parseTasks([{ ...task, updatedAt: 'invalid' }])).toThrow('invalid tasks')
    expect(() => parseTasks([task, task])).toThrow('invalid tasks')
  })
})
