import { X } from 'lucide-react'
import { Dialog as RDialog } from 'radix-ui'
import type { ReactNode } from 'react'
import { Button } from './button'

/**
 * Modal — Radix Dialog: focus is trapped inside, Esc and the overlay close it.
 * Header / scrolling body / footer with actions on the right.
 */
export function Modal({
  open, onOpenChange, title, meta, headerExtra, footer, children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  meta?: ReactNode
  headerExtra?: ReactNode
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-40 bg-fg-subtle" />
        <RDialog.Content
          {...(meta ? {} : { 'aria-describedby': undefined })}
          className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-4rem)] w-225 max-w-[calc(100vw-2rem)] -translate-1/2 flex-col bg-surface text-fg shadow-pop outline-none"
        >
          <div className="flex shrink-0 items-start justify-between gap-4 px-7 pt-5 pb-3">
            <div className="flex min-w-0 flex-col">
              <RDialog.Title className="text-2xl font-light text-fg-muted">{title}</RDialog.Title>
              {meta && <RDialog.Description className="text-xs text-fg-muted">{meta}</RDialog.Description>}
              {headerExtra && <div className="mt-2">{headerExtra}</div>}
            </div>
            <RDialog.Close asChild>
              <Button variant="ghost" size="icon" className="size-8 text-fg-muted" aria-label="Close"><X className="size-5" strokeWidth={1.5} /></Button>
            </RDialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-7 pt-1 pb-6">{children}</div>
          {footer && <div className="flex shrink-0 items-center justify-end gap-3 px-7 pt-2 pb-6">{footer}</div>}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  )
}

export const ModalClose = RDialog.Close
