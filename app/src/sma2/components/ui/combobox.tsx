import { Command } from 'cmdk'
import { Check, ChevronDown, Search } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useState } from 'react'
import { cn } from '../../lib/cn'
import { popupSurface } from './popup'

export type ComboOption = { id: string; label: string; sub?: string }

/**
 * Combo box — the Platinum UI combo box. The field shows what is chosen ("Menu item one, Menu item four…" and a count
 * badge for the rest, grey while closed, blue while open); a chevron opens the list. The list starts with its own
 * Search row; chosen rows are shaded with a grey check on the right. While open the field takes the focus fill and
 * border. Keyboard: ↓ opens, ↑ ↓ move, Enter picks, Esc closes (cmdk inside a Radix Popover).
 * closeOnSelect closes the list after each pick (single choice). tone is kept for callers; both tones look the same.
 */
export function MultiCombobox({
  options, value, onValueChange, placeholder, className, id, closeOnSelect, 'aria-label': ariaLabel,
}: {
  tone?: 'exclude' | 'select'
  closeOnSelect?: boolean
  options: ComboOption[]
  value: string[]
  onValueChange: (v: string[]) => void
  placeholder?: string
  className?: string
  showTrigger?: boolean
  id?: string
  'aria-label'?: string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const shown = needle ? options.filter((o) => (o.label + ' ' + (o.sub ?? '')).toLowerCase().includes(needle)) : options
  const chosen = value.map((v) => options.find((o) => o.id === v)?.label).filter((l): l is string => !!l)
  const head = chosen.slice(0, 2)
  const rest = chosen.length - head.length
  const toggle = (oid: string) => {
    onValueChange(value.includes(oid) ? value.filter((v) => v !== oid) : [...value, oid])
    if (closeOnSelect) { setOpen(false); setQ('') }
  }
  return (
    <Popover.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ('') }}>
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          className={cn(
            'flex h-8 min-w-0 cursor-pointer items-center gap-2 rounded-sm border border-control bg-surface pr-2 pl-2.5 text-left text-sm text-fg outline-none focus-visible:border-control-active data-[state=open]:border-control-active data-[state=open]:bg-field-focus',
            className,
          )}
        >
          <span className={cn('min-w-0 flex-1 truncate', !chosen.length && 'text-fg-subtle')}>{chosen.length ? head.join(', ') + (rest > 0 ? '…' : '') : placeholder}</span>
          {rest > 0 && <span className={cn('shrink-0 rounded-xs px-1.5 text-xs/5 text-on-accent', open ? 'bg-link' : 'bg-fg-muted')}>+{rest}</span>}
          <ChevronDown className={cn('size-3.5 shrink-0 text-fg-secondary', open && 'rotate-180')} strokeWidth={1.75} aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={4} className={cn(popupSurface, 'z-50 w-(--radix-popover-trigger-width) min-w-55')}>
          <Command loop shouldFilter={false}>
            <div className="flex h-9 items-center gap-2 border-b border-line px-2.5">
              <Search className="size-3.5 shrink-0 text-fg-muted" strokeWidth={1.75} aria-hidden />
              <Command.Input autoFocus value={q} onValueChange={setQ} placeholder="Search" aria-label={`Search ${ariaLabel ?? placeholder ?? 'options'}`} className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-fg-subtle" />
            </div>
            <Command.List className="max-h-[min(17.5rem,var(--radix-popover-content-available-height))] overflow-y-auto">
              <Command.Empty className="px-3 py-2 text-sm text-fg-muted">No matches</Command.Empty>
              {shown.map((o) => {
                const on = value.includes(o.id)
                return (
                  <Command.Item
                    key={o.id}
                    value={o.id}
                    onSelect={() => toggle(o.id)}
                    data-checked={on || undefined}
                    className="flex min-h-9 cursor-pointer items-center gap-2 px-3 text-sm outline-none select-none data-checked:bg-field-focus data-[selected=true]:bg-field-focus"
                  >
                    <span className="min-w-0 flex-1">{o.label}{o.sub && <span className="ml-2 text-fg-muted">{o.sub}</span>}</span>
                    {on && <Check className="size-3.5 shrink-0 text-fg-muted" strokeWidth={1.75} aria-hidden />}
                  </Command.Item>
                )
              })}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
