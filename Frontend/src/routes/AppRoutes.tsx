import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authDestination } from '../utils/validation'
import ProtectedRoute from './ProtectedRoute'
import AppShell from '../components/layout/AppShell'
import Loader from '../components/common/Loader'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Dashboard from '../pages/Dashboard'
import Projects from '../pages/Projects'
import ProjectDetails from '../pages/ProjectDetails'
import CreateTask from '../pages/CreateTask'
import TaskExecution from '../pages/TaskExecution'
import RecentTasks from '../pages/RecentTasks'
import Settings from '../pages/Settings'
import NotFound from '../pages/NotFound'
function GuestRoute() {
  const { user, initialized } = useAuth()
  const location = useLocation()
  if (!initialized) return <div className="page-loading"><Loader label="Checking your session…" /></div>
  return user ? <Navigate to={authDestination(location.state)} replace /> : <Outlet />
}
export default function AppRoutes() {
  return <Routes>
    <Route element={<GuestRoute />}><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /></Route>
    <Route element={<ProtectedRoute />}><Route element={<AppShell />}>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:projectId" element={<ProjectDetails />} />
      <Route path="/projects/:projectId/tasks/new" element={<CreateTask />} />
      <Route path="/tasks" element={<RecentTasks />} />
      <Route path="/tasks/:taskId" element={<TaskExecution />} />
      <Route path="/settings" element={<Settings />} />
    </Route></Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
}
