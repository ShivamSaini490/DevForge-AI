import type { ReactNode } from 'react'
import { ArrowUpRight, Check, GitBranch, ShieldCheck, Terminal } from 'lucide-react'
import Brand from '../common/Brand'
import { isDemoAuth } from '../../services/authService'
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="auth-layout">
    <aside className="auth-story">
      <Brand />
      <div className="story-content">
        <span className="eyebrow"><span className="live-dot" /> YOUR AI ENGINEERING WORKSPACE</span>
        <h1>Great ideas.<br />Better software.<br /><span>Built together.</span></h1>
        <p className="story-description">Bring your projects, agents, and ideas into one workspace. Build with AI. Stay in control.</p>
        <div className="workflow-preview" aria-label="Illustration of the planned agent workflow">
          <div className="preview-top"><span><Terminal size={15} /> devforge / workspace</span><span className="preview-caption">WORKFLOW PREVIEW</span></div>
          <div className="preview-task"><GitBranch size={18} /><span>From an idea to a reviewed change</span><ArrowUpRight size={17} /></div>
          {['Plan the approach', 'Build with context', 'Test and review'].map((step, index) =>
            <div className="workflow-step" key={step}><span className="step-check"><Check size={13} /></span><span>{step}</span><span className="step-number">0{index + 1}</span></div>)}
          <div className="preview-footer"><ShieldCheck size={15} /> Your approval. Your control.</div>
        </div>
      </div>
      <div className="story-footer"><span>Made for the way you build.</span><span>01 — 05 / Foundation</span></div>
    </aside>
    <main className="auth-main">
      <div className="auth-mobile-brand"><Brand /></div>
      <div className="auth-form-container">{children}
        {isDemoAuth && <div className="demo-notice"><strong>Development demo</strong><span>Use <b>demo@devforge.ai</b> / <b>DevForge123!</b> or create a test account. Accounts reset on refresh. Use sample details only.</span></div>}
      </div>
      <p className="auth-footer"><ShieldCheck size={14} /> A workspace for thoughtful engineering.</p>
    </main>
  </div>
}
