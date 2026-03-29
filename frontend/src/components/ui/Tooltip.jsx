import * as RadixTooltip from '@radix-ui/react-tooltip'

export function Tooltip({ content, children, side = 'top' }) {
  return (
    <RadixTooltip.Provider delayDuration={150}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            sideOffset={8}
            className="z-50 rounded-xl border border-border/80 bg-popover px-3 py-2 text-xs text-popover-foreground shadow-xl"
          >
            {content}
            <RadixTooltip.Arrow className="fill-popover" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}

