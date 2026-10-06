import { useState } from 'react'
import { Search } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import EmptyState from '../components/common/EmptyState'
import ListSkeleton from '../components/common/ListSkeleton'
import LoadError from '../components/common/LoadError'
import ProjectCard from '../components/projects/ProjectCard'
import ConnectProjectButton from '../components/projects/ConnectProjectButton'
import { useProjects } from '../hooks/useProjects'
import { isDemoAuth } from '../services/authService'

export default function Projects() {
  const { data: projects, loading, error, retry } = useProjects()
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  const filtered = projects.filter((project) => [project.name, project.description, project.repository?.url, project.repository?.defaultBranch].some((value) => value?.toLowerCase().includes(query)))

  return <>
    <PageHeader title="Projects" subtitle="A home for your repositories and the work ahead." action={<ConnectProjectButton />} />
    {isDemoAuth && <p className="workspace-demo-note">Demo workspace · Sample projects; repositories are not actually connected.</p>}
    <div className="projects-toolbar"><Input label="Search projects" type="search" placeholder="Search by name, repository, or branch…" value={search} onChange={(event) => setSearch(event.target.value)} trailing={<Search size={18} className="search-icon" aria-hidden="true" />} />
      {!loading && !error && <span className="project-result-count" role="status">{filtered.length} {filtered.length === 1 ? 'project' : 'projects'}{query ? ` matching “${search.trim()}”` : ' in your workspace'}</span>}
    </div>
    {loading ? <ListSkeleton kind="projects" /> : error ? <section className="panel"><LoadError title="Could not load projects" message={error} onRetry={retry} /></section>
      : projects.length === 0 ? <section className="panel"><EmptyState title="No projects yet" description="Create or connect your first project to keep your repository and AI tasks together." action={<ConnectProjectButton label="Create project" />} /></section>
        : filtered.length === 0 ? <section className="panel"><EmptyState title="No matching projects" description="Try another project name, repository, or branch." icon={<Search size={26} />} action={<Button variant="secondary" onClick={() => setSearch('')}>Clear search</Button>} /></section>
          : <div className="project-grid">{filtered.map((project) => <ProjectCard key={project.id} project={project} />)}</div>}
  </>
}
