import { ScrollArea as RScrollArea } from 'radix-ui'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * ScrollArea — Radix Scroll Area. The root is marked with data-overflow-y-start / -end while there is more content
 * above / below (measured on scroll and resize), so the edge hints are plain CSS (group-data-…).
 *
 * hints="edges"  no scrollbar; a soft shadow and a small ▲ / ▼ at the right edge show there is more.
 *                Used where a scrollbar would cut a row off from the panel it joins (allocation list).
 * hints="bar"    a thin overlay scrollbar that appears while hovering or scrolling.
 */
export function ScrollArea({ hints = 'bar', className, viewportClassName, children }: { hints?: 'edges' | 'bar'; className?: string; viewportClassName?: string; children: ReactNode }) {
  const vp = useRef<HTMLDivElement>(null)
  const [edge, setEdge] = useState({ start: false, end: false })
  const measure = useCallback(() => {
    const el = vp.current
    if (!el) return
    const start = el.scrollTop > 1
    const end = el.scrollTop + el.clientHeight < el.scrollHeight - 1
    setEdge((e) => (e.start === start && e.end === end ? e : { start, end }))
  }, [])
  useEffect(() => {
    const el = vp.current
    if (!el) return
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => ro.disconnect()
  }, [measure])
  return (
    <RScrollArea.Root
      type="hover"
      data-overflow-y-start={edge.start ? '' : undefined}
      data-overflow-y-end={edge.end ? '' : undefined}
      className={cn('group/scroll relative min-h-0 overflow-hidden', className)}
    >
      <RScrollArea.Viewport ref={vp} onScroll={measure} className={cn('h-full overscroll-contain outline-none [&>div]:block!', viewportClassName)}>
        {children}
      </RScrollArea.Viewport>
      {hints === 'edges' ? (
        <>
          <EdgeHint side="top" />
          <EdgeHint side="bottom" />
        </>
      ) : (
        <RScrollArea.Scrollbar orientation="vertical" className="m-0.5 flex w-1.5 justify-center">
          <RScrollArea.Thumb className="w-full rounded-full bg-line-strong hover:bg-fg-subtle" />
        </RScrollArea.Scrollbar>
      )}
    </RScrollArea.Root>
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
