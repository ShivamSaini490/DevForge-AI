import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { ApiError } from '../services/api'

export function useListResource<T>(load: (signal: AbortSignal) => Promise<T[]>) {
  const ownerId = useAuthStore((state) => state.user?.id)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{ ownerId?: string; data: T[]; loading: boolean; error: string | null }>({ data: [], loading: true, error: null })

  useEffect(() => {
    const controller = new AbortController()
    // Combine cancellation with a deadline so abandoned or stalled requests do not linger.
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15000)])
    load(signal).then((data) => {
      if (!controller.signal.aborted) setState({ ownerId, data, loading: false, error: null })
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      const message = error instanceof ApiError && error.status === 401
        ? 'Your session has expired. Please sign out and sign in again.'
        : error instanceof Error ? error.message : 'Unable to load your workspace. Please try again.'
      setState({ ownerId, data: [], loading: false, error: message })
    })
    return () => controller.abort()
  }, [load, ownerId, attempt])

  function retry() {
    setState({ ownerId, data: [], loading: true, error: null })
    setAttempt((value) => value + 1)
  }
  return { ...(state.ownerId === ownerId ? state : { data: [], loading: true, error: null }), retry }
}
