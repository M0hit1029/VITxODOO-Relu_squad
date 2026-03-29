import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

export function DataTable({
  columns,
  data,
  loading = false,
  emptyState = null,
  onRowClick,
  getRowKey = (row) => row.id,
  className,
}) {
  if (loading) {
    return (
      <div className={cn('surface-card overflow-hidden', className)}>
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid grid-cols-5 gap-3">
              <Skeleton className="h-10 col-span-2" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data.length) {
    return emptyState
  }

  return (
    <div className={cn('surface-card overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left">
          <thead className="sticky top-0 bg-card/95 backdrop-blur">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  className="border-b border-border/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {data.map((row, index) => (
                <motion.tr
                  key={getRowKey(row)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.24, delay: index * 0.03 }}
                  className={cn(
                    'border-b border-border/50 transition-colors last:border-b-0',
                    onRowClick && 'cursor-pointer hover:bg-primary/6',
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td key={`${getRowKey(row)}-${column.header}`} className="px-4 py-3 align-middle text-sm">
                      {column.cell ? column.cell(row) : row[column.accessorKey]}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  )
}
