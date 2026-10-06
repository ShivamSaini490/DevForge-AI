import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Task } from '../../types/workspace'
import { formatDate } from '../../utils/formatDate'
import StatusBadge from '../common/StatusBadge'

export default function TaskCard({ task }: { task: Task }) {
  return <li className="task-card">
    <div className="task-summary"><Link className="task-title" to={`/tasks/${encodeURIComponent(task.id)}`}>{task.title}<ArrowUpRight size={16} aria-hidden="true" /></Link>
      <div className="task-meta"><span>{task.projectName}</span><span aria-hidden="true">·</span><time dateTime={task.updatedAt}>{formatDate(task.updatedAt)}</time></div>
    </div>
    <StatusBadge status={task.status} />
  </li>
}
