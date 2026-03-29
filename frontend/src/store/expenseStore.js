import { create } from 'zustand'

export const useExpenseStore = create((set) => ({
  expenses: [],
  currentExpense: null,
  filters: {
    status: 'all',
    category: 'all',
    categories: [],
    dateRange: null,
    search: '',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
  setExpenses: (expenses, total) =>
    set((state) => ({
      expenses,
      pagination: {
        ...state.pagination,
        total: total ?? expenses.length,
      },
    })),
  setFilters: (nextFilters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...nextFilters,
      },
    })),
  setPagination: (nextPagination) =>
    set((state) => ({
      pagination: {
        ...state.pagination,
        ...nextPagination,
      },
    })),
  setCurrentExpense: (expense) => set({ currentExpense: expense }),
}))
