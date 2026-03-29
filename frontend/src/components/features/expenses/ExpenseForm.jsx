import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { DatePicker } from '@/components/ui/DatePicker'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Stepper } from '@/components/ui/Stepper'
import { CATEGORIES, PAID_BY_OPTIONS } from '@/lib/constants'
import { expenseSchema } from '@/lib/validators'
import { useCurrency } from '@/hooks/useCurrency'
import { useOCR } from '@/hooks/useOCR'
import { CurrencyConverter } from '@/components/features/expenses/CurrencyConverter'
import { OCRPreviewPanel } from '@/components/features/expenses/OCRPreviewPanel'
import { ReceiptUpload } from '@/components/features/expenses/ReceiptUpload'

function buildSteps(status) {
  const resolved = status === 'rejected' ? 'Rejected' : status === 'approved' ? 'Approved' : 'Under Review'
  const labels = ['Draft', 'Submitted', 'Under Review', resolved]
  const currentIndex =
    status === 'draft' ? 0 : status === 'submitted' ? 2 : 3

  return labels.map((label, index) => ({
    label,
    status: index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming',
  }))
}

export function ExpenseForm({ initialValues, countries, baseCurrency = 'INR', onSave }) {
  const [file, setFile] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [activeAction, setActiveAction] = useState(null)
  const form = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: initialValues,
  })
  const { scan, progress, isScanning, result, setResult } = useOCR()
  const amount = form.watch('amount')
  const currency = form.watch('currency')
  const { convertedAmount, isLoading, error } = useCurrency(currency, baseCurrency, amount)
  const status = initialValues?.status ?? 'draft'
  const isDraft = status === 'draft'

  useEffect(() => {
    form.reset(initialValues)
  }, [form, initialValues])

  useEffect(() => {
    if (file) scan(file).catch(() => toast.error('Could not scan receipt.'))
  }, [file, scan])

  const currencyOptions = useMemo(
    () =>
      countries.map((country) => ({
        ...country,
        value: country.currencyCode,
        label: country.currencyCode,
      })),
    [countries],
  )

  const applyOcrToForm = () => {
    if (!result?.parsedFields) return
    Object.entries(result.parsedFields).forEach(([key, value]) => {
      if (value) form.setValue(key, value, { shouldValidate: false })
    })
    toast.success('Receipt details applied to form.')
    setResult(null)
  }

  const handleDraftSave = form.handleSubmit(async (values) => {
    setActiveAction('draft')
    try {
      await onSave({
        ...initialValues,
        ...values,
        amountInBase: convertedAmount || values.amount,
        receiptFile: file ?? null,
        receiptUrl: initialValues?.receiptUrl ?? '',
      }, false)
    } finally {
      setActiveAction(null)
    }
  })

  const handleSubmitApproval = form.handleSubmit(async (values) => {
    setActiveAction('submit')
    try {
      await onSave({
        ...initialValues,
        ...values,
        amountInBase: convertedAmount || values.amount,
        receiptFile: file ?? null,
        receiptUrl: initialValues?.receiptUrl ?? '',
      }, true)
      setConfirmOpen(false)
    } finally {
      setActiveAction(null)
    }
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Stepper steps={buildSteps(status)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Receipt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReceiptUpload
            file={file}
            onFileChange={setFile}
            isScanning={isScanning}
            progress={progress}
            disabled={!isDraft || form.formState.isSubmitting}
          />
          {result && <OCRPreviewPanel result={result} onApply={applyOcrToForm} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">Description</label>
            <Input multiline rows={4} disabled={!isDraft || form.formState.isSubmitting} {...form.register('description')} />
            <p className="text-xs text-destructive">{form.formState.errors.description?.message}</p>
          </div>
          <div className="form-grid">
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">Expense date</label>
              <DatePicker
                value={form.watch('expenseDate')}
                onChange={(value) => form.setValue('expenseDate', value)}
                disableFuture
                disabled={!isDraft || form.formState.isSubmitting}
              />
              <p className="text-xs text-destructive">{form.formState.errors.expenseDate?.message}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">Category</label>
              <Select
                value={form.watch('category')}
                onValueChange={(value) => form.setValue('category', value)}
                options={CATEGORIES.map((category) => ({
                  value: category.value,
                  label: category.label,
                  flag: category.emoji,
                }))}
                disabled={!isDraft || form.formState.isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">Paid by</label>
              <Select
                value={form.watch('paidBy')}
                onValueChange={(value) => form.setValue('paidBy', value)}
                options={PAID_BY_OPTIONS.map((option) => ({ value: option, label: option }))}
                disabled={!isDraft || form.formState.isSubmitting}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-card-foreground">Amount</label>
              <CurrencyInput
                amount={form.watch('amount')}
                onAmountChange={(value) => form.setValue('amount', Number(value))}
                currency={currency}
                onCurrencyChange={(value) => form.setValue('currency', value)}
                currencies={currencyOptions}
                disabled={!isDraft || form.formState.isSubmitting}
              />
              <p className="text-xs text-destructive">{form.formState.errors.amount?.message}</p>
            </div>
          </div>
          <CurrencyConverter
            value={convertedAmount}
            currency={currency}
            baseCurrency={baseCurrency}
            isLoading={isLoading}
            error={error}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">Remarks</label>
            <Input
              multiline
              rows={4}
              disabled={!isDraft || form.formState.isSubmitting}
              {...form.register('remarks')}
              placeholder="Optional notes for reviewers"
            />
          </div>
          {isDraft ? (
            <div className="flex flex-wrap justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleDraftSave}
                disabled={form.formState.isSubmitting}
                loading={activeAction === 'draft'}
                loadingText="Saving draft..."
              >
                Save as Draft
              </Button>
              <Button onClick={() => setConfirmOpen(true)} disabled={form.formState.isSubmitting}>
                Submit for Approval
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This expense has been submitted and is now read-only.
            </p>
          )}
        </CardContent>
      </Card>

      <Modal
        open={isDraft && confirmOpen}
        onOpenChange={(nextOpen) => {
          if (activeAction === 'submit') return
          setConfirmOpen(nextOpen)
        }}
        title="Submit this expense?"
        description="This sends the request into the approval workflow and makes the form read-only."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={activeAction === 'submit'}>
              Cancel
            </Button>
            <Button onClick={handleSubmitApproval} loading={activeAction === 'submit'} loadingText="Submitting expense...">
              Confirm submit
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Double-check the description, date, category, and converted amount before you continue.
        </p>
      </Modal>
    </div>
  )
}
