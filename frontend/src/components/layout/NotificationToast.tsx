import { useUiStore } from '@/store/uiStore'
import { X, Anchor } from 'lucide-react'
import { useEffect, useState } from 'react'

export function NotificationToast() {
  const notifications = useUiStore((s) => s.notifications)
  const dismiss = useUiStore((s) => s.dismissNotification)

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((n) => (
        <ToastItem key={n.id} id={n.id} title={n.title} message={n.message} onDismiss={dismiss} />
      ))}
    </div>
  )
}

function ToastItem({ id, title, message, onDismiss }: { id: string; title: string; message: string; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  return (
    <div
      className={`bg-white dark:bg-kazakh-burgundy-dark border border-silk-gold/30 rounded-xl shadow-lg p-4 transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Anchor className="w-3.5 h-3.5 text-silk-gold shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-kazakh-burgundy dark:text-silk-gold truncate">{title}</p>
            <p className="text-xs text-modern-slate dark:text-warm-sand mt-0.5 line-clamp-2">{message}</p>
          </div>
        </div>
        <button onClick={() => onDismiss(id)} className="shrink-0 p-0.5 rounded hover:bg-silk-gold/20 transition-colors">
          <X className="w-3.5 h-3.5 text-modern-slate dark:text-warm-sand" />
        </button>
      </div>
    </div>
  )
}
