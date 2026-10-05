import PageHeader from '../components/layout/PageHeader'
import { useAuth } from '../hooks/useAuth'
export default function Settings() {
  const user = useAuth((state) => state.user)
  return <><PageHeader title="Settings" subtitle="Your account, at a glance." /><section className="panel profile-panel"><h2>Profile</h2><p className="muted">Your current account details.</p><dl><div><dt>Full name</dt><dd>{user?.name}</dd></div><div><dt>Email address</dt><dd>{user?.email}</dd></div></dl><p className="foundation-caption">Profile editing and workspace preferences are scheduled for day 24.</p></section></>
}
