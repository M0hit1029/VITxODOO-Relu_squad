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

function SortableApprover({ approver, users, onToggleRequired, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: approver.userId,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const user = users.find((entry) => entry.id === approver.userId)

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 rounded-2xl border border-border/70 px-4 py-3">
      <button type="button" className="text-muted-foreground" {...attributes} {...listeners}>
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
          onChange={(event) => onToggleRequired(approver.userId, event.target.checked)}
        />
        Required
      </label>
      <button type="button" className="text-destructive" onClick={() => onRemove(approver.userId)}>
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ApprovalRuleBuilder({ users, rule, onSave, onCancel }) {
  const employeeOptions = useMemo(
    () =>
      users
        .filter((user) => user.role !== 'admin')
        .map((user) => ({ value: user.id, label: user.name })),
    [users],
  )
  const approverOptions = useMemo(
    () =>
      users
        .filter((user) => user.role !== 'employee')
        .map((user) => ({ value: user.id, label: user.name })),
    [users],
  )

  const [form, setForm] = useState(
    rule ?? {
      name: '',
      description: '',
      employeeId: employeeOptions[0]?.value ?? '',
      isManagerRequired: true,
      mode: 'sequential',
      minApprovalPercentage: 100,
      approvers: approverOptions.slice(0, 1).map((entry) => ({ userId: entry.value, isRequired: true })),
    },
  )
  const [newApprover, setNewApprover] = useState(approverOptions[0]?.value ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    if (rule) {
      setForm(rule)
      return
    }

    setForm({
      name: '',
      description: '',
      employeeId: employeeOptions[0]?.value ?? '',
      isManagerRequired: true,
      mode: 'sequential',
      minApprovalPercentage: 100,
      approvers: approverOptions.slice(0, 1).map((entry) => ({ userId: entry.value, isRequired: true })),
    })
  }, [approverOptions, employeeOptions, rule])

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = form.approvers.findIndex((entry) => entry.userId === active.id)
    const newIndex = form.approvers.findIndex((entry) => entry.userId === over.id)
    setForm((current) => ({
      ...current,
      approvers: arrayMove(current.approvers, oldIndex, newIndex),
    }))
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{rule ? 'Edit Rule' : 'Create Rule'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Input
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="Rule name"
          disabled={isSaving}
        />
        <Input
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          placeholder="Rule description"
          disabled={isSaving}
        />
        <Select
          value={form.employeeId}
          onValueChange={(value) => setForm((current) => ({ ...current, employeeId: value }))}
          options={employeeOptions}
          disabled={isSaving}
        />
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
                    : [...current.approvers, { userId: newApprover, isRequired: false }],
                }))
              }
            >
              Add Approver
            </Button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={form.approvers.map((entry) => entry.userId)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {form.approvers.map((approver) => (
                  <SortableApprover
                    key={approver.userId}
                    approver={approver}
                    users={users}
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
                        approvers: current.approvers.filter((entry) => entry.userId !== userId),
                      }))
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            loading={isSaving}
            loadingText="Saving rule..."
            onClick={async () => {
              setIsSaving(true)
              try {
                await onSave(form)
              } finally {
                setIsSaving(false)
              }
            }}
          >
            Save Rule
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
