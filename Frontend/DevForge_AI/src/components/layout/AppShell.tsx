import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Modal from '../common/Modal'
export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const main = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  useEffect(() => {
    main.current?.focus()
    window.scrollTo(0, 0)
    const section = pathname.split('/')[1] || 'Dashboard'
    document.title = `${section.charAt(0).toUpperCase() + section.slice(1)} · DevForge AI`
  }, [pathname])
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="sidebar"><Sidebar /></aside>
    <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="Navigation"><Sidebar onNavigate={() => setMenuOpen(false)} /></Modal>
    <div className="app-body"><Topbar onMenu={() => setMenuOpen(true)} /><main key={pathname} id="main-content" className="main-content" ref={main} tabIndex={-1}><Outlet /></main>
      <footer className="workspace-footer"><span>DevForge AI</span><span>Build with intention.</span></footer>
    </div>
  </div>
}
