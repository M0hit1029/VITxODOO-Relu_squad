import * as RadixAvatar from '@radix-ui/react-avatar'
import { getInitials } from '@/lib/utils'

export function Avatar({ name, src, className = 'h-10 w-10' }) {
  return (
    <RadixAvatar.Root
      className={`inline-flex items-center justify-center overflow-hidden rounded-full border border-border/70 bg-accent text-sm font-medium text-accent-foreground ${className}`}
    >
      {src && <RadixAvatar.Image className="h-full w-full object-cover" src={src} alt={name} />}
      <RadixAvatar.Fallback delayMs={100}>{getInitials(name)}</RadixAvatar.Fallback>
    </RadixAvatar.Root>
  )
}
