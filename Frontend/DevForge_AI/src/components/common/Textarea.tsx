import { useId, type TextareaHTMLAttributes } from 'react'
import Field, { type FieldProps } from './Field'
export default function Textarea({ label, error, helper, id, className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps) {
  const generatedId = useId()
  const fieldId = id || generatedId
  return <Field id={fieldId} label={label} error={error} helper={helper}>
    <textarea {...props} id={fieldId} className={`input ${className}`} aria-invalid={!!error} aria-describedby={error || helper ? `${fieldId}-message` : undefined} />
  </Field>
}
