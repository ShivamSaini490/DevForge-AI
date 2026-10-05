export function validateEmail(email: string) {
  if (!email.trim()) return 'Enter your email address.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.'
  return ''
}
export function authDestination(state: unknown): string {
  if (state && typeof state === 'object' && 'from' in state && typeof state.from === 'string'
    && /^\/(dashboard|projects|tasks|settings)(\/|\?|#|$)/.test(state.from)) return state.from
  return '/dashboard'
}
