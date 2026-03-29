import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

export function ApprovalActionPanel({ open, onOpenChange, decision, onConfirm }) {
  const [comment, setComment] = useState('')

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={decision === 'approved' ? 'Approve expense' : 'Reject expense'}
      description={
        decision === 'approved'
          ? 'Add an optional note before confirming approval.'
          : 'A comment is recommended so the employee knows how to correct this.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={decision === 'approved' ? 'default' : 'destructive'}
            onClick={() => {
              onConfirm(comment)
              setComment('')
            }}
          >
            Confirm
          </Button>
        </>
      }
    >
      <Input
        multiline
        rows={4}
        placeholder={decision === 'approved' ? 'Optional comment' : 'Reason for rejection'}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
    </Modal>
  )
}
