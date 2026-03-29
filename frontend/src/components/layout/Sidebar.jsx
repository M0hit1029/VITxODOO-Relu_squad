import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronsLeft,
  ChevronsRight,
  FilePlus2,
  LayoutDashboard,
  ListTodo,
  ReceiptText,
  Settings,
  Users,
  WalletCards,
  Workflow,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Tooltip } from '@/components/ui/Tooltip'
import { NAVIGATION_BY_ROLE } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

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

export function Sidebar() {
  const user = useAuthStore((state) => state.user)
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const navigation = NAVIGATION_BY_ROLE[user?.role ?? 'employee'] ?? []

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 256 : 72 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="hidden h-screen flex-col border-r border-border/50 bg-card py-5 lg:flex"
      style={{ overflow: 'hidden', position: 'sticky', top: 0 }}
    >
      {/* Logo row */}
      <div className="mb-6 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground shadow-[0_4px_12px_color-mix(in_oklab,var(--primary)_30%,transparent)]">
            AL
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="min-w-0"
              >
                <p className="truncate font-display text-base">
                  Amber<span className="text-primary">Ledger</span>
                </p>
                <p className="truncate text-[11px] text-muted-foreground">Reimbursement OS</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {navigation.map((item, index) => {
          const Icon = iconMap[item.icon]

          const link = (
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  'hover:bg-primary/8 hover:text-foreground',
                  isActive &&
                    'border-primary/20 bg-primary/10 text-primary shadow-[inset_3px_0_0_var(--primary)]',
                  !sidebarOpen && 'justify-center px-0',
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          )

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              {!sidebarOpen ? (
                <Tooltip content={item.label} side="right">
                  {link}
                </Tooltip>
              ) : (
                link
              )}
            </motion.div>
          )
        })}
      </nav>

      {/* Toggle button - single, at bottom */}
      <div className="mx-3 mb-3 mt-2">
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            !sidebarOpen && 'justify-center px-0',
          )}
        >
          {sidebarOpen ? (
            <>
              <ChevronsLeft className="h-4 w-4 shrink-0" />
              <span>Collapse</span>
            </>
          ) : (
            <ChevronsRight className="h-4 w-4" />
          )}
        </button>
      </div>
    </motion.aside>
  )
}
