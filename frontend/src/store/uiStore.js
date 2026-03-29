import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      darkMode: true,
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleDarkMode: () => set({ darkMode: !get().darkMode }),
    }),
    {
      name: 'reimbursement-ui',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        darkMode: state.darkMode,
      }),
    },
  ),
)
