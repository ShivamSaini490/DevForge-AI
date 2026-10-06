import { taskStatuses } from '../constants/taskStatus'
import type { Project, Task } from '../types/workspace'

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object'
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const isDate = (value: unknown) => isText(value) && Number.isFinite(Date.parse(value))

function isProject(value: unknown): value is Project {
  if (!isRecord(value)) return false
  const repo = value.repository
  return isText(value.id) && isText(value.name) && typeof value.description === 'string'
    && typeof value.recentTaskCount === 'number' && Number.isInteger(value.recentTaskCount) && value.recentTaskCount >= 0
    && isDate(value.updatedAt)
    && (repo === null || (isRecord(repo) && isText(repo.url) && isText(repo.defaultBranch)))
}

function isTask(value: unknown): value is Task {
  return isRecord(value) && isText(value.id) && isText(value.projectId) && isText(value.projectName)
    && isText(value.title) && isDate(value.updatedAt) && isText(value.status)
    && Object.hasOwn(taskStatuses, value.status)
}

function parseList<T extends { id: string }>(value: unknown, validate: (item: unknown) => item is T, name: string): T[] {
  if (!Array.isArray(value) || !value.every(validate) || new Set(value.map((item) => item.id)).size !== value.length) {
    throw new Error(`The server returned invalid ${name}. Please try again.`)
  }
  return value
}

export const parseProjects = (value: unknown) => parseList(value, isProject, 'projects')
export const parseTasks = (value: unknown) => parseList(value, isTask, 'tasks')
