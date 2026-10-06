export default function ListSkeleton({ kind = 'tasks' }: { kind?: 'tasks' | 'projects' }) {
  return <div role="status" aria-label={`Loading ${kind}`} className={kind === 'projects' ? 'project-grid' : 'task-skeleton-list'}>
    {Array.from({ length: 3 }, (_, index) => <div key={index} aria-hidden="true" className={`skeleton-item ${kind === 'projects' ? 'panel' : ''}`}>
      <span className="skeleton skeleton-title" /><span className="skeleton skeleton-line" /><span className="skeleton skeleton-short" />
    </div>)}
  </div>
}
