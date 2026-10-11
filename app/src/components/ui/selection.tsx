import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import { Radio as BaseRadio } from '@base-ui/react/radio'
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group'
import { Switch as BaseSwitch } from '@base-ui/react/switch'
import { Check } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'

/*
 * Selection controls — Base UI Checkbox / Radio / Switch.
 * Base UI renders a <span> plus a hidden native <input>, and marks state with data attributes,
 * so the whole look is Tailwind variants: data-checked:bg-selected, data-disabled:opacity-…
 * Chosen = the selected token (blue) everywhere; grey never means "chosen", and red is kept for problems and exclusions.
 */

type CheckboxProps = Omit<ComponentProps<typeof BaseCheckbox.Root>, 'className'> & { className?: string }

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <BaseCheckbox.Root
      className={cn(
        'flex size-4 shrink-0 cursor-pointer items-center justify-center border border-control bg-surface text-on-accent',
        'data-checked:border-selected data-checked:bg-selected data-disabled:cursor-default data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <BaseCheckbox.Indicator className="flex data-unchecked:hidden">
        <Check className="size-3" strokeWidth={3} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  )
}

export function RadioGroup({ className, ...props }: Omit<ComponentProps<typeof BaseRadioGroup>, 'className'> & { className?: string }) {
  return <BaseRadioGroup className={cn('flex flex-col', className)} {...props} />
}

type RadioProps = Omit<ComponentProps<typeof BaseRadio.Root>, 'className'> & { className?: string }

export function Radio({ className, ...props }: RadioProps) {
  return (
    <BaseRadio.Root
      className={cn(
        'flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border border-control bg-surface',
        'data-checked:border-selected',
        className,
      )}
      {...props}
    >
      <BaseRadio.Indicator className="size-2 rounded-full bg-selected data-unchecked:hidden" />
    </BaseRadio.Root>
  )
}

type SwitchProps = Omit<ComponentProps<typeof BaseSwitch.Root>, 'className'> & { className?: string }

export function Switch({ className, ...props }: SwitchProps) {
  return (
    <BaseSwitch.Root
      className={cn(
        'relative inline-flex h-4 w-7.5 shrink-0 cursor-pointer rounded-full bg-fg-subtle transition-colors duration-150 data-checked:bg-selected',
        className,
      )}
      {...props}
    >
      <BaseSwitch.Thumb className="absolute top-0.5 left-0.5 size-3 rounded-full bg-surface transition-transform duration-150 data-checked:translate-x-3.5" />
    </BaseSwitch.Root>
  )
}
