import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ExpenseForm } from '@/components/features/expenses/ExpenseForm'
import { getCountries } from '@/services/currencyService'
import { useExpenses } from '@/hooks/useExpenses'
import { useAuthStore } from '@/store/authStore'

const defaultValues = {
  description: '',
  expenseDate: new Date().toISOString().slice(0, 10),
  category: 'travel',
  paidBy: 'Self',
  amount: 0,
  currency: 'INR',
  remarks: '',
  status: 'draft',
}

export default function NewExpense() {
  const { persistExpense, submitCurrentExpense } = useExpenses()
  const company = useAuthStore((state) => state.company)
  const [countries, setCountries] = useState([])

  useEffect(() => {
    getCountries().then(setCountries).catch(() => setCountries([]))
  }, [])

  const handleSave = async (payload, shouldSubmit) => {
    const saved = await persistExpense(payload)
    if (shouldSubmit && saved?.id) {
      await submitCurrentExpense(saved.id)
      toast.success('Expense submitted for approval.')
      return
    }
    toast.success('Draft saved.')
  }

  if (!countries.length) {
    return <div className="surface-card p-10 text-center text-muted-foreground">Loading expense form…</div>
  }

  return (
    <ExpenseForm
      initialValues={defaultValues}
      countries={countries}
      baseCurrency={company?.baseCurrency ?? 'INR'}
      onSave={handleSave}
    />
  )
}
