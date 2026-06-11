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
      <Languages className="w-3.5 h-3.5 text-slate-400" />
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={cn(
            'text-xs font-medium px-1.5 py-0.5 rounded transition-colors',
            current === lang.code
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
