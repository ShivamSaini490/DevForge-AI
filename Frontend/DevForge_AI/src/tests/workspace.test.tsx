import { act, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Dashboard from '../pages/Dashboard'
import Projects from '../pages/Projects'
import { useProjects } from '../hooks/useProjects'
import { projectService } from '../services/projectService'
import { taskService } from '../services/taskService'
import { useAuthStore } from '../store/authStore'
import type { Project, Task } from '../types/workspace'
import { taskStatuses } from '../constants/taskStatus'

vi.mock('../services/authService', () => ({ isDemoAuth: false }))
vi.mock('../services/projectService', () => ({ projectService: { list: vi.fn() } }))
vi.mock('../services/taskService', () => ({ taskService: { list: vi.fn() } }))

const projects: Project[] = [
  { id: 'shop', name: 'Storefront', description: 'Shopping tools', repository: { url: 'https://github.com/example/shop', defaultBranch: 'main' }, recentTaskCount: 5, updatedAt: '2026-10-05T09:00:00Z' },
  { id: 'design', name: 'Design system', description: 'Shared components', repository: null, recentTaskCount: 0, updatedAt: '2026-10-04T09:00:00Z' },
]
const tasks: Task[] = Object.keys(taskStatuses).map((status, index) => ({
  id: `task-${index}`, projectId: 'shop', projectName: 'Storefront', title: `Work item ${index}`,
  status: status as Task['status'], updatedAt: `2026-10-0${index + 1}T09:00:00Z`,
}))
function open(page: 'dashboard' | 'projects') {
  return render(<MemoryRouter initialEntries={[`/${page}`]}><Routes>
    <Route path="/dashboard" element={<Dashboard />} /><Route path="/projects" element={<Projects />} />
    <Route path="/projects/:projectId" element={<h1>Opened project</h1>} />
    <Route path="/tasks/:taskId" element={<h1>Opened task</h1>} />
  </Routes></MemoryRouter>)
}
beforeEach(() => {
  vi.resetAllMocks()
  useAuthStore.setState({ user: { id: 'one', name: 'Alex', email: 'alex@example.com' } })
  vi.mocked(projectService.list).mockResolvedValue(projects)
  vi.mocked(taskService.list).mockResolvedValue(tasks)
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute('open', '') } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute('open') } })
})

describe('day 6 dashboard', () => {
  it('derives statistics, displays every status, and sorts recent work newest first', async () => {
    open('dashboard')
    await screen.findByRole('link', { name: 'Work item 0' })
    expect(within(screen.getByRole('article', { name: 'Projects' })).getByText('2')).toBeInTheDocument()
    for (const label of ['Running tasks', 'Waiting approval', 'Completed', 'Failed']) {
      expect(within(screen.getByRole('article', { name: label })).getByText('1')).toBeInTheDocument()
    }
    const recent = screen.getByRole('region', { name: 'Recent AI tasks' })
    for (const { label } of Object.values(taskStatuses)) expect(within(recent).getByText(label)).toBeInTheDocument()
    expect(within(recent).getAllByRole('listitem')[0]).toHaveTextContent('Work item 5')
    expect(within(screen.getByRole('region', { name: 'Your next decision' })).getByRole('link', { name: 'Work item 2' })).toHaveAttribute('href', '/tasks/task-2')
  })
  it('opens a running task through its route', async () => {
    const user = userEvent.setup()
    open('dashboard')
    await user.click(await screen.findByRole('link', { name: 'Work item 1' }))
    expect(screen.getByRole('heading', { name: 'Opened task' })).toBeInTheDocument()
  })
  it('shows an empty workspace with zero counts and a create-project action', async () => {
    vi.mocked(projectService.list).mockResolvedValue([])
    vi.mocked(taskService.list).mockResolvedValue([])
    open('dashboard')
    expect(await screen.findByText('No projects yet')).toBeInTheDocument()
    expect(await screen.findByText('No tasks yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create project' })).toBeEnabled()
    expect(within(screen.getByRole('article', { name: 'Running tasks' })).getByText('0')).toBeInTheDocument()
    expect(screen.getByText('No tasks are waiting for approval.')).toBeInTheDocument()
  })
  it('keeps successful project data visible when tasks fail and recovers on retry', async () => {
    vi.mocked(taskService.list).mockRejectedValueOnce(new Error('Task service is offline.'))
    const user = userEvent.setup()
    open('dashboard')
    expect(await screen.findByRole('alert')).toHaveTextContent('Task service is offline.')
    expect(within(screen.getByRole('article', { name: 'Projects' })).getByText('2')).toBeInTheDocument()
    expect(within(screen.getByRole('article', { name: 'Running tasks' })).getByText('Unavailable')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('link', { name: 'Work item 1' })).toBeInTheDocument()
  })
})

