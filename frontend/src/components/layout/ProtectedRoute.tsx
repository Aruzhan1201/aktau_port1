import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/lib/constants'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  children: ReactNode
  roles?: UserRole[]
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isAuthLoading, user } = useAuthStore()
  const location = useLocation()

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-heritage-cream">
        <div className="animate-spin h-8 w-8 border-4 border-silk-gold border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  if (roles && user && !roles.includes(user.role as UserRole)) {
    const roleDashboards: Record<string, string> = {
      client: ROUTES.CLIENT_DASHBOARD,
      driver: ROUTES.DRIVER_DASHBOARD,
      captain: ROUTES.CAPTAIN_DASHBOARD,
    }
    return <Navigate to={roleDashboards[user.role] || ROUTES.DASHBOARD} replace />
  }

  return <>{children}</>
}
