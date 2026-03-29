import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      company: null,
      isAuthenticated: false,
      role: null,
      login: (token, user, company) =>
        set({
          token,
          user,
          company,
          isAuthenticated: true,
          role: user?.role ?? null,
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          company: null,
          isAuthenticated: false,
          role: null,
        }),
      setUser: (user) =>
        set((state) => ({
          user,
          role: user?.role ?? state.role,
        })),
      validateSession: () => {
        const state = get()
        if (!state.token || !state.user) state.logout()
      },
    }),
    {
      name: 'reimbursement-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        company: state.company,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    },
  ),
)
