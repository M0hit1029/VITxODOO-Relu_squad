import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { createUserSchema } from '@/lib/validators'

export function CreateUserModal({ open, onOpenChange, managers, onCreate }) {
  const form = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: '',
      email: '',
      role: 'employee',
      managerId: managers[0]?.id ?? '',
    },
  })

  const role = form.watch('role')

  const handleSubmit = form.handleSubmit(async (values) => {
    await onCreate(values)
    form.reset()
    onOpenChange(false)
  })

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Create User"
      description="Invite a manager or employee and optionally assign them to a reporting line."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create user</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input placeholder="Full name" {...form.register('fullName')} />
        <Input placeholder="Email address" {...form.register('email')} />
        <Select
          value={role}
          onValueChange={(value) => form.setValue('role', value)}
          options={[
            { value: 'admin', label: 'Admin' },
            { value: 'manager', label: 'Manager' },
            { value: 'employee', label: 'Employee' },
          ]}
        />
        {(role === 'employee' || role === 'manager') && (
          <Select
            value={form.watch('managerId')}
            onValueChange={(value) => form.setValue('managerId', value)}
            options={managers.map((manager) => ({ value: manager.id, label: manager.name }))}
          />
        )}
      </div>
    </Modal>
  )
}
