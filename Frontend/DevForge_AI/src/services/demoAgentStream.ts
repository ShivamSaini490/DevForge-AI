import { agentOrder } from '../constants/agentNames'
import type { ExecutionEvent, ExecutionPayload } from '../types/execution'
import type { TaskDetails } from '../types/workspace'

// Illustrative events only. This preview never changes code or reports real tests.
export function subscribeDemoExecution(task: TaskDetails, receive: (event: ExecutionEvent) => void) {
  const timers: ReturnType<typeof setTimeout>[] = []
  let sequence = 0
  const emit = (payload: ExecutionPayload) => receive({
    ...payload, id: `demo-${task.id}-${task.status}-${sequence++}`, taskId: task.id, timestamp: new Date().toISOString(),
  })
  const event = (delay: number, payload: ExecutionPayload) => timers.push(setTimeout(() => emit(payload), delay))
  if (task.status !== 'pending' && task.status !== 'cancelled') {
    event(100, { type: 'plan_updated', steps: ['Understand the request and repository context.', 'Prepare a focused implementation.', 'Check the changes and summarize the result.'] })
    event(150, { type: 'log', message: 'Demo preview connected. Activity below is simulated.' })
    if (task.status === 'running') {
      agentOrder.forEach((agent, index) => {
        event(500 + index * 2500, { type: 'agent_started', agent, message: `Previewing the ${agent} stage.` })
        event(2000 + index * 2500, { type: 'agent_completed', agent })
        event(2100 + index * 2500, { type: 'log', message: `Demo: ${agent} stage illustrated.` })
      })
      event(16000, { type: 'log', message: 'Demo preview finished. The task remains running until you cancel it; no AI work was performed.' })
    } else if (task.status === 'waiting_approval') {
      event(200, { type: 'agent_completed', agent: 'planner' })
      event(300, { type: 'approval_required', approval: { id: 'demo-review', description: 'Sample decision: review the proposed dependency update before continuing.' } })
    } else {
      for (const agent of task.status === 'failed' ? agentOrder.slice(0, 4) : agentOrder) event(200, { type: 'agent_completed', agent })
      if (task.status === 'failed') event(250, { type: 'agent_failed', agent: 'tester', message: 'Sample failure: an integration check timed out.' })
      event(300, { type: task.status === 'failed' ? 'task_failed' : 'task_completed', summary: task.status === 'failed' ? 'Demo result: an integration check needs attention. No tests were actually run.' : 'Demo result: the sample task is complete. No repository files were changed.' })
    }
  }
  return () => timers.forEach(clearTimeout)
}
