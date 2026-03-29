import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/lib/utils'

export function CurrencyConverter({ value, currency, baseCurrency, isLoading, error }) {
  if (isLoading) {
    return <Skeleton className="h-12 w-full" />
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  return (
    <div className="rounded-2xl border border-primary/15 bg-primary/8 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Live conversion preview</p>
      <p className="money-text mt-2 text-lg font-semibold text-foreground">
        = {formatCurrency(value, baseCurrency)} {baseCurrency}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">Preview based on current {currency} exchange rates.</p>
    </div>
  )
}
