import { Plus, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/*
 * Chips (24px, square, 12px text)
 *   SuggestionChip  grey fill + "+": one click to exclude. Grey always means "suggested, not chosen".
 *   ExclusionChip   red tint + "×": a chosen exclusion.
 *   EmptySlot       dashed placeholder where exclusion chips go, so suggestions are never read as values.
 */

export function SuggestionChip({ children, onClick, 'aria-label': ariaLabel }: { children: ReactNode; onClick: () => void; 'aria-label'?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="inline-flex h-6.5 cursor-pointer items-center gap-1 rounded-sm border border-suggested-border bg-suggested pr-2.25 pl-1.75 text-xs hover:bg-surface-strong"
    >
      <Plus className="size-2.5 text-fg-secondary" strokeWidth={2.5} aria-hidden />
      {children}
    </button>
  )
}

export function ExclusionChip({ children, onRemove, removeLabel }: { children: ReactNode; onRemove: () => void; removeLabel: string }) {
  return (
    <span className="inline-flex h-6.5 items-center gap-0.5 rounded-sm border border-excluded-border bg-excluded pr-0.5 pl-2.25 text-xs">
      {children}
      <RemoveButton onClick={onRemove} label={removeLabel} className="hover:bg-excluded-border" />
    </span>
  )
}

export function EmptySlot({ children }: { children: ReactNode }) {
  return <span className="inline-flex h-6.5 items-center rounded-sm border border-dashed border-line-strong px-2.5 text-xs text-fg-muted">{children}</span>
}

/** Small "×" used on chips and list rows (22px target). */
export function RemoveButton({ onClick, label, className }: { onClick: () => void; label: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn('flex size-5.5 cursor-pointer items-center justify-center text-fg-secondary hover:bg-surface-muted hover:text-fg', className)}
    >
      <X className="size-2.5" strokeWidth={2.5} aria-hidden />
    </button>
  )
}
