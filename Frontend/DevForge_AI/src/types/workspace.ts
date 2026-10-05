import type { TaskStatus } from '../constants/taskStatus'

export interface Project {
  id: string
  name: string
  description: string
  repository: { url: string; defaultBranch: string } | null
  recentTaskCount: number
  updatedAt: string
}

export interface CreateProjectInput {
  name: string
  description: string
  repositoryUrl: string
  defaultBranch: string
}

export interface Task {
  id: string
  projectId: string
  projectName: string
  title: string
  status: TaskStatus
  updatedAt: string
}

export type RepositoryStatus = 'ready' | 'indexing' | 'error' | 'disconnected'
export interface FileMetadata { path: string; size: number }
export interface ProjectDetails extends Project {
  repositoryStatus: RepositoryStatus
  files: FileMetadata[]
  tasks: Task[]
}
export type TaskMode = 'implement' | 'explain' | 'review'
export interface CreateTaskInput {
  description: string
  constraints: string
  mode: TaskMode
  provider?: string
  model?: string
}
export interface TaskDetails extends Task, CreateTaskInput { branch: string | null }
export interface AgentConfig {
  modes: TaskMode[]
  supportsModelSelection: boolean
  providers: { id: string; label: string; available: boolean; models: { id: string; label: string; available: boolean }[] }[]
}
export interface TaskDiff { files: { path: string; status: 'added' | 'modified' | 'deleted'; diff: string }[] }
export interface TaskTests { status: 'not_run' | 'running' | 'passed' | 'failed'; passed: number; failed: number; output: string }
