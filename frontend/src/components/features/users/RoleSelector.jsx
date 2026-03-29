import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'

export function RoleSelector({ value, onChange }) {
  const [nextRole, setNextRole] = useState(value)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setNextRole(value)
  }, [value])

  if (value === 'admin') {
    return <span className="text-sm font-medium text-card-foreground">Admin</span>
  }

  return (
    <>
      <Select
        value={value}
        onValueChange={(role) => {
          setNextRole(role)
          if (role === value) return
          setConfirmOpen(true)
        }}
        disabled={isSaving}
        options={[
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
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              loading={isSaving}
              loadingText="Updating role..."
              onClick={async () => {
                setIsSaving(true)
                try {
                  await onChange(nextRole)
                  setConfirmOpen(false)
                } finally {
                  setIsSaving(false)
                }
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
