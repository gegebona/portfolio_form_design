import { Popover as RPopover } from 'radix-ui'
import { createContext, useContext, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { popupSurface } from './popup'

type HoverCtx = { enter: (delay: number) => void; leave: () => void }
const Hover = createContext<HoverCtx>({ enter: () => {}, leave: () => {} })

/**
 * Popover — Radix Popover: a small panel anchored to its trigger, with a title and a one-line description.
 * Pass a PopoverTrigger as `trigger`; give it `openOnHover` for details that should also show on hover
 * (it still opens on click and with the keyboard, so touch and keyboard users are not left out).
 */
export function Popover({ trigger, title, description, className, children }: { trigger: ReactNode; title: ReactNode; description?: ReactNode; className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const clear = () => clearTimeout(timer.current)
  useEffect(() => clear, [])
  // Hover opens after the trigger's delay and closes shortly after the pointer leaves both trigger and panel.
  const hover: HoverCtx = {
    enter: (delay) => { clear(); timer.current = setTimeout(() => setOpen(true), delay) },
    leave: () => { clear(); timer.current = setTimeout(() => setOpen(false), 150) },
  }
  return (
    <RPopover.Root open={open} onOpenChange={(o) => { clear(); setOpen(o) }}>
      <Hover.Provider value={hover}>{trigger}</Hover.Provider>
      <RPopover.Portal>
        <RPopover.Content
          sideOffset={6}
          align="start"
          onMouseEnter={clear}
          onMouseLeave={hover.leave}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={cn(popupSurface, 'z-50 w-140 p-4', className)}
        >
          <div className="text-sm font-semibold">{title}</div>
          {description && <p className="mt-0.5 text-xs text-fg-muted">{description}</p>}
          <div className="mt-3">{children}</div>
        </RPopover.Content>
      </RPopover.Portal>
    </RPopover.Root>
  )
}

/** The popover's trigger (a button). openOnHover: also opens while the pointer rests on it, after `delay` ms. */
export function PopoverTrigger({ openOnHover, delay = 0, onMouseEnter, onMouseLeave, ...props }: ComponentProps<typeof RPopover.Trigger> & { openOnHover?: boolean; delay?: number }) {
  const h = useContext(Hover)
  return (
    <RPopover.Trigger
      onMouseEnter={(e) => { onMouseEnter?.(e); if (openOnHover) h.enter(delay) }}
      onMouseLeave={(e) => { onMouseLeave?.(e); if (openOnHover) h.leave() }}
      {...props}
    />
  )
}
