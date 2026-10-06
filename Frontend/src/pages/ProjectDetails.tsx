import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/common/Button'
import EmptyState from '../components/common/EmptyState'
import ListSkeleton from '../components/common/ListSkeleton'
import LoadError from '../components/common/LoadError'
import FileTree from '../components/code/FileTree'
import TaskCard from '../components/tasks/TaskCard'
import RepositoryStatus from '../components/projects/RepositoryStatus'
import { projectService } from '../services/projectService'
import { useResource } from '../hooks/useResource'
import { isDemoAuth } from '../services/authService'

export default function ProjectDetails() {
  const { projectId = '' } = useParams()
  const load = useCallback((signal: AbortSignal) => projectService.get(projectId, signal), [projectId])
  const { data: project, loading, error, retry } = useResource(load)
  const [tab, setTab] = useState<'files' | 'history'>('files')
  const tasks = [...(project?.tasks ?? [])].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
  return <>
    <PageHeader title="Project overview" subtitle={project?.name ?? 'Repository context and recent work.'} action={project && <Link className="button button-primary" to={`/projects/${encodeURIComponent(project.id)}/tasks/new`}>New AI Task</Link>} />
    <Link className="text-link back-link" to="/projects">Back to projects</Link>
    {loading ? <ListSkeleton /> : error ? <section className="panel"><LoadError title="Could not load project" message={error} onRetry={retry} /></section> : project && <>
      {isDemoAuth && <p className="muted">Demo project · Repository status and file metadata are illustrative.</p>}
      <section className="panel detail-panel"><h2>{project.name}</h2><p className="detail-copy">{project.description || 'No project description yet.'}</p>
        <dl className="detail-facts"><div><dt>Repository</dt><dd>{project.repository?.url ?? 'Not connected'}</dd></div><div><dt>Default branch</dt><dd>{project.repository?.defaultBranch ?? 'Not set'}</dd></div></dl>
        <RepositoryStatus status={project.repositoryStatus} /><Button variant="secondary" onClick={retry}>Refresh project</Button>
      </section>
      <section className="panel detail-section"><div className="panel-heading"><h2>Recent tasks</h2></div>
        {tasks.length ? <ul className="task-list">{tasks.slice(0, 5).map((task) => <TaskCard key={task.id} task={task} />)}</ul> : <EmptyState title="No task history yet" description="Create your first AI task to start this project's history." />}
      </section>
      <section className="panel detail-section"><div className="detail-tabs" aria-label="Project views">
        <Button variant={tab === 'files' ? 'primary' : 'ghost'} aria-pressed={tab === 'files'} onClick={() => setTab('files')}>Files</Button>
        <Button variant={tab === 'history' ? 'primary' : 'ghost'} aria-pressed={tab === 'history'} onClick={() => setTab('history')}>History</Button></div>
        <div role="region" aria-label={tab === 'files' ? 'Project files' : 'Task history'}>{tab === 'files' ? <FileTree files={project.files} />
          : tasks.length ? <ul className="task-list">{tasks.map((task) => <TaskCard key={task.id} task={task} />)}</ul> : <EmptyState title="No task history yet" description="Tasks and their latest status will appear here." />}</div>
      </section>
    </>}
  </>
}
