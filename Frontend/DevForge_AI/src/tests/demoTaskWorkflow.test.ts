import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { demoAuthService } from '../services/demoAuthService'
import { demoWorkspaceService as demo } from '../services/demoWorkspaceService'

vi.mock('../services/demoAuthService', () => ({ demoAuthService: { me: vi.fn() } }))
beforeEach(() => {
  vi.mocked(demoAuthService.me).mockResolvedValue({ id: 'demo', name: 'Alex', email: 'demo@devforge.ai' })
})
afterEach(() => vi.useRealTimers())
it('creates projects for new accounts, simulates preparation and keeps accounts isolated', async () => {
  vi.useFakeTimers()
  vi.mocked(demoAuthService.me).mockResolvedValue({ id: 'new-account', name: 'Sam', email: 'sam@example.com' })
  expect(await demo.projects()).toEqual([])
  const input = { name: 'New project', description: 'A project', repositoryUrl: 'https://github.com/example/new-project', defaultBranch: 'main' }
  const created = await demo.createProject(input)
  expect(created.repositoryStatus).toBe('indexing')
  expect(created.files).toEqual([])
  expect((await demo.projects())[0].id).toBe(created.id)
  await expect(demo.createProject({ ...input, name: 'Another name', repositoryUrl: `${input.repositoryUrl}.git/` })).rejects.toMatchObject({ status: 409 })
  await expect(demo.createProject({ ...input, name: 'new PROJECT', repositoryUrl: 'https://github.com/example/another' })).rejects.toMatchObject({ status: 409 })
  await expect(demo.createTask(created.id, { description: 'Add tests', constraints: '', mode: 'implement' })).rejects.toMatchObject({ status: 409 })
  vi.advanceTimersByTime(3000)
  expect((await demo.project(created.id)).repositoryStatus).toBe('ready')
  expect((await demo.createTask(created.id, { description: 'Add tests', constraints: '', mode: 'implement' })).status).toBe('pending')
  vi.mocked(demoAuthService.me).mockResolvedValue({ id: 'separate-account', name: 'Lee', email: 'lee@example.com' })
  expect(await demo.projects()).toEqual([])
  await expect(demo.project(created.id)).rejects.toMatchObject({ status: 404 })
})
it('does not create a project if the request has been aborted', async () => {
  const controller = new AbortController()
  controller.abort()
  const before = await demo.projects()
  await expect(demo.createProject({ name: 'Aborted', description: '', repositoryUrl: 'https://github.com/example/aborted', defaultBranch: 'main' }, controller.signal)).rejects.toThrow()
  expect(await demo.projects()).toEqual(before)
})
it('creates, retrieves, starts and cancels a demo task and updates project history', async () => {
  const before = await demo.project('commerce')
  const task = await demo.createTask('commerce', { description: 'Demo task', constraints: 'Add tests', mode: 'review', provider: 'openai', model: 'demo-code' })
  expect(task.status).toBe('pending')
  expect(await demo.task(task.id)).toEqual(task)
  expect((await demo.project('commerce')).recentTaskCount).toBe(before.recentTaskCount + 1)
  expect((await demo.project('commerce')).tasks.some((t) => t.id === task.id)).toBe(true)
  expect((await demo.transition(task.id, 'start')).status).toBe('running')
  await expect(demo.transition(task.id, 'start')).rejects.toMatchObject({ status: 409 })
  expect((await demo.transition(task.id, 'cancel')).status).toBe('cancelled')
  await expect(demo.transition(task.id, 'cancel')).rejects.toMatchObject({ status: 409 })
  vi.mocked(demoAuthService.me).mockResolvedValue({ id: 'other', name: 'Sam', email: 'sam@example.com' })
  await expect(demo.task(task.id)).rejects.toMatchObject({ status: 404 })
  expect(await demo.tasks()).toEqual([])
})
it('rejects unready repositories and unavailable demo models', async () => {
  await expect(demo.createTask('platform-api', { description: 'Task', mode: 'implement', constraints: '' })).rejects.toMatchObject({ status: 409 })
  await expect(demo.createTask('commerce', { description: 'Task', mode: 'implement', constraints: '', provider: 'anthropic', model: 'unavailable' })).rejects.toMatchObject({ status: 422 })
})
