import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import Field, { type FieldProps } from './Field'
type Props = InputHTMLAttributes<HTMLInputElement> & FieldProps & { trailing?: ReactNode }
export default function Input({ label, error, helper, id, className = '', trailing, ...props }: Props) {
  const generatedId = useId()
  const fieldId = id || generatedId
  return <Field id={fieldId} label={label} error={error} helper={helper}>
    <div className="input-wrap">
      <input {...props} id={fieldId} className={`input ${trailing ? 'has-trailing' : ''} ${className}`}
        aria-invalid={!!error} aria-describedby={error || helper ? `${fieldId}-message` : undefined} />
      {trailing && <span className="input-trailing">{trailing}</span>}
    </div>
  </Field>
}
