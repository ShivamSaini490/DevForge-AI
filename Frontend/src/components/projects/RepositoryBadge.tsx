import { GitBranch, Unplug } from 'lucide-react'

export default function RepositoryBadge({ connected }: { connected: boolean }) {
  const Icon = connected ? GitBranch : Unplug
  return <span className={`status-badge ${connected ? 'status-green' : 'status-neutral'}`}><Icon size={13} aria-hidden="true" />{connected ? 'Repository connected' : 'No repo connected'}</span>
}
