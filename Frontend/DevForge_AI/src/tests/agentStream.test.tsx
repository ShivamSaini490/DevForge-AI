import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAgentStream } from '../hooks/useAgentStream'
import { createExecutionStore } from '../store/executionStore'
import { task } from './taskFixtures'
import { MockEventSource } from './mockEventSource'

vi.mock('../services/authService', () => ({ isDemoAuth: false }))
beforeEach(() => { MockEventSource.instances = []; vi.stubGlobal('EventSource', MockEventSource); vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true) })
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })
const log = { id: 'e1', taskId: task.id, timestamp: '2026-10-05T10:00:00Z', type: 'log', message: 'Inspecting repository' }

describe('SSE lifecycle', () => {
  it('uses credentialed SSE at the configured API path and updates state from JSON', () => {
    const store = createExecutionStore({ ...task, id: 'task/1' })
    const { result, unmount } = renderHook(() => useAgentStream(store))
    const source = MockEventSource.instances[0]
    expect(source.url).toBe('/api/tasks/task%2F1/stream')
    expect(source.options).toEqual({ withCredentials: true })
    expect(result.current.connection).toBe('connecting')
    act(() => source.open())
    expect(result.current.connection).toBe('live')
    act(() => source.message({ ...log, taskId: 'task/1' }))
    expect(result.current.logs[0].message).toBe(log.message)
    unmount()
    expect(source.close).toHaveBeenCalledTimes(1)
  })
  it('ignores malformed JSON, invalid payloads and duplicate replay', () => {
    const store = createExecutionStore(task)
    const { result } = renderHook(() => useAgentStream(store))
    const source = MockEventSource.instances[0]
    act(() => {
      source.onmessage?.({ data: '{bad json', lastEventId: '' })
      source.message({ id: 'bad' })
      source.message(log); source.message(log)
    })
    expect(result.current.logs).toHaveLength(1)
  })
  it('shows native reconnect state and supports a manual resume cursor', () => {
    const store = createExecutionStore(task)
    const { result } = renderHook(() => useAgentStream(store))
    const source = MockEventSource.instances[0]
    act(() => { source.open(); source.message(log); source.error() })
    expect(result.current.connection).toBe('reconnecting')
    expect(MockEventSource.instances).toHaveLength(1)
    act(() => result.current.reconnect())
    expect(source.close).toHaveBeenCalledTimes(1)
    expect(MockEventSource.instances[1].url).toBe('/api/tasks/task-1/stream?lastEventId=e1')
    act(() => MockEventSource.instances[1].open())
    expect(result.current.connection).toBe('live')
  })
  it('handles offline/online and a permanently closed connection', () => {
    const store = createExecutionStore(task)
    const { result } = renderHook(() => useAgentStream(store))
    act(() => window.dispatchEvent(new Event('offline')))
    expect(result.current.connection).toBe('offline')
    expect(MockEventSource.instances[0].close).toHaveBeenCalled()
    act(() => window.dispatchEvent(new Event('online')))
    act(() => MockEventSource.instances[1].error(2))
    expect(result.current.connection).toBe('offline')
  })
  it('closes old connections, clears the next task view and ignores queued callbacks', () => {
    const oldStore = createExecutionStore(task)
    const { result, rerender, unmount } = renderHook(({ store }) => useAgentStream(store), { initialProps: { store: oldStore } })
    const source = MockEventSource.instances[0]
    const queued = source.onmessage!
    act(() => source.message(log))
    const nextStore = createExecutionStore({ ...task, id: 'next-task' })
    rerender({ store: nextStore })
    expect(source.close).toHaveBeenCalled()
    act(() => queued({ data: JSON.stringify({ ...log, id: 'late' }), lastEventId: 'late' }))
    expect(result.current.logs).toHaveLength(0)
    expect(oldStore.getState().logs).toHaveLength(1)
    unmount()
    const count = MockEventSource.instances.length
    act(() => window.dispatchEvent(new Event('online')))
    expect(MockEventSource.instances).toHaveLength(count)
  })
  it('closes on terminal events and does not reopen when the network returns', () => {
    const store = createExecutionStore(task)
    const { result } = renderHook(() => useAgentStream(store))
    act(() => MockEventSource.instances[0].message({ ...log, type: 'task_completed', summary: 'All done' }))
    expect(result.current.task.status).toBe('completed')
    expect(result.current.connection).toBe('closed')
    expect(MockEventSource.instances[0].close).toHaveBeenCalled()
    act(() => window.dispatchEvent(new Event('online')))
    expect(MockEventSource.instances).toHaveLength(1)
  })
  it('cleans up streams when an HTTP cancellation arrives', () => {
    const store = createExecutionStore({ ...task, status: 'running' })
    renderHook(() => useAgentStream(store))
    act(() => store.getState().syncTask({ ...task, status: 'cancelled' }))
    expect(MockEventSource.instances[0].close).toHaveBeenCalledTimes(1)
  })
  it('shows offline when EventSource is unavailable instead of crashing the page', () => {
    vi.stubGlobal('EventSource', undefined)
    const store = createExecutionStore(task)
    const { result } = renderHook(() => useAgentStream(store))
    expect(result.current.connection).toBe('offline')
    expect(MockEventSource.instances).toHaveLength(0)
  })
})
