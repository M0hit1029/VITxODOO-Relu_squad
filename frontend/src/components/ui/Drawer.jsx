import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function Drawer({ open, onOpenChange, title, description, children, className }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'fixed right-0 top-0 z-50 h-full w-full max-w-xl border-l border-border/80 bg-popover p-6 shadow-2xl',
                  className,
                )}
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <Dialog.Title className="font-display text-2xl text-popover-foreground">
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                      <X className="h-4 w-4" />
                    </Button>
                  </Dialog.Close>
                </div>
                <div className="h-[calc(100%-5rem)] overflow-y-auto pr-1">{children}</div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
