import { Combobox as BaseCombobox } from '@base-ui/react/combobox'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '../../lib/cn'
import { popupSurface } from './popup'

export type ComboOption = { id: string; label: string; sub?: string }

/**
 * MultiCombobox — Base UI Combobox in `multiple` mode: type to filter, pick several.
 * The chosen values are NOT shown inside the field; screens render them where they belong
 * (exclusion chips under the field, instrument rows in a list), so the field stays one line.
 * Each option shows a checkbox look, driven by the item's data-selected attribute.
 */
export function MultiCombobox({
  options, value, onValueChange, placeholder, className, showTrigger = true, id, 'aria-label': ariaLabel,
}: {
  options: ComboOption[]
  value: string[]
  onValueChange: (v: string[]) => void
  placeholder?: string
  className?: string
  showTrigger?: boolean
  id?: string
  'aria-label'?: string
}) {
  const byId = new Map(options.map((o) => [o.id, o]))
  return (
    <BaseCombobox.Root
      items={options.map((o) => o.id)}
      multiple
      value={value}
      onValueChange={(v) => onValueChange(v as string[])}
      itemToStringLabel={(id: string) => byId.get(id)?.label ?? id}
    >
      <BaseCombobox.InputGroup
        className={cn(
          'flex h-8 items-center gap-1.5 border border-control bg-surface pl-2 text-sm text-fg data-popup-open:border-control-active has-[input:focus]:border-control-active',
          showTrigger ? 'pr-0.5' : 'pr-2',
          className,
        )}
      >
        <Search className="size-3.5 shrink-0 text-fg-subtle" strokeWidth={1.75} aria-hidden />
        <BaseCombobox.Input id={id} aria-label={ariaLabel} placeholder={placeholder} className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg-subtle" />
        {showTrigger && (
          <BaseCombobox.Trigger className="flex size-7 cursor-pointer items-center justify-center text-fg-secondary hover:bg-surface-muted" aria-label="Show options">
            <ChevronDown className="size-3.5 transition-transform in-data-popup-open:rotate-180" strokeWidth={1.75} />
          </BaseCombobox.Trigger>
        )}
      </BaseCombobox.InputGroup>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner className="z-50 outline-none" sideOffset={1}>
          <BaseCombobox.Popup className={cn(popupSurface, 'w-(--anchor-width) min-w-55')}>
            <BaseCombobox.Empty className="px-2.5 py-2 text-fg-muted empty:p-0">No matches</BaseCombobox.Empty>
            <BaseCombobox.List className="max-h-[min(14.5rem,var(--available-height))] overflow-y-auto py-0.5">
              {(id: string) => {
                const o = byId.get(id)!
                return (
                  <BaseCombobox.Item
                    key={id}
                    value={id}
                    className="group flex min-h-8 cursor-pointer items-center gap-2 px-2.5 outline-none select-none data-highlighted:bg-surface-muted data-selected:bg-excluded-subtle data-selected:data-highlighted:bg-excluded"
                  >
                    <span className="flex size-3.5 shrink-0 items-center justify-center border border-control bg-surface text-on-accent group-data-selected:border-error group-data-selected:bg-error">
                      <BaseCombobox.ItemIndicator><Check className="size-2.5" strokeWidth={3.5} /></BaseCombobox.ItemIndicator>
                    </span>
                    <span>{o.label}</span>
                    {o.sub && <span className="text-fg-subtle">{o.sub}</span>}
                  </BaseCombobox.Item>
                )
              }}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  )
}
