import { Command } from 'cmdk'
import { Check, ChevronDown, Search } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { Button } from './button'
import { popupSurface } from './popup'

export type ComboOption = { id: string; label: string; sub?: string }

/**
 * MultiCombobox — type to filter, pick several. Radix has no combobox, so this is the shadcn pattern: cmdk (filtering
 * and keyboard: ↑ ↓ move, Enter picks) in a Radix Popover anchored to the field.
 * The chosen values are NOT shown inside the field; screens render them where they belong
 * (exclusion chips under the field, instrument rows in a list), so the field stays one line.
 * Each option shows a checkbox look, driven by the item's data-checked attribute.
 * tone: 'exclude' (red: picking means excluding, on Preferences) or 'select' (blue: picking means adding).
 * The list closes with its own Done button, with Esc, or by clicking outside; closeOnSelect closes it after each pick.
 */
export function MultiCombobox({
  options, value, onValueChange, placeholder, className, showTrigger = true, id, tone = 'exclude', closeOnSelect, 'aria-label': ariaLabel,
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
  const anchor = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const toggle = (oid: string) => {
    onValueChange(value.includes(oid) ? value.filter((v) => v !== oid) : [...value, oid])
    setQ('')
    if (closeOnSelect) setOpen(false)
  }
  return (
    <Command loop shouldFilter className="contents" onKeyDown={(e) => { if (e.key === 'ArrowDown' && !open) setOpen(true) }}>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Anchor asChild>
          <div
            ref={anchor}
            data-state={open ? 'open' : 'closed'}
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-sm border border-control bg-surface pl-2 text-sm text-fg data-[state=open]:border-control-active has-[input:focus]:border-control-active',
              showTrigger ? 'pr-0.5' : 'pr-2',
              className,
            )}
          >
            <Search className="size-3.5 shrink-0 text-fg-subtle" strokeWidth={1.75} aria-hidden />
            <Command.Input
              ref={input}
              id={id}
              aria-label={ariaLabel}
              placeholder={placeholder}
              value={q}
              onValueChange={(v) => { setQ(v); setOpen(true) }}
              onClick={() => setOpen(true)}
              className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg-subtle"
            />
            {showTrigger && (
              <button type="button" tabIndex={-1} onClick={() => { setOpen(!open); input.current?.focus() }} className="group flex size-7 cursor-pointer items-center justify-center text-fg-secondary hover:bg-surface-muted" aria-label="Show options">
                <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} strokeWidth={1.75} />
              </button>
            )}
          </div>
        </Popover.Anchor>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={1}
            // Focus stays in the field so typing keeps filtering; clicks on the field itself do not count as outside.
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => { if (anchor.current?.contains(e.target as Node)) e.preventDefault() }}
            className={cn(popupSurface, 'z-50 w-(--radix-popover-trigger-width) min-w-55')}
          >
            <Command.List className="max-h-[min(14.5rem,var(--radix-popover-content-available-height))] overflow-y-auto py-0.5">
              <Command.Empty className="px-2.5 py-2 text-fg-muted">No matches</Command.Empty>
              {options.map((o) => {
                const on = value.includes(o.id)
                return (
                  <Command.Item
                    key={o.id}
                    value={o.id}
                    keywords={[o.label, o.sub ?? '']}
                    onSelect={() => toggle(o.id)}
                    data-checked={on || undefined}
                    className={cn(
                      'group flex min-h-8 cursor-pointer items-center gap-2 px-2.5 outline-none select-none data-[selected=true]:bg-surface-muted',
                      tone === 'exclude' && 'data-checked:bg-excluded-subtle data-checked:data-[selected=true]:bg-excluded',
                    )}
                  >
                    <span className={cn('flex size-3.5 shrink-0 items-center justify-center rounded-xs border border-control bg-surface text-on-accent', on && (tone === 'exclude' ? 'border-error bg-error' : 'border-selected bg-selected'))}>
                      {on && <Check className="size-2.5" strokeWidth={3.5} />}
                    </span>
                    <span>{o.label}</span>
                    {o.sub && <span className="text-fg-subtle">{o.sub}</span>}
                  </Command.Item>
                )
              })}
            </Command.List>
            <div className="flex justify-end border-t border-line px-2 py-1.5">
              <Button size="xs" onClick={() => setOpen(false)}>Done</Button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </Command>
  )
}
