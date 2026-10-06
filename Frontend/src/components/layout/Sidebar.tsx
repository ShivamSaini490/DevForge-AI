import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderGit2, ListTodo, Settings, Sparkles, Sun, Moon } from 'lucide-react'
import Brand from '../common/Brand'
import { useThemeStore } from '../../store/themeStore'
const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderGit2 },
  { to: '/tasks', label: 'Recent tasks', icon: ListTodo },
  { to: '/settings', label: 'Settings', icon: Settings },
]
export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  return <div className="sidebar-inner"><NavLink className="brand-link" to="/dashboard" onClick={onNavigate} aria-label="DevForge AI dashboard"><Brand /></NavLink>
    <p className="nav-label">WORKSPACE</p>
    <nav aria-label="Main navigation">{links.map(({ to, label, icon: Icon }) =>
      <NavLink key={to} to={to} onClick={onNavigate} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={19} />{label}</NavLink>
    )}</nav>
    <button type="button" className="theme-toggle" role="switch" aria-checked={theme === 'dark'} aria-label="Night mode" onClick={toggleTheme}>
      <span className="theme-toggle-label"><Sun size={18} aria-hidden="true" /><span>{theme === 'dark' ? 'Night mode' : 'Day mode'}</span></span>
      <span className="theme-toggle-track" aria-hidden="true"><span className="theme-toggle-thumb"><Sun className="theme-sun" size={13} /><Moon className="theme-moon" size={13} /></span></span>
    </button>
    <div className="sidebar-note"><Sparkles size={21} /><strong>A space to build better.</strong><p>Your ideas, with a little help from AI.</p><span>DevForge AI · Foundation</span></div>
  </div>
}
