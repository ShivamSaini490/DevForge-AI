import { useEffect, useRef, useState } from 'react'
import type { TaskDetails } from '../../types/workspace'
import { taskService } from '../../services/taskService'
import { useAuthStore } from '../../store/authStore'
import { errorMessage } from '../../utils/errorMessage'
import Button from '../common/Button'
import Modal from '../common/Modal'

export default function TaskActions({ task, onChange, onRefresh }: { task: TaskDetails; onChange: (task: TaskDetails) => void; onRefresh: () => void }) {
  const [confirm, setConfirm] = useState(false)
  const [pending, setPending] = useState<'start' | 'cancel' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => request.current?.abort(), [])
  async function perform(action: 'start' | 'cancel') {
    if (request.current) return
    const controller = new AbortController()
    request.current = controller
    const owner = useAuthStore.getState().user?.id
    setPending(action); setError(null)
    try {
      const updated = await taskService[action](task.id, AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]))
      if (!controller.signal.aborted && owner === useAuthStore.getState().user?.id) { setConfirm(false); onChange(updated) }
    } catch (cause) {
      if (!controller.signal.aborted && owner === useAuthStore.getState().user?.id) { setConfirm(false); setError(errorMessage(cause)) }
    } finally {
      if (!controller.signal.aborted) { request.current = null; setPending(null) }
    }
  }
  return <div className="task-controls">
    {error && <div className="form-alert" role="alert">{error}</div>}
    <div className="action-row">
      {task.status === 'pending' && <Button loading={pending === 'start'} loadingLabel="Starting AI..." disabled={!!pending} onClick={() => void perform('start')}>Start AI</Button>}
      {['running', 'waiting_approval'].includes(task.status) && <Button variant="danger" disabled={!!pending} onClick={() => setConfirm(true)}>Cancel task</Button>}
      <Button variant="secondary" disabled={!!pending} onClick={onRefresh}>Refresh details</Button>
    </div>
    <Modal open={confirm} title="Cancel this task?" onClose={() => { if (!pending) setConfirm(false) }}>
      <p className="detail-copy">The AI will stop work on this task. Changes already made may remain available for review.</p>
      <div className="action-row"><Button variant="secondary" disabled={!!pending} onClick={() => setConfirm(false)}>Keep running</Button>
        <Button variant="danger" loading={pending === 'cancel'} loadingLabel="Cancelling task..." onClick={() => void perform('cancel')}>Confirm cancellation</Button></div>
    </Modal>
  </div>
}
