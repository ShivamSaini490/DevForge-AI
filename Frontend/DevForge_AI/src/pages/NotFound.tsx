import { Link } from 'react-router-dom'
import Brand from '../components/common/Brand'
export default function NotFound() {
  return <main className="not-found"><Brand /><span className="section-kicker">404 / PAGE NOT FOUND</span><h1>A turn off the beaten path.</h1><p>This page doesn’t exist. Let’s get you back to your workspace.</p><Link to="/dashboard" className="button button-primary">Go to dashboard</Link></main>
}
