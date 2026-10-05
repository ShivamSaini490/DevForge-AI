import { FolderOpen } from 'lucide-react'
import type { ReactNode } from 'react'
export default function EmptyState({ title, description, action, icon = <FolderOpen size={26} /> }: {
  title: string; description: string; action?: ReactNode; icon?: ReactNode
}) {
  return <div className="empty-state"><div className="empty-icon" aria-hidden="true">{icon}</div><h2>{title}</h2><p>{description}</p>{action}</div>
}
