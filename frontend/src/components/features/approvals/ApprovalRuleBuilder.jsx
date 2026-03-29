import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

function buildDefaultForm(users, rule = null) {
  const employees = users.filter((user) => user.role === 'employee')
  const selectedEmployee = employees.find((user) => user.id === rule?.employeeId) ?? employees[0] ?? null

  if (rule) {
    return {
      id: rule.id,
      description: rule.description ?? rule.name ?? '',
      employeeId: rule.employeeId ?? selectedEmployee?.id ?? '',
      managerId: rule.managerId ?? selectedEmployee?.managerId ?? '',
      isManagerRequired: Boolean(rule.isManagerRequired),
      mode: rule.mode ?? 'sequential',
      minApprovalPercentage: Number(rule.minApprovalPercentage ?? 100),
      approvers: (rule.approvers ?? []).map((approver, index) => ({
        userId: approver.userId,
        isRequired: Boolean(approver.isRequired),
        sequenceOrder: approver.sequenceOrder ?? index + 1,
      })),
    }
  }

  return {
    description: '',
    employeeId: selectedEmployee?.id ?? '',
    managerId: selectedEmployee?.managerId ?? '',
    isManagerRequired: true,
    mode: 'sequential',
    minApprovalPercentage: 100,
    approvers: [],
  }
}

