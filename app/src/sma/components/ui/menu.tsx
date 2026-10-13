import { Menu as BaseMenu } from '@base-ui/react/menu'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { popupSurface } from './popup'

/** Menu — Base UI Menu: a trigger plus a list of actions. Keyboard: arrows move, Enter picks, Esc closes. */
export function Menu({ trigger, items, align = 'end' }: { trigger: ReactNode; items: { label: string; onClick: () => void }[]; align?: 'start' | 'end' }) {
  return (
    <BaseMenu.Root>
      {trigger}
      <BaseMenu.Portal>
        <BaseMenu.Positioner className="z-50 outline-none" sideOffset={4} align={align}>
          <BaseMenu.Popup className={cn(popupSurface, 'min-w-48 origin-(--transform-origin) py-0.5')}>
            {items.map((it) => (
              <BaseMenu.Item key={it.label} onClick={it.onClick} className="flex h-9 cursor-pointer items-center px-3 text-sm outline-none select-none data-highlighted:bg-surface-muted">
                {it.label}
              </BaseMenu.Item>
            ))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  )
}

export const MenuTrigger = BaseMenu.Trigger
