import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProjectDetails from '../pages/ProjectDetails'
import CreateTask from '../pages/CreateTask'
import TaskExecution from '../pages/TaskExecution'
import { projectService } from '../services/projectService'
import { taskService } from '../services/taskService'
import { agentService } from '../services/agentService'
import { ApiError } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { config, project, task } from './taskFixtures'
import type { TaskDetails } from '../types/workspace'

vi.mock('../services/authService', () => ({ isDemoAuth: false }))
vi.mock('../services/projectService', () => ({ projectService: { get: vi.fn() } }))
vi.mock('../services/taskService', () => ({ taskService: { get: vi.fn(), create: vi.fn(), start: vi.fn(), cancel: vi.fn() } }))
vi.mock('../services/agentService', () => ({ agentService: { config: vi.fn() } }))
function SwitchTask() {
  const navigate = useNavigate()
  return <button onClick={() => navigate('/tasks/another')}>Switch task</button>
}
function open(path = '/projects/shop/tasks/new') {
  return render(<MemoryRouter initialEntries={[path]}><SwitchTask /><Routes>
    <Route path="/projects/:projectId" element={<ProjectDetails />} />
    <Route path="/projects/:projectId/tasks/new" element={<CreateTask />} />
    <Route path="/tasks/:taskId" element={<TaskExecution />} />
  </Routes></MemoryRouter>)
}
beforeEach(() => {
  vi.resetAllMocks()
  useAuthStore.setState({ user: { id: 'one', name: 'Alex', email: 'alex@example.com' } })
  vi.mocked(projectService.get).mockResolvedValue(project)
  vi.mocked(agentService.config).mockResolvedValue(config)
  vi.mocked(taskService.get).mockResolvedValue(task)
  vi.mocked(taskService.create).mockResolvedValue(task)
  vi.mocked(taskService.start).mockResolvedValue({ ...task, status: 'running' })
  vi.mocked(taskService.cancel).mockResolvedValue({ ...task, status: 'cancelled' })
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute('open', '') } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute('open') } })
})

describe('day 9 project details', () => {
  it('loads the route project, shows file metadata, branch, history, and task links', async () => {
    const user = userEvent.setup()
    open('/projects/shop')
    expect(await screen.findByText('Repository ready')).toBeInTheDocument()
    expect(projectService.get).toHaveBeenCalledWith('shop', expect.any(AbortSignal))
    expect(screen.getByRole('link', { name: 'New AI Task' })).toHaveAttribute('href', '/projects/shop/tasks/new')
    expect(screen.getByText('main')).toBeInTheDocument()
    expect(screen.getByText('app.ts')).toBeInTheDocument()
    expect(screen.getByText('256 bytes')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'History' }))
    expect(screen.getByRole('region', { name: 'Task history' })).toHaveTextContent('Add checkout tests')
    expect(screen.getAllByRole('link', { name: 'Add checkout tests' })[0]).toHaveAttribute('href', '/tasks/task-1')
  })
  it.each(['indexing', 'error', 'disconnected'] as const)('shows %s repository state with empty history', async (repositoryStatus) => {
    vi.mocked(projectService.get).mockResolvedValue({ ...project, repositoryStatus, tasks: [], files: [] })
    open('/projects/shop')
    expect(await screen.findByText('No task history yet')).toBeInTheDocument()
    expect(screen.getByText('No files yet')).toBeInTheDocument()
    expect(screen.getByText(repositoryStatus === 'disconnected' ? 'No repository connected' : `Repository ${repositoryStatus}`)).toBeInTheDocument()
  })
  it('handles unknown projects and retries loading', async () => {
    vi.mocked(projectService.get).mockRejectedValueOnce(new ApiError('', 404))
    const user = userEvent.setup()
    open('/projects/shop')
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be found')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Repository ready')).toBeInTheDocument()
  })
})

