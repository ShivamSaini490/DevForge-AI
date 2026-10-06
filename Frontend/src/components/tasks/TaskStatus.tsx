import type { TaskStatus as Status } from '../../constants/taskStatus'

export default function TaskStatus({ status }: { status: Status }) {
  if (!['completed', 'failed', 'cancelled', 'waiting_approval'].includes(status)) return null
  const message = status === 'completed' ? 'Task completed. Review the results below.'
    : status === 'failed' ? 'Task failed. Check the timeline and logs for details.'
      : status === 'cancelled' ? 'Task cancelled. Changes already made may remain available for review.'
        : 'Your review is needed before this task can continue.'
  return <div role="status" className={`execution-banner status-${status === 'completed' ? 'green' : status === 'failed' ? 'red' : status === 'waiting_approval' ? 'amber' : 'neutral'}`}>{message}</div>
}
