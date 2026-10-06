import { describe, expect, it } from 'vitest'
import { createExecutionStore } from '../store/executionStore'
import { parseExecutionEvent } from '../services/executionValidation'
import { task } from './taskFixtures'
import type { ExecutionPayload } from '../types/execution'

const event = (id: string, payload: ExecutionPayload) => ({ id, taskId: task.id, timestamp: '2026-10-05T10:00:00Z', ...payload })
describe('execution event state', () => {
  it('tracks six agents, current activity, failures and an unknown future role', () => {
    const store = createExecutionStore(task)
    expect(store.getState().agents).toHaveLength(6)
    store.getState().applyEvent(event('1', { type: 'agent_started', agent: 'planner' }))
    expect(store.getState().task.status).toBe('running')
    expect(store.getState().agents.find((a) => a.id === 'planner')?.state).toBe('active')
    store.getState().applyEvent(event('2', { type: 'agent_completed', agent: 'planner' }))
    store.getState().applyEvent(event('3', { type: 'agent_started', agent: 'future-agent' }))
    store.getState().applyEvent(event('4', { type: 'agent_failed', agent: 'future-agent', message: 'Could not finish.' }))
    expect(store.getState().agents.find((a) => a.id === 'planner')?.state).toBe('done')
    expect(store.getState().agents.find((a) => a.id === 'future-agent')?.state).toBe('failed')
  })
  it('updates each panel, deduplicates replayed events and bounds the log buffer', () => {
    const store = createExecutionStore(task)
    const apply = store.getState().applyEvent
    apply(event('plan', { type: 'plan_updated', steps: ['Inspect code', 'Add tests'] }))
    apply(event('file', { type: 'file_changed', file: { path: 'src/app.ts', status: 'added' } }))
    apply(event('file2', { type: 'file_changed', file: { path: 'src/app.ts', status: 'modified' } }))
    apply(event('test', { type: 'test_result', result: { status: 'passed', passed: 5, failed: 0, output: 'Passed' } }))
    const approval = event('approval', { type: 'approval_required', approval: { id: 'a', description: 'Review changes' } })
    expect(apply(approval)).toBe(true)
    expect(apply(approval)).toBe(false)
    expect(store.getState().task.status).toBe('waiting_approval')
    expect(store.getState().approvals).toHaveLength(1)
    expect(store.getState().files).toEqual([{ path: 'src/app.ts', status: 'modified' }])
    expect(store.getState().tests?.passed).toBe(5)
    expect(store.getState().plan).toHaveLength(2)
    for (let i = 0; i < 310; i++) apply(event(`log-${i}`, { type: 'log', message: `Message ${i}` }))
    expect(store.getState().logs).toHaveLength(300)
    expect(store.getState().logs[0].message).toBe('Message 10')
  })
  it('clears active work on completion and prevents stale HTTP responses from undoing it', () => {
    const store = createExecutionStore(task)
    store.getState().applyEvent(event('1', { type: 'agent_started', agent: 'developer' }))
    store.getState().applyEvent(event('2', { type: 'task_completed', summary: 'Done with tests.' }))
    store.getState().syncTask({ ...task, status: 'running' })
    store.getState().applyEvent(event('3', { type: 'task_started' }))
    expect(store.getState().task.status).toBe('completed')
    expect(store.getState().task.finishedAt).toBe('2026-10-05T10:00:00Z')
    expect(store.getState().agents.some((a) => a.state === 'active')).toBe(false)
    expect(store.getState().summary).toBe('Done with tests.')
    expect(store.getState().connection).toBe('closed')
  })
  it('ignores malformed, unknown and other-task events without poisoning the cursor', () => {
    const store = createExecutionStore(task)
    for (const value of [null, {}, { ...event('1', { type: 'log', message: 'a' }), timestamp: 'bad' },
      { ...event('1', { type: 'log', message: 'a' }), taskId: 'other' }, event('1', { type: 'test_result', result: { status: 'passed', passed: -1, failed: 0, output: '' } }),
      { ...event('1', { type: 'log', message: 'a' }), type: 'unknown' }]) expect(store.getState().applyEvent(value)).toBe(false)
    expect(store.getState().lastEventId).toBeNull()
    expect(parseExecutionEvent({ ...event('1', { type: 'log', message: 'text' }), extra: 'ignored' })).not.toHaveProperty('extra')
  })
  it('isolates separate task stores and accepts a cancellation response', () => {
    const first = createExecutionStore(task)
    const second = createExecutionStore({ ...task, id: 'other' })
    first.getState().applyEvent(event('1', { type: 'log', message: 'Private task log' }))
    first.getState().syncTask({ ...task, status: 'cancelled' })
    expect(first.getState().connection).toBe('closed')
    expect(second.getState().logs).toEqual([])
    second.getState().syncTask(task)
    expect(second.getState().task.id).toBe('other')
  })
  it('restores historical start/finish data for an already completed task without regressing its status', () => {
    const store = createExecutionStore({ ...task, status: 'completed', updatedAt: '2026-10-05T12:00:00Z' })
    store.getState().applyEvent({ ...event('start', { type: 'task_started' }), timestamp: '2026-10-05T09:55:00Z' })
    store.getState().applyEvent(event('finish', { type: 'task_completed', summary: 'Saved result' }))
    expect(store.getState().task.startedAt).toBe('2026-10-05T09:55:00Z')
    expect(store.getState().task.finishedAt).toBe('2026-10-05T10:00:00Z')
    expect(store.getState().task.updatedAt).toBe('2026-10-05T12:00:00Z')
    expect(store.getState().task.status).toBe('completed')
    expect(store.getState().summary).toBe('Saved result')
  })
})
