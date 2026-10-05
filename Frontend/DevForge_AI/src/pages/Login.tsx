import AuthLayout from '../components/auth/AuthLayout'
import LoginForm from '../components/auth/LoginForm'
export default function Login() {
  return <AuthLayout><span className="section-kicker">WELCOME BACK</span><h2 className="auth-title">Your next idea starts here.</h2><p className="auth-subtitle">Sign in to your DevForge workspace.</p><LoginForm /></AuthLayout>
}
