import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../services/api'
import { projectService } from '../services/projectService'
import { taskService } from '../services/taskService'
import { agentService } from '../services/agentService'
import { parseAgentConfig, parseProjectDetails, parseTaskDetails, parseTaskDiff, parseTaskTests } from '../services/taskValidation'
import { config, project, task } from './taskFixtures'

vi.mock('../services/authService', () => ({ isDemoAuth: false }))
vi.mock('../services/api', () => ({ api: vi.fn() }))
beforeEach(() => vi.resetAllMocks())

describe('days 9–12 API contracts', () => {
  it('loads project details and public model configuration', async () => {
    const signal = new AbortController().signal
    vi.mocked(api).mockResolvedValueOnce({ ...project, id: 'org/shop', tasks: [] }).mockResolvedValueOnce(config)
    expect((await projectService.get('org/shop', signal)).id).toBe('org/shop')
    expect(await agentService.config(signal)).toEqual(config)
    expect(api).toHaveBeenCalledWith('/projects/org%2Fshop', { signal })
    expect(api).toHaveBeenCalledWith('/agents/config', { signal })
  })
  it('creates a task, fetches its details, starts and cancels with encoded IDs and signals', async () => {
    const signal = new AbortController().signal
    const input = { description: 'Add tests', constraints: 'Keep API', mode: 'implement' as const, provider: 'openai', model: 'code' }
    vi.mocked(api).mockResolvedValue({ ...task, id: 'task/1', projectId: 'org/shop' })
    await taskService.create('org/shop', input, signal)
    await taskService.get('task/1', signal)
    await taskService.start('task/1', signal)
    await taskService.cancel('task/1', signal)
    expect(api).toHaveBeenCalledWith('/projects/org%2Fshop/tasks', { method: 'POST', body: JSON.stringify(input), signal })
    expect(api).toHaveBeenCalledWith('/tasks/task%2F1', { method: 'GET', signal })
    expect(api).toHaveBeenCalledWith('/tasks/task%2F1/start', { method: 'POST', signal })
    expect(api).toHaveBeenCalledWith('/tasks/task%2F1/cancel', { method: 'POST', signal })
  })
  it('fetches typed diff and test results', async () => {
    const signal = new AbortController().signal
    const diff = { files: [{ path: 'src/app.ts', status: 'modified', diff: '+test' }] }
    const tests = { status: 'passed', passed: 5, failed: 0, output: 'Passed' }
    vi.mocked(api).mockResolvedValueOnce(diff).mockResolvedValueOnce(tests)
    expect(await taskService.diff('task/1', signal)).toEqual(diff)
    expect(await taskService.tests('task/1', signal)).toEqual(tests)
    expect(api).toHaveBeenCalledWith('/tasks/task%2F1/diff', { signal })
    expect(api).toHaveBeenCalledWith('/tasks/task%2F1/tests', { signal })
  })
  it('rejects responses for different requested resources', async () => {
    vi.mocked(api).mockResolvedValueOnce(project).mockResolvedValueOnce(task).mockResolvedValueOnce(task)
    await expect(projectService.get('wrong')).rejects.toThrow('different project')
    await expect(taskService.get('wrong')).rejects.toThrow('different task')
    await expect(taskService.create('wrong', { description: 'Test', mode: 'implement', constraints: '' })).rejects.toThrow('different project')
  })
  it('validates detail responses, file metadata, task history, modes and test counts', () => {
    expect(parseProjectDetails(project)).toEqual(project)
    expect(parseTaskDetails(task)).toEqual(task)
    for (const value of [{ ...project, repositoryStatus: 'unknown' }, { ...project, files: [{ path: 'a', size: -1 }] }, { ...project, tasks: [{ ...task, projectId: 'other' }] }]) {
      expect(() => parseProjectDetails(value)).toThrow('invalid')
    }
    expect(() => parseTaskDetails({ ...task, mode: 'invalid' })).toThrow('invalid')
    expect(() => parseTaskDetails({ ...task, provider: 'auto', model: 'code' })).toThrow('invalid')
    expect(() => parseAgentConfig({ ...config, modes: ['review'] })).toThrow('invalid')
    expect(() => parseAgentConfig({ ...config, providers: [...config.providers, config.providers[0]] })).toThrow('invalid')
    expect(() => parseTaskDiff({ files: [{ path: 'a', status: 'unknown' }] })).toThrow('invalid')
    expect(() => parseTaskTests({ status: 'passed', passed: -1, failed: 0, output: '' })).toThrow('invalid')
  })
  it('allowlists public model configuration without propagating secret fields', () => {
    const result = parseAgentConfig({ ...config, apiKey: 'unexpected', providers: config.providers.map((p) => ({ ...p, apiKey: 'unexpected' })) })
    expect(result).toEqual(config)
    expect(JSON.stringify(result)).not.toContain('unexpected')
  })
})
