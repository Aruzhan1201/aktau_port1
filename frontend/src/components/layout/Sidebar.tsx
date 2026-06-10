import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'
import {
  LayoutDashboard,
  Package,
  Ship,
  Anchor,
  ListOrdered,
  Link2,
  Map,
  CreditCard,
  BarChart3,
  Building2,
  Bell,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  MapPin,
  MessageSquare,
  Handshake,
} from 'lucide-react'

interface NavItem {
  label: string
  path: string
  icon: typeof LayoutDashboard
  roles: UserRole[]
}

const allNavItems: NavItem[] = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard, roles: ['admin', 'parking_manager', 'captain', 'client'] },
  { label: 'Cargo', path: ROUTES.CARGO, icon: Package, roles: ['admin', 'parking_manager', 'captain', 'client'] },
  { label: 'Ships', path: ROUTES.SHIPS, icon: Ship, roles: ['admin', 'parking_manager', 'captain'] },
  { label: 'Berths', path: ROUTES.BERTHS, icon: Anchor, roles: ['admin', 'parking_manager'] },
  { label: 'Queue', path: ROUTES.QUEUE, icon: ListOrdered, roles: ['admin', 'parking_manager'] },
  { label: 'Assignments', path: ROUTES.ASSIGNMENTS, icon: Link2, roles: ['admin', 'parking_manager'] },
  { label: 'Map', path: ROUTES.MAP, icon: Map, roles: ['admin', 'parking_manager', 'captain', 'client'] },
  { label: 'Payments', path: ROUTES.PAYMENTS, icon: CreditCard, roles: ['admin'] },
  { label: 'Analytics', path: ROUTES.ANALYTICS, icon: BarChart3, roles: ['admin'] },
  { label: 'Companies', path: ROUTES.COMPANIES, icon: Building2, roles: ['admin'] },
  { label: 'Notifications', path: ROUTES.NOTIFICATIONS, icon: Bell, roles: ['admin', 'parking_manager', 'captain', 'client'] },
  // Captain-specific nav items
  { label: 'Captain Dashboard', path: ROUTES.CAPTAIN_DASHBOARD, icon: LayoutDashboard, roles: ['captain'] },
  { label: 'Order Board', path: ROUTES.CAPTAIN_ORDERS, icon: ClipboardList, roles: ['captain'] },
  { label: 'Parking Schema', path: ROUTES.CAPTAIN_PARKING, icon: MapPin, roles: ['captain'] },
  { label: 'Messages', path: ROUTES.CAPTAIN_CHAT, icon: MessageSquare, roles: ['captain'] },
  { label: 'Deals', path: ROUTES.CAPTAIN_DEALS, icon: Handshake, roles: ['captain'] },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const user = useAuthStore((s) => s.user)

  const visibleItems = useMemo(() => {
    if (!user) return []
    return allNavItems.filter((item) => item.roles.includes(user.role as UserRole))
  }, [user])

  return (
    <aside
      className={cn(
        'bg-sidebar-bg text-white flex flex-col transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex items-center justify-between h-14 px-4 border-b border-white/5">
        {!collapsed && (
          <span className="font-semibold text-sm tracking-tight text-sidebar-text-active">
            Aktau Port
          </span>
        )}
        <button
          onClick={onToggle}
          className="text-sidebar-text hover:text-sidebar-text-active transition-colors p-1 rounded-md hover:bg-sidebar-hover"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }: { isActive: boolean }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-active text-sidebar-text-active shadow-sm'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active',
                )
              }
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
