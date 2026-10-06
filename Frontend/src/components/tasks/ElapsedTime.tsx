import { useEffect, useState } from 'react'
import type { TaskDetails } from '../../types/workspace'
import { isTerminal } from '../../store/executionStore'
import { formatDuration } from '../../utils/formatDuration'

export default function ElapsedTime({ task }: { task: TaskDetails }) {
  const [now, setNow] = useState(() => Date.now())
  const ticking = !!task.startedAt && !isTerminal(task.status)
  useEffect(() => {
    if (!ticking) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [ticking])
  const end = task.finishedAt ? Date.parse(task.finishedAt) : isTerminal(task.status) ? NaN : now
  return <span>{task.status === 'pending' ? 'Not started' : task.startedAt ? formatDuration(end - Date.parse(task.startedAt)) : 'Not available'}</span>
}
