import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const baseClassName =
  'w-full rounded-xl border border-input/80 bg-background/80 px-3.5 py-3 text-sm text-foreground shadow-sm transition-all outline-none placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15'

const Input = forwardRef(function Input(
  { className, multiline = false, rows = 4, ...props },
  ref,
) {
  if (multiline) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(baseClassName, 'min-h-[120px] resize-y', className)}
        {...props}
      />
    )
  }

  return <input ref={ref} className={cn(baseClassName, 'h-11', className)} {...props} />
})

export { Input }