describe('day 7 projects', () => {
  it('shows a skeleton until projects arrive, then repository and branch details', async () => {
    let finish!: (value: Project[]) => void
    vi.mocked(projectService.list).mockReturnValue(new Promise((resolve) => { finish = resolve }))
    open('projects')
    expect(screen.getByRole('status', { name: 'Loading projects' })).toBeInTheDocument()
    await act(async () => finish(projects))
    expect(screen.getByText('Repository connected')).toBeInTheDocument()
    expect(screen.getByText('No repo connected')).toBeInTheDocument()
    expect(screen.getByText('main')).toBeInTheDocument()
    expect(screen.getByText('Not set')).toBeInTheDocument()
  })
  it('searches case-insensitively by name, repository, and branch, and can clear no results', async () => {
    const user = userEvent.setup()
    open('projects')
    await screen.findByRole('heading', { name: 'Storefront' })
    const search = screen.getByRole('searchbox', { name: 'Search projects' })
    for (const query of [' STOREFRONT ', 'example/shop', 'main']) {
      await user.clear(search)
      await user.type(search, query)
      expect(screen.getByRole('heading', { name: 'Storefront' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Design system' })).not.toBeInTheDocument()
    }
    await user.clear(search)
    await user.type(search, 'nothing-matches')
    expect(screen.getByRole('heading', { name: 'No matching projects' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(screen.getByRole('heading', { name: 'Design system' })).toBeInTheDocument()
    expect(search).toHaveValue('')
  })
  it('opens the selected project', async () => {
    const user = userEvent.setup()
    open('projects')
    const link = await screen.findByRole('link', { name: 'Open Storefront' })
    expect(link).toHaveAttribute('href', '/projects/shop')
    await user.click(link)
    expect(screen.getByRole('heading', { name: 'Opened project' })).toBeInTheDocument()
  })
  it('shows a useful API error and retries successfully', async () => {
    vi.mocked(projectService.list).mockRejectedValueOnce(new Error('Connection unavailable.'))
    const user = userEvent.setup()
    open('projects')
    expect(await screen.findByRole('alert')).toHaveTextContent('Connection unavailable.')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: 'Storefront' })).toBeInTheDocument()
  })
  it('distinguishes no projects from no matches and opens the project form', async () => {
    vi.mocked(projectService.list).mockResolvedValue([])
    const user = userEvent.setup()
    open('projects')
    expect(await screen.findByRole('heading', { name: 'No projects yet' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'No matching projects' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Create / Connect project' }))
    expect(screen.getByRole('dialog', { name: 'Create or connect a project' })).toHaveTextContent('Repository URL')
    expect(screen.getByLabelText('Default branch')).toHaveValue('main')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('ignores a previous account’s late response and cancels its request', async () => {
    let finishOld!: (value: Project[]) => void
    vi.mocked(projectService.list).mockReturnValueOnce(new Promise((resolve) => { finishOld = resolve })).mockResolvedValueOnce([])
    const { result } = renderHook(useProjects)
    const signal = vi.mocked(projectService.list).mock.calls[0][0]!
    act(() => { useAuthStore.setState({ user: { id: 'two', name: 'Sam', email: 'sam@example.com' } }) })
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => finishOld(projects))
    expect(signal.aborted).toBe(true)
    expect(result.current.data).toEqual([])
  })
})
