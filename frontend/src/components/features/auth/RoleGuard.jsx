import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function RoleGuard({ allowedRoles, children, fallback }) {
  const role = useAuthStore((state) => state.role)

  if (!allowedRoles.includes(role)) {
    return fallback ?? <Navigate to="/403" replace />
  }

  return children
}
