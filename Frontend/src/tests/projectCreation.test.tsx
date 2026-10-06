import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Projects from '../pages/Projects'
import ProjectDetails from '../pages/ProjectDetails'
import { projectService } from '../services/projectService'
import { ApiError } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { project } from './taskFixtures'
import type { ProjectDetails as ProjectData } from '../types/workspace'

vi.mock('../services/authService', () => ({ isDemoAuth: false }))
vi.mock('../services/projectService', () => ({ projectService: { list: vi.fn(), get: vi.fn(), create: vi.fn() } }))

beforeEach(() => {
  vi.resetAllMocks()
  useAuthStore.setState({ user: { id: 'one', name: 'Alex', email: 'alex@example.com' } })
  vi.mocked(projectService.list).mockResolvedValue([])
  vi.mocked(projectService.create).mockResolvedValue({ ...project, repositoryStatus: 'indexing', files: [], tasks: [] })
  vi.mocked(projectService.get).mockResolvedValue({ ...project, repositoryStatus: 'indexing', files: [], tasks: [] })
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute('open', '') } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute('open') } })
})
async function open() {
  const user = userEvent.setup()
  render(<MemoryRouter initialEntries={['/projects']}><Routes>
    <Route path="/projects" element={<Projects />} />
    <Route path="/projects/:projectId" element={<ProjectDetails />} />
  </Routes></MemoryRouter>)
  await user.click(screen.getByRole('button', { name: 'Create / Connect project' }))
  return user
}
async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Project name'), '  Storefront  ')
  await user.type(screen.getByLabelText('Repository URL'), 'https://github.com/example/shop')
}

describe('day 8 project creation', () => {
  it('validates required fields and repository URLs before sending requests', async () => {
    const user = await open()
    expect(screen.getByLabelText('Default branch')).toHaveValue('main')
    expect(screen.getByText(/Paste the HTTPS clone URL/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Create Project' }))
    expect(screen.getByText('Enter a project name.')).toBeInTheDocument()
    expect(screen.getByLabelText('Project name')).toHaveFocus()
    await user.type(screen.getByLabelText('Project name'), 'Storefront')
    await user.type(screen.getByLabelText('Repository URL'), 'not-a-url')
    await user.clear(screen.getByLabelText('Default branch'))
    await user.click(screen.getByRole('button', { name: 'Create Project' }))
    expect(screen.getByText(/Enter an HTTPS repository URL/)).toBeInTheDocument()
    expect(screen.getByText('Enter the default branch.')).toBeInTheDocument()
    expect(projectService.create).not.toHaveBeenCalled()
  })
  it('sends trimmed fields, redirects to project details, and shows indexing status', async () => {
    const user = await open()
    await fill(user)
    await user.type(screen.getByLabelText('Description (optional)'), '  A shop  ')
    await user.clear(screen.getByLabelText('Default branch'))
    await user.type(screen.getByLabelText('Default branch'), ' develop{Enter}')
    expect(await screen.findByText('Repository indexing')).toBeInTheDocument()
    expect(projectService.create).toHaveBeenCalledWith({ name: 'Storefront', description: 'A shop', repositoryUrl: 'https://github.com/example/shop', defaultBranch: 'develop' }, expect.any(AbortSignal))
    expect(projectService.get).toHaveBeenCalledWith('shop', expect.any(AbortSignal))
    expect(screen.getByRole('link', { name: 'New AI Task' })).toHaveAttribute('href', '/projects/shop/tasks/new')
  })
  it.each([
    [409, 'A project with this name or repository already exists.'],
    [422, 'Check the project name, repository URL, and default branch'],
    [500, 'The server could not complete this request'],
    [0, 'Unable to reach the server'],
  ])('handles %s creation failures and preserves input for retry', async (status, message) => {
    vi.mocked(projectService.create).mockRejectedValueOnce(new ApiError('Raw server error', Number(status)))
    const user = await open()
    await fill(user)
    await user.click(screen.getByRole('button', { name: 'Create Project' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(String(message))
    expect(screen.getByLabelText('Project name')).toHaveValue('  Storefront  ')
    expect(screen.getByRole('button', { name: 'Create Project' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Create Project' }))
    expect(await screen.findByText('Repository indexing')).toBeInTheDocument()
  })
  it('blocks duplicate creation and dismissal while the request is pending', async () => {
    let finish!: (value: ProjectData) => void
    vi.mocked(projectService.create).mockReturnValueOnce(new Promise((resolve) => { finish = resolve }))
    const user = await open()
    await fill(user)
    await user.dblClick(screen.getByRole('button', { name: 'Create Project' }))
    expect(screen.getByRole('button', { name: 'Creating project...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(projectService.create).toHaveBeenCalledTimes(1)
    await act(async () => finish(project))
    expect(await screen.findByText('Repository indexing')).toBeInTheDocument()
  })
  it('cancels the old request and ignores its redirect after switching accounts', async () => {
    let finish!: (value: ProjectData) => void
    vi.mocked(projectService.create).mockReturnValueOnce(new Promise((resolve) => { finish = resolve }))
    const user = await open()
    await fill(user)
    await user.click(screen.getByRole('button', { name: 'Create Project' }))
    const signal = vi.mocked(projectService.create).mock.calls[0][1]!
    act(() => useAuthStore.setState({ user: { id: 'two', name: 'Sam', email: 'sam@example.com' } }))
    await act(async () => finish(project))
    expect(signal.aborted).toBe(true)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument()
    expect(projectService.get).not.toHaveBeenCalled()
  })
  it('resets cancelled form values when reopened without creating a project', async () => {
    const user = await open()
    await fill(user)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Create / Connect project' }))
    expect(screen.getByLabelText('Project name')).toHaveValue('')
    expect(projectService.create).not.toHaveBeenCalled()
  })
})
