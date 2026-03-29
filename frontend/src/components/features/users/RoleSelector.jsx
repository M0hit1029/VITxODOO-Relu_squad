import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'

export function RoleSelector({ value, onChange }) {
  const [nextRole, setNextRole] = useState(value)
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <Select
        value={value}
        onValueChange={(role) => {
          setNextRole(role)
          setConfirmOpen(true)
        }}
        options={[
          { value: 'admin', label: 'Admin' },
          { value: 'manager', label: 'Manager' },
          { value: 'employee', label: 'Employee' },
        ]}
      />
      <Modal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Change role?"
        description="This updates what the user can access inside the workspace."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onChange(nextRole)
                setConfirmOpen(false)
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Changing this role may alter dashboards, approvals, and admin visibility for the user.
        </p>
      </Modal>
    </>
  )
}
