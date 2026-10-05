import { useParams } from 'react-router-dom'
import PlaceholderPage from '../components/layout/PlaceholderPage'
export default function ProjectDetails() {
  const { projectId } = useParams()
  return <PlaceholderPage title="Project overview" subtitle={`Project reference: ${projectId}`} description="This route is ready. Project data, branches, files, and history will be connected in day 9." backTo="/projects" backLabel="Back to projects" />
}
