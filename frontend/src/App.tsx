import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { GlobalErrorBoundary, RouteErrorBoundary } from '@/components/ErrorBoundary'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { CargoListPage } from '@/pages/cargo/CargoListPage'
import { CargoCreatePage } from '@/pages/cargo/CargoCreatePage'
import { CargoDetailPage } from '@/pages/cargo/CargoDetailPage'
import { AIOrderPage } from '@/pages/cargo/AIOrderPage'
import { ShipListPage } from '@/pages/ships/ShipListPage'
import { ShipDetailPage } from '@/pages/ships/ShipDetailPage'
import { ShipCreatePage } from '@/pages/ships/ShipCreatePage'
import { BerthListPage } from '@/pages/berths/BerthListPage'
import { BerthDetailPage } from '@/pages/berths/BerthDetailPage'
import { QueuePage } from '@/pages/queue/QueuePage'
import { AssignmentsPage } from '@/pages/assignments/AssignmentsPage'
import { PaymentsPage } from '@/pages/payments/PaymentsPage'
import { AnalyticsPage } from '@/pages/analytics/AnalyticsPage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'
import { CompanyManagementPage } from '@/pages/companies/CompanyManagementPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { CaptainDashboard } from '@/pages/captain/CaptainDashboard'
import { OrderBoard } from '@/pages/captain/OrderBoard'
import { ParkingSchema } from '@/pages/captain/ParkingSchema'
import { ChatPage } from '@/pages/captain/ChatPage'
import { DealsPage as CaptainDealsPage } from '@/pages/captain/DealsPage'
import { GovDashboard } from '@/pages/gov/GovDashboard'
import { IncidentsPage } from '@/pages/gov/IncidentsPage'
import { ReportsPage } from '@/pages/gov/ReportsPage'
import { UserManagementPage } from '@/pages/super-admin/UserManagementPage'
import { TariffManagementPage } from '@/pages/super-admin/TariffManagementPage'
import { WeatherPage } from '@/pages/weather/WeatherPage'
import { MapPage } from '@/pages/maps/MapPage'
import { RoRoPage } from '@/pages/ro-ro/RoRoPage'
import { RoRoAnalyticsPage } from '@/pages/ro-ro/RoRoAnalyticsPage'
import { ParkingZonesPage } from '@/pages/parking/ParkingZonesPage'
import { ParkingSpotsPage } from '@/pages/parking/ParkingSpotsPage'
import { DealsListPage } from '@/pages/deals/DealsListPage'
import { DealDetailPage } from '@/pages/deals/DealDetailPage'
import { ClientDashboard } from '@/pages/client/ClientDashboard'
import { GovExcelReportPage } from '@/pages/gov/GovExcelReportPage'
import { GovTrafficPage } from '@/pages/gov/GovTrafficPage'
import { GovDocumentsPage } from '@/pages/gov/GovDocumentsPage'
import { DriverDashboard } from '@/pages/driver/DriverDashboard'
import { SenderDashboard } from '@/pages/sender/SenderDashboard'
import { ReceiverDashboard } from '@/pages/receiver/ReceiverDashboard'
import { ClientTrackingPage } from '@/pages/tracking/ClientTrackingPage'
import { ParkingSchema3D } from '@/pages/parking/ParkingSchema3D'
import { ROUTES } from '@/lib/constants'
import { useAuthStore } from '@/store/authStore'
import { useWsStore } from '@/store/wsStore'
import { useUiStore } from '@/store/uiStore'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { NotificationToast } from '@/components/layout/NotificationToast'
import { useEffect } from 'react'


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const err = error as { status?: number }
        if (err.status && err.status >= 400 && err.status < 500) return false
        if (err.status && err.status >= 500) return failureCount < 3
        return failureCount < 2
      },
      retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 10000),
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: (failureCount, error: unknown) => {
        const err = error as { status?: number }
        return err.status ? err.status >= 500 && failureCount < 2 : false
      },
    },
  },
})

