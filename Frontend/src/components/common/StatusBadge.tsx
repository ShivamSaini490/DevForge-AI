import { taskStatuses, type TaskStatus } from '../../constants/taskStatus'
export default function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, tone } = taskStatuses[status]
  return <span className={`status-badge status-${tone}`}><span aria-hidden="true" />{label}</span>
}
