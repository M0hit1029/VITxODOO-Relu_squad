import { cloneElement, forwardRef, isValidElement } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_18px_45px_color-mix(in_oklab,var(--primary)_22%,transparent)] hover:-translate-y-0.5 hover:brightness-105',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
        outline:
          'border border-border/80 bg-background/70 text-foreground hover:border-primary/40 hover:bg-primary/8',
        destructive: 'bg-destructive text-destructive-foreground hover:brightness-105',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-11 px-4',
        lg: 'h-12 px-5',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

const Button = forwardRef(function Button(
  { className, variant, size, type = 'button', asChild = false, children, ...props },
  ref,
) {
  const resolvedClassName = cn(buttonVariants({ variant, size }), className)

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      ...props,
      className: cn(resolvedClassName, children.props.className),
    })
  }

  return (
    <button
      ref={ref}
      type={type}
      className={resolvedClassName}
      {...props}
    >
      {children}
    </button>
  )
})

export { Button, buttonVariants }
