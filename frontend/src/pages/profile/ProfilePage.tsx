import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/common/PageHeader'
import { formatDate } from '@/lib/utils'
import { User, Mail, ShieldCheck, Calendar, CheckCircle2, XCircle } from 'lucide-react'

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <User className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-lg font-semibold text-slate-900">Please log in</h2>
        <p className="text-sm text-slate-500 mt-1">You need to be authenticated to view this page.</p>
      </div>
    )
  }

  const fields = [
    { label: 'Name', value: user.name, icon: User },
    { label: 'Email', value: user.email, icon: Mail },
    { label: 'Role', value: (user.role ?? '').replace('_', ' '), icon: ShieldCheck },
    { label: 'Status', value: user.is_active ? 'Active' : 'Inactive', icon: user.is_active ? CheckCircle2 : XCircle },
    { label: 'Joined', value: formatDate(user.created_at), icon: Calendar },
  ]

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Profile" description="Your account information" />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold text-white">
            {(user.name ?? '').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{user.name || 'Unknown'}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {fields.map((field) => {
            const Icon = field.icon
            return (
              <div key={field.label} className="flex items-start gap-2">
                <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">{field.label}</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{field.value}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
