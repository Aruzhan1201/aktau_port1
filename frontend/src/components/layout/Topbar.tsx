import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, LogOut, WifiOff, Anchor } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from './LanguageSwitcher'
import { DarkModeToggle } from './DarkModeToggle'
import { useEffect, useState } from 'react'

function TimezoneIndicator() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 30000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="text-xs text-warm-sand dark:text-silk-gold/70 font-sans">
      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Aqtau', hour12: false })}
      {' '}UTC+5
    </span>
  )
}

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
    <header className="relative bg-white dark:bg-kazakh-burgundy-dark border-b border-silk-gold/20">
      {offline && (
        <div className="flex items-center justify-center gap-2 bg-merchant-copper/20 text-merchant-copper text-xs py-1.5 border-b border-merchant-copper/30">
          <WifiOff className="w-3 h-3" />
          <span>{t('common.offline')}</span>
        </div>
      )}
      <div className="flex items-center justify-between h-14 px-6">
        <div className="flex items-center gap-3">
          <Anchor className="w-4 h-4 text-silk-gold hidden sm:block" />
          <div>
            <span className="text-sm font-serif font-semibold text-kazakh-burgundy dark:text-silk-gold">
              {t('app.title')}
            </span>
            <span className="text-xs text-modern-slate dark:text-warm-sand ml-2 hidden md:inline font-sans">
              {t('app.subtitle')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TimezoneIndicator />
          <div className="h-4 w-px bg-silk-gold/30" />
          <DarkModeToggle />
          <button
            onClick={() => navigate(ROUTES.NOTIFICATIONS)}
            className="relative p-2 rounded-lg text-modern-slate dark:text-warm-sand hover:text-kazakh-burgundy dark:hover:text-silk-gold hover:bg-silk-gold/20 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
          </button>
          <LanguageSwitcher />
          <div className="flex items-center gap-3 pl-3 border-l border-silk-gold/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-kazakh-burgundy to-silk-gold-dark flex items-center justify-center text-xs font-semibold text-heritage-cream shadow-sm">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-kazakh-burgundy dark:text-silk-gold leading-tight">{user?.name}</p>
                <p className={cn(
                  'text-xs capitalize leading-tight font-sans',
                  'text-modern-slate dark:text-warm-sand'
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
              className="p-2 rounded-lg text-modern-slate dark:text-warm-sand hover:text-status-cancelled hover:bg-status-cancelled/10 transition-colors"
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
