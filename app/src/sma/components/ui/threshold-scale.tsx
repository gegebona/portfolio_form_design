import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { Fragment } from 'react'
import { cn } from '../../lib/cn'

/**
 * ThresholdScale — Base UI ToggleGroup of joined segments. Each segment is pressed when it is excluded
 * (aria-pressed), so screen readers hear "Ba, excluded". Clicking a grade moves the threshold;
 * a 3px accent bar marks the cut between allowed and excluded.
 */
export function ThresholdScale({
  labels, isExcluded, cutAt, onPick, className, 'aria-labelledby': labelledBy,
}: {
  labels: string[]
  isExcluded: (i: number) => boolean
  /** Index of the first segment after the cut (the bar is drawn before it). */
  cutAt: number
  onPick: (i: number) => void
  className?: string
  'aria-labelledby'?: string
}) {
  const value = labels.map((_, i) => String(i)).filter((_, i) => isExcluded(i))
  return (
    <ToggleGroup
      multiple
      value={value}
      aria-labelledby={labelledBy}
      onValueChange={(next) => {
        const changed = [...next.filter((v) => !value.includes(v)), ...value.filter((v) => !next.includes(v))][0]
        if (changed != null) onPick(Number(changed))
      }}
      className={cn('flex min-w-0 items-center pl-px', className)}
    >
      {labels.map((label, i) => (
        <Fragment key={label}>
          {/* 40px bar on a 28px row: negative margins let it overhang without changing the row height. */}
          {i > 0 && i === cutAt && <span aria-hidden className="relative z-2 -my-1.5 mr-1 ml-0.75 h-10 w-0.75 shrink-0 bg-error" />}
          <Toggle
            value={String(i)}
            aria-label={`${label}, ${isExcluded(i) ? 'excluded' : 'allowed'}`}
            className="-ml-px h-7 min-w-0 flex-1 basis-0 cursor-pointer border border-control bg-surface hover:relative hover:z-1 hover:outline hover:-outline-offset-1 hover:outline-fg-secondary data-pressed:border-excluded-border data-pressed:bg-excluded"
          >
            {label}
          </Toggle>
        </Fragment>
      ))}
    </ToggleGroup>
  )
}
