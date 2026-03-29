import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { createUserSchema } from '@/lib/validators'

function getDefaultValues(managers) {
  return {
    fullName: '',
    email: '',
    role: 'employee',
    managerId: managers[0]?.id ?? '',
  }
}

export function CreateUserModal({ open, onOpenChange, managers, onCreate }) {
  const form = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: getDefaultValues(managers),
  })
  const formId = 'create-user-form'
  const role = form.watch('role')
  const managerId = form.watch('managerId')
  const isSubmitting = form.formState.isSubmitting

  useEffect(() => {
    if (!open) {
      form.reset(getDefaultValues(managers))
      return
    }

    const availableManagerIds = managers.map((manager) => manager.id)
    if (!managerId && managers[0]?.id) {
      form.setValue('managerId', managers[0].id, { shouldDirty: false })
      return
    }

    if (managerId && !availableManagerIds.includes(managerId)) {
      form.setValue('managerId', managers[0]?.id ?? '', { shouldDirty: false })
    }
  }, [form, managerId, managers, open])

  const handleSubmit = form.handleSubmit(async (values) => {
    await onCreate(values)
    form.reset(getDefaultValues(managers))
    onOpenChange(false)
  })

  const handleOpenChange = (nextOpen) => {
    if (isSubmitting) return
    if (!nextOpen) {
      form.reset(getDefaultValues(managers))
    }
    onOpenChange(nextOpen)
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Create User"
      description="Invite a manager or employee and optionally assign them to a reporting line."
      footer={
        <>
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button form={formId} type="submit" loading={isSubmitting} loadingText="Creating user...">
            Create user
          </Button>
        </>
      }
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-card-foreground">Full name</label>
          <Input placeholder="Full name" {...form.register('fullName')} />
          <p className="text-xs text-destructive">{form.formState.errors.fullName?.message}</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-card-foreground">Email address</label>
          <Input placeholder="Email address" {...form.register('email')} />
          <p className="text-xs text-destructive">{form.formState.errors.email?.message}</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-card-foreground">Role</label>
          <Select
            value={role}
            onValueChange={(value) =>
              form.setValue('role', value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            options={[
              { value: 'manager', label: 'Manager' },
              { value: 'employee', label: 'Employee' },
            ]}
            disabled={isSubmitting}
          />
          <p className="text-xs text-destructive">{form.formState.errors.role?.message}</p>
        </div>
        {(role === 'employee' || role === 'manager') && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">Manager</label>
            {managers.length ? (
              <Select
                value={managerId}
                onValueChange={(value) =>
                  form.setValue('managerId', value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                options={managers.map((manager) => ({ value: manager.id, label: manager.name }))}
                placeholder="Choose a manager"
                disabled={isSubmitting}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 px-4 py-3 text-sm text-muted-foreground">
                No managers available yet. You can still create this user and assign a manager later.
              </div>
            )}
            <p className="text-xs text-destructive">{form.formState.errors.managerId?.message}</p>
          </div>
        )}
      </form>
    </Modal>
  )
}
