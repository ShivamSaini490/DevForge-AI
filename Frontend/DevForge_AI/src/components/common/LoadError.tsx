import { AlertCircle, RotateCcw } from 'lucide-react'
import Button from './Button'

export default function LoadError({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
  return <div className="load-error">
    <div role="alert"><AlertCircle size={22} aria-hidden="true" /><h2>{title}</h2><p>{message}</p></div>
    <Button variant="secondary" onClick={onRetry}><RotateCcw size={15} aria-hidden="true" />Try again</Button>
  </div>
}
