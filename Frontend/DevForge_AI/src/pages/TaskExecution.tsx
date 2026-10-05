import { useCallback } from 'react'
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

export default function TaskExecution() {
  const { taskId = '' } = useParams()
  const owner = useAuthStore((state) => state.user?.id)
  const load = useCallback((signal: AbortSignal) => taskService.get(taskId, signal), [taskId])
  const { data: task, loading, error, retry, update } = useResource(load)
  return <>
    <PageHeader title="Task execution" subtitle={task?.title ?? 'Review your task and control its progress.'} />
    {loading ? <ListSkeleton /> : error ? <section className="panel"><LoadError title="Could not load task" message={error} onRetry={retry} /></section> : task && <>
      <Link className="text-link back-link" to={`/projects/${encodeURIComponent(task.projectId)}`}>Back to {task.projectName}</Link>
      {isDemoAuth && <p className="muted">Demo task · Start and cancel simulate status changes. No AI, code changes, or tests are executed.</p>}
      <section className="panel detail-panel">
        <div className="task-detail-heading"><h2>{task.title}</h2><StatusBadge status={task.status} /></div>
        <dl className="detail-facts"><div><dt>Project</dt><dd>{task.projectName}</dd></div><div><dt>Branch</dt><dd>{task.branch ?? 'Not set'}</dd></div>
          <div><dt>Mode</dt><dd>{task.mode}</dd></div><div><dt>AI model</dt><dd>{!task.provider || task.provider === 'auto' ? 'Auto - system chooses' : `${task.provider} / ${task.model ?? 'System chooses'}`}</dd></div>
          <div><dt>Last updated</dt><dd><time dateTime={task.updatedAt}>{formatDate(task.updatedAt)}</time></dd></div></dl>
        <h3>Task description</h3><p className="detail-copy preserve-lines">{task.description}</p>
        {task.constraints && <><h3>Constraints</h3><p className="detail-copy preserve-lines">{task.constraints}</p></>}
        <TaskActions key={`${owner}:${task.id}`} task={task} onChange={update} onRefresh={retry} />
      </section>
    </>}
  </>
}
