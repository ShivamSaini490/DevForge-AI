import { createStore } from 'zustand/vanilla'
import { agentOrder } from '../constants/agentNames'
import { parseExecutionEvent } from '../services/executionValidation'
import type { AgentProgress, ConnectionState, ExecutionData } from '../types/execution'
import type { TaskDetails } from '../types/workspace'

export const isTerminal = (status: TaskDetails['status']) => ['completed', 'failed', 'cancelled'].includes(status)
interface ExecutionStore extends ExecutionData {
  applyEvent: (value: unknown) => boolean
  setConnection: (state: ConnectionState) => void
  syncTask: (task: TaskDetails) => void
}
const clearActive = (agents: AgentProgress[]) => agents.map((agent) => agent.state === 'active' ? { ...agent, state: 'waiting' as const } : agent)

// One store per mounted execution view prevents data leaking between tasks/accounts.
export function createExecutionStore(task: TaskDetails) {
  return createStore<ExecutionStore>((set, get) => ({
    task, connection: 'connecting', agents: agentOrder.map((id) => ({ id, state: 'waiting' })),
    plan: [], logs: [], files: [], tests: null, approvals: [], summary: null, seenIds: [], lastEventId: null,
    setConnection: (connection) => set({ connection }),
    syncTask: (incoming) => {
      const current = get().task
      if (incoming.id !== current.id || Date.parse(incoming.updatedAt) < Date.parse(current.updatedAt)
        || (isTerminal(current.status) && incoming.status !== current.status)) return
      set({ task: incoming, ...(isTerminal(incoming.status) ? { agents: clearActive(get().agents), connection: 'closed', approvals: [] } : {}) })
    },
    applyEvent: (value) => {
      const event = parseExecutionEvent(value)
      const state = get()
      if (!event || event.taskId !== state.task.id || state.seenIds.includes(event.id)) return false
      const next: Partial<ExecutionData> = { seenIds: [...state.seenIds.slice(-1999), event.id], lastEventId: event.id }
      const timestampIsCurrent = Date.parse(event.timestamp) >= Date.parse(state.task.updatedAt)
      const canChangeStatus = !isTerminal(state.task.status) && timestampIsCurrent
      const updateTask = (patch: Partial<TaskDetails>) => { next.task = { ...state.task, ...patch, updatedAt: event.timestamp } }
      switch (event.type) {
        case 'task_started':
          if (canChangeStatus) updateTask({ status: 'running', startedAt: state.task.startedAt ?? event.timestamp })
          else if (!state.task.startedAt && (!state.task.finishedAt || Date.parse(event.timestamp) <= Date.parse(state.task.finishedAt))) next.task = { ...state.task, startedAt: event.timestamp }
          break
        case 'agent_started': case 'agent_completed': case 'agent_failed': {
          const status = event.type === 'agent_started' ? 'active' : event.type === 'agent_completed' ? 'done' : 'failed'
          let agents = event.type === 'agent_started' ? clearActive(state.agents) : [...state.agents]
          if (!agents.some((agent) => agent.id === event.agent)) agents.push({ id: event.agent, state: 'waiting' })
          agents = agents.map((agent) => agent.id === event.agent ? { id: agent.id, state: status, message: event.message } : agent)
          next.agents = isTerminal(state.task.status) ? clearActive(agents) : agents
          if (event.type === 'agent_started' && canChangeStatus) { updateTask({ status: 'running', startedAt: state.task.startedAt ?? event.timestamp }); next.approvals = [] }
          break
        }
        case 'plan_updated': next.plan = event.steps; break
        case 'log': next.logs = [...state.logs.slice(-299), { id: event.id, timestamp: event.timestamp, message: event.message }]; break
        case 'file_changed': next.files = [...state.files.filter((file) => file.path !== event.file.path), event.file].slice(-500); break
        case 'test_result': next.tests = event.result; break
        case 'approval_required':
          if (canChangeStatus) { next.approvals = [...state.approvals.filter((item) => item.id !== event.approval.id), event.approval].slice(-100); updateTask({ status: 'waiting_approval' }) }
          break
        case 'task_completed': case 'task_failed': case 'task_cancelled': {
          const status = event.type === 'task_completed' ? 'completed' : event.type === 'task_failed' ? 'failed' : 'cancelled'
          if (canChangeStatus || state.task.status === status) {
            if (canChangeStatus) updateTask({ status, finishedAt: event.timestamp })
            else next.task = { ...state.task, finishedAt: state.task.finishedAt ?? event.timestamp }
            next.summary = event.summary
            next.agents = clearActive(state.agents); next.approvals = []; next.connection = 'closed'
          }
          break
        }
      }
      set(next)
      return true
    },
  }))
}
export type ExecutionStoreApi = ReturnType<typeof createExecutionStore>
