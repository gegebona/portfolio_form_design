import { Search } from 'lucide-react'
import { Label } from 'radix-ui'
import { createContext, useContext, useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * Shared look of every boxed control: 32px, 1px control border, darker border while focused.
 * Corners: rounded-sm on controls, buttons, cards and panels; rounded-xs on tags and checkboxes (both set in theme.css).
 */
export const controlBox =
  'flex h-8 items-center rounded-sm border border-control bg-surface text-sm text-fg has-[input:focus]:border-control-active has-[input:focus]:bg-field-focus data-[state=open]:border-control-active data-[state=open]:bg-field-focus has-[input[aria-invalid=true]]:border-conflict has-[input[aria-invalid=true]]:bg-field-required'

/** Id of the control inside a Field, so its label points at it (inputs and selects pick it up). */
const FieldId = createContext<string | undefined>(undefined)
export const useFieldId = () => useContext(FieldId)

type InputProps = Omit<ComponentProps<'input'>, 'onChange'> & { onValueChange?: (v: string) => void }

/** Text input. Inside a Field it takes the Field's id, so the label is linked to it. */
export function Input({ className, onValueChange, id, ...props }: InputProps) {
  const fid = useFieldId()
  return (
    <input
      id={id ?? fid}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={cn(
        'h-8 rounded-sm border border-control bg-surface px-2.5 text-sm text-fg outline-none placeholder:text-fg-subtle focus:border-control-active focus:bg-field-focus aria-invalid:border-conflict aria-invalid:bg-field-required disabled:border-line disabled:bg-surface disabled:text-fg-muted',
        className,
      )}
      {...props}
    />
  )
}

/** Input with a leading search icon. The box carries the border; the input inside is bare. */
export function SearchInput({ className, onValueChange, ...props }: InputProps) {
  return (
    <div className={cn(controlBox, 'gap-1.5 pr-2 pl-2', className)}>
      <Search className="size-3.5 shrink-0 text-fg-subtle" strokeWidth={1.75} aria-hidden />
      <input onChange={(e) => onValueChange?.(e.target.value)} className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg-subtle" {...props} />
    </div>
  )
}

/** Input with a unit after the value ("%"). */
export function AffixInput({ className, suffix, inputClassName, onValueChange, id, ...props }: InputProps & { suffix: ReactNode; inputClassName?: string }) {
  const fid = useFieldId()
  return (
    <div className={cn(controlBox, className)}>
      <input id={id ?? fid} onChange={(e) => onValueChange?.(e.target.value)} className={cn('h-full min-w-0 flex-1 bg-transparent px-2.5 outline-none placeholder:text-fg-subtle', inputClassName)} {...props} />
      <span className="pr-2.5 text-fg-muted">{suffix}</span>
    </div>
  )
}

/** Field: label above the control (Radix Label, linked to the control by id), optional description and error. */
export function Field({ label, description, error, className, children }: { label: ReactNode; description?: ReactNode; /** Shown in the error colour under the control (e.g. "Required"). */ error?: ReactNode; className?: string; children: ReactNode }) {
  const id = useId()
  return (
    <FieldId.Provider value={id}>
      <div className={cn('group/field flex flex-col gap-1', className)}>
        {/* Platinum: the label turns blue while its field has focus, red when the field is required and empty. */}
        <Label.Root htmlFor={id} className={cn('text-sm text-fg-muted group-focus-within/field:text-link', error && 'text-conflict group-focus-within/field:text-conflict')}>{label}</Label.Root>
        {children}
        {description && <p className="text-xs text-fg-muted">{description}</p>}
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    </FieldId.Provider>
  )
}
