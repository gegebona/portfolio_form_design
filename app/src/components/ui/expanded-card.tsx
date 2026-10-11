import { X } from 'lucide-react'
import { useEffect, useId, useRef, ViewTransition, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { Button } from './button'

/**
 * ExpandedCard — a card opened up into a large centred panel (used by Learn more on catalogue cards).
 *
 * The panel and the card it came from share one view-transition name (`name`): the catalogue renders the card
 * without that name while it is open, the panel renders with it. Opening / closing inside startTransition
 * then makes React's <ViewTransition> morph the card into the panel and back — the box grows from the card's
 * own rectangle; title and meta (shared names too) fly to their new places.
 *
 * Rendered with React's createPortal, which renders in the same update (a portal that mounts a pass later
 * would miss the transition's "after" picture).
 *
 * Dialog behaviour without a dialog library: role="dialog" + aria-modal, the app behind is made inert
 * (keyboard can't leave the panel), focus moves to the close button, Esc and a click on the backdrop close it.
 * The caller returns focus to the opener after closing.
 */
export function ExpandedCard({
  name, titleName, metaName, title, meta, headerExtra, footer, onClose, children,
}: {
  name: string
  titleName?: string
  metaName?: string
  title: ReactNode
  meta?: ReactNode
  headerExtra?: ReactNode
  footer?: ReactNode
  onClose: () => void
  children: ReactNode
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const titleId = useId()

  useEffect(() => {
    const app = document.getElementById('root')
    app?.setAttribute('inert', '')
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current() }
    document.addEventListener('keydown', onKey)
    return () => { app?.removeAttribute('inert'); document.removeEventListener('keydown', onKey) }
  }, [])

  return createPortal(
    <>
      <ViewTransition enter="fade-in" exit="fade-out" default="none">
        <div aria-hidden className="fixed inset-0 z-40 bg-fg/45" onClick={() => onCloseRef.current()} />
      </ViewTransition>
      <ViewTransition name={name} share="card-expand" default="none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-4rem)] w-225 max-w-[calc(100vw-2rem)] -translate-1/2 flex-col rounded-sm border border-line-strong bg-surface text-fg shadow-pop"
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-6 pt-5 pb-4">
            <div className="flex min-w-0 flex-col">
              <h2 id={titleId} className="text-xl"><Shared name={titleName}>{title}</Shared></h2>
              {meta && <Shared name={metaName} className="text-xs text-fg-muted">{meta}</Shared>}
              {headerExtra && <div className="mt-2">{headerExtra}</div>}
            </div>
            <Button ref={closeRef} variant="ghost" size="icon" className="size-8" aria-label="Close" onClick={() => onCloseRef.current()}>
              <X className="size-3.5" strokeWidth={2} />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-1 pb-6">{children}</div>
          {footer && <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-6 py-3.5">{footer}</div>}
        </div>
      </ViewTransition>
    </>,
    document.body,
  )
}

/**
 * A block that morphs to / from the element with the same view-transition name (no name: a plain block).
 * Must be a block: a named inline element that wraps over two lines can't be captured.
 */
export function Shared({ name, children, className }: { name?: string; children: ReactNode; className?: string }) {
  const el = <span className={cn('block', className)}>{children}</span>
  return name ? <ViewTransition name={name} share="text-morph" default="none">{el}</ViewTransition> : el
}
