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

  const loadUsers = useCallback(async () => {
    const result = await listUsers(filters)
    setUsers(result)
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
            await updateUser(row.id, { role })
            toast.success('Role updated.')
            loadUsers()
          }}
        />
      ),
    },
    {
      header: 'Manager',
      cell: (row) => managers.find((manager) => manager.id === row.managerId)?.name ?? '—',
    },
    {
      header: 'Status',
      cell: (row) => <Badge variant={row.status === 'active' ? 'success' : 'outline'}>{row.status}</Badge>,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={async (event) => {
            event.stopPropagation()
            await sendPassword(row.id)
            toast.success('Password email queued.')
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

      <DataTable columns={columns} data={users} />

      <CreateUserModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        managers={managers}
        onCreate={async (values) => {
          await createUser(values)
          toast.success('User invited.')
          loadUsers()
        }}
      />
    </div>
  )
}
