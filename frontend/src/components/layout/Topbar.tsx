import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, LogOut, WifiOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Topbar() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const offline = useUiStore((s) => s.offline)
  const navigate = useNavigate()

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <header className="relative bg-white border-b border-slate-200">
      {offline && (
        <div className="flex items-center justify-center gap-2 bg-amber-50 text-amber-700 text-xs py-1.5 border-b border-amber-200">
          <WifiOff className="w-3 h-3" />
          <span>{t('common.offline')}</span>
        </div>
      )}
      <div className="flex items-center justify-between h-14 px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-400">Aktau Port Logistics</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(ROUTES.NOTIFICATIONS)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
          </button>
          <LanguageSwitcher />
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold text-white">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900 leading-tight">{user?.name}</p>
                <p className={cn(
                  'text-xs capitalize leading-tight',
                  user?.role === 'admin' ? 'text-blue-600' : 'text-slate-400',
                )}>
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                logout()
                navigate(ROUTES.LOGIN)
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
