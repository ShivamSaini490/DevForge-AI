import { demoAuthService } from './demoAuthService'
import type { AgentConfig, CreateProjectInput, CreateTaskInput, Project, ProjectDetails, Task, TaskDetails } from '../types/workspace'
import { ApiError } from './api'
import { normalizeProjectInput, validateProjectInput } from '../utils/projectValidation'

// In-memory development fixtures. Newly registered accounts start with an empty workspace.
const projects: Project[] = [
  { id: 'commerce', name: 'Commerce storefront', description: 'A thoughtful shopping experience, from discovery to checkout.', repository: { url: 'https://github.com/example/commerce-storefront', defaultBranch: 'main' }, recentTaskCount: 3, updatedAt: '2026-10-05T09:40:00Z' },
  { id: 'platform-api', name: 'Platform API', description: 'The services and integrations that keep everything connected.', repository: { url: 'https://github.com/example/platform-api', defaultBranch: 'develop' }, recentTaskCount: 2, updatedAt: '2026-10-05T09:25:00Z' },
  { id: 'design-system', name: 'Design system', description: 'Consistent, accessible building blocks for the next idea.', repository: null, recentTaskCount: 1, updatedAt: '2026-10-04T16:00:00Z' },
]
const tasks: Task[] = [
  { id: 'checkout-tests', projectId: 'commerce', projectName: 'Commerce storefront', title: 'Add tests for the checkout flow', status: 'running', updatedAt: '2026-10-05T09:40:00Z' },
  { id: 'api-dependencies', projectId: 'platform-api', projectName: 'Platform API', title: 'Review the dependency update', status: 'waiting_approval', updatedAt: '2026-10-05T09:25:00Z' },
  { id: 'product-search', projectId: 'commerce', projectName: 'Commerce storefront', title: 'Improve product search accessibility', status: 'completed', updatedAt: '2026-10-05T08:30:00Z' },
  { id: 'api-timeout', projectId: 'platform-api', projectName: 'Platform API', title: 'Investigate the integration test timeout', status: 'failed', updatedAt: '2026-10-04T17:00:00Z' },
  { id: 'button-audit', projectId: 'design-system', projectName: 'Design system', title: 'Audit button styles and focus states', status: 'pending', updatedAt: '2026-10-04T16:00:00Z' },
  { id: 'cart-refactor', projectId: 'commerce', projectName: 'Commerce storefront', title: 'Refactor the cart summary', status: 'cancelled', updatedAt: '2026-10-03T14:00:00Z' },
]

