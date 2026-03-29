import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Menu, MoonStar, Bell, SunMedium, LogOut } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

const pathLabels = {
  admin: 'Admin Dashboard',
  users: 'User Management',
  rules: 'Approval Rules',
  expenses: 'Expenses',
  settings: 'Company Settings',
  dashboard: 'Dashboard',
  approvals: 'Approval Queue',
  manager: 'Manager',
  new: 'New Expense',
}

export function Topbar({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const darkMode = useUIStore((state) => state.darkMode)
  const toggleDarkMode = useUIStore((state) => state.toggleDarkMode)

  const breadcrumb = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean)
    if (!segments.length) return ['Workspace']
    return segments.map((segment) => pathLabels[segment] ?? segment.replace(/-/g, ' '))
  }, [location.pathname])

  const settingsPath = user?.role === 'admin' ? '/admin/settings' : user?.role === 'manager' ? '/manager/dashboard' : '/dashboard'

  return (
    <header className="shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-2xl">
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {breadcrumb.map((item, index) => (
                <span key={`${item}-${index}`} className="flex items-center gap-1.5">
                  {index > 0 && <span className="text-border">/</span>}
                  <span className={index === breadcrumb.length - 1 ? 'text-foreground font-medium' : ''}>
                    {item}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-9 w-9">
            {darkMode ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background" />
          </Button>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="ml-1 flex items-center gap-2.5 rounded-xl border border-border/50 bg-card/50 px-2.5 py-1.5 text-left backdrop-blur-xl transition-colors hover:bg-card/80">
                <Avatar name={user?.name} className="h-8 w-8" />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium leading-tight text-foreground">{user?.name}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{user?.role}</p>
                </div>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                sideOffset={8}
                align="end"
                className="z-50 w-52 rounded-xl border border-border/60 bg-popover/95 p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.12)] backdrop-blur-2xl"
              >
                <DropdownMenu.Item asChild>
                  <Link
                    to={user?.role === 'admin' ? '/admin/settings' : '/dashboard'}
                    className="flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-accent"
                  >
                    Profile
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <Link
                    to={settingsPath}
                    className="flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-accent"
                  >
                    Settings
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1.5 h-px bg-border/50" />
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10"
                  onSelect={() => {
                    logout()
                    navigate('/signin', { replace: true })
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  )
}
