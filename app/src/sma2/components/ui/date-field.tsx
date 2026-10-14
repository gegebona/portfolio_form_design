import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useState } from 'react'
import { cn } from '../../lib/cn'
import { popupSurface } from './popup'

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
/** ISO (yyyy-mm-dd) to the field's DD/MM/YYYY. */
export const ddmmyyyy = (s: string) => (s ? s.split('-').reverse().join('/') : '')

/**
 * Date field with calendar — the Platinum UI date field: DD/MM/YYYY with a calendar icon on the right. The calendar
 * opens under the field: month and year between ‹ › buttons, weeks from Sunday, days of other months greyed, the
 * chosen day filled blue. Days outside min / max cannot be picked. Values are ISO dates (yyyy-mm-dd).
 */
export function DateField({ value, onChange, min, max, className, 'aria-label': ariaLabel }: { value: string; onChange: (v: string) => void; min?: string; max?: string; className?: string; 'aria-label'?: string }) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => { const d = value ? parse(value) : new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const first = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay())
  const cells = Array.from({ length: 42 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + i))
  const step = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))
  const nav = 'flex size-6 cursor-pointer items-center justify-center rounded-xs border border-control bg-surface text-fg hover:border-link hover:bg-link hover:text-on-accent'
  return (
    <Popover.Root open={open} onOpenChange={(o) => { setOpen(o); if (o && value) { const d = parse(value); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)) } }}>
      <Popover.Trigger asChild>
        <button type="button" aria-label={ariaLabel} className={cn('flex h-8 w-36 cursor-pointer items-center justify-between gap-2 rounded-sm border border-control bg-surface pr-1.5 pl-2.5 text-left text-sm tabular-nums outline-none data-[state=open]:border-control-active data-[state=open]:bg-field-focus', className)}>
          <span className={cn(!value && 'text-fg-subtle')}>{value ? ddmmyyyy(value) : 'DD/MM/YYYY'}</span>
          <CalendarDays className="size-4.5 text-fg" strokeWidth={1.5} aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={4} className={cn(popupSurface, 'z-50 w-64 px-3 pt-3 pb-2 text-sm')}>
          <div className="mb-2 flex items-center justify-between">
            <button type="button" className={nav} aria-label="Previous month" onClick={() => step(-1)}><ChevronLeft className="size-3.5" strokeWidth={1.75} /></button>
            <span className="font-semibold">{MONTHS[month.getMonth()]} {month.getFullYear()}</span>
            <button type="button" className={nav} aria-label="Next month" onClick={() => step(1)}><ChevronRight className="size-3.5" strokeWidth={1.75} /></button>
          </div>
          <div className="grid grid-cols-7 text-center">
            {DAYS.map((d) => <span key={d} className="py-1 text-xs text-fg-muted">{d}</span>)}
            {cells.map((d) => {
              const k = iso(d)
              const other = d.getMonth() !== month.getMonth()
              const off = (!!min && k < min) || (!!max && k > max)
              const on = k === value
              return (
                <button
                  key={k}
                  type="button"
                  disabled={off}
                  onClick={() => { onChange(k); setOpen(false) }}
                  className={cn('mx-auto my-0.5 flex size-7 cursor-pointer items-center justify-center rounded-xs tabular-nums hover:bg-field-focus disabled:cursor-default disabled:text-fg-subtle disabled:hover:bg-transparent', other && 'text-fg-subtle', on && 'bg-link text-on-accent hover:bg-link')}
                >
                  {pad(d.getDate())}
                </button>
              )
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
