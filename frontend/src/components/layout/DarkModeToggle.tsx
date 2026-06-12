import { useUiStore } from '@/store/uiStore'
import { Sun, Moon } from 'lucide-react'

export function DarkModeToggle() {
  const darkMode = useUiStore((s) => s.darkMode)
  const toggle = useUiStore((s) => s.toggleDarkMode)

  return (
    <button
      onClick={toggle}
      className="relative p-2 rounded-lg text-warm-sand dark:text-silk-gold hover:bg-kazakh-burgundy-light/30 dark:hover:bg-white/10 transition-colors"
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
    </button>
  )
}
