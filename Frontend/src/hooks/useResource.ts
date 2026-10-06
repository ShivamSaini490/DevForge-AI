import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { errorMessage } from '../utils/errorMessage'

export function useResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const owner = useAuthStore((state) => state.user?.id)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{ owner?: string; load: typeof load; attempt: number; data: T | null; error: string | null } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15000)])
    Promise.resolve().then(() => load(signal)).then((data) => {
      if (!controller.signal.aborted) setState({ owner, load, attempt, data, error: null })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ owner, load, attempt, data: null, error: errorMessage(error) })
    })
    return () => controller.abort()
  }, [load, owner, attempt])
  const current = state && state.owner === owner && state.load === load && state.attempt === attempt ? state : null
  return {
    data: current?.data ?? null, error: current?.error ?? null, loading: !current,
    retry: () => setAttempt((value) => value + 1),
    update: (data: T) => setState({ owner, load, attempt, data, error: null }),
  }
}
