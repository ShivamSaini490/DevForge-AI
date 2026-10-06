import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageHeader from './PageHeader'
import EmptyState from '../common/EmptyState'
export default function PlaceholderPage({ title, subtitle, description, backTo = '/dashboard', backLabel = 'Back to dashboard' }: {
  title: string; subtitle: string; description: string; backTo?: string; backLabel?: string
}) {
  return <><PageHeader title={title} subtitle={subtitle} /><section className="panel"><EmptyState title="Your workspace is taking shape" description={description}
    action={<Link className="button button-secondary" to={backTo}><ArrowLeft size={16} />{backLabel}</Link>} /></section></>
}
