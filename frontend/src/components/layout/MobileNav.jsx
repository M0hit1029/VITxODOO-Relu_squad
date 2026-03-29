import { AnimatePresence, motion } from 'framer-motion'
import {
  FilePlus2,
  LayoutDashboard,
  ListTodo,
  LogOut,
  ReceiptText,
  Settings,
  Users,
  WalletCards,
  Workflow,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { NAVIGATION_BY_ROLE } from '@/lib/constants'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const iconMap = {
  FilePlus2,
  LayoutDashboard,
  ListTodo,
  ReceiptText,
  Settings,
  Users,
  WalletCards,
  Workflow,
}

export function MobileNav({ open, onClose }) {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigation = NAVIGATION_BY_ROLE[user?.role ?? 'employee'] ?? []

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border/50 bg-background/95 backdrop-blur-2xl lg:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground">
                  AL
                </div>
                <div>
                  <p className="font-display text-base">
                    Amber<span className="text-primary">Ledger</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {navigation.map((item, i) => {
                const Icon = iconMap[item.icon]
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                          isActive
                            ? 'bg-primary/10 text-primary shadow-[inset_3px_0_0_var(--primary)]'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                        )
                      }
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </NavLink>
                  </motion.div>
                )
              })}
            </nav>

            {/* User */}
            <div className="border-t border-border/50 px-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar name={user?.name} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user?.name}</p>
                  <Badge variant="outline" className="mt-0.5 text-[10px]">
                    {user?.role}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                className="mt-3 h-9 w-full justify-start gap-2 text-sm text-muted-foreground hover:text-destructive"
                onClick={() => {
                  logout()
                  onClose()
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
