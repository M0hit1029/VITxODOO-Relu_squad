import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils'

export function CurrencyInput({
  amount,
  onAmountChange,
  currency,
  onCurrencyChange,
  currencies,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border border-input/80 bg-background/80 shadow-sm md:flex-row',
        className,
      )}
    >
      <Input
        type="number"
        min="0"
        step="0.01"
        className="rounded-none border-0 bg-transparent shadow-none focus:ring-0"
        value={amount}
        onChange={(event) => onAmountChange(event.target.value)}
        placeholder="0.00"
      />
      <div className="border-l border-border/70 md:w-52">
        <Select
          value={currency}
          onValueChange={onCurrencyChange}
          options={currencies.map((entry) => ({
            value: entry.currencyCode,
            label: entry.currencyCode,
            flag: entry.flag,
            meta: entry.name,
          }))}
          placeholder="Currency"
          className="rounded-none border-0 bg-transparent shadow-none focus:ring-0"
        />
      </div>
    </div>
  )
}