const details: TaskDetails[] = tasks.map((task) => ({ ...task, description: task.title, constraints: '', mode: 'implement', provider: 'auto', branch: projects.find((p) => p.id === task.projectId)?.repository?.defaultBranch ?? null }))
const config: AgentConfig = {
  modes: ['implement', 'explain', 'review'], supportsModelSelection: true,
  providers: [
    { id: 'openai', label: 'OpenAI', available: true, models: [{ id: 'demo-code', label: 'Code model (demo)', available: true }, { id: 'demo-unavailable', label: 'Unavailable model (demo)', available: false }] },
    { id: 'anthropic', label: 'Anthropic', available: false, models: [] },
    { id: 'gemini', label: 'Gemini', available: false, models: [] },
  ],
}
const workspaces = new Map<string, { projects: Project[]; tasks: TaskDetails[] }>([['demo', { projects, tasks: details }]])
const preparationTimes = new Map<string, number>()
async function workspace() {
  const user = await demoAuthService.me()
  if (!workspaces.has(user.id)) workspaces.set(user.id, { projects: [], tasks: [] })
  return workspaces.get(user.id)!
}
function projectDetails(project: Project, items: TaskDetails[]): ProjectDetails {
  const readyAt = preparationTimes.get(project.id)
  return { ...project, repositoryStatus: !project.repository ? 'disconnected' : project.id === 'platform-api' || (readyAt !== undefined && Date.now() < readyAt) ? 'indexing' : 'ready',
    files: project.repository && readyAt === undefined ? [{ path: 'README.md', size: 1042 }, { path: 'src/app.ts', size: 2400 }, { path: 'src/tests/app.test.ts', size: 820 }] : [],
    tasks: items.filter((t) => t.projectId === project.id) }
}
export const demoWorkspaceService = {
  async createProject(input: CreateProjectInput, signal?: AbortSignal): Promise<ProjectDetails> {
    const data = await workspace()
    signal?.throwIfAborted()
    const payload = normalizeProjectInput(input)
    if (Object.keys(validateProjectInput(payload)).length) throw new ApiError('Invalid project details.', 422)
    const repositoryKey = (url: string) => new URL(url).href.replace(/\/+$/, '').replace(/\.git$/, '')
    if (data.projects.some((p) => p.name.toLowerCase() === payload.name.toLowerCase()
      || (p.repository && repositoryKey(p.repository.url) === repositoryKey(payload.repositoryUrl)))) throw new ApiError('Project already exists.', 409)
    const project: Project = { id: crypto.randomUUID(), name: payload.name, description: payload.description,
      repository: { url: payload.repositoryUrl, defaultBranch: payload.defaultBranch }, recentTaskCount: 0, updatedAt: new Date().toISOString() }
    data.projects.push(project)
    // A short, explicitly simulated preparation period. No repository is fetched.
    preparationTimes.set(project.id, Date.now() + 3000)
    return structuredClone(projectDetails(project, data.tasks))
  },
  async projects(): Promise<Project[]> { return structuredClone((await workspace()).projects) },
  async tasks(): Promise<Task[]> { return structuredClone((await workspace()).tasks) },
  async project(id: string): Promise<ProjectDetails> {
    const data = await workspace()
    const project = data.projects.find((p) => p.id === id)
    if (!project) throw new ApiError('Project not found.', 404)
    return structuredClone(projectDetails(project, data.tasks))
  },
  async task(id: string): Promise<TaskDetails> {
    const task = (await workspace()).tasks.find((t) => t.id === id)
    if (!task) throw new ApiError('Task not found.', 404)
    return structuredClone(task)
  },
  async config(): Promise<AgentConfig> { await demoAuthService.me(); return structuredClone(config) },
  async createTask(projectId: string, input: CreateTaskInput): Promise<TaskDetails> {
    const data = await workspace()
    const project = data.projects.find((p) => p.id === projectId)
    if (!project) throw new ApiError('Project not found.', 404)
    if (projectDetails(project, data.tasks).repositoryStatus !== 'ready') throw new ApiError('Repository not ready.', 409)
    if (!input.description.trim() || !config.modes.includes(input.mode)) throw new ApiError('Invalid task.', 422)
    if (input.provider && input.provider !== 'auto') {
      const provider = config.providers.find((p) => p.id === input.provider && p.available)
      if (!provider || !provider.models.some((m) => m.id === input.model && m.available)) throw new ApiError('Model unavailable.', 422)
    }
    const task: TaskDetails = { ...input, description: input.description.trim(), constraints: input.constraints.trim(),
      id: crypto.randomUUID(), projectId, projectName: project.name, title: input.description.trim().slice(0, 100),
      status: 'pending', branch: project.repository?.defaultBranch ?? null, updatedAt: new Date().toISOString() }
    data.tasks.push(task)
    project.recentTaskCount += 1
    project.updatedAt = task.updatedAt
    return structuredClone(task)
  },
  async transition(id: string, action: 'start' | 'cancel'): Promise<TaskDetails> {
    const data = await workspace()
    const task = data.tasks.find((t) => t.id === id)
    if (!task) throw new ApiError('Task not found.', 404)
    const allowed = action === 'start' ? task.status === 'pending' : ['running', 'waiting_approval'].includes(task.status)
    if (!allowed) throw new ApiError('Task state changed.', 409)
    task.status = action === 'start' ? 'running' : 'cancelled'
    task.updatedAt = new Date().toISOString()
    return structuredClone(task)
  },
}
