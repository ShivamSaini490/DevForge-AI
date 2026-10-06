import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Loader from '../components/common/Loader'
export default function ProtectedRoute() {
  const { user, initialized } = useAuth()
  const location = useLocation()
  if (!initialized) return <div className="page-loading"><Loader label="Opening your workspace…" /></div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />
  return <Outlet />
}
