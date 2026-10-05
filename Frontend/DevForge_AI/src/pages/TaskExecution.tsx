import { useParams } from 'react-router-dom'
import PlaceholderPage from '../components/layout/PlaceholderPage'
export default function TaskExecution() {
  const { taskId } = useParams()
  return <PlaceholderPage title="Task execution" subtitle={`Task reference: ${taskId}`} description="This is the reserved execution route. Live progress, logs, tests, and approvals will arrive in the later phases." backTo="/tasks" backLabel="Back to recent tasks" />
}
