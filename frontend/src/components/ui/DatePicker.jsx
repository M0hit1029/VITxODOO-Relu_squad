import * as Popover from '@radix-ui/react-popover'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { cn, formatDate } from '@/lib/utils'

export function DatePicker({ value, onChange, disableFuture = false, placeholder = 'Pick a date' }) {
  const [month, setMonth] = useState(value ? new Date(value) : new Date())
  const selectedDate = value ? new Date(value) : null

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [month])

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="outline" className="w-full justify-between rounded-xl px-3.5 font-normal">
          <span className={selectedDate ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedDate ? formatDate(selectedDate) : placeholder}
          </span>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={10}
          className="z-50 w-80 rounded-2xl border border-border/80 bg-popover p-4 shadow-2xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonth(subMonths(month, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="font-medium text-popover-foreground">{format(month, 'MMMM yyyy')}</p>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonth(addMonths(month, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="mb-2 grid grid-cols-7 text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <span key={day} className="py-2">
                {day}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const isDisabled = disableFuture && isAfter(day, new Date())
              const selected = selectedDate ? isSameDay(day, selectedDate) : false
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onChange(format(day, 'yyyy-MM-dd'))}
                  className={cn(
                    'flex h-10 items-center justify-center rounded-xl text-sm transition-colors',
                    selected && 'bg-primary text-primary-foreground',
                    !selected && isToday(day) && 'border border-primary/40 text-primary',
                    !selected && !isToday(day) && 'text-popover-foreground hover:bg-accent',
                    isDisabled && 'cursor-not-allowed opacity-40',
                    format(day, 'M') !== format(month, 'M') && 'text-muted-foreground',
                  )}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
