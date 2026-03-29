import { cn } from '@/lib/utils'

export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        'animate-[sweep_1.4s_linear_infinite] rounded-xl bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.25),transparent)] bg-[length:220%_100%] bg-muted/80',
        className,
      )}
    />
  )
}
