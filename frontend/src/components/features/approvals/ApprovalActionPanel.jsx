import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

export function ApprovalActionPanel({ open, onOpenChange, decision, onConfirm }) {
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const isApprove = decision === 'approve' || decision === 'approved'

  useEffect(() => {
    if (!open) {
      setComment('')
      setIsSubmitting(false)
      setErrorMessage('')
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
          : 'A rejection comment is required so the employee knows how to correct this.'
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
              if (!isApprove && !comment.trim()) {
                setErrorMessage('A rejection comment is required.')
                return
              }

              setIsSubmitting(true)
              try {
                setErrorMessage('')
                await onConfirm(comment.trim())
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
        onChange={(event) => {
          setComment(event.target.value)
          if (errorMessage) setErrorMessage('')
        }}
      />
      {errorMessage && <p className="mt-2 text-sm text-destructive">{errorMessage}</p>}
    </Modal>
  )
}
