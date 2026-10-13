import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './button'

/**
 * Modal — Base UI Dialog: focus is trapped inside, Esc and the backdrop close it.
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
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop
          className="fixed inset-0 bg-fg/45 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-[-webkit-touch-callout:none]:absolute"
        />
        <BaseDialog.Popup
          className="fixed top-1/2 left-1/2 flex max-h-[calc(100dvh-4rem)] w-225 max-w-[calc(100vw-2rem)] -translate-1/2 flex-col bg-surface text-fg shadow-pop transition-[opacity,scale] duration-150 data-ending-style:scale-98 data-ending-style:opacity-0 data-starting-style:scale-98 data-starting-style:opacity-0"
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-6 pt-5 pb-4">
            <div className="flex min-w-0 flex-col">
              <BaseDialog.Title className="text-xl">
                {title}
              </BaseDialog.Title>
              {meta && (
                <BaseDialog.Description className="text-xs text-fg-muted">
                  {meta}
                </BaseDialog.Description>
              )}
              {headerExtra && <div className="mt-2">{headerExtra}</div>}
            </div>
            <BaseDialog.Close render={<Button variant="ghost" size="icon" className="size-8" aria-label="Close" />}>
              <X className="size-3.5" strokeWidth={2} />
            </BaseDialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-1 pb-6">{children}</div>
          {footer && <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-6 py-3.5">{footer}</div>}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}


export const ModalClose = BaseDialog.Close
