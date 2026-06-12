import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'
import { ReportIncidentModal } from '@/components/incidents/ReportIncidentModal'
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
  Wind,
  Truck,
  ShieldAlert,
  Users,
  DollarSign,
  Settings,
  Send,
  AlertTriangle,
  FileText,
  Car,
  ParkingCircle,
  GanttChartSquare,
  Crosshair,
  LineChart,
} from 'lucide-react'

interface NavItem {
  labelKey: string
  path: string
  icon: typeof LayoutDashboard
  roles: UserRole[]
}

const allNavItems: NavItem[] = [
  { labelKey: 'dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard, roles: ['admin', 'parking_manager', 'port_manager', 'governance', 'super_admin'] },
  { labelKey: 'cargo', path: ROUTES.CARGO, icon: Package, roles: ['admin', 'captain', 'port_manager', 'client', 'driver', 'super_admin'] },
  { labelKey: 'ships', path: ROUTES.SHIPS, icon: Ship, roles: ['admin', 'port_manager', 'captain', 'super_admin'] },
  { labelKey: 'queue', path: ROUTES.QUEUE, icon: ListOrdered, roles: ['admin', 'parking_manager', 'super_admin'] },
  { labelKey: 'assignments', path: ROUTES.ASSIGNMENTS, icon: Link2, roles: ['admin', 'parking_manager', 'super_admin'] },
  { labelKey: 'payments', path: ROUTES.PAYMENTS, icon: CreditCard, roles: ['admin', 'client', 'driver', 'captain', 'super_admin', 'port_manager', 'parking_manager', 'governance'] },
  { labelKey: 'notifications', path: ROUTES.NOTIFICATIONS, icon: Bell, roles: ['admin', 'parking_manager', 'captain', 'port_manager', 'client', 'driver', 'governance', 'super_admin'] },
  { labelKey: 'portMap', path: ROUTES.MAP, icon: Map, roles: ['admin', 'parking_manager', 'captain', 'port_manager', 'client', 'driver', 'governance', 'super_admin'] },
  { labelKey: 'messages', path: ROUTES.CHAT, icon: MessageSquare, roles: ['admin', 'parking_manager', 'captain', 'port_manager', 'driver', 'governance', 'super_admin', 'client'] },
  { labelKey: 'weather', path: ROUTES.WEATHER, icon: Wind, roles: ['admin', 'parking_manager', 'captain', 'port_manager', 'governance', 'super_admin'] },
  { labelKey: 'deals', path: ROUTES.DEALS, icon: Handshake, roles: ['admin', 'super_admin', 'governance', 'port_manager', 'parking_manager'] },
  { labelKey: 'clientDashboard', path: ROUTES.CLIENT_DASHBOARD, icon: Send, roles: ['client', 'admin', 'super_admin'] },
  { labelKey: 'trackShipment', path: ROUTES.MAP, icon: Crosshair, roles: ['client'] },
  { labelKey: 'deals', path: ROUTES.DEALS, icon: Handshake, roles: ['client'] },
  { labelKey: 'driverDashboard', path: ROUTES.DRIVER_DASHBOARD, icon: LayoutDashboard, roles: ['driver', 'admin', 'super_admin'] },
  { labelKey: 'parkingSpots', path: ROUTES.PARKING_SPOTS, icon: ParkingCircle, roles: ['driver', 'admin', 'super_admin'] },
  { labelKey: 'deals', path: ROUTES.DEALS, icon: Handshake, roles: ['driver'] },
  { labelKey: 'captainDashboard', path: ROUTES.CAPTAIN_DASHBOARD, icon: LayoutDashboard, roles: ['captain', 'admin', 'super_admin'] },
  { labelKey: 'orderBoard', path: ROUTES.CAPTAIN_ORDERS, icon: ClipboardList, roles: ['captain'] },
  { labelKey: 'portSchema', path: ROUTES.CAPTAIN_PARKING, icon: MapPin, roles: ['captain'] },
  { labelKey: 'deals', path: ROUTES.DEALS, icon: Handshake, roles: ['captain'] },
  { labelKey: 'parkingZones', path: ROUTES.PARKING_ZONES, icon: Car, roles: ['parking_manager', 'admin', 'super_admin'] },
  { labelKey: 'parkingSpots', path: ROUTES.PARKING_SPOTS, icon: ParkingCircle, roles: ['parking_manager', 'admin', 'super_admin'] },
  { labelKey: 'govDashboard', path: ROUTES.GOV_DASHBOARD, icon: ShieldAlert, roles: ['governance', 'admin', 'super_admin'] },
  { labelKey: 'incidents', path: ROUTES.GOV_INCIDENTS, icon: AlertTriangle, roles: ['governance', 'admin', 'super_admin'] },
  { labelKey: 'reports', path: ROUTES.GOV_REPORTS, icon: FileText, roles: ['governance', 'admin', 'super_admin'] },
  { labelKey: 'excelReports', path: ROUTES.GOVERNANCE_EXCEL, icon: FileText, roles: ['governance', 'admin', 'super_admin'] },
  { labelKey: 'trafficAnalytics', path: ROUTES.GOVERNANCE_TRAFFIC, icon: LineChart, roles: ['governance', 'admin', 'super_admin'] },
  { labelKey: 'documents', path: ROUTES.GOVERNANCE_DOCUMENTS, icon: ShieldAlert, roles: ['governance', 'admin', 'super_admin'] },
  { labelKey: 'analytics', path: ROUTES.ANALYTICS, icon: BarChart3, roles: ['admin', 'governance', 'super_admin'] },
  { labelKey: 'companies', path: ROUTES.COMPANIES, icon: Building2, roles: ['admin', 'super_admin'] },
  { labelKey: 'roRo', path: ROUTES.RO_RO, icon: Truck, roles: ['admin', 'parking_manager', 'super_admin'] },
  { labelKey: 'roRoAnalytics', path: ROUTES.RO_RO_ANALYTICS, icon: BarChart3, roles: ['admin', 'parking_manager', 'super_admin', 'governance'] },
  { labelKey: 'userManagement', path: ROUTES.SUPER_ADMIN_USERS, icon: Users, roles: ['super_admin'] },
  { labelKey: 'tariffManagement', path: ROUTES.SUPER_ADMIN_TARIFFS, icon: DollarSign, roles: ['super_admin'] },
  { labelKey: 'portSettings', path: ROUTES.SUPER_ADMIN_PORTS, icon: Settings, roles: ['super_admin'] },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const [showReport, setShowReport] = useState(false)

  const visibleItems = useMemo(() => {
    if (!user) return []
    return allNavItems.filter((item) => item.roles.includes(user.role as UserRole))
  }, [user])

  return (
    <>
      <aside
        className={cn(
          'bg-sidebar-bg text-white flex flex-col transition-all duration-300 ease-in-out relative',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-silk-gold/20">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Anchor className="w-4 h-4 text-silk-gold" />
              <span className="font-serif font-semibold text-sm tracking-tight text-sidebar-text-active">
                Aktau Port
              </span>
            </div>
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

        {!collapsed && (
          <div className="px-3 py-2 border-b border-silk-gold/10">
            <div className="h-px bg-gradient-to-r from-transparent via-silk-gold/30 to-transparent" />
          </div>
        )}

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
                      ? 'bg-sidebar-active/20 text-sidebar-text-active border-l-2 border-silk-gold shadow-sm'
                      : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active',
                  )
                }
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                {!collapsed && <span>{t(`nav.${item.labelKey}`)}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Report Incident button at bottom */}
        <div className={cn('p-3 border-t border-silk-gold/20', collapsed && 'flex justify-center')}>
          <button
            onClick={() => setShowReport(true)}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
              'bg-silk-gold/20 text-silk-gold-light hover:bg-silk-gold/30 hover:text-white',
              collapsed && 'justify-center px-0'
            )}
            aria-label="Report Incident"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Report Incident</span>}
          </button>
        </div>
      </aside>

      <ReportIncidentModal open={showReport} onClose={() => setShowReport(false)} />
    </>
  )
}
