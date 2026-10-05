export const taskStatuses = {
  pending: { label: 'Pending', tone: 'neutral' },
  running: { label: 'Running', tone: 'blue' },
  waiting_approval: { label: 'Waiting for approval', tone: 'amber' },
  completed: { label: 'Completed', tone: 'green' },
  failed: { label: 'Failed', tone: 'red' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
} as const
export type TaskStatus = keyof typeof taskStatuses
