import type { CreateProjectInput } from '../types/workspace'

export function normalizeProjectInput(input: CreateProjectInput): CreateProjectInput {
  return { name: input.name.trim(), description: input.description.trim(), repositoryUrl: input.repositoryUrl.trim(), defaultBranch: input.defaultBranch.trim() }
}

export function validateProjectInput(input: CreateProjectInput): Partial<Record<keyof CreateProjectInput, string>> {
  const value = normalizeProjectInput(input)
  const errors: Partial<Record<keyof CreateProjectInput, string>> = {}
  if (!value.name) errors.name = 'Enter a project name.'
  else if (value.name.length > 100) errors.name = 'Use 100 characters or fewer for the project name.'
  if (value.description.length > 2000) errors.description = 'Use 2,000 characters or fewer for the description.'
  try {
    const url = new URL(value.repositoryUrl)
    if (!/^https:\/\//i.test(value.repositoryUrl) || url.protocol !== 'https:' || !url.hostname || !url.pathname.split('/').filter(Boolean).length
      || url.username || url.password || url.search || url.hash || /\s|\\/.test(value.repositoryUrl) || value.repositoryUrl.length > 2048) throw new Error()
  } catch {
    errors.repositoryUrl = 'Enter an HTTPS repository URL without credentials, query parameters, or fragments.'
  }
  const branch = value.defaultBranch
  if (!branch) errors.defaultBranch = 'Enter the default branch.'
  else if (branch.length > 255 || branch === '@' || branch.startsWith('-') || branch.endsWith('.') || branch.includes('..') || branch.includes('@{')
    || /[\s~^:?*\\]/.test(branch) || branch.includes('[') || [...branch].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
    || branch.split('/').some((part) => !part || part.startsWith('.') || part.endsWith('.lock'))) {
    errors.defaultBranch = 'Enter a valid branch name, such as main or develop.'
  }
  return errors
}
