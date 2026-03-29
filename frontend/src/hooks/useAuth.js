import { useAuthStore } from '@/store/authStore'
import * as authService from '@/services/authService'

export function useAuth() {
  const auth = useAuthStore()

  const login = async (credentials) => {
    const session = await authService.login(credentials)
    auth.login(session.token, session.user, session.company)
    return session
  }

  const signup = async (payload) => {
    const session = await authService.signup(payload)
    auth.login(session.token, session.user, session.company)
    return session
  }

  return {
    ...auth,
    login,
    signup,
    forgotPassword: authService.forgotPassword,
    resetPassword: authService.resetPassword,
  }
}
