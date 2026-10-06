import { useState, type SubmitEvent } from 'react'
import { ArrowRight, AlertCircle } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Input from '../common/Input'
import Button from '../common/Button'
import PasswordInput from './PasswordInput'
import { useAuth } from '../../hooks/useAuth'
import { authDestination, validateEmail } from '../../utils/validation'
export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({ email: '', password: '' })
  const { login, loading, error, clearError } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    const next = { email: validateEmail(email), password: password ? '' : 'Enter your password.' }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    if (await login({ email: email.trim(), password })) navigate(authDestination(location.state), { replace: true })
  }
  return <form className="auth-form" onSubmit={submit} noValidate>
    {error && <div className="form-alert" role="alert"><AlertCircle size={18} /><span>{error}</span></div>}
    <Input label="Email address" name="email" type="email" autoComplete="email" placeholder="you@company.com"
      value={email} error={errors.email} required disabled={loading} onChange={(e) => { setEmail(e.target.value); clearError(); setErrors({ ...errors, email: '' }) }} />
    <PasswordInput label="Password" name="password" autoComplete="current-password" placeholder="Enter your password"
      value={password} error={errors.password} required disabled={loading} onChange={(e) => { setPassword(e.target.value); clearError(); setErrors({ ...errors, password: '' }) }} />
    <Button type="submit" className="full-width" loading={loading} loadingLabel="Signing in…">Sign in <ArrowRight size={18} /></Button>
    <p className="auth-switch">New to DevForge? <Link to="/register" state={location.state} onClick={clearError}>Create an account <ArrowRight size={14} /></Link></p>
  </form>
}