function SortableApprover({ approver, users, onToggleRequired, onRemove, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: approver.userId,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const user = users.find((entry) => entry.id === approver.userId)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-2xl border border-border/70 px-4 py-3"
    >
      <button type="button" className="text-muted-foreground" disabled={disabled} {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1">
        <p className="font-medium text-card-foreground">{user?.name ?? 'Unknown approver'}</p>
        <p className="text-sm text-muted-foreground">Sequence order updates live</p>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={approver.isRequired}
          disabled={disabled}
          onChange={(event) => onToggleRequired(approver.userId, event.target.checked)}
        />
        Required
      </label>
      <button type="button" className="text-destructive" disabled={disabled} onClick={() => onRemove(approver.userId)}>
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ApprovalRuleBuilder({ users, rule, onSave, onCancel }) {
  const employeeOptions = useMemo(
    () =>
      users
        .filter((user) => user.role === 'employee')
        .map((user) => ({ value: user.id, label: user.name })),
    [users],
  )

  const managerOptions = useMemo(
    () =>
      users
        .filter((user) => user.role === 'manager' || user.role === 'admin')
        .map((user) => ({ value: user.id, label: `${user.name} (${user.role})` })),
    [users],
  )

  const approverOptions = useMemo(
    () =>
      users
        .filter((user) => user.role !== 'employee')
        .map((user) => ({ value: user.id, label: `${user.name} (${user.role})` })),
    [users],
  )

  const [form, setForm] = useState(() => buildDefaultForm(users, rule))
  const [newApprover, setNewApprover] = useState(approverOptions[0]?.value ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    setForm(buildDefaultForm(users, rule))
  }, [rule, users])

  useEffect(() => {
    const selectedEmployee = users.find((user) => user.id === form.employeeId)
    if (!selectedEmployee) return
    const defaultManagerId = selectedEmployee.managerId ?? ''

    setForm((current) => {
      if (current.managerId === defaultManagerId) {
        return current
      }

      if (rule && current.employeeId === rule.employeeId) {
        return current
      }

      return {
        ...current,
        managerId: defaultManagerId,
      }
    })
  }, [form.employeeId, rule, users])

  useEffect(() => {
    if (!newApprover && approverOptions[0]?.value) {
      setNewApprover(approverOptions[0].value)
    }
  }, [approverOptions, newApprover])

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = form.approvers.findIndex((entry) => entry.userId === active.id)
    const newIndex = form.approvers.findIndex((entry) => entry.userId === over.id)
    setForm((current) => ({
      ...current,
      approvers: arrayMove(current.approvers, oldIndex, newIndex).map((entry, index) => ({
        ...entry,
        sequenceOrder: index + 1,
      })),
    }))
  }

  const validateForm = () => {
    if (!form.employeeId) return 'Select an employee.'
    if (!form.description.trim()) return 'Add a rule name or description.'
    if (form.isManagerRequired && form.managerId && form.managerId === form.employeeId) {
      return 'An employee cannot be their own manager approver.'
    }
    if (form.isManagerRequired && form.managerId && form.approvers.some((approver) => approver.userId === form.managerId)) {
      return 'Do not add the manager twice. Use the manager approver toggle instead.'
    }
    if (!form.isManagerRequired && form.approvers.length === 0) {
      return 'Add at least one approver when manager approval is off.'
    }
    if (form.isManagerRequired && !form.managerId) {
      return 'Select a manager override or assign a manager to the employee first.'
    }
    if (form.approvers.some((approver) => approver.userId === form.employeeId)) {
      return 'An employee cannot approve their own expenses.'
    }
    if (new Set(form.approvers.map((approver) => approver.userId)).size !== form.approvers.length) {
      return 'Approvers cannot be duplicated.'
    }
    return ''
  }

  const saveRule = async () => {
    const validationError = validateForm()
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setErrorMessage('')
    setIsSaving(true)

    try {
      await onSave({
        id: form.id,
        description: form.description.trim(),
        employeeId: form.employeeId,
        managerId: form.managerId || null,
        isManagerRequired: form.isManagerRequired,
        mode: form.mode,
        minApprovalPercentage: form.mode === 'sequential' ? 100 : Number(form.minApprovalPercentage),
        approvers: form.approvers.map((approver, index) => ({
          userId: approver.userId,
          sequenceOrder: index + 1,
          isRequired: approver.isRequired,
        })),
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{rule ? 'Edit Rule' : 'Create Rule'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-card-foreground">Rule name / description</label>
          <Input
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Manager then finance approval"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-card-foreground">Employee</label>
          <Select
            value={form.employeeId}
            onValueChange={(value) => {
              const nextEmployee = users.find((user) => user.id === value)
              setForm((current) => ({
                ...current,
                employeeId: value,
                managerId: nextEmployee?.managerId || '',
              }))
            }}
            options={employeeOptions}
            placeholder="Select an employee"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-card-foreground">Manager override</label>
          <Select
            value={form.managerId || ''}
            onValueChange={(value) => setForm((current) => ({ ...current, managerId: value }))}
            options={managerOptions}
            placeholder="Use employee's manager"
            disabled={isSaving}
          />
          <p className="text-xs text-muted-foreground">
            This defaults to the employee&apos;s direct manager and is used when manager approval is required.
          </p>
        </div>

        <label className="flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3 text-sm text-card-foreground">
          Is manager required as first approver?
          <input
            type="checkbox"
            checked={form.isManagerRequired}
            disabled={isSaving}
            onChange={(event) =>
              setForm((current) => ({ ...current, isManagerRequired: event.target.checked }))
            }
          />
        </label>

        <div className="space-y-2">
          <label className="text-sm font-medium text-card-foreground">Approval mode</label>
          <Select
            value={form.mode}
            onValueChange={(value) => setForm((current) => ({ ...current, mode: value }))}
            options={[
              { value: 'sequential', label: 'Sequential' },
              { value: 'parallel', label: 'Parallel' },
              { value: 'hybrid', label: 'Hybrid' },
            ]}
            disabled={isSaving}
          />
        </div>

        {(form.mode === 'parallel' || form.mode === 'hybrid') && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">
              Minimum approval %: {form.minApprovalPercentage}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={form.minApprovalPercentage}
              disabled={isSaving}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  minApprovalPercentage: Number(event.target.value),
                }))
              }
              className="w-full accent-[var(--primary)]"
            />
          </div>
        )}

        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <Select
                value={newApprover}
                onValueChange={setNewApprover}
                options={approverOptions}
                placeholder="Select approver"
                disabled={isSaving}
              />
            </div>
            <Button
              variant="outline"
              disabled={isSaving || !newApprover}
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  approvers: current.approvers.some((entry) => entry.userId === newApprover)
                    ? current.approvers
                    : [
                        ...current.approvers,
                        {
                          userId: newApprover,
                          isRequired: false,
                          sequenceOrder: current.approvers.length + 1,
                        },
                      ],
                }))
              }
            >
              Add Approver
            </Button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={form.approvers.map((entry) => entry.userId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {form.approvers.map((approver) => (
                  <SortableApprover
                    key={approver.userId}
                    approver={approver}
                    users={users}
                    disabled={isSaving}
                    onToggleRequired={(userId, isRequired) =>
                      setForm((current) => ({
                        ...current,
                        approvers: current.approvers.map((entry) =>
                          entry.userId === userId ? { ...entry, isRequired } : entry,
                        ),
                      }))
                    }
                    onRemove={(userId) =>
                      setForm((current) => ({
                        ...current,
                        approvers: current.approvers
                          .filter((entry) => entry.userId !== userId)
                          .map((entry, index) => ({
                            ...entry,
                            sequenceOrder: index + 1,
                          })),
                      }))
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button loading={isSaving} loadingText="Saving rule..." onClick={saveRule}>
            Save Rule
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
