import type { TaskDetails, TaskTests } from './workspace'

export type AgentState = 'waiting' | 'active' | 'done' | 'failed'
export type ConnectionState = 'connecting' | 'live' | 'reconnecting' | 'offline' | 'closed'
export interface AgentProgress { id: string; state: AgentState; message?: string }
export interface ExecutionLog { id: string; timestamp: string; message: string }
export interface ChangedFile { path: string; status: 'added' | 'modified' | 'deleted' }
export interface PendingApproval { id: string; description: string }
export type ExecutionPayload =
  | { type: 'task_started' }
  | { type: 'agent_started' | 'agent_completed' | 'agent_failed'; agent: string; message?: string }
  | { type: 'plan_updated'; steps: string[] }
  | { type: 'log'; message: string }
  | { type: 'file_changed'; file: ChangedFile }
  | { type: 'test_result'; result: TaskTests }
  | { type: 'approval_required'; approval: PendingApproval }
  | { type: 'task_completed' | 'task_failed' | 'task_cancelled'; summary: string }
export type ExecutionEvent = { id: string; taskId: string; timestamp: string } & ExecutionPayload
export interface ExecutionData {
  task: TaskDetails
  connection: ConnectionState
  agents: AgentProgress[]
  plan: string[]
  logs: ExecutionLog[]
  files: ChangedFile[]
  tests: TaskTests | null
  approvals: PendingApproval[]
  summary: string | null
  seenIds: string[]
  lastEventId: string | null
}
