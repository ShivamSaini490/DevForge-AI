import { useState, type SubmitEvent } from 'react'
import { ArrowRight, AlertCircle } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Input from '../common/Input'
import Button from '../common/Button'
import PasswordInput from './PasswordInput'
import { useAuth } from '../../hooks/useAuth'
import { authDestination, validateEmail } from '../../utils/validation'
export default function RegisterForm() {
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { register, loading, error, clearError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  function change(field: keyof typeof values, value: string) {
    setValues({ ...values, [field]: value }); setErrors({ ...errors, [field]: '' }); clearError()
  }
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    const next = {
      name: values.name.trim() ? '' : 'Enter your name.',
      email: validateEmail(values.email),
      password: values.password.length >= 8 ? '' : 'Use at least 8 characters.',
      confirmPassword: !values.confirmPassword ? 'Confirm your password.' : values.password === values.confirmPassword ? '' : 'Passwords do not match.',
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    if (await register({ name: values.name.trim(), email: values.email.trim(), password: values.password })) navigate(authDestination(location.state), { replace: true })
  }
  return <form className="auth-form" onSubmit={submit} noValidate>
    {error && <div className="form-alert" role="alert"><AlertCircle size={18} /><span>{error}</span></div>}
    <Input label="Full name" name="name" autoComplete="name" placeholder="Alex Morgan" value={values.name} error={errors.name} required disabled={loading} maxLength={100} onChange={(e) => change('name', e.target.value)} />
    <Input label="Email address" name="email" type="email" autoComplete="email" placeholder="you@company.com" value={values.email} error={errors.email} required disabled={loading} onChange={(e) => change('email', e.target.value)} />
    <PasswordInput label="Password" name="password" autoComplete="new-password" placeholder="Create a password" helper="Use at least 8 characters." value={values.password} error={errors.password} required disabled={loading} onChange={(e) => change('password', e.target.value)} />
    <PasswordInput label="Confirm password" name="confirmPassword" autoComplete="new-password" placeholder="Re-enter your password" value={values.confirmPassword} error={errors.confirmPassword} required disabled={loading} onChange={(e) => change('confirmPassword', e.target.value)} />
    <Button type="submit" className="full-width" loading={loading} loadingLabel="Creating account…">Create account <ArrowRight size={18} /></Button>
    <p className="auth-switch">Already have an account? <Link to="/login" state={location.state} onClick={clearError}>Sign in <ArrowRight size={14} /></Link></p>
  </form>
}
