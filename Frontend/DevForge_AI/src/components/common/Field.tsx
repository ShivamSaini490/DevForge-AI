import type { ReactNode } from 'react'
export interface FieldProps { label: string; error?: string; helper?: string }
export default function Field({ id, label, error, helper, children }: FieldProps & { id: string; children: ReactNode }) {
  return <div className="field">
    <label htmlFor={id}>{label}</label>
    {children}
    {error ? <p className="field-error" id={`${id}-message`}>{error}</p>
      : helper ? <p className="field-helper" id={`${id}-message`}>{helper}</p> : null}
  </div>
}
