import { useEffect } from 'react'
import AppRoutes from './routes/AppRoutes'
import { useAuthStore } from './store/authStore'
import InteractionEffects from './components/common/InteractionEffects'
export default function App() {
  const initialize = useAuthStore((s) => s.initialize)
  useEffect(() => { void initialize() }, [initialize])
  return <><InteractionEffects /><AppRoutes /></>
}
