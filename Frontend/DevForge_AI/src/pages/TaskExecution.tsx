import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/layout/PageHeader'
import ListSkeleton from '../components/common/ListSkeleton'
import LoadError from '../components/common/LoadError'
import StatusBadge from '../components/common/StatusBadge'
import TaskActions from '../components/tasks/TaskActions'
import { taskService } from '../services/taskService'
import { isDemoAuth } from '../services/authService'
import { useResource } from '../hooks/useResource'
import { useAuthStore } from '../store/authStore'
import { formatDate } from '../utils/formatDate'
import TaskStatus from '../components/tasks/TaskStatus'
import ElapsedTime from '../components/tasks/ElapsedTime'
import ExecutionPanels from '../components/agents/ExecutionPanels'
import Button from '../components/common/Button'
import { useAgentStream } from '../hooks/useAgentStream'
import { createExecutionStore } from '../store/executionStore'
import type { TaskDetails } from '../types/workspace'

export default function TaskExecution() {
  const { taskId = '' } = useParams()
  const owner = useAuthStore((state) => state.user?.id)
  const load = useCallback((signal: AbortSignal) => taskService.get(taskId, signal), [taskId])
  const { data: task, loading, error, retry } = useResource(load)
  return <>
    <PageHeader title="Task execution" subtitle={task?.title ?? 'Review your task and control its progress.'} />
    {loading ? <><ListSkeleton /><ExecutionPanels loading /></> : error ? <section className="panel"><LoadError title="Could not load task" message={error} onRetry={retry} /></section>
      : task && <ExecutionView key={`${owner}:${task.id}`} initialTask={task} retry={retry} />}
  </>
}

function ExecutionView({ initialTask, retry }: { initialTask: TaskDetails; retry: () => void }) {
  const [store] = useState(() => createExecutionStore(initialTask))
  const data = useAgentStream(store)
  const { task, connection } = data
  const connectionLabels = { connecting: 'Connecting', live: isDemoAuth ? 'Demo stream' : 'Live', reconnecting: 'Reconnecting', offline: 'Offline', closed: 'Stream finished' }
  return <>
      <Link className="text-link back-link" to={`/projects/${encodeURIComponent(task.projectId)}`}>Back to {task.projectName}</Link>
      {isDemoAuth && <p className="muted">Demo task · Timeline and messages are simulated while this view is open. No AI, code changes, or tests are executed.</p>}
      <TaskStatus status={task.status} />
      <section className="panel detail-panel">
        <div className="task-detail-heading"><h2>{task.title}</h2><StatusBadge status={task.status} /></div>
        <dl className="detail-facts"><div><dt>Project</dt><dd>{task.projectName}</dd></div><div><dt>Branch</dt><dd>{task.branch ?? 'Not set'}</dd></div>
          <div><dt>Mode</dt><dd>{task.mode}</dd></div><div><dt>AI model</dt><dd>{!task.provider || task.provider === 'auto' ? 'Auto - system chooses' : `${task.provider} / ${task.model ?? 'System chooses'}`}</dd></div>
          <div><dt>Last updated</dt><dd><time dateTime={task.updatedAt}>{formatDate(task.updatedAt)}</time></dd></div></dl>
        <div className="execution-monitor"><div><span className="muted">Elapsed time</span><strong><ElapsedTime task={task} /></strong></div>
          <span role="status" aria-label="Stream connection" className={`status-badge status-${connection === 'live' ? 'green' : connection === 'offline' ? 'red' : 'neutral'}`}>{connectionLabels[connection]}</span>
          {['offline', 'reconnecting'].includes(connection) && <Button variant="secondary" onClick={data.reconnect}>Reconnect stream</Button>}
        </div>
        {connection === 'offline' && <p className="muted">Live updates are unavailable. Check your connection or session, then reconnect. You can still refresh task details.</p>}
        <TaskActions key={task.status} task={task} onChange={store.getState().syncTask} onRefresh={retry} />
        <details className="execution-request"><summary>Task request and constraints</summary>
        <h3>Task description</h3><p className="detail-copy preserve-lines">{task.description}</p>
        {task.constraints && <><h3>Constraints</h3><p className="detail-copy preserve-lines">{task.constraints}</p></>}
        </details>
      </section>
      <ExecutionPanels data={data} />
  </>
}
