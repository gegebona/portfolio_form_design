import { Select as BaseSelect } from '@base-ui/react/select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'
import { popupSurface } from './popup'

type Item = { value: string; label: string }

/**
 * Select — Base UI Select. The popup opens over the trigger with the chosen item aligned to it
 * (alignItemWithTrigger), like a native select, and is keyboard- and screen-reader-complete.
 */
export function Select({
  value, onValueChange, items, className, 'aria-label': ariaLabel, id,
}: {
  value: string
  onValueChange: (v: string) => void
  items: Item[]
  className?: string
  'aria-label'?: string
  id?: string
}) {
  return (
    <BaseSelect.Root items={items} value={value} onValueChange={(v) => onValueChange(v as string)}>
      <BaseSelect.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          'flex h-8 min-w-0 cursor-pointer items-center justify-between gap-2 rounded-sm border border-control bg-surface pr-2 pl-2.5 text-left text-sm text-fg data-popup-open:border-control-active',
          className,
        )}
      >
        <BaseSelect.Value className="truncate" />
        <BaseSelect.Icon className="flex text-fg-secondary">
          <ChevronDown className="size-3.5" strokeWidth={1.75} />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner className="z-50 outline-none" sideOffset={4}>
          <BaseSelect.Popup className={cn(popupSurface, 'min-w-(--anchor-width) origin-(--transform-origin) py-0.5')}>
            <BaseSelect.List className="max-h-(--available-height) overflow-y-auto">
              {items.map((it) => (
                <BaseSelect.Item
                  key={it.value}
                  value={it.value}
                  className="grid h-8 cursor-pointer grid-cols-[1rem_1fr] items-center gap-2 pr-4 pl-2 text-sm outline-none select-none data-highlighted:bg-surface-muted"
                >
                  <BaseSelect.ItemIndicator className="col-start-1 flex text-selected">
                    <Check className="size-3.5" strokeWidth={2.25} />
                  </BaseSelect.ItemIndicator>
                  <BaseSelect.ItemText className="col-start-2">{it.label}</BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
