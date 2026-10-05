import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TaskExecution from '../pages/TaskExecution'
import AgentTimeline from '../components/agents/AgentTimeline'
import ElapsedTime from '../components/tasks/ElapsedTime'
import { taskService } from '../services/taskService'
import { useAuthStore } from '../store/authStore'
import { task } from './taskFixtures'
import { MockEventSource } from './mockEventSource'
import { subscribeDemoExecution } from '../services/demoAgentStream'
import { createExecutionStore } from '../store/executionStore'
import { formatDuration } from '../utils/formatDuration'

vi.mock('../services/authService', () => ({ isDemoAuth: false }))
vi.mock('../services/taskService', () => ({ taskService: { get: vi.fn(), start: vi.fn(), cancel: vi.fn() } }))
beforeEach(() => {
  vi.resetAllMocks(); MockEventSource.instances = []; vi.stubGlobal('EventSource', MockEventSource)
  useAuthStore.setState({ user: { id: 'one', name: 'Alex', email: 'alex@example.com' } })
  vi.mocked(taskService.get).mockResolvedValue(task)
})
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })
function open() { return render(<MemoryRouter initialEntries={['/tasks/task-1']}><Routes><Route path="/tasks/:taskId" element={<TaskExecution />} /></Routes></MemoryRouter>) }
const panels = ['AI Plan', 'Agent Timeline', 'Live Logs', 'Changed Files', 'Tests', 'Approval Queue', 'Final Summary']
const base = { taskId: task.id, timestamp: '2026-10-05T10:00:00Z' }

describe('days 13–15 execution dashboard', () => {
  it('renders every panel with loading and empty states, task metadata and elapsed time', async () => {
    open()
    for (const title of panels) expect(screen.getByRole('status', { name: `Loading ${title}` })).toBeInTheDocument()
    await screen.findByRole('button', { name: 'Start AI' })
    for (const title of panels) expect(screen.getByRole('region', { name: title })).toBeInTheDocument()
    expect(screen.getByText('Not started')).toBeInTheDocument()
    expect(screen.getByText('main')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'AI team progress' }).children).toHaveLength(6)
  })
  it('updates panels, current agent, summary, status and controls from incoming SSE', async () => {
    open()
    await screen.findByRole('button', { name: 'Start AI' })
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1))
    const source = MockEventSource.instances[0]
    act(() => {
      source.open()
      source.message({ ...base, id: '1', type: 'plan_updated', steps: ['Inspect checkout'] })
      source.message({ ...base, id: '2', type: 'agent_started', agent: 'developer', message: 'Implementing checkout checks.' })
      source.message({ ...base, id: '3', type: 'log', message: '<script>untrusted text</script>' })
      source.message({ ...base, id: '4', type: 'file_changed', file: { path: 'src/app.ts', status: 'modified' } })
      source.message({ ...base, id: '5', type: 'test_result', result: { status: 'passed', passed: 2, failed: 0, output: 'Two checks passed' } })
      source.message({ ...base, id: '6', type: 'approval_required', approval: { id: 'approve', description: 'Approve dependency changes' } })
    })
    expect(screen.getByRole('status', { name: 'Stream connection' })).toHaveTextContent('Live')
    expect(screen.getByText('Inspect checkout')).toBeInTheDocument()
    expect(screen.getByText('Implementing checkout checks.')).toBeInTheDocument()
    expect(screen.getByText('<script>untrusted text</script>')).toBeInTheDocument()
    expect(screen.getByText('src/app.ts')).toBeInTheDocument()
    expect(screen.getByText('2 passed · 0 failed')).toBeInTheDocument()
    expect(screen.getByText('Approve dependency changes')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start AI' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel task' })).toBeInTheDocument()
    act(() => source.message({ ...base, id: '7', type: 'task_completed', summary: 'Checkout work completed.' }))
    expect(screen.getByText('Task completed. Review the results below.')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Final Summary' })).toHaveTextContent('Checkout work completed.')
    expect(screen.queryByRole('button', { name: 'Cancel task' })).not.toBeInTheDocument()
  })
  it('shows failed-task banners and stream reconnection feedback', async () => {
    open()
    await screen.findByRole('button', { name: 'Start AI' })
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1))
    const source = MockEventSource.instances[0]
    act(() => source.error())
    expect(screen.getByRole('status', { name: 'Stream connection' })).toHaveTextContent('Reconnecting')
    expect(screen.getByRole('button', { name: 'Reconnect stream' })).toBeInTheDocument()
    act(() => source.message({ ...base, id: 'failed', type: 'task_failed', summary: 'A check failed.' }))
    expect(screen.getByText('Task failed. Check the timeline and logs for details.')).toBeInTheDocument()
  })
  it('shows agent responsibilities on click and handles an unknown future agent', async () => {
    const user = userEvent.setup()
    render(<AgentTimeline agents={[{ id: 'planner', state: 'active' }, { id: 'new-agent', state: 'failed' }]} />)
    expect(screen.getByText('Planner').closest('li')).toHaveAttribute('aria-current', 'step')
    await user.click(screen.getByText('new-agent'))
    expect(screen.getByText('An additional agent is helping with this task.')).toBeVisible()
    expect(screen.getByText('new-agent').closest('li')).toHaveClass('agent-failed')
  })
  it('closes the stream and removes old task content on an account change', async () => {
    open()
    await screen.findByRole('button', { name: 'Start AI' })
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1))
    const source = MockEventSource.instances[0]
    act(() => source.message({ ...base, id: 'log', type: 'log', message: 'Previous account message' }))
    vi.mocked(taskService.get).mockRejectedValue(new Error('Task is unavailable.'))
    act(() => useAuthStore.setState({ user: { id: 'two', name: 'Sam', email: 'sam@example.com' } }))
    await screen.findByRole('alert')
    expect(source.close).toHaveBeenCalled()
    expect(screen.queryByText('Previous account message')).not.toBeInTheDocument()
  })
  it('ticks elapsed time from the actual start and freezes at the finish', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-05T10:00:00Z'))
    const started = { ...task, status: 'running' as const, startedAt: '2026-10-05T09:59:00Z' }
    const { rerender } = render(<ElapsedTime task={started} />)
    expect(screen.getByText('1m 0s')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(2000))
    expect(screen.getByText('1m 2s')).toBeInTheDocument()
    rerender(<ElapsedTime task={{ ...started, status: 'completed', finishedAt: '2026-10-05T10:00:03Z' }} />)
    act(() => vi.advanceTimersByTime(5000))
    expect(screen.getByText('1m 3s')).toBeInTheDocument()
    expect(formatDuration(-1)).toBe('Not available')
    expect(formatDuration(3661000)).toBe('1h 1m 1s')
  })
  it('runs and cleans up a simulated agent sequence without claiming real work', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-05T10:00:00Z'))
    const store = createExecutionStore({ ...task, status: 'running' })
    const stop = subscribeDemoExecution(store.getState().task, store.getState().applyEvent)
    vi.advanceTimersByTime(600)
    expect(store.getState().agents.find((a) => a.id === 'manager')?.state).toBe('active')
    expect(store.getState().logs[0].message).toContain('simulated')
    stop()
    const previous = store.getState()
    vi.advanceTimersByTime(20000)
    expect(store.getState()).toBe(previous)
    render(<AgentTimeline agents={store.getState().agents} />)
    expect(within(screen.getByRole('list', { name: 'AI team progress' })).getByText('Manager')).toBeInTheDocument()
  })
})
