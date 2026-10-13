import { Popover as BasePopover } from '@base-ui/react/popover'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { popupSurface } from './popup'

/**
 * Popover — Base UI Popover: a small panel anchored to its trigger, with a title and a one-line description.
 * Pass a PopoverTrigger as `trigger`; give it `openOnHover` for details that should also show on hover
 * (it still opens on click and with the keyboard, so touch and keyboard users are not left out).
 */
export function Popover({ trigger, title, description, className, children }: { trigger: ReactNode; title: ReactNode; description?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <BasePopover.Root>
      {trigger}
      <BasePopover.Portal>
        <BasePopover.Positioner className="z-50 outline-none" sideOffset={6} align="start">
          <BasePopover.Popup className={cn(popupSurface, 'w-140 origin-(--transform-origin) p-4', className)}>
            <BasePopover.Title className="text-sm font-semibold">{title}</BasePopover.Title>
            {description && <BasePopover.Description className="mt-0.5 text-xs text-fg-muted">{description}</BasePopover.Description>}
            <div className="mt-3">{children}</div>
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  )
}

export const PopoverTrigger = BasePopover.Trigger
