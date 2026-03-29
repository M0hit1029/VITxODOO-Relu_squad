import { Mail, Search, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CreateUserModal } from '@/components/features/users/CreateUserModal'
import { RoleSelector } from '@/components/features/users/RoleSelector'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { listUsers, createUser, sendPassword, updateUser } from '@/services/userService'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [filters, setFilters] = useState({ search: '', role: 'all' })
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [sendingPasswordUserId, setSendingPasswordUserId] = useState(null)

  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true)
    try {
      const result = await listUsers(filters)
      setUsers(result)
    } catch (error) {
      toast.error(error.message || 'Unable to load users.')
    } finally {
      setIsLoadingUsers(false)
    }
  }, [filters])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const managers = useMemo(() => users.filter((user) => user.role === 'manager' || user.role === 'admin'), [users])

  const columns = [
    {
      header: 'User',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} />
          <div className="min-w-0">
            <p className="truncate font-medium text-card-foreground">{row.name}</p>
            <p className="truncate text-sm text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      cell: (row) => (
        <RoleSelector
          value={row.role}
          onChange={async (role) => {
            try {
              await updateUser(row.id, { role })
              toast.success('Role updated.')
              await loadUsers()
            } catch (error) {
              toast.error(error.message || 'Unable to update role.')
              throw error
            }
          }}
        />
      ),
    },
    {
      header: 'Manager',
      cell: (row) => row.manager?.name ?? managers.find((manager) => manager.id === row.managerId)?.name ?? '—',
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={(row.status ?? 'active') === 'active' ? 'success' : 'outline'}>
          {row.status ?? 'active'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          loading={sendingPasswordUserId === row.id}
          loadingText="Sending password..."
          onClick={async (event) => {
            event.stopPropagation()
            setSendingPasswordUserId(row.id)
            try {
              await sendPassword(row.id)
              toast.success('Password email queued.')
            } catch (error) {
              toast.error(error.message || 'Unable to send password email.')
            } finally {
              setSendingPasswordUserId(null)
            }
          }}
        >
          <Mail className="mr-1.5 h-4 w-4" />
          Send Password
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground">User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage team members and roles</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <UserPlus className="mr-1.5 h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search users"
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={filters.role}
              onValueChange={(value) => setFilters((current) => ({ ...current, role: value }))}
              options={[
                { value: 'all', label: 'All roles' },
                { value: 'admin', label: 'Admin' },
                { value: 'manager', label: 'Manager' },
                { value: 'employee', label: 'Employee' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={users} loading={isLoadingUsers} />

      <CreateUserModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        managers={managers}
        onCreate={async (values) => {
          try {
            await createUser(values)
            toast.success('User created and password emailed.')
            await loadUsers()
          } catch (error) {
            toast.error(error.message || 'Unable to create user.')
            throw error
          }
        }}
      />
    </div>
  )
}
