import { useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useExpenseStore } from '@/store/expenseStore'
import * as expenseService from '@/services/expenseService'

export function useExpenses() {
  const user = useAuthStore((state) => state.user)
  const expenses = useExpenseStore((state) => state.expenses)
  const currentExpense = useExpenseStore((state) => state.currentExpense)
  const filters = useExpenseStore((state) => state.filters)
  const pagination = useExpenseStore((state) => state.pagination)
  const isLoading = useExpenseStore((state) => state.isLoading)
  const setLoading = useExpenseStore((state) => state.setLoading)
  const setExpenses = useExpenseStore((state) => state.setExpenses)
  const setFilters = useExpenseStore((state) => state.setFilters)
  const setPagination = useExpenseStore((state) => state.setPagination)
  const setCurrentExpense = useExpenseStore((state) => state.setCurrentExpense)

  const fetchExpenses = useCallback(async (overrides = {}) => {
    setLoading(true)
    try {
      const params = {
        user,
        filters: {
          ...filters,
          ...overrides.filters,
        },
        page: overrides.page ?? pagination.page,
        limit: overrides.limit ?? pagination.limit,
      }
      const result = await expenseService.listExpenses(params)
      setExpenses(result.data, result.total)
      setPagination({
        page: params.page,
        limit: params.limit,
        total: result.total,
      })
      return result
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.limit, pagination.page, setExpenses, setLoading, setPagination, user])

  const fetchExpense = useCallback(async (expenseId) => {
    setLoading(true)
    try {
      const expense = await expenseService.getExpenseById(expenseId)
      setCurrentExpense(expense)
      return expense
    } finally {
      setLoading(false)
    }
  }, [setCurrentExpense, setLoading])

  return {
    expenses,
    currentExpense,
    filters,
    pagination,
    isLoading,
    setFilters,
    setPagination,
    setCurrentExpense,
    user,
    fetchExpenses,
    fetchExpense,
    persistExpense: (payload) => expenseService.saveExpense(payload, user),
    submitCurrentExpense: (expenseId) => expenseService.submitExpense(expenseId, user),
  }
}
