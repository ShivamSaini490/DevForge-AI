import { Menu, LogOut, ChevronRight } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { isDemoAuth } from '../../services/authService'
import Button from '../common/Button'
export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout, loading } = useAuth()
  const location = useLocation()
  const section = location.pathname.split('/')[1]
  const title = section === 'tasks' ? 'Recent tasks' : section.charAt(0).toUpperCase() + section.slice(1)
  return <header className="topbar">
    <Button variant="ghost" className="mobile-menu-button" onClick={onMenu} aria-label="Open navigation"><Menu size={21} /></Button>
    <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>{title}</strong></div>
    <div className="topbar-account">{isDemoAuth && <span className="demo-pill">Demo</span>}<span className="avatar" aria-hidden="true">{user?.name.slice(0, 1).toUpperCase()}</span><span className="account-name">{user?.name}</span>
      <Button variant="ghost" onClick={() => void logout()} loading={loading} loadingLabel="Signing out…"><LogOut size={17} /><span>Sign out</span></Button>
    </div>
  </header>
}
