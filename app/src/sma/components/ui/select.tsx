import { Check, ChevronDown } from 'lucide-react'
import { Select as RSelect } from 'radix-ui'
import { cn } from '../../lib/cn'
import { useFieldId } from './input'
import { popupSurface } from './popup'

type Item = { value: string; label: string }

/**
 * Select — Radix Select. The list opens over the trigger with the chosen item aligned to it (item-aligned),
 * like a native select, and is keyboard- and screen-reader-complete.
 */
export function Select({
  value, onValueChange, items, className, placeholder, 'aria-label': ariaLabel, id,
}: {
  /** Shown in a quieter ink while the value matches no item (nothing chosen yet). */
  placeholder?: string
  value: string
  onValueChange: (v: string) => void
  items: Item[]
  className?: string
  'aria-label'?: string
  id?: string
}) {
  const fid = useFieldId()
  // Radix does not allow an empty item value, so an "All" option with value '' travels under a stand-in key.
  const ALL = '__all__'
  const enc = (v: string) => (v === '' ? ALL : v)
  // Radix shows the placeholder only for an empty value, so a value that matches no item counts as empty.
  const known = items.some((it) => it.value === value)
  return (
    <RSelect.Root value={known ? enc(value) : ''} onValueChange={(v) => onValueChange(v === ALL ? '' : v)}>
      <RSelect.Trigger
        id={id ?? fid}
        aria-label={ariaLabel}
        className={cn(
          'group flex h-8 min-w-0 cursor-pointer items-center justify-between gap-2 rounded-sm border border-control bg-surface pr-2 pl-2.5 text-left text-sm text-fg outline-none data-[state=open]:border-control-active data-placeholder:text-fg-subtle',
          className,
        )}
      >
        <span className="truncate"><RSelect.Value placeholder={placeholder} /></span>
        <RSelect.Icon className="flex text-fg-secondary">
          <ChevronDown className="size-3.5" strokeWidth={1.75} />
        </RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content className={cn(popupSurface, 'z-50 min-w-(--radix-select-trigger-width) py-0.5')}>
          <RSelect.Viewport className="max-h-(--radix-select-content-available-height)">
            {items.map((it) => (
              <RSelect.Item
                key={it.value}
                value={enc(it.value)}
                className="grid h-8 cursor-pointer grid-cols-[1rem_1fr] items-center gap-2 pr-4 pl-2 text-sm outline-none select-none data-highlighted:bg-surface-muted"
              >
                <RSelect.ItemIndicator className="col-start-1 flex text-selected">
                  <Check className="size-3.5" strokeWidth={2.25} />
                </RSelect.ItemIndicator>
                <span className="col-start-2"><RSelect.ItemText>{it.label}</RSelect.ItemText></span>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  )
}
