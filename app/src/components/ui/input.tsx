import { Field as BaseField } from '@base-ui/react/field'
import { Input as BaseInput } from '@base-ui/react/input'
import { Search } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * Shared look of every boxed control: 32px, 1px control border, darker border while focused.
 * Corners: a subtle 4px radius (rounded-sm) on controls, buttons, cards and panels; 2px (rounded-xs) on tags and checkboxes.
 */
export const controlBox =
  'flex h-8 items-center rounded-sm border border-control bg-surface text-sm text-fg has-[input:focus]:border-control-active data-popup-open:border-control-active'

type InputProps = Omit<ComponentProps<typeof BaseInput>, 'className'> & { className?: string }

/** Text input (Base UI Input — wires itself to a surrounding Field for label, validation and ids). */
export function Input({ className, ...props }: InputProps) {
  return (
    <BaseInput
      className={cn(
        'h-8 rounded-sm border border-control bg-surface px-2.5 text-sm text-fg outline-none placeholder:text-fg-subtle focus:border-control-active disabled:bg-surface-muted disabled:text-fg-disabled',
        className,
      )}
      {...props}
    />
  )
}

/** Input with a leading search icon. The box carries the border; the input inside is bare. */
export function SearchInput({ className, ...props }: InputProps) {
  return (
    <div className={cn(controlBox, 'gap-1.5 pr-2 pl-2', className)}>
      <Search className="size-3.5 shrink-0 text-fg-subtle" strokeWidth={1.75} aria-hidden />
      <BaseInput className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg-subtle" {...props} />
    </div>
  )
}

/** Input with a unit after the value ("%"). */
export function AffixInput({ className, suffix, inputClassName, ...props }: InputProps & { suffix: ReactNode; inputClassName?: string }) {
  return (
    <div className={cn(controlBox, className)}>
      <BaseInput className={cn('h-full min-w-0 flex-1 bg-transparent px-2.5 outline-none placeholder:text-fg-subtle', inputClassName)} {...props} />
      <span className="pr-2.5 text-fg-muted">{suffix}</span>
    </div>
  )
}

/** Field: label above the control, optional description. Base UI Field links label ↔ control for screen readers. */
export function Field({ label, description, error, className, children }: { label: ReactNode; description?: ReactNode; /** Shown in the error colour under the control (e.g. "Required"). */ error?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <BaseField.Root className={cn('flex flex-col gap-1', className)}>
      <BaseField.Label className="text-sm text-fg">{label}</BaseField.Label>
      {children}
      {description && <BaseField.Description className="text-xs text-fg-muted">{description}</BaseField.Description>}
      {error && <p className="text-xs text-error">{error}</p>}
    </BaseField.Root>
  )
}
