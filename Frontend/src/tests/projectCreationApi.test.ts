import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../services/api'
import { projectService } from '../services/projectService'
import { validateProjectInput } from '../utils/projectValidation'
import { project } from './taskFixtures'

vi.mock('../services/authService', () => ({ isDemoAuth: false }))
vi.mock('../services/api', () => ({ api: vi.fn() }))
const input = { name: 'New project', description: '', repositoryUrl: 'https://github.com/example/new-project.git', defaultBranch: 'main' }
beforeEach(() => vi.resetAllMocks())

describe('project creation API and validation', () => {
  it('posts normalized fields to /projects with a signal and validates the response', async () => {
    vi.mocked(api).mockResolvedValueOnce(project).mockResolvedValueOnce({ id: 'broken' })
    const signal = new AbortController().signal
    expect(await projectService.create({ ...input, name: '  New project  ' }, signal)).toEqual(project)
    expect(api).toHaveBeenCalledWith('/projects', { method: 'POST', body: JSON.stringify(input), signal })
    await expect(projectService.create(input)).rejects.toThrow('invalid projects')
  })
  it('rejects invalid input before making a network request', async () => {
    await expect(projectService.create({ ...input, repositoryUrl: 'invalid' })).rejects.toThrow('HTTPS')
    expect(api).not.toHaveBeenCalled()
  })
  it.each(['invalid', 'https:github.com/a/b', 'http://github.com/a/b', 'file:///repo', 'git@github.com:a/b.git', 'https://github.com', 'https://token@github.com/a/b', 'https://github.com/a/b?token=secret', 'https://github.com/a/b#main', 'https://github.com/a b'])('rejects unsupported repository URL %s', (repositoryUrl) => {
    expect(validateProjectInput({ ...input, repositoryUrl }).repositoryUrl).toBeTruthy()
  })
  it.each(['main', 'develop', 'feature/my-feature'])('allows branch %s', (defaultBranch) => {
    expect(validateProjectInput({ ...input, defaultBranch })).toEqual({})
  })
  it.each(['', 'bad branch', '-main', 'a..b', 'a.lock', '.hidden', 'a//b', 'a/', 'a@{1}', 'a?b'])('rejects invalid branch %s', (defaultBranch) => {
    expect(validateProjectInput({ ...input, defaultBranch }).defaultBranch).toBeTruthy()
  })
})
