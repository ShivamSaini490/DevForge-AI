import type { ExecutionEvent } from '../types/execution'
import { parseTaskTests } from './taskValidation'

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const text = (value: unknown, limit = 20000): value is string => typeof value === 'string' && !!value.trim() && value.length <= limit

// Stream input is untrusted. Unknown event types and malformed payloads are ignored.
export function parseExecutionEvent(value: unknown): ExecutionEvent | null {
  if (!record(value) || !text(value.id, 256) || !text(value.taskId, 256) || !text(value.timestamp, 64)
    || !Number.isFinite(Date.parse(value.timestamp))) return null
  const base = { id: value.id, taskId: value.taskId, timestamp: value.timestamp }
  switch (value.type) {
    case 'task_started': return { ...base, type: value.type }
    case 'agent_started': case 'agent_completed': case 'agent_failed':
      if (!text(value.agent, 100) || (value.message !== undefined && !text(value.message))) return null
      return { ...base, type: value.type, agent: value.agent, ...(value.message ? { message: value.message as string } : {}) }
    case 'plan_updated':
      return Array.isArray(value.steps) && value.steps.length <= 100 && value.steps.every((step) => text(step, 2000))
        ? { ...base, type: value.type, steps: value.steps } : null
    case 'log': return text(value.message) ? { ...base, type: value.type, message: value.message } : null
    case 'file_changed': {
      const file = value.file
      if (!record(file) || !text(file.path, 2000) || !['added', 'modified', 'deleted'].includes(String(file.status))) return null
      return { ...base, type: value.type, file: { path: file.path, status: file.status as 'added' | 'modified' | 'deleted' } }
    }
    case 'test_result':
      try { return { ...base, type: value.type, result: parseTaskTests(value.result) } } catch { return null }
    case 'approval_required': {
      const approval = value.approval
      return record(approval) && text(approval.id, 256) && text(approval.description)
        ? { ...base, type: value.type, approval: { id: approval.id, description: approval.description } } : null
    }
    case 'task_completed': case 'task_failed': case 'task_cancelled':
      return text(value.summary) ? { ...base, type: value.type, summary: value.summary } : null
    default: return null
  }
}
