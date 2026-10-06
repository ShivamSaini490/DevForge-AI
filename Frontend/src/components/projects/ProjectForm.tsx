import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../common/Input'
import Textarea from '../common/Textarea'
import Button from '../common/Button'
import type { CreateProjectInput } from '../../types/workspace'
import { normalizeProjectInput, validateProjectInput } from '../../utils/projectValidation'
import { projectCreateErrorMessage } from '../../utils/errorMessage'
import { projectService } from '../../services/projectService'
import { isDemoAuth } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'

export default function ProjectForm({ onCancel, onPendingChange }: { onCancel: () => void; onPendingChange: (pending: boolean) => void }) {
  const navigate = useNavigate()
  const [form, setForm] = useState<CreateProjectInput>({ name: '', description: '', repositoryUrl: '', defaultBranch: 'main' })
  const [errors, setErrors] = useState<Partial<Record<keyof CreateProjectInput, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const request = useRef<AbortController | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => () => request.current?.abort(), [])
  function change(field: keyof CreateProjectInput, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }))
    setErrors((previous) => ({ ...previous, [field]: undefined }))
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (request.current) return
    const payload = normalizeProjectInput(form)
    const validation = validateProjectInput(payload)
    setErrors(validation); setError(null)
    if (Object.keys(validation).length) {
      const field = Object.keys(validation)[0]
      const element = formRef.current?.elements.namedItem(field)
      if (element instanceof HTMLElement) element.focus()
      return
    }
    const controller = new AbortController()
    request.current = controller
    const owner = useAuthStore.getState().user?.id
    setPending(true); onPendingChange(true)
    try {
      const project = await projectService.create(payload, AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]))
      if (!controller.signal.aborted && owner === useAuthStore.getState().user?.id) navigate(`/projects/${encodeURIComponent(project.id)}`)
    } catch (cause) {
      if (!controller.signal.aborted && owner === useAuthStore.getState().user?.id) setError(projectCreateErrorMessage(cause))
    } finally {
      if (!controller.signal.aborted) { request.current = null; setPending(false); onPendingChange(false) }
    }
  }
  return <form ref={formRef} className="project-form" onSubmit={submit} noValidate aria-busy={pending}>
    <p className="muted">Connect a Git repository to organize your code and AI tasks.</p>
    {isDemoAuth && <p className="muted">Demo mode: projects last until refresh. Repository preparation is simulated; no repository is cloned.</p>}
    <Input label="Project name" name="name" value={form.name} onChange={(e) => change('name', e.target.value)} maxLength={100} required autoFocus disabled={pending} error={errors.name} placeholder="My application" />
    <Textarea label="Description (optional)" name="description" value={form.description} onChange={(e) => change('description', e.target.value)} maxLength={2000} rows={3} disabled={pending} error={errors.description} placeholder="What is this project for?" />
    <Input label="Repository URL" name="repositoryUrl" type="url" value={form.repositoryUrl} onChange={(e) => change('repositoryUrl', e.target.value)} maxLength={2048} required disabled={pending} error={errors.repositoryUrl}
      placeholder="https://github.com/your-team/your-repository" helper="Paste the HTTPS clone URL from your Git host. Do not include a password or access token." />
    <Input label="Default branch" name="defaultBranch" value={form.defaultBranch} onChange={(e) => change('defaultBranch', e.target.value)} maxLength={255} required disabled={pending} error={errors.defaultBranch} helper="Use the repository's default branch, usually main or develop." />
    {error && <div className="form-alert" role="alert">{error}</div>}
    <div className="action-row"><Button variant="secondary" disabled={pending} onClick={onCancel}>Cancel</Button><Button type="submit" loading={pending} loadingLabel="Creating project...">Create Project</Button></div>
  </form>
}
