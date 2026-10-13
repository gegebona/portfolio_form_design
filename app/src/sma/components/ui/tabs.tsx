import { Tabs as RTabs } from 'radix-ui'
import { createContext, useContext, type ComponentProps, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/*
 * Tabs — Radix Tabs (Root > List > Trigger, Content).
 * One look for every tab type; only label size and the colour of inactive labels differ:
 *   step     screens of the flow          14px, inactive labels in normal ink
 *   sub      content inside a screen      14px, inactive labels muted
 *   segment  Current / New in Simulation  joined boxes, the active one filled in the tab-active blue — for a choice
 *            that changes what the whole screen means and must stay obvious
 *   version  (older look of Current / New)  16px, inactive labels muted
 * Shared: 24px between tabs (gap-6), label 6px above the line, 2px line under the active tab (data-state=active).
 * Hover shows a light line on the tab itself.
 */

type Variant = 'step' | 'sub' | 'version' | 'segment'
const VariantContext = createContext<Variant>('step')

export const Tabs = RTabs.Root

export function TabsList({ variant = 'step', className, children, ...props }: ComponentProps<typeof RTabs.List> & { variant?: Variant; children: ReactNode }) {
  return (
    <VariantContext.Provider value={variant}>
      <RTabs.List className={cn('relative z-0 flex gap-0', className)} {...props}>
        {children}
      </RTabs.List>
    </VariantContext.Provider>
  )
}

const tabVariant: Record<Variant, string> = {
  step: 'pt-3 text-sm text-fg data-[state=active]:border-tab-active',
  sub: 'pt-2 text-sm text-fg-muted data-[state=active]:border-tab-active',
  version: 'pt-1.5 text-base text-fg-muted data-[state=active]:border-tab-active',
  segment: '-ml-px first:rounded-l-sm last:rounded-r-sm border border-b border-control px-4 py-1.5 text-sm text-fg first:ml-0 hover:border-control hover:bg-surface-muted data-[state=active]:border-tab-active data-[state=active]:bg-tab-active data-[state=active]:font-semibold data-[state=active]:text-fg-inverse data-[state=active]:hover:bg-tab-active',
}

export function Tab({ className, ...props }: ComponentProps<typeof RTabs.Trigger>) {
  const variant = useContext(VariantContext)
  return (
    <RTabs.Trigger
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 border-b-2 border-transparent pb-1.5 whitespace-nowrap outline-none focus-visible:outline-2 focus-visible:outline-focus',
        'px-3 hover:bg-surface-subtle hover:text-fg active:bg-link active:text-fg-inverse data-[state=active]:cursor-default data-[state=active]:text-fg data-[state=active]:hover:bg-transparent',
        'data-disabled:cursor-default data-disabled:text-fg-disabled data-disabled:hover:bg-transparent',
        tabVariant[variant],
        className,
      )}
      {...props}
    />
  )
}

/** Count after a tab label ("Building blocks 9"). */
export function TabCount({ children }: { children: ReactNode }) {
  return <span className="text-xs text-fg-muted">{children}</span>
}

export const TabsPanel = RTabs.Content
