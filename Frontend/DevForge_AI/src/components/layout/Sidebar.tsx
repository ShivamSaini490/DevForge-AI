import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderGit2, ListTodo, Settings, Sparkles } from 'lucide-react'
import Brand from '../common/Brand'
const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderGit2 },
  { to: '/tasks', label: 'Recent tasks', icon: ListTodo },
  { to: '/settings', label: 'Settings', icon: Settings },
]
export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return <div className="sidebar-inner"><NavLink className="brand-link" to="/dashboard" onClick={onNavigate} aria-label="DevForge AI dashboard"><Brand /></NavLink>
    <p className="nav-label">WORKSPACE</p>
    <nav aria-label="Main navigation">{links.map(({ to, label, icon: Icon }) =>
      <NavLink key={to} to={to} onClick={onNavigate} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={19} />{label}</NavLink>
    )}</nav>
    <div className="sidebar-note"><Sparkles size={21} /><strong>A space to build better.</strong><p>Your ideas, with a little help from AI.</p><span>DevForge AI · Foundation</span></div>
  </div>
}
