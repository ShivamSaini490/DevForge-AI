import type { RepositoryStatus as Status } from '../../types/workspace'

const statuses = {
  ready: { label: 'Repository ready', tone: 'green', message: 'Knowledge index ready. You can create a new AI task.' },
  indexing: { label: 'Repository indexing', tone: 'amber', message: 'Preparing the repository and knowledge index. Refresh to check progress.' },
  error: { label: 'Repository error', tone: 'red', message: 'The repository could not be prepared. Check its connection before creating a task.' },
  disconnected: { label: 'No repository connected', tone: 'neutral', message: 'Connect a repository before creating an AI task.' },
}
export default function RepositoryStatus({ status }: { status: Status }) {
  const { label, tone, message } = statuses[status]
  return <div><span className={`status-badge status-${tone}`}>{label}</span><p className="muted">{message}</p></div>
}
