import { useParams } from 'react-router-dom'
import PlaceholderPage from '../components/layout/PlaceholderPage'
export default function CreateTask() {
  const { projectId } = useParams()
  return <PlaceholderPage title="Create a task" subtitle={`Project reference: ${projectId}`} description="Task creation and model selection will be added in days 10–11. No AI request is sent from this page." backTo="/projects" backLabel="Back to projects" />
}
