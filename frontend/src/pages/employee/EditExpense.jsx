import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useNavigate, useParams } from 'react-router-dom'
import { ExpenseForm } from '@/components/features/expenses/ExpenseForm'
import { getCountries } from '@/services/currencyService'
import { useExpenses } from '@/hooks/useExpenses'
import { useAuthStore } from '@/store/authStore'

export default function EditExpense() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { currentExpense, fetchExpense, persistExpense, submitCurrentExpense } = useExpenses()
  const company = useAuthStore((state) => state.company)
  const [countries, setCountries] = useState([])

  useEffect(() => {
    if (id) {
      fetchExpense(id).catch((error) => toast.error(error.message || 'Unable to load expense.'))
    }
  }, [fetchExpense, id])

  useEffect(() => {
    getCountries().then(setCountries).catch(() => setCountries([]))
  }, [])

  const expense = currentExpense?.id === id ? currentExpense : null

  useEffect(() => {
    if (!expense || expense.status === 'draft') return
    toast.error('Only draft expenses can be edited.')
    navigate(`/expenses/${expense.id}`, { replace: true })
  }, [expense, navigate])

  const handleSave = async (payload, shouldSubmit) => {
    try {
      const saved = await persistExpense({ ...payload, id })
      if (shouldSubmit && saved?.id) {
        await submitCurrentExpense(saved.id)
        toast.success('Expense submitted for approval.')
        navigate(`/expenses/${saved.id}`, { replace: true })
        return
      }
      toast.success('Draft saved.')
      if (saved?.id) {
        navigate(`/expenses/${saved.id}/edit`, { replace: true })
      }
    } catch (error) {
      toast.error(error.message || `Unable to ${shouldSubmit ? 'submit' : 'save'} expense.`)
      throw error
    }
  }

  if (!countries.length || !expense) {
    return <div className="surface-card p-10 text-center text-muted-foreground">Loading expense form...</div>
  }

  return (
    <ExpenseForm
      initialValues={expense}
      countries={countries}
      baseCurrency={company?.baseCurrency ?? 'INR'}
      onSave={handleSave}
    />
  )
}
