import type { AgentConfig, ProjectDetails, TaskDetails, TaskDiff, TaskTests } from '../types/workspace'
import { parseProjects, parseTasks } from './workspaceValidation'

const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object'
const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim()
const count = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
const modes = ['implement', 'explain', 'review']
function invalid(name: string): never { throw new Error(`The server returned invalid ${name}. Please try again.`) }

export function parseProjectDetails(value: unknown): ProjectDetails {
  const project = parseProjects([value])[0]
  if (!record(value) || !['ready', 'indexing', 'error', 'disconnected'].includes(String(value.repositoryStatus))
    || !Array.isArray(value.files) || !value.files.every((f) => record(f) && text(f.path) && count(f.size))
    || new Set(value.files.map((f) => f.path)).size !== value.files.length) return invalid('project details')
  const tasks = parseTasks(value.tasks)
  if (tasks.some((task) => task.projectId !== project.id)) return invalid('project history')
  return { ...project, repositoryStatus: value.repositoryStatus, files: value.files, tasks } as ProjectDetails
}

export function parseTaskDetails(value: unknown): TaskDetails {
  const task = parseTasks([value])[0]
  if (!record(value) || !text(value.description) || typeof value.constraints !== 'string' || !modes.includes(String(value.mode))
    || !(value.branch === null || text(value.branch))
    || !(value.provider === undefined || text(value.provider)) || !(value.model === undefined || text(value.model))
    || (value.model !== undefined && (!value.provider || value.provider === 'auto'))) return invalid('task details')
  for (const key of ['startedAt', 'finishedAt']) {
    if (value[key] !== undefined && value[key] !== null && !(text(value[key]) && Number.isFinite(Date.parse(value[key])))) return invalid('task timestamps')
  }
  if (text(value.startedAt) && text(value.finishedAt) && Date.parse(value.finishedAt) < Date.parse(value.startedAt)) return invalid('task timestamps')
  return { ...task, description: value.description, constraints: value.constraints, mode: value.mode,
    branch: value.branch, provider: value.provider, model: value.model } as TaskDetails
}

export function parseAgentConfig(value: unknown): AgentConfig {
  if (!record(value) || !Array.isArray(value.modes) || !value.modes.includes('implement')
    || !value.modes.every((m) => modes.includes(m)) || new Set(value.modes).size !== value.modes.length
    || typeof value.supportsModelSelection !== 'boolean' || !Array.isArray(value.providers)) return invalid('model configuration')
  const providers = value.providers.map((p) => {
    if (!record(p) || !text(p.id) || p.id === 'auto' || !text(p.label) || typeof p.available !== 'boolean' || !Array.isArray(p.models)) return invalid('providers')
    const models = p.models.map((m) => {
      if (!record(m) || !text(m.id) || !text(m.label) || typeof m.available !== 'boolean') return invalid('models')
      return { id: m.id, label: m.label, available: m.available }
    })
    if (new Set(models.map((m) => m.id)).size !== models.length) return invalid('models')
    return { id: p.id, label: p.label, available: p.available, models }
  })
  if (new Set(providers.map((p) => p.id)).size !== providers.length) return invalid('providers')
  // Allowlist public configuration fields; never propagate credentials from a response.
  return { modes: value.modes, supportsModelSelection: value.supportsModelSelection, providers }
}

export function parseTaskDiff(value: unknown): TaskDiff {
  if (!record(value) || !Array.isArray(value.files) || !value.files.every((f) => record(f) && text(f.path)
    && ['added', 'modified', 'deleted'].includes(String(f.status)) && typeof f.diff === 'string')) return invalid('task diff')
  return value as unknown as TaskDiff
}
export function parseTaskTests(value: unknown): TaskTests {
  if (!record(value) || !['not_run', 'running', 'passed', 'failed'].includes(String(value.status))
    || !count(value.passed) || !count(value.failed) || typeof value.output !== 'string') return invalid('test results')
  return value as unknown as TaskTests
}
