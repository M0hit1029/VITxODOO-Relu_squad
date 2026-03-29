import { motion } from 'framer-motion'
import { Check, LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Stepper({ steps }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      {steps.map((step, index) => (
        <div key={step.label} className="flex flex-1 items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold',
              step.status === 'complete' && 'border-success/40 bg-success/15 text-success',
              step.status === 'current' && 'border-primary/40 bg-primary/15 text-primary',
              step.status === 'upcoming' && 'border-border bg-background text-muted-foreground',
            )}
          >
            {step.status === 'complete' && <Check className="h-4 w-4" />}
            {step.status === 'current' && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {step.status === 'upcoming' && index + 1}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{step.label}</p>
          </div>
          {index < steps.length - 1 && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="hidden h-px flex-1 origin-left bg-border md:block"
            />
          )}
        </div>
      ))}
    </div>
  )
}
