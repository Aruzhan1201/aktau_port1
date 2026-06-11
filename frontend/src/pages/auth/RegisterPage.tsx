import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserCheck, UserCog, Ship, Anchor, Car, Building2 } from 'lucide-react'
import type { UserRole } from '@/types'

const roles: { value: UserRole; label: string; description: string; icon: typeof UserCheck }[] = [
  { value: 'client', label: 'Client', description: 'Create and track cargo shipments', icon: UserCheck },
  { value: 'driver', label: 'Driver', description: 'Transport cargo over land', icon: Car },
  { value: 'captain', label: 'Captain', description: 'Manage vessel operations', icon: Ship },
  { value: 'parking_manager', label: 'Parking Manager', description: 'Manage parking zones', icon: UserCog },
  { value: 'port_manager', label: 'Port Manager', description: 'Manage berths and docks', icon: Building2 },
]

export function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('client')
  const [error, setError] = useState('')
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await register({ name, email, password, role, phone: phone || undefined })
      navigate(ROUTES.LOGIN)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Registration failed. Try again.')
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-500 rounded-full blur-3xl" />
        </div>
        <div className="relative text-center px-12">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 border border-white/20">
            <Anchor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Join Aktau Port</h1>
          <p className="text-blue-200/70 max-w-sm mx-auto text-sm leading-relaxed">
            Create your account to start managing cargo, coordinating berths, and tracking shipments in real time.
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="text-slate-500 mt-1 text-sm">Register for Aktau Port Logistics</p>
          </div>
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-lg border border-red-200 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input id="name" label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required className="col-span-2" />
              <Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="col-span-2 sm:col-span-1" />
              <Input id="phone" label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 700 123 4567" className="col-span-2 sm:col-span-1" />
              <Input id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" required minLength={8} className="col-span-2" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Role</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {roles.map((r) => {
                  const Icon = r.icon
                  const selected = role === r.value
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                        selected
                          ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${selected ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className={`text-xs font-semibold ${selected ? 'text-blue-700' : 'text-slate-700'}`}>
                        {r.label}
                      </span>
                      <span className={`text-[10px] text-center leading-tight ${selected ? 'text-blue-500' : 'text-slate-400'}`}>
                        {r.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg">
              Create Account
            </Button>
            <p className="text-sm text-center text-slate-500">
              Already have an account?{' '}
              <Link to={ROUTES.LOGIN} className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
