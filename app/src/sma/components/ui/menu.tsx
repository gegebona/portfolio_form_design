import { DropdownMenu } from 'radix-ui'
import { cloneElement, type ReactElement, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { popupSurface } from './popup'

/** Menu — Radix Dropdown Menu: a trigger plus a list of actions. Keyboard: arrows move, Enter picks, Esc closes. */
export function Menu({ trigger, items, align = 'end' }: { trigger: ReactNode; items: { label: string; onClick: () => void }[]; align?: 'start' | 'end' }) {
  return (
    <DropdownMenu.Root modal={false}>
      {trigger}
      <DropdownMenu.Portal>
        <DropdownMenu.Content sideOffset={4} align={align} className={cn(popupSurface, 'z-50 min-w-48 py-0.5')}>
          {items.map((it) => (
            <DropdownMenu.Item key={it.label} onSelect={it.onClick} className="flex h-9 cursor-pointer items-center px-3 text-sm outline-none select-none data-highlighted:bg-surface-muted">
              {it.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/** The menu's trigger: `render` is the element to use (usually a Button), the children go inside it. */
export function MenuTrigger({ render, children }: { render: ReactElement<{ children?: ReactNode }>; children?: ReactNode }) {
  return <DropdownMenu.Trigger asChild>{cloneElement(render, undefined, children)}</DropdownMenu.Trigger>
}