function AppInitializer({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const connect = useWsStore((s) => s.connect)
  const disconnect = useWsStore((s) => s.disconnect)
  const setOffline = useUiStore((s) => s.setOffline)

  useRealtimeSync()

  useEffect(() => {
    const handleOffline = () => setOffline(true)
    const handleOnline = () => {
      setOffline(false)
      queryClient.invalidateQueries()
    }
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [setOffline])

  useEffect(() => {
    if (isAuthenticated) {
      connect()
    }
    return () => { disconnect() }
  }, [isAuthenticated, connect, disconnect])

  return <>{children}</>
}

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-heritage-cream">
        <div className="animate-spin h-8 w-8 border-4 border-silk-gold border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalErrorBoundary>
        <BrowserRouter>
          <AppInitializer>
            <Routes>
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
              <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

              <Route
                element={
                  <ProtectedRoute>
                    <RouteErrorBoundary>
                      <AppShell />
                    </RouteErrorBoundary>
                  </ProtectedRoute>
                }
              >
                <Route path={ROUTES.DASHBOARD} element={
                  <ProtectedRoute roles={['admin', 'super_admin', 'governance', 'port_manager', 'parking_manager']}>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.CARGO} element={<CargoListPage />} />
                <Route path={ROUTES.CARGO_NEW} element={
                  <ProtectedRoute roles={['client', 'admin']}>
                    <CargoCreatePage />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.CARGO_AI_ORDER} element={
                  <ProtectedRoute roles={['client', 'admin']}>
                    <AIOrderPage />
                  </ProtectedRoute>
                } />
                <Route path="/cargo/:id" element={<CargoDetailPage />} />
                <Route path={ROUTES.SHIPS} element={<ShipListPage />} />
                <Route path={ROUTES.SHIP_NEW} element={
                  <ProtectedRoute roles={['admin', 'super_admin', 'captain']}>
                    <ShipCreatePage />
                  </ProtectedRoute>
                } />
                <Route path="/ships/:id" element={<ShipDetailPage />} />
                <Route path={ROUTES.BERTHS} element={<BerthListPage />} />
                <Route path="/berths/:id" element={<BerthDetailPage />} />
                <Route path={ROUTES.QUEUE} element={
                  <ProtectedRoute roles={['admin', 'parking_manager', 'super_admin']}>
                    <QueuePage />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.ASSIGNMENTS} element={
                  <ProtectedRoute roles={['admin', 'parking_manager', 'super_admin']}>
                    <AssignmentsPage />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.PAYMENTS} element={
                  <ProtectedRoute roles={['client', 'driver', 'captain', 'admin', 'super_admin', 'port_manager', 'parking_manager', 'governance']}>
                    <PaymentsPage />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.ANALYTICS} element={
                  <ProtectedRoute roles={['admin', 'super_admin', 'governance', 'port_manager', 'parking_manager']}>
                    <AnalyticsPage />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.MAP} element={<MapPage />} />
                <Route path={ROUTES.WEATHER} element={
                  <ProtectedRoute roles={['admin', 'parking_manager', 'captain', 'port_manager', 'governance', 'super_admin']}>
                    <WeatherPage />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
                <Route path={ROUTES.COMPANIES} element={
                  <ProtectedRoute roles={['admin', 'super_admin']}>
                    <CompanyManagementPage />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
                {/* Client routes */}
                <Route path={ROUTES.CLIENT_DASHBOARD} element={
                  <ProtectedRoute roles={['client', 'admin', 'super_admin']}>
                    <ClientDashboard />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.SENDER_DASHBOARD} element={
                  <ProtectedRoute roles={['client', 'admin', 'super_admin']}>
                    <SenderDashboard />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.RECEIVER_DASHBOARD} element={
                  <ProtectedRoute roles={['client', 'admin', 'super_admin']}>
                    <ReceiverDashboard />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.CLIENT_TRACKING} element={
                  <ProtectedRoute roles={['client', 'admin', 'super_admin']}>
                    <ClientTrackingPage />
                  </ProtectedRoute>
                } />
                <Route path="/tracking/:id" element={
                  <ProtectedRoute roles={['client', 'driver', 'captain', 'admin', 'super_admin']}>
                    <ClientTrackingPage />
                  </ProtectedRoute>
                } />
                {/* Captain routes */}
                <Route path={ROUTES.CAPTAIN_DASHBOARD} element={
                  <ProtectedRoute roles={['captain', 'admin', 'super_admin']}>
                    <CaptainDashboard />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.CAPTAIN_ORDERS} element={
                  <ProtectedRoute roles={['captain', 'admin', 'super_admin']}>
                    <OrderBoard />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.CAPTAIN_PARKING} element={
                  <ProtectedRoute roles={['captain', 'admin', 'super_admin']}>
                    <ParkingSchema />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.CAPTAIN_CHAT} element={
                  <ProtectedRoute roles={['captain', 'driver', 'parking_manager', 'port_manager', 'admin', 'super_admin', 'governance', 'client']}>
                    <ChatPage />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.CHAT} element={
                  <ProtectedRoute roles={['client', 'captain', 'driver', 'parking_manager', 'port_manager', 'admin', 'super_admin', 'governance']}>
                    <ChatPage />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.CAPTAIN_DEALS} element={
                  <ProtectedRoute roles={['captain', 'admin', 'super_admin']}>
                    <Navigate to={ROUTES.DEALS} replace />
                  </ProtectedRoute>
                } />
                {/* Government routes */}
                <Route path={ROUTES.GOV_DASHBOARD} element={
                  <ProtectedRoute roles={['governance', 'admin', 'super_admin']}>
                    <GovDashboard />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.GOV_INCIDENTS} element={
                  <ProtectedRoute roles={['governance', 'admin', 'super_admin']}>
                    <IncidentsPage />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.GOV_REPORTS} element={
                  <ProtectedRoute roles={['governance', 'admin', 'super_admin']}>
                    <ReportsPage />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.GOVERNANCE_EXCEL} element={
                  <ProtectedRoute roles={['governance', 'admin', 'super_admin']}>
                    <GovExcelReportPage />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.GOVERNANCE_TRAFFIC} element={
                  <ProtectedRoute roles={['governance', 'admin', 'super_admin']}>
                    <GovTrafficPage />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.GOVERNANCE_DOCUMENTS} element={
                  <ProtectedRoute roles={['governance', 'admin', 'super_admin']}>
                    <GovDocumentsPage />
                  </ProtectedRoute>
                } />
                {/* Parking routes */}
                <Route path={ROUTES.PARKING_ZONES} element={
                  <ProtectedRoute roles={['parking_manager', 'admin', 'super_admin']}>
                    <ParkingZonesPage />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.DRIVER_DASHBOARD} element={
                  <ProtectedRoute roles={['driver', 'admin', 'super_admin']}>
                    <DriverDashboard />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.PARKING_SPOTS} element={
                  <ProtectedRoute roles={['parking_manager', 'driver', 'admin', 'super_admin']}>
                    <ParkingSpotsPage />
                  </ProtectedRoute>
                } />
                <Route path="/parking/schema-3d" element={
                  <ProtectedRoute roles={['parking_manager', 'admin', 'super_admin']}>
                    <ParkingSchema3D />
                  </ProtectedRoute>
                } />
                {/* Deal routes */}
                <Route path={ROUTES.DEALS} element={
                  <ProtectedRoute roles={['client', 'driver', 'captain', 'port_manager', 'parking_manager', 'admin', 'super_admin', 'governance']}>
                    <DealsListPage />
                  </ProtectedRoute>
                } />
                <Route path="/deals/:id" element={
                  <ProtectedRoute roles={['client', 'driver', 'captain', 'port_manager', 'parking_manager', 'admin', 'super_admin', 'governance']}>
                    <DealDetailPage />
                  </ProtectedRoute>
                } />
                {/* Ro-Ro routes */}
                <Route path={ROUTES.RO_RO} element={
                  <ProtectedRoute roles={['parking_manager', 'admin', 'super_admin']}>
                    <RoRoPage />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.RO_RO_ANALYTICS} element={
                  <ProtectedRoute roles={['parking_manager', 'admin', 'super_admin', 'governance']}>
                    <RoRoAnalyticsPage />
                  </ProtectedRoute>
                } />
                {/* Super Admin routes */}
                <Route path={ROUTES.SUPER_ADMIN_USERS} element={
                  <ProtectedRoute roles={['super_admin']}>
                    <UserManagementPage />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.SUPER_ADMIN_TARIFFS} element={
                  <ProtectedRoute roles={['super_admin']}>
                    <TariffManagementPage />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.SUPER_ADMIN_PORTS} element={
                  <ProtectedRoute roles={['super_admin']}>
                    <div className="p-6 text-slate-500">Port settings page</div>
                  </ProtectedRoute>
                } />
                <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
              </Route>

              <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            </Routes>
            <NotificationToast />
          </AppInitializer>
        </BrowserRouter>
      </GlobalErrorBoundary>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
