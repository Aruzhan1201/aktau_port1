import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { cn } from '@/lib/utils'

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
  { code: 'kk', label: 'KZ' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language?.split('-')[0] || 'en'

  return (
    <div className="flex items-center gap-1">
      <Languages className="w-3.5 h-3.5 text-silk-gold dark:text-silk-gold/70" />
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={cn(
            'text-xs font-medium px-1.5 py-0.5 rounded transition-colors',
            current === lang.code
              ? 'bg-silk-gold/30 text-kazakh-burgundy dark:text-silk-gold font-semibold'
              : 'text-modern-slate dark:text-warm-sand/60 hover:text-kazakh-burgundy dark:hover:text-silk-gold hover:bg-silk-gold/20',
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
