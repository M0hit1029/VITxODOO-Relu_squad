import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { hydrateMockDb } from '@/services/mockDb'
import { shouldUseMockApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

export function AppProviders({ children }) {
  const darkMode = useUIStore((state) => state.darkMode)
  const validateSession = useAuthStore((state) => state.validateSession)

  useEffect(() => {
    if (shouldUseMockApi) {
      hydrateMockDb()
    }
    validateSession()
  }, [validateSession])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        theme={darkMode ? 'dark' : 'light'}
        toastOptions={{
          classNames: {
            toast:
              '!border-border !bg-card !text-card-foreground !shadow-[0_24px_80px_rgba(0,0,0,0.16)]',
            title: '!font-medium',
          },
        }}
      />
    </>
  )
}
