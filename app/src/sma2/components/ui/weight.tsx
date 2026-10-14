import { Slider } from 'radix-ui'
import { useState, type CSSProperties, type KeyboardEvent, type WheelEvent } from 'react'
import { cn } from '../../lib/cn'

export const STEP_HINT = '↑ ↓ or mouse wheel changes by 0.1 · with Shift by 1'
export const WHOLE_HINT = '↑ ↓ or mouse wheel changes by 1 · whole percentages only'

const clamp = (v: number) => Math.min(100, Math.max(0, v))

/**
 * WeightField — a typed value with "%" (Radix has no number field, so this is a plain Tailwind input):
 * 2 decimals (or whole numbers), ↑/↓ step 0.1 (Shift: 1), mouse wheel while focused, clamped to 0–100.
 * While focused the text stays as typed (valid values apply at once); it is formatted on blur or Enter.
 */
export function WeightField({
  value, onValueChange, onFocus, size = 'md', strong, whole, className, 'aria-label': ariaLabel,
}: {
  /** Whole percentages (component weights). Default is 2 decimals (instrument weights). */
  whole?: boolean
  value: number
  onValueChange: (v: number) => void
  onFocus?: () => void
  size?: 'md' | 'sm'
  /** Bold value (edited in Simulation). */
  strong?: boolean
  className?: string
  'aria-label': string
}) {
  const fmt = (v: number) => (whole ? String(Math.round(v)) : v.toFixed(2))
  const [draft, setDraft] = useState<string | null>(null)
  const round = (v: number) => (whole ? Math.round(v) : Math.round(v * 100) / 100)
  const commit = () => {
    if (draft === null) return
    const n = Number(draft.replace(',', '.'))
    if (draft.trim() !== '' && Number.isFinite(n)) onValueChange(round(clamp(n)))
    else if (draft.trim() === '') onValueChange(0)
    setDraft(null)
  }
  const stepBy = (dir: 1 | -1, shift: boolean) => {
    const step = whole ? (shift ? 5 : 1) : shift ? 1 : 0.1
    const base = draft !== null && Number.isFinite(Number(draft)) ? Number(draft) : value
    const next = round(clamp(base + dir * step))
    setDraft(null)
    onValueChange(next)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); stepBy(e.key === 'ArrowUp' ? 1 : -1, e.shiftKey) }
    else if (e.key === 'Enter') commit()
  }
  const onWheel = (e: WheelEvent<HTMLInputElement>) => {
    if (document.activeElement !== e.currentTarget || !e.deltaY) return
    stepBy(e.deltaY < 0 ? 1 : -1, e.shiftKey)
  }
  return (
    <div
      title={whole ? WHOLE_HINT : STEP_HINT}
      className={cn(
        'flex shrink-0 items-center rounded-sm border border-control bg-surface has-[input:focus]:border-control-active',
        size === 'md' ? 'h-8 w-24' : 'h-7 w-22',
        className,
      )}
    >
      <input
        inputMode="decimal"
        aria-label={`${ariaLabel}. ${whole ? WHOLE_HINT : STEP_HINT}`}
        value={draft ?? fmt(value)}
        onChange={(e) => {
          // Totals follow the typing: a valid number goes through at once, the text stays as typed until blur.
          const t = e.target.value
          setDraft(t)
          const n = Number(t.replace(',', '.'))
          if (t.trim() !== '' && Number.isFinite(n)) onValueChange(round(clamp(n)))
        }}
        onFocus={onFocus}
        onBlur={commit}
        onKeyDown={onKeyDown}
        onWheel={onWheel}
        className={cn('h-full w-full min-w-0 bg-transparent pr-1 pl-2 text-right tabular-nums outline-none', strong && 'font-semibold')}
      />
      <span className="pr-2 pl-0.5 text-fg-muted">%</span>
    </div>
  )
}

/**
 * WeightSlider — Radix Slider styled as the share line under each allocation row:
 * a 3px track filled in the asset-class colour (--fill) and a small round handle. Step 0.1, Shift+arrow 1.
 */
export function WeightSlider({
  value, onValueChange, color, onPointerDown, 'aria-label': ariaLabel,
}: {
  value: number
  onValueChange: (v: number) => void
  color: string
  onPointerDown?: () => void
  'aria-label': string
}) {
  return (
    <Slider.Root
      value={[value]}
      onValueChange={(v) => onValueChange(v[0])}
      min={0}
      max={100}
      step={0.1}
      onPointerDown={onPointerDown}
      style={{ '--fill': color } as CSSProperties}
      className="relative flex h-4 w-full cursor-pointer touch-none items-center select-none"
    >
      <Slider.Track className="relative h-0.75 w-full grow bg-surface-strong">
        <Slider.Range className="absolute h-full bg-(--fill)" />
      </Slider.Track>
      <Slider.Thumb
        aria-label={ariaLabel}
        className="flex h-4 w-2.5 items-center justify-center gap-px rounded-xs border border-line-strong bg-surface outline-none before:h-2 before:w-px before:bg-line-strong after:h-2 after:w-px after:bg-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      />
    </Slider.Root>
  )
}
