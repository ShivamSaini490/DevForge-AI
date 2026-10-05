import { useId, type SelectHTMLAttributes } from 'react'
import Field, { type FieldProps } from './Field'
export default function Select({ label, error, helper, id, className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & FieldProps) {
  const generatedId = useId()
  const fieldId = id || generatedId
  return <Field id={fieldId} label={label} error={error} helper={helper}>
    <select {...props} id={fieldId} className={`input ${className}`} aria-invalid={!!error} aria-describedby={error || helper ? `${fieldId}-message` : undefined}>{children}</select>
  </Field>
}
