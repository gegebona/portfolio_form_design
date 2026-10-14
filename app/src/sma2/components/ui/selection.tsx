import { Check } from 'lucide-react'
import { Checkbox as RCheckbox, RadioGroup as RRadioGroup, Switch as RSwitch } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'

/*
 * Selection controls — Radix Checkbox / Radio Group / Switch.
 * Radix renders a <button> and marks state with data-state, so the whole look is Tailwind variants:
 * data-[state=checked]:bg-selected, data-disabled:opacity-…
 * Chosen = the selected token (blue) everywhere; grey never means "chosen", and red is kept for problems and exclusions.
 */

type CheckboxProps = Omit<ComponentProps<typeof RCheckbox.Root>, 'checked' | 'onCheckedChange'> & { checked?: boolean; onCheckedChange?: (checked: boolean) => void }

export function Checkbox({ className, onCheckedChange, ...props }: CheckboxProps) {
  return (
    <RCheckbox.Root
      onCheckedChange={(v) => onCheckedChange?.(v === true)}
      className={cn(
        'flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-xs border border-control bg-surface text-on-accent',
        'data-[state=checked]:border-selected data-[state=checked]:bg-selected data-disabled:cursor-default data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RCheckbox.Indicator className="flex">
        <Check className="size-3" strokeWidth={3} />
      </RCheckbox.Indicator>
    </RCheckbox.Root>
  )
}

export function RadioGroup({ className, ...props }: ComponentProps<typeof RRadioGroup.Root>) {
  return <RRadioGroup.Root className={cn('flex flex-col', className)} {...props} />
}

export function Radio({ className, ...props }: ComponentProps<typeof RRadioGroup.Item>) {
  return (
    <RRadioGroup.Item
      className={cn(
        'flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border border-control bg-surface',
        'data-[state=checked]:border-selected',
        className,
      )}
      {...props}
    >
      <RRadioGroup.Indicator className="size-2 rounded-full bg-selected" />
    </RRadioGroup.Item>
  )
}

export function Switch({ className, ...props }: ComponentProps<typeof RSwitch.Root>) {
  return (
    <RSwitch.Root
      className={cn(
        'relative inline-flex h-4 w-7.5 shrink-0 cursor-pointer rounded-full bg-fg-subtle transition-colors duration-150 data-[state=checked]:bg-selected',
        className,
      )}
      {...props}
    >
      <RSwitch.Thumb className="absolute top-0.5 left-0.5 size-3 rounded-full bg-surface transition-transform duration-150 data-[state=checked]:translate-x-3.5" />
    </RSwitch.Root>
  )
}
