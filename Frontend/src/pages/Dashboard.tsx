import { ArrowRight, CircleCheck, CircleX, Clock3, FolderGit2, Play, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/layout/PageHeader'
import EmptyState from '../components/common/EmptyState'
import ListSkeleton from '../components/common/ListSkeleton'
import LoadError from '../components/common/LoadError'
import TaskCard from '../components/tasks/TaskCard'
import ConnectProjectButton from '../components/projects/ConnectProjectButton'
import { useAuth } from '../hooks/useAuth'
import { useProjects } from '../hooks/useProjects'
import { useTasks } from '../hooks/useTasks'
import { isDemoAuth } from '../services/authService'

export default function Dashboard() {
  const user = useAuth((state) => state.user)
  const projects = useProjects()
  const tasks = useTasks()
  const count = (status: string) => tasks.data.filter((task) => task.status === status).length
  const stats = [
    { label: 'Projects', value: projects.data.length, icon: FolderGit2, tone: 'blue', resource: projects },
    { label: 'Running tasks', value: count('running'), icon: Play, tone: 'blue', resource: tasks },
    { label: 'Waiting approval', value: count('waiting_approval'), icon: Clock3, tone: 'amber', resource: tasks },
    { label: 'Completed', value: count('completed'), icon: CircleCheck, tone: 'green', resource: tasks },
    { label: 'Failed', value: count('failed'), icon: CircleX, tone: 'red', resource: tasks },
  ]
  const recentTasks = [...tasks.data].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 6)
  const waitingTasks = tasks.data.filter((task) => task.status === 'waiting_approval')

  return <>
    <PageHeader title={`Welcome, ${user?.name.split(' ')[0] || 'builder'}.`} subtitle="Your projects, AI activity, and next decisions. All in one place."
      action={<Link className="button button-primary" to="/projects">Open projects<ArrowRight size={17} aria-hidden="true" /></Link>} />
    {isDemoAuth && <p className="workspace-demo-note">Demo workspace · Sample activity, not live AI runs.</p>}
    <section className="stats-grid" aria-label="Workspace statistics">{stats.map(({ label, value, icon: Icon, tone, resource }) =>
      <article className="panel stat-card" key={label} aria-label={label} aria-busy={resource.loading}>
        <span className={`stat-icon status-${tone}`} aria-hidden="true"><Icon size={19} /></span><h2>{label}</h2>
        {resource.loading ? <span className="skeleton stat-loading" aria-label="Loading" /> : <strong className="stat-value">{resource.error ? '—' : value}</strong>}
        <span className="stat-caption">{resource.error ? 'Unavailable' : label === 'Projects' ? 'In your workspace' : 'Across your projects'}</span>
      </article>
    )}</section>
    {projects.error && <div className="panel dashboard-project-state"><LoadError title="Could not load projects" message={projects.error} onRetry={projects.retry} /></div>}
    {!projects.loading && !projects.error && projects.data.length === 0 && <section className="panel dashboard-project-state"><EmptyState title="No projects yet" description="Start a project to bring your repository and AI tasks into one workspace." action={<ConnectProjectButton label="Create project" />} /></section>}
    <div className="dashboard-grid">
      <section className="panel" aria-labelledby="recent-tasks-title"><div className="panel-heading"><h2 id="recent-tasks-title">Recent AI tasks</h2><span className="subtle-label">LATEST ACTIVITY</span></div>
        {tasks.loading ? <ListSkeleton /> : tasks.error ? <LoadError title="Could not load tasks" message={tasks.error} onRetry={tasks.retry} />
          : recentTasks.length ? <ul className="task-list">{recentTasks.map((task) => <TaskCard key={task.id} task={task} />)}</ul>
            : <EmptyState title="No tasks yet" description="Your AI tasks will appear here with their latest status when work begins." action={<Link className="text-link" to="/projects">Explore projects<ArrowRight size={15} aria-hidden="true" /></Link>} />}
      </section>
      <section className="panel approval-panel" aria-labelledby="approval-title"><span className="feature-icon" aria-hidden="true"><ShieldCheck size={23} /></span>
        <h2 id="approval-title">Your next decision</h2><p>Keep an eye on work that needs your review before it can continue.</p>
        {tasks.loading ? <p role="status">Checking approvals…</p> : tasks.error ? <p>Approval information is unavailable until tasks can be loaded.</p>
          : waitingTasks.length ? <><span className="status-badge status-amber">{waitingTasks.length} awaiting review</span><ul className="approval-list">{waitingTasks.map((task) => <li key={task.id}><Link className="text-link" to={`/tasks/${encodeURIComponent(task.id)}`}>{task.title}<ArrowRight size={15} aria-hidden="true" /></Link><span>{task.projectName}</span></li>)}</ul></>
            : <div className="approval-clear"><CircleCheck size={22} aria-hidden="true" /><strong>You’re all caught up.</strong><p>No tasks are waiting for approval.</p></div>}
      </section>
    </div>
  </>
}