describe('days 10–11 task creation', () => {
  it('defaults to Auto, blocks empty tasks, and sends trimmed input before redirecting', async () => {
    const user = userEvent.setup()
    open()
    expect(await screen.findByText('Auto - system chooses', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText(/Example: Add tests/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Create Task' }))
    expect(screen.getByText('Describe what you want the AI to do.')).toBeInTheDocument()
    expect(taskService.create).not.toHaveBeenCalled()
    await user.type(screen.getByLabelText('What would you like the AI to do?'), '  Add checkout tests  ')
    await user.type(screen.getByLabelText('Constraints (optional)'), '  Do not push to main  ')
    await user.click(screen.getByRole('button', { name: 'Create Task' }))
    expect(await screen.findByRole('button', { name: 'Start AI' })).toBeInTheDocument()
    expect(taskService.create).toHaveBeenCalledWith('shop', { description: 'Add checkout tests', constraints: 'Do not push to main', mode: 'implement', provider: 'auto' }, expect.any(AbortSignal))
  })
  it('disables unavailable choices, requires a model, and preserves chosen metadata', async () => {
    const user = userEvent.setup()
    open()
    await user.type(await screen.findByLabelText('What would you like the AI to do?'), 'Explain checkout')
    await user.selectOptions(screen.getByLabelText('Mode'), 'explain')
    await user.click(screen.getByText('Advanced model settings'))
    expect(screen.getByRole('option', { name: 'Anthropic - not configured' })).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('Provider'), 'openai')
    expect(screen.getByRole('option', { name: 'Offline model - unavailable' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Create Task' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose an available model')
    await user.selectOptions(screen.getByLabelText('Model'), 'code')
    await user.click(screen.getByText('Advanced model settings'))
    vi.mocked(taskService.get).mockResolvedValue({ ...task, mode: 'explain', provider: 'openai', model: 'code' })
    await user.click(screen.getByRole('button', { name: 'Create Task' }))
    expect(await screen.findByText('openai / code')).toBeInTheDocument()
    expect(taskService.create).toHaveBeenCalledWith('shop', expect.objectContaining({ mode: 'explain', provider: 'openai', model: 'code' }), expect.any(AbortSignal))
  })
  it('omits model metadata when backend configuration does not support selection', async () => {
    vi.mocked(agentService.config).mockResolvedValue({ modes: ['implement'], supportsModelSelection: false, providers: [] })
    const user = userEvent.setup()
    open()
    await user.type(await screen.findByLabelText('What would you like the AI to do?'), 'Add tests')
    await user.click(screen.getByRole('button', { name: 'Create Task' }))
    await screen.findByRole('button', { name: 'Start AI' })
    expect(taskService.create).toHaveBeenCalledWith('shop', { description: 'Add tests', constraints: '', mode: 'implement' }, expect.any(AbortSignal))
  })
  it('prevents duplicate submissions and retains inputs after an API error', async () => {
    let reject!: (error: Error) => void
    vi.mocked(taskService.create).mockReturnValueOnce(new Promise((_resolve, rejectPromise) => { reject = rejectPromise }))
    const user = userEvent.setup()
    open()
    await user.type(await screen.findByLabelText('What would you like the AI to do?'), 'Add tests')
    await user.dblClick(screen.getByRole('button', { name: 'Create Task' }))
    expect(screen.getByRole('button', { name: 'Creating task...' })).toBeDisabled()
    expect(taskService.create).toHaveBeenCalledTimes(1)
    await act(async () => reject(new ApiError('', 422)))
    expect(await screen.findByRole('alert')).toHaveTextContent('Check your task description')
    expect(screen.getByLabelText('What would you like the AI to do?')).toHaveValue('Add tests')
    expect(screen.getByRole('button', { name: 'Create Task' })).toBeEnabled()
  })
  it('blocks creation while repository indexing and recovers configuration errors', async () => {
    vi.mocked(projectService.get).mockResolvedValue({ ...project, repositoryStatus: 'indexing' })
    vi.mocked(agentService.config).mockRejectedValueOnce(new Error('Configuration unavailable.'))
    const user = userEvent.setup()
    open()
    expect(await screen.findByRole('alert')).toHaveTextContent('Configuration unavailable.')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('button', { name: 'Create Task' })).toBeDisabled()
    expect(screen.getByText('Repository indexing')).toBeInTheDocument()
  })
})

describe('day 12 task controls', () => {
  it('starts pending tasks and only cancels after confirmation', async () => {
    const user = userEvent.setup()
    open('/tasks/task-1')
    await user.click(await screen.findByRole('button', { name: 'Start AI' }))
    expect(await screen.findByText('Running')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start AI' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel task' }))
    expect(taskService.cancel).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Keep running' }))
    expect(taskService.cancel).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Cancel task' }))
    await user.click(screen.getByRole('button', { name: 'Confirm cancellation' }))
    expect(await screen.findByText('Cancelled')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel task' })).not.toBeInTheDocument()
  })
  it.each(['completed', 'failed', 'cancelled', 'waiting_approval'] as const)('uses correct controls for %s', async (status) => {
    vi.mocked(taskService.get).mockResolvedValue({ ...task, status })
    open('/tasks/task-1')
    await screen.findByRole('button', { name: 'Refresh details' })
    expect(screen.queryByRole('button', { name: 'Start AI' })).not.toBeInTheDocument()
    expect(!!screen.queryByRole('button', { name: 'Cancel task' })).toBe(status === 'waiting_approval')
  })
  it.each([409, 422, 500])('reports a human-readable %s action error without changing task state', async (status) => {
    vi.mocked(taskService.start).mockRejectedValue(new ApiError('Raw server error', status))
    const user = userEvent.setup()
    open('/tasks/task-1')
    await user.click(await screen.findByRole('button', { name: 'Start AI' }))
    expect(await screen.findByRole('alert')).not.toHaveTextContent('Raw server error')
    expect(screen.getByRole('button', { name: 'Start AI' })).toBeEnabled()
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })
  it('blocks duplicate starts and ignores late results after switching tasks', async () => {
    let finish!: (value: TaskDetails) => void
    vi.mocked(taskService.start).mockReturnValue(new Promise((resolve) => { finish = resolve }))
    const user = userEvent.setup()
    open('/tasks/task-1')
    await user.dblClick(await screen.findByRole('button', { name: 'Start AI' }))
    expect(taskService.start).toHaveBeenCalledTimes(1)
    const signal = vi.mocked(taskService.start).mock.calls[0][1]!
    vi.mocked(taskService.get).mockResolvedValue({ ...task, id: 'another', title: 'Another task' })
    await user.click(screen.getByRole('button', { name: 'Switch task' }))
    await screen.findByRole('heading', { name: 'Another task' })
    await act(async () => finish({ ...task, status: 'running' }))
    expect(signal.aborted).toBe(true)
    expect(screen.queryByText('Running')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start AI' })).toBeEnabled()
  })
  it('hides previous account data and ignores its late load result', async () => {
    let finish!: (value: TaskDetails) => void
    vi.mocked(taskService.get).mockReturnValueOnce(new Promise((resolve) => { finish = resolve }))
    open('/tasks/task-1')
    await waitFor(() => expect(taskService.get).toHaveBeenCalledTimes(1))
    vi.mocked(taskService.get).mockRejectedValueOnce(new ApiError('', 404))
    act(() => useAuthStore.setState({ user: { id: 'two', name: 'Sam', email: 'sam@example.com' } }))
    await screen.findByRole('alert')
    await act(async () => finish(task))
    expect(screen.queryByRole('button', { name: 'Start AI' })).not.toBeInTheDocument()
  })
})
