import { ArrowRight, Blocks, FolderGit2, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/layout/PageHeader'
import EmptyState from '../components/common/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { isDemoAuth } from '../services/authService'
export default function Dashboard() {
  const user = useAuth((state) => state.user)
  return <>
    <PageHeader title={`Welcome, ${user?.name.split(' ')[0] || 'builder'}.`} subtitle="A little clarity. A lot of possibility. This is your workspace." />
    <section className="welcome-panel"><div><span className="section-kicker">YOUR NEXT CHAPTER</span><h2>Good software starts<br />with a great workspace.</h2><p>Your foundation is ready. Projects and AI task workflows are coming next.</p><Link className="button button-primary" to="/projects">Explore projects <ArrowRight size={17} /></Link></div><div className="welcome-art" aria-hidden="true"><Blocks size={84} strokeWidth={1} /><span>IDEA → BUILD → REVIEW</span></div></section>
    <div className="foundation-grid">
      <section className="panel"><div className="panel-heading"><h2>Your workspace</h2><span className="subtle-label">GETTING STARTED</span></div><EmptyState title="A fresh start for your projects" description="Your connected repositories will live here. Project management is planned for the next phase." action={<Link className="text-link" to="/projects">View projects <ArrowRight size={16} /></Link>} icon={<FolderGit2 size={28} />} /></section>
      <section className="panel foundation-panel"><span className="feature-icon"><ShieldCheck size={22} /></span><h2>You’re in control.</h2><p>Your account and navigation are ready. The next steps bring your repositories, tasks, and agent activity into this space.</p><div className="foundation-item"><span className="small-check">✓</span> Account and session flow</div><div className="foundation-item"><span className="small-check">✓</span> Protected workspace routes</div><div className="foundation-item"><span className="small-check">✓</span> Shared interface foundations</div><p className="foundation-caption">{isDemoAuth ? 'Demo workspace · sample data only · resets on refresh' : 'Foundation preview · projects and tasks are not connected yet'}</p></section>
    </div>
  </>
}
