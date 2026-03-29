import * as RadixSelect from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  className,
  disabled = false,
}) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RadixSelect.Trigger
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-xl border border-input/80 bg-background/80 px-3.5 text-sm text-foreground shadow-sm outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        disabled={disabled}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-border/80 bg-popover p-1 shadow-2xl"
        >
          <RadixSelect.Viewport className="max-h-72 p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                className="relative flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-sm text-popover-foreground outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
              >
                <RadixSelect.ItemText>
                  <div className="flex items-center gap-2">
                    {option.flag && <span>{option.flag}</span>}
                    <span>{option.label}</span>
                    {option.meta && (
                      <span className="ml-auto text-xs text-muted-foreground">{option.meta}</span>
                    )}
                  </div>
                </RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="absolute right-3">
                  <Check className="h-4 w-4 text-primary" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}
