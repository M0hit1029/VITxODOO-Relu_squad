import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

export function ApprovalActionPanel({ open, onOpenChange, decision, onConfirm }) {
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isApprove = decision === 'approve' || decision === 'approved'

  useEffect(() => {
    if (!open) {
      setComment('')
      setIsSubmitting(false)
    }
  }, [open])

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return
        onOpenChange(nextOpen)
      }}
      title={isApprove ? 'Approve expense' : 'Reject expense'}
      description={
        isApprove
          ? 'Add an optional note before confirming approval.'
          : 'A comment is recommended so the employee knows how to correct this.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={isApprove ? 'default' : 'destructive'}
            loading={isSubmitting}
            loadingText={isApprove ? 'Approving...' : 'Rejecting...'}
            onClick={async () => {
              setIsSubmitting(true)
              try {
                await onConfirm(comment)
                setComment('')
              } finally {
                setIsSubmitting(false)
              }
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
        placeholder={isApprove ? 'Optional comment' : 'Reason for rejection'}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
    </Modal>
  )
}
