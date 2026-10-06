import type { AgentConfig, ProjectDetails, TaskDetails } from '../types/workspace'

export const task: TaskDetails = { id: 'task-1', projectId: 'shop', projectName: 'Storefront', title: 'Add checkout tests', description: 'Add checkout tests', constraints: 'Do not push to main', mode: 'implement', provider: 'auto', branch: 'main', status: 'pending', updatedAt: '2026-10-05T09:00:00Z' }
export const project: ProjectDetails = { id: 'shop', name: 'Storefront', description: 'A shop', repository: { url: 'https://github.com/example/shop', defaultBranch: 'main' }, repositoryStatus: 'ready', recentTaskCount: 1, updatedAt: task.updatedAt, files: [{ path: 'src/app.ts', size: 256 }], tasks: [task] }
export const config: AgentConfig = {
  modes: ['implement', 'explain', 'review'], supportsModelSelection: true,
  providers: [
    { id: 'openai', label: 'OpenAI', available: true, models: [{ id: 'code', label: 'Code model', available: true }, { id: 'offline', label: 'Offline model', available: false }] },
    { id: 'anthropic', label: 'Anthropic', available: false, models: [] },
    { id: 'gemini', label: 'Gemini', available: false, models: [] },
  ],
}
