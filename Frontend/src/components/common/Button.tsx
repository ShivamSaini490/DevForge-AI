import type { ButtonHTMLAttributes } from 'react'
import Loader from './Loader'
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  loading?: boolean
  loadingLabel?: string
}
export default function Button({ variant = 'primary', loading = false, loadingLabel = 'Please wait…', className = '', disabled, children, type = 'button', ...props }: Props) {
  return <button {...props} type={type} className={`button button-${variant} ${className}`} disabled={disabled || loading} aria-busy={loading}>
    {loading ? <Loader label={loadingLabel} /> : children}
  </button>
}
