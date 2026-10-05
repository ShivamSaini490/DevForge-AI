import { ArrowUpRight, FolderGit2, GitBranch, ListTodo } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Project } from '../../types/workspace'
import { formatDate } from '../../utils/formatDate'
import RepositoryBadge from './RepositoryBadge'

export default function ProjectCard({ project }: { project: Project }) {
  return <article className="panel project-card">
    <div className="project-card-top"><span className="project-icon" aria-hidden="true"><FolderGit2 size={23} /></span><RepositoryBadge connected={!!project.repository} /></div>
    <h2>{project.name}</h2><p className="project-description">{project.description || 'No description yet.'}</p>
    <p className="repository-path">{project.repository?.url.replace(/^https?:\/\//, '') || 'Connect a repository to give tasks their code context.'}</p>
    <dl className="project-details"><div><dt><GitBranch size={14} aria-hidden="true" />Default branch</dt><dd>{project.repository?.defaultBranch || 'Not set'}</dd></div>
      <div><dt><ListTodo size={14} aria-hidden="true" />Recent tasks</dt><dd>{project.recentTaskCount}</dd></div></dl>
    <div className="project-card-footer"><span>Updated <time dateTime={project.updatedAt}>{formatDate(project.updatedAt)}</time></span><Link className="button button-secondary" to={`/projects/${encodeURIComponent(project.id)}`} aria-label={`Open ${project.name}`}>Open<ArrowUpRight size={15} aria-hidden="true" /></Link></div>
  </article>
}
