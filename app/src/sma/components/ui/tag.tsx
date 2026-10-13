import { Tooltip } from '@base-ui/react/tooltip'
import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Popover, PopoverTrigger } from './popover'

/*
 * Tags — small read-only signals.
 *   ConflictTag   pink fill, dark-red text: a component conflicts with exclusions (cards, allocation rows)
 *   ConflictList  ConflictTag for a list of exclusions: the first `max` by name, the rest behind a “+N more” popover
 *   ConflictNote  same text, no fill: inside rows that are already pink (Simulation)
 *   CurrencyTag   outlined: benchmark currency differs from the portfolio's
 * ⚠ marks conflicts and failed checks and is always red (the error token), wherever it appears; ⊘ is reserved for excluded items.
 */

export function ConflictTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-start gap-1.25 self-start rounded-xs bg-excluded-subtle px-1.75 py-0.75 text-xs/snug text-conflict', className)}>
      <TriangleAlert className="mt-px size-3 shrink-0 text-error" strokeWidth={1.75} aria-hidden />
      <span>{children}</span>
    </span>
  )
}

/**
 * Conflict tag that never outgrows its row: shows the first `max` exclusions and a “+N more” button that opens the full
 * list. Must not be placed inside another button.
 */
export function ConflictList({ items, groups, max = 2, compact, className }: { items: string[]; /** The same items by preference type, for the full list. */ groups?: { label: string; values: string[] }[]; max?: number; /** Small spaces (cards): no lead-in text and “+N” instead of “+N more”. */ compact?: boolean; className?: string }) {
  const shown = items.slice(0, max)
  const more = items.length - shown.length
  // Cards (compact) show a value without its type, so there the details open even for a single conflict.
  const details = compact || more > 0
  const list = (
    <ul className="text-xs">
      {/* Same pattern as the exclusions strip: preference type in grey, the conflicting values in red. */}
      {(groups ?? items.map((x) => ({ label: '', values: [x] }))).map((g) => (
        <li key={g.label + g.values[0]} className="border-t border-line py-1.5 first:border-t-0">
          <span>{g.label && <span className="text-fg-muted">{g.label} </span>}<span className="text-conflict">{g.values.join(', ')}</span></span>
        </li>
      ))}
    </ul>
  )
  const trigger = (children: ReactNode, cls: string) => (
    <PopoverTrigger openOnHover delay={150} className={cn('cursor-pointer whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-selected', cls)}>{children}</PopoverTrigger>
  )
  const pop = (t: ReactNode) => (
    <Popover title={`Conflicts with ${items.length} ${items.length === 1 ? 'exclusion' : 'exclusions'}`} description="The component holds positions in these excluded areas." className="w-72" trigger={t}>
      {list}
    </Popover>
  )
  return (
    <ConflictTag className={className}>
      {compact ? (
        <>
          <span className="sr-only">Conflicts with exclusions: </span>
          {pop(trigger(<>{shown.join(', ')}{more > 0 && <span className="ml-1 font-semibold underline underline-offset-2">+{more}</span>}</>, ''))}
        </>
      ) : (
        <>
          Conflicts with exclusions: {shown.join(', ')}
          {details && pop(trigger(`+${more} more`, 'ml-1 font-semibold underline underline-offset-2'))}
        </>
      )}
    </ConflictTag>
  )
}

export function ConflictNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('mt-0.75 inline-flex items-center gap-1.25 text-xs text-conflict', className)}>
      <TriangleAlert className="size-3 shrink-0 text-error" strokeWidth={1.75} aria-hidden />
      {children}
    </span>
  )
}

export function CurrencyTag({ ccy, portfolioCcy }: { ccy: string; portfolioCcy: string }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={<span />} className="shrink-0 rounded-xs border border-line-strong px-1.5 text-xs/4.5 whitespace-nowrap text-fg-muted">
        in {ccy}
      </Tooltip.Trigger>
      <TooltipPopup>Benchmark currency differs from the portfolio currency ({portfolioCcy})</TooltipPopup>
    </Tooltip.Root>
  )
}

/** Dark tooltip bubble, shared by every tooltip. */
export function TooltipPopup({ children }: { children: ReactNode }) {
  return (
    <Tooltip.Portal>
      <Tooltip.Positioner sideOffset={6} className="z-50">
        <Tooltip.Popup className="rounded-xs bg-surface-inverse px-2 py-0.75 text-xs text-fg-inverse transition-opacity duration-100 data-ending-style:opacity-0 data-starting-style:opacity-0">
          {children}
        </Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  )
}
