import { demoAuthService } from './demoAuthService'
import type { Project, Task } from '../types/workspace'

// Read-only development fixtures. Newly registered accounts start with an empty workspace.
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

export const demoWorkspaceService = {
  async projects(): Promise<Project[]> { return (await demoAuthService.me()).id === 'demo' ? structuredClone(projects) : [] },
  async tasks(): Promise<Task[]> { return (await demoAuthService.me()).id === 'demo' ? structuredClone(tasks) : [] },
}
