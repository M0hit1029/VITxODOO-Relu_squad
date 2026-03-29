import { createElement, useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { formatCompactNumber, formatCurrency } from '@/lib/utils'

export function StatCard({
  label,
  value,
  icon,
  trend,
  kind = 'currency',
  color = 'default',
  currency = 'INR',
}) {
  const count = useMotionValue(0)
  const display = useTransform(count, (latest) =>
    kind === 'currency' ? formatCurrency(Math.round(latest), currency) : formatCompactNumber(latest),
  )
  const iconElement = icon ? createElement(icon, { className: 'h-5 w-5 shrink-0' }) : null

  useEffect(() => {
    const controls = animate(count, Number(value ?? 0), {
      duration: 1.1,
      ease: 'easeOut',
    })
    return () => controls.stop()
  }, [count, value])

  const colorClasses =
    color === 'destructive'
      ? 'bg-destructive/12 text-destructive'
      : color === 'warning'
        ? 'bg-warning/12 text-warning-foreground'
        : color === 'success'
          ? 'bg-success/12 text-success'
          : 'bg-primary/12 text-primary'

  return (
    <Card className="amber-glow transition-transform hover:-translate-y-0.5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">{label}</p>
            <motion.span className="money-text mt-2 block truncate text-xl font-semibold text-card-foreground">
              {display}
            </motion.span>
          </div>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClasses}`}
          >
            {iconElement}
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            {trend.direction === 'up' ? (
              <TrendingUp className="h-3.5 w-3.5 shrink-0 text-success" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 shrink-0 text-destructive" />
            )}
            {trend.percent}% vs last period
          </div>
        )}
      </CardContent>
    </Card>
  )
}
