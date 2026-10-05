import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AgentConfig, ProjectDetails, TaskMode } from '../../types/workspace'
import Textarea from '../common/Textarea'
import Select from '../common/Select'
import Button from '../common/Button'
import ModelSelector, { type ModelChoice } from '../ai/ModelSelector'
import { taskService } from '../../services/taskService'
import { useAuthStore } from '../../store/authStore'
import { errorMessage } from '../../utils/errorMessage'

export default function TaskForm({ project, config }: { project: ProjectDetails; config: AgentConfig }) {
  const navigate = useNavigate()
  const [description, setDescription] = useState('')
  const [constraints, setConstraints] = useState('')
  const [mode, setMode] = useState<TaskMode>('implement')
  const [choice, setChoice] = useState<ModelChoice>({ provider: 'auto', model: '' })
  const [error, setError] = useState<string | null>(null)
  const [descriptionError, setDescriptionError] = useState<string | undefined>()
  const [pending, setPending] = useState(false)
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => request.current?.abort(), [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (request.current || project.repositoryStatus !== 'ready') return
    setError(null)
    if (!description.trim()) { setDescriptionError('Describe what you want the AI to do.'); return }
    setDescriptionError(undefined)
    const provider = config.providers.find((p) => p.id === choice.provider)
    if (config.supportsModelSelection && choice.provider !== 'auto' && (!provider?.available || !provider.models.some((m) => m.id === choice.model && m.available))) {
      setError('Choose an available model or use Auto.'); return
    }
    const controller = new AbortController()
    request.current = controller
    const owner = useAuthStore.getState().user?.id
    setPending(true)
    try {
      const task = await taskService.create(project.id, {
        description: description.trim(), constraints: constraints.trim(), mode,
        ...(config.supportsModelSelection ? { provider: choice.provider, ...(choice.provider !== 'auto' ? { model: choice.model } : {}) } : {}),
      }, AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]))
      if (!controller.signal.aborted && owner === useAuthStore.getState().user?.id) navigate(`/tasks/${encodeURIComponent(task.id)}`)
    } catch (cause) {
      if (!controller.signal.aborted && owner === useAuthStore.getState().user?.id) setError(errorMessage(cause))
    } finally {
      if (!controller.signal.aborted) { request.current = null; setPending(false) }
    }
  }
  return <form className="task-form" onSubmit={submit} noValidate aria-busy={pending}>
    <Textarea label="What would you like the AI to do?" value={description} onChange={(event) => { setDescription(event.target.value); setDescriptionError(undefined) }}
      rows={7} maxLength={20000} required disabled={pending} error={descriptionError} placeholder="Describe the outcome you want in your own words..."
      helper="Example: Add tests for the checkout flow. Keep the existing code style and explain the changes." />
    <Select label="Mode" value={mode} disabled={pending} onChange={(event) => setMode(event.target.value as TaskMode)}>
      {config.modes.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}
    </Select>
    <Textarea label="Constraints (optional)" value={constraints} onChange={(event) => setConstraints(event.target.value)} maxLength={10000} disabled={pending}
      placeholder="Do not push to main. Add tests. Keep existing API behavior." helper="Tell the AI about boundaries or requirements it should follow." />
    <ModelSelector config={config} value={choice} onChange={setChoice} disabled={pending} />
    {error && <div className="form-alert" role="alert">{error}</div>}
    <div className="task-form-footer"><p className="muted">Review your task before starting AI work on the next screen.</p><Button type="submit" loading={pending} loadingLabel="Creating task..." disabled={project.repositoryStatus !== 'ready'}>Create Task</Button></div>
  </form>
}
