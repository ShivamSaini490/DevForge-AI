import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/layout/PageHeader'
import LoadError from '../components/common/LoadError'
import ListSkeleton from '../components/common/ListSkeleton'
import TaskForm from '../components/tasks/TaskForm'
import RepositoryStatus from '../components/projects/RepositoryStatus'
import { projectService } from '../services/projectService'
import { agentService } from '../services/agentService'
import { useResource } from '../hooks/useResource'
import { useAuthStore } from '../store/authStore'
import { isDemoAuth } from '../services/authService'

export default function CreateTask() {
  const { projectId = '' } = useParams()
  const owner = useAuthStore((state) => state.user?.id)
  const load = useCallback(async (signal: AbortSignal) => {
    const [project, config] = await Promise.all([projectService.get(projectId, signal), agentService.config(signal)])
    return { project, config }
  }, [projectId])
  const { data, loading, error, retry } = useResource(load)
  return <>
    <PageHeader title="Create a task" subtitle={data ? `Project: ${data.project.name}` : 'Describe an outcome. Let AI help with the work.'} />
    <Link className="text-link back-link" to={`/projects/${encodeURIComponent(projectId)}`}>Back to project</Link>
    {isDemoAuth && <p className="muted">Demo mode · Tasks are saved for this page session. Starting a task simulates its status; no AI runs.</p>}
    {loading ? <ListSkeleton /> : error ? <section className="panel"><LoadError title="Could not prepare task form" message={error} onRetry={retry} /></section> : data && <section className="panel detail-panel task-form-panel">
      {data.project.repositoryStatus !== 'ready' && <><RepositoryStatus status={data.project.repositoryStatus} /><button className="button button-secondary" onClick={retry}>Refresh repository status</button></>}
      <TaskForm key={`${owner}:${projectId}`} project={data.project} config={data.config} />
    </section>}
  </>
}
