import type { TaskStatus } from '../constants/taskStatus'

export interface Project {
  id: string
  name: string
  description: string
  repository: { url: string; defaultBranch: string } | null
  recentTaskCount: number
  updatedAt: string
}

export interface Task {
  id: string
  projectId: string
  projectName: string
  title: string
  status: TaskStatus
  updatedAt: string
}
