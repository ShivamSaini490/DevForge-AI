import AuthLayout from '../components/auth/AuthLayout'
import RegisterForm from '../components/auth/RegisterForm'
export default function Register() {
  return <AuthLayout><span className="section-kicker">LET’S BUILD SOMETHING</span><h2 className="auth-title">Make room for your ideas.</h2><p className="auth-subtitle">Create your DevForge account to get started.</p><RegisterForm /></AuthLayout>
}
