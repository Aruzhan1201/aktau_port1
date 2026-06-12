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
    <div className="min-h-screen flex bg-heritage-cream">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-kazakh-burgundy via-kazakh-burgundy-dark to-modern-slate items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-silk-gold rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-caspian-teal rounded-full blur-3xl" />
        </div>
        <div className="relative text-center px-12">
          <div className="w-16 h-16 rounded-2xl bg-silk-gold/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 border border-silk-gold/30">
            <Ship className="w-8 h-8 text-silk-gold" />
          </div>
          <h1 className="text-3xl font-bold text-heritage-cream mb-3 tracking-tight font-serif">Aktau Port Logistics</h1>
          <p className="text-warm-sand/70 max-w-sm mx-auto text-sm leading-relaxed font-sans">
            Centralized port management system for cargo tracking, berth scheduling, and operational analytics on the Caspian Sea.
          </p>
          <div className="mt-8 h-px bg-gradient-to-r from-transparent via-silk-gold/30 to-transparent" />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-kazakh-burgundy flex items-center justify-center mx-auto mb-4">
              <Anchor className="w-6 h-6 text-heritage-cream" />
            </div>
            <h1 className="text-2xl font-bold text-kazakh-burgundy font-serif">Welcome back</h1>
            <p className="text-modern-slate mt-1 text-sm font-sans">Sign in to your account</p>
          </div>
          <div className="hidden lg:block text-center mb-8">
            <h1 className="text-2xl font-bold text-kazakh-burgundy font-serif">Welcome back</h1>
            <p className="text-modern-slate mt-1 text-sm font-sans">Sign in to your account</p>
          </div>
          <form onSubmit={handleSubmit} className="bg-white dark:bg-kazakh-burgundy-dark rounded-2xl border border-silk-gold/30 shadow-sm p-8 space-y-5">
            <div className="bg-silk-gold/20 border border-silk-gold/30 rounded-lg px-4 py-2.5 text-sm text-kazakh-burgundy dark:text-silk-gold">
              All demo accounts password: <strong className="font-mono">demo123</strong>
            </div>
            {error && (
              <div className="bg-status-cancelled/10 text-status-cancelled text-sm px-4 py-2.5 rounded-lg border border-status-cancelled/30 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-status-cancelled shrink-0" />
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
            <div className="border-t border-silk-gold/20 pt-3">
              <button type="button" onClick={() => setShowDemo(!showDemo)} className="flex items-center justify-between w-full text-sm text-modern-slate dark:text-warm-sand hover:text-kazakh-burgundy dark:hover:text-silk-gold">
                <span className="font-medium font-sans">Demo Accounts</span>
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
                      className="flex items-center justify-between w-full px-2 py-1.5 rounded hover:bg-silk-gold/20 text-left"
                    >
                      <span className="text-modern-slate dark:text-warm-sand w-24 shrink-0">{role.replace('_', ' ')}</span>
                      <span className="font-mono text-kazakh-burgundy dark:text-silk-gold">{mail}</span>
                      <span className="text-modern-slate dark:text-warm-sand ml-2">demo123</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm text-center text-modern-slate dark:text-warm-sand font-sans">
              Don&apos;t have an account?{' '}
              <Link to={ROUTES.REGISTER} className="text-silk-gold-dark hover:text-kazakh-burgundy dark:hover:text-silk-gold font-medium">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
