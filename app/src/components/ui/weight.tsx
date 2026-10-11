import { NumberField } from '@base-ui/react/number-field'
import { Slider } from '@base-ui/react/slider'
import type { CSSProperties } from 'react'
import { cn } from '../../lib/cn'

export const STEP_HINT = '↑ ↓ or mouse wheel changes by 0.1 · with Shift by 1'
export const WHOLE_HINT = '↑ ↓ or mouse wheel changes by 1 · whole percentages only'

/**
 * WeightField — Base UI NumberField: typed value with "%", 2 decimals,
 * ↑/↓ step 0.1 (Shift: 1), mouse wheel while focused (allowWheelScrub), clamped to 0–100.
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
  return (
    <NumberField.Root
      value={value}
      onValueChange={(v) => onValueChange(v ?? 0)}
      min={0}
      max={100}
      step={whole ? 1 : 0.1}
      smallStep={whole ? 1 : 0.1}
      largeStep={whole ? 5 : 1}
      allowWheelScrub
      format={whole ? { maximumFractionDigits: 0, useGrouping: false } : { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false }}
      className={cn('shrink-0', className)}
    >
      <NumberField.Group
        title={whole ? WHOLE_HINT : STEP_HINT}
        className={cn(
          'flex items-center border border-control bg-surface has-[input:focus]:border-control-active',
          size === 'md' ? 'h-8 w-24' : 'h-7 w-22',
        )}
      >
        <NumberField.Input
          aria-label={`${ariaLabel}. ${whole ? WHOLE_HINT : STEP_HINT}`}
          onFocus={onFocus}
          className={cn('h-full w-full min-w-0 bg-transparent pr-1 pl-2 text-right tabular-nums outline-none', strong && 'font-semibold')}
        />
        <span className="pr-2 pl-0.5 text-fg-muted">%</span>
      </NumberField.Group>
    </NumberField.Root>
  )
}

/**
 * WeightSlider — Base UI Slider styled as the share line under each allocation row:
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
      value={value}
      onValueChange={(v) => onValueChange(Array.isArray(v) ? v[0] : v)}
      min={0}
      max={100}
      step={0.1}
      largeStep={1}
      onPointerDown={onPointerDown}
      style={{ '--fill': color } as CSSProperties}
      className="w-full"
    >
      <Slider.Control className="flex h-4 cursor-pointer items-center">
        <Slider.Track className="h-0.75 w-full bg-surface-strong">
          <Slider.Indicator className="bg-(--fill)" />
          <Slider.Thumb
            aria-label={ariaLabel}
            className="size-2.75 rounded-full border-2 border-surface bg-(--fill) ring-1 ring-(--fill) transition-transform hover:scale-115 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
          />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  )
}
