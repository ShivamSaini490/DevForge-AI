import { ApiError } from '../services/api'

export function projectCreateErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return 'A project with this name or repository already exists. Open it from Projects or use a different name and repository.'
    if (error.status === 422) return 'Check the project name, repository URL, and default branch, then try again.'
  }
  return errorMessage(error)
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const messages: Record<number, string> = {
      0: 'Unable to reach the server. Check your connection and try again.',
      401: 'Your session has expired. Please sign out and sign in again.',
      403: 'You do not have permission to access this project or task.',
      404: 'This project or task could not be found. It may have been removed.',
      409: 'The task or repository state has changed. Refresh the details before trying again.',
      422: 'Check your task description, mode, and model selection, then try again.',
      429: 'Too many requests. Please wait a moment and try again.',
    }
    return messages[error.status] ?? (error.status >= 500 ? 'The server could not complete this request. Please try again shortly.' : error.message)
  }
  return error instanceof Error ? error.message : 'Unable to complete this request. Please try again.'
}
