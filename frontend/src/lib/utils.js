import { clsx } from 'clsx'
import { format } from 'date-fns'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount,
  currency = 'INR',
  locale = currency === 'INR' ? 'en-IN' : 'en-US',
) {
  const numericAmount = Number(amount ?? 0)

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(numericAmount)
  } catch {
    return `${currency} ${numericAmount.toFixed(2)}`
  }
}

export function formatDate(value, pattern = 'MMM d, yyyy') {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return format(date, pattern)
}

export function formatCompactNumber(value) {
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value ?? 0))
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function sleep(ms = 600) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function truncate(value = '', length = 42) {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value
}

export function getStatusTone(status) {
  const map = {
    draft: 'secondary',
    submitted: 'warning',
    pending: 'warning',
    approved: 'success',
    rejected: 'destructive',
    invited: 'secondary',
    active: 'success',
  }
  return map[status] ?? 'secondary'
}
