import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Anchor, Ship, ChevronDown, ChevronUp } from 'lucide-react'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showDemo, setShowDemo] = useState(true)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login({ email, password })
      navigate(ROUTES.DASHBOARD)
    } catch {
      setError('Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500 rounded-full blur-3xl" />
        </div>
        <div className="relative text-center px-12">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 border border-white/20">
            <Ship className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Aktau Port Logistics</h1>
          <p className="text-blue-200/70 max-w-sm mx-auto text-sm leading-relaxed">
            Centralized port management system for cargo tracking, berth scheduling, and operational analytics on the Caspian Sea.
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
              <Anchor className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 mt-1 text-sm">Sign in to your account</p>
          </div>
          <div className="hidden lg:block text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 mt-1 text-sm">Sign in to your account</p>
          </div>
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-sm text-blue-700">
              All demo accounts password: <strong className="font-mono">demo123</strong>
            </div>
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-lg border border-red-200 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}
            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <Button type="submit" className="w-full" size="lg">
              Sign In
            </Button>
            <div className="border-t border-slate-100 pt-3">
              <button type="button" onClick={() => setShowDemo(!showDemo)} className="flex items-center justify-between w-full text-sm text-slate-500 hover:text-slate-700">
                <span className="font-medium">Demo Accounts</span>
                {showDemo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showDemo && (
                <div className="mt-2 text-xs space-y-1 max-h-48 overflow-y-auto">
                  {[
                    ['admin', 'admin@demo.kz'],
                    ['super_admin', 'super@demo.kz'],
                    ['client', 'alice@demo.kz'],
                    ['client', 'bob@demo.kz'],
                    ['captain', 'smith@demo.kz'],
                    ['captain', 'jones@demo.kz'],
                    ['driver', 'dave@demo.kz'],
                    ['driver', 'eve@demo.kz'],
                    ['parking_manager', 'park@demo.kz'],
                    ['port_manager', 'port@demo.kz'],
                    ['governance', 'gov@demo.kz'],
                  ].map(([role, mail]) => (
                    <button
                      key={mail}
                      type="button"
                      onClick={() => { setEmail(mail); setPassword('demo123') }}
                      className="flex items-center justify-between w-full px-2 py-1.5 rounded hover:bg-slate-50 text-left"
                    >
                      <span className="text-slate-400 w-24 shrink-0">{role.replace('_', ' ')}</span>
                      <span className="font-mono text-slate-600">{mail}</span>
                      <span className="text-slate-300 ml-2">demo123</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm text-center text-slate-500">
              Don&apos;t have an account?{' '}
              <Link to={ROUTES.REGISTER} className="text-blue-600 hover:text-blue-700 font-medium">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
