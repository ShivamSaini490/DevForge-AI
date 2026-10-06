import { useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { apiUrl } from '../services/api'
import { isDemoAuth } from '../services/authService'
import { isTerminal, type ExecutionStoreApi } from '../store/executionStore'

export function useAgentStream(store: ExecutionStoreApi) {
  const state = useStore(store)
  const [attempt, setAttempt] = useState(0)
  const demoStatus = isDemoAuth ? state.task.status : null
  useEffect(() => {
    let disposed = false
    let source: EventSource | null = null
    let stopDemo: (() => void) | undefined
    const setConnection = store.getState().setConnection
    setConnection('connecting')
    const close = () => {
      if (source) { source.onopen = null; source.onmessage = null; source.onerror = null; source.close(); source = null }
    }
    const connect = () => {
      close()
      if (disposed) return
      if (store.getState().connection === 'closed') return
      if (!navigator.onLine || typeof EventSource === 'undefined') { setConnection('offline'); return }
      const current = store.getState()
      const cursor = current.lastEventId ? `?lastEventId=${encodeURIComponent(current.lastEventId)}` : ''
      setConnection(current.lastEventId ? 'reconnecting' : 'connecting')
      try {
        const connection = new EventSource(apiUrl(`/tasks/${encodeURIComponent(current.task.id)}/stream${cursor}`), { withCredentials: true })
        source = connection
        const isCurrent = () => !disposed && source === connection
        connection.onopen = () => { if (isCurrent()) setConnection('live') }
        connection.onmessage = (message) => {
          if (!isCurrent() || typeof message.data !== 'string' || message.data.length > 100000) return
          try {
            const accepted = store.getState().applyEvent(JSON.parse(message.data))
            if (accepted && store.getState().connection === 'closed') close()
          } catch { /* Ignore invalid JSON and keep the connection healthy. */ }
        }
        connection.onerror = () => {
          if (!isCurrent()) return
          setConnection(navigator.onLine && connection.readyState === 0 ? 'reconnecting' : 'offline')
          if (connection.readyState === 2) close()
        }
      } catch { setConnection('offline') }
    }
    const offline = () => { close(); setConnection('offline') }
    const unsubscribe = store.subscribe((next, previous) => {
      if (next.task.status !== previous.task.status && isTerminal(next.task.status)) { close(); stopDemo?.(); setConnection('closed') }
    })
    if (import.meta.env.DEV && isDemoAuth) {
      if (store.getState().task.status === 'cancelled') setConnection('closed')
      else void import('../services/demoAgentStream').then(({ subscribeDemoExecution }) => {
        if (disposed) return
        setConnection('live')
        stopDemo = subscribeDemoExecution(store.getState().task, (event) => {
          if (!disposed) store.getState().applyEvent(event)
        })
      }).catch(() => { if (!disposed) setConnection('offline') })
    } else {
      connect()
      window.addEventListener('offline', offline)
      window.addEventListener('online', connect)
    }
    return () => {
      disposed = true; close(); stopDemo?.(); unsubscribe()
      window.removeEventListener('offline', offline); window.removeEventListener('online', connect)
    }
  }, [store, attempt, demoStatus])
  return { ...state, reconnect: () => setAttempt((value) => value + 1) }
}
