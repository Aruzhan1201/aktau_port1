import { useNotifications, useMarkNotificationRead } from '@/hooks/useOther'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { Bell, BellRing, Package, Anchor, CreditCard, Info } from 'lucide-react'
import type { Notification } from '@/types'

const typeIcons: Record<string, typeof Bell> = {
  cargo_update: Package,
  berth_update: Anchor,
  payment_update: CreditCard,
  system: Info,
}

const typeColors: Record<string, string> = {
  cargo_update: 'bg-blue-50 text-blue-600',
  berth_update: 'bg-emerald-50 text-emerald-600',
  payment_update: 'bg-amber-50 text-amber-600',
  system: 'bg-slate-50 text-slate-600',
}

export function NotificationsPage() {
  const { data, isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Notifications" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const notifications = data?.items ?? []
  const unread = data?.unread ?? 0

  if (notifications.length === 0) {
    return (
      <div>
        <PageHeader title="Notifications" description="No notifications yet" />
        <EmptyState
          icon={<Bell className="w-6 h-6" />}
          title="All caught up"
          description="You don't have any notifications right now."
        />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Notifications"
        description={`${unread} unread`}
      />
      <div className="space-y-2">
        {notifications.map((n: Notification) => {
          const Icon = typeIcons[n.type] || Bell
          const color = typeColors[n.type] || 'bg-slate-50 text-slate-600'
          return (
            <div
              key={n.id}
              className={`rounded-xl border bg-white p-4 flex items-start justify-between gap-4 transition-all duration-200 hover:shadow-sm ${
                !n.is_read ? 'border-l-4 border-l-blue-500 shadow-sm' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${!n.is_read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {n.title}
                    </p>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDate(n.created_at)}</p>
                </div>
              </div>
              {!n.is_read && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => markRead.mutate(n.id)}
                  className="shrink-0"
                >
                  <BellRing className="w-3 h-3" />
                  Mark Read
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
