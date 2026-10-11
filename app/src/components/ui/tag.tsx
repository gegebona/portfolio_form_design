import { Tooltip } from '@base-ui/react/tooltip'
import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/*
 * Tags — small read-only signals.
 *   ConflictTag   pink fill, dark-red text: a component conflicts with exclusions (cards, allocation rows)
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
