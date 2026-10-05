import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/authService'
import { ApiError } from '../services/api'
import { authDestination } from '../utils/validation'

vi.mock('../services/authService', () => ({
  isDemoAuth: false,
  authService: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn() },
}))
vi.mock('../services/projectService', () => ({ projectService: { list: async () => [] } }))
vi.mock('../services/taskService', () => ({ taskService: { list: async () => [] } }))
const account = { id: '1', name: 'Alex Morgan', email: 'alex@example.com' }
function open(path = '/login') {
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
}
beforeEach(() => {
  vi.resetAllMocks()
  useAuthStore.setState({ user: null, initialized: false, loading: false, error: null })
  vi.mocked(authService.me).mockRejectedValue(new ApiError('Unauthorized', 401))
})
describe('auth forms and routes', () => {
  it('blocks private routes and returns to the requested page after login with Enter', async () => {
    vi.mocked(authService.login).mockResolvedValue(account)
    const user = userEvent.setup()
    open('/projects')
    await user.type(await screen.findByLabelText('Email address'), 'alex@example.com')
    await user.type(screen.getByLabelText('Password', { exact: true }), 'password123{Enter}')
    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument()
    expect(authService.login).toHaveBeenCalledWith({ email: 'alex@example.com', password: 'password123' })
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('aria-current', 'page')
  })
  it('validates empty fields and malformed email before sending requests', async () => {
    const user = userEvent.setup()
    open()
    await user.click(await screen.findByRole('button', { name: 'Sign in' }))
    expect(screen.getByText('Enter your email address.')).toBeInTheDocument()
    expect(screen.getByText('Enter your password.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Email address'), 'invalid')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(authService.login).not.toHaveBeenCalled()
  })
  it('toggles password visibility and reports wrong credentials', async () => {
    vi.mocked(authService.login).mockRejectedValue(new ApiError('Incorrect credentials.', 401))
    const user = userEvent.setup()
    open()
    await user.type(await screen.findByLabelText('Email address'), 'alex@example.com')
    const password = screen.getByLabelText('Password', { exact: true })
    await user.type(password, 'badpassword')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(password).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect credentials.')
  })
  it('disables submission during login and prevents duplicate requests', async () => {
    let finish!: (value: typeof account) => void
    vi.mocked(authService.login).mockImplementation(() => new Promise((resolve) => { finish = resolve }))
    const user = userEvent.setup()
    open()
    await user.type(await screen.findByLabelText('Email address'), 'alex@example.com')
    await user.type(screen.getByLabelText('Password', { exact: true }), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Signing in…' }))
    expect(authService.login).toHaveBeenCalledTimes(1)
    finish(account)
    expect(await screen.findByRole('heading', { name: 'Welcome, Alex.' })).toBeInTheDocument()
  })
  it('validates registration and excludes password confirmation from the request', async () => {
    vi.mocked(authService.register).mockResolvedValue(account)
    const user = userEvent.setup()
    open('/register')
    await user.click(await screen.findByRole('button', { name: 'Create account' }))
    expect(screen.getByText('Enter your name.')).toBeInTheDocument()
    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Full name'), '  Alex Morgan  ')
    await user.type(screen.getByLabelText('Email address'), 'alex@example.com')
    await user.type(screen.getByLabelText('Password', { exact: true }), 'password123')
    await user.type(screen.getByLabelText('Confirm password'), 'different')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(authService.register).not.toHaveBeenCalled()
    await user.clear(screen.getByLabelText('Confirm password'))
    await user.type(screen.getByLabelText('Confirm password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByRole('heading', { name: 'Welcome, Alex.' })).toBeInTheDocument()
    expect(authService.register).toHaveBeenCalledWith({ name: 'Alex Morgan', email: 'alex@example.com', password: 'password123' })
  })
  it('restores an existing server session before rendering private content', async () => {
    vi.mocked(authService.me).mockResolvedValue(account)
    open('/settings')
    expect(screen.getByRole('status')).toHaveTextContent('Opening your workspace')
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByText('alex@example.com')).toBeInTheDocument()
  })
  it('clears the local user and redirects after logout', async () => {
    vi.mocked(authService.me).mockResolvedValue(account)
    vi.mocked(authService.logout).mockResolvedValue()
    const user = userEvent.setup()
    open('/dashboard')
    await user.click(await screen.findByRole('button', { name: 'Sign out' }))
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(useAuthStore.getState().user).toBeNull()
  })
  it('clears local state and surfaces server logout failure', async () => {
    vi.mocked(authService.me).mockResolvedValue(account)
    vi.mocked(authService.logout).mockRejectedValue(new Error('offline'))
    const user = userEvent.setup()
    open('/dashboard')
    await user.click(await screen.findByRole('button', { name: 'Sign out' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Signed out locally')
    expect(useAuthStore.getState().user).toBeNull()
  })
  it('shows initialization network errors instead of an endless loader', async () => {
    vi.mocked(authService.me).mockRejectedValue(new Error('Unable to reach the server.'))
    open()
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to reach the server.')
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  })
  it.each([
    ['/dashboard', 'Welcome, Alex.'], ['/projects', 'Projects'],
    ['/projects/example', 'Project overview'], ['/projects/example/tasks/new', 'Create a task'],
    ['/tasks', 'Recent tasks'], ['/tasks/example', 'Task execution'], ['/settings', 'Settings'],
  ])('renders authenticated route %s', async (path, heading) => {
    vi.mocked(authService.me).mockResolvedValue(account)
    open(path)
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
  })
  it('handles unknown routes safely', async () => {
    open('/not-a-page')
    expect(screen.getByRole('heading', { name: 'A turn off the beaten path.' })).toBeInTheDocument()
    await waitFor(() => expect(useAuthStore.getState().initialized).toBe(true))
  })
  it('rejects external or auth-page return URLs', () => {
    expect(authDestination({ from: 'https://example.com' })).toBe('/dashboard')
    expect(authDestination({ from: '//example.com' })).toBe('/dashboard')
    expect(authDestination({ from: '/login' })).toBe('/dashboard')
    expect(authDestination({ from: '/projects/123?tab=files' })).toBe('/projects/123?tab=files')
  })
})
