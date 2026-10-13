import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * ScrollArea — Base UI ScrollArea. Base UI marks the root with data-overflow-y-start / -end while there is
 * more content above / below, so the edge hints are pure CSS (group-data-…), no scroll listeners.
 *
 * hints="edges"  no scrollbar; a soft shadow and a small ▲ / ▼ at the right edge show there is more.
 *                Used where a scrollbar would cut a row off from the panel it joins (allocation list).
 * hints="bar"    a thin overlay scrollbar that appears while hovering or scrolling.
 */
export function ScrollArea({ hints = 'bar', className, viewportClassName, children }: { hints?: 'edges' | 'bar'; className?: string; viewportClassName?: string; children: ReactNode }) {
  return (
    <BaseScrollArea.Root className={cn('group/scroll relative min-h-0', className)}>
      <BaseScrollArea.Viewport className={cn('h-full overscroll-contain outline-none', viewportClassName)}>
        <BaseScrollArea.Content>{children}</BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      {hints === 'edges' ? (
        <>
          <EdgeHint side="top" />
          <EdgeHint side="bottom" />
        </>
      ) : (
        <BaseScrollArea.Scrollbar className="pointer-events-none m-0.5 flex w-1.5 justify-center opacity-0 transition-opacity data-hovering:pointer-events-auto data-hovering:opacity-100 data-scrolling:opacity-100">
          <BaseScrollArea.Thumb className="w-full rounded-full bg-line-strong hover:bg-fg-subtle" />
        </BaseScrollArea.Scrollbar>
      )}
    </BaseScrollArea.Root>
  )
}

function EdgeHint({ side }: { side: 'top' | 'bottom' }) {
  const top = side === 'top'
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 z-2 flex h-4 justify-end pr-1.25 opacity-0 transition-opacity duration-150',
        top
          ? 'top-0 items-start bg-linear-to-b from-fg/16 to-transparent pt-0.75 group-data-overflow-y-start/scroll:opacity-100'
          : 'bottom-0 items-end bg-linear-to-t from-fg/16 to-transparent pb-0.75 group-data-overflow-y-end/scroll:opacity-100',
      )}
    >
      <svg width="10" height="6" viewBox="0 0 10 6" className="fill-fg-muted">
        <path d={top ? 'M0 6L5 0l5 6z' : 'M0 0l5 6 5-6z'} />
      </svg>
    </div>
  )
}
