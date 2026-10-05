import { useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Input from '../common/Input'
export default function PasswordInput(props: Omit<ComponentProps<typeof Input>, 'type' | 'trailing'>) {
  const [visible, setVisible] = useState(false)
  return <Input {...props} type={visible ? 'text' : 'password'} trailing={
    <button className="password-toggle" type="button" aria-label={`${visible ? 'Hide' : 'Show'} ${props.label.toLowerCase()}`} aria-pressed={visible}
      disabled={props.disabled} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
  } />
}
