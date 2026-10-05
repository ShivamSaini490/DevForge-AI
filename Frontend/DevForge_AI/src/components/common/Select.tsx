import { useId, type SelectHTMLAttributes } from 'react'
import Field, { type FieldProps } from './Field'
import { ChevronDown } from 'lucide-react'
export default function Select({ label, error, helper, id, className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & FieldProps) {
  const generatedId = useId()
  const fieldId = id || generatedId
  return <Field id={fieldId} label={label} error={error} helper={helper}>
    <div className={`select-wrap ${props.multiple || (props.size ?? 0) > 1 ? 'select-list' : ''}`}>
      <select {...props} id={fieldId} className={`input ${className}`} aria-invalid={!!error} aria-describedby={error || helper ? `${fieldId}-message` : undefined}>{children}</select>
      {!props.multiple && (props.size ?? 0) <= 1 && <ChevronDown className="select-chevron" size={17} aria-hidden="true" />}
    </div>
  </Field>
}
