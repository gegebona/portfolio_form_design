import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import { createContext, useContext, type ComponentProps, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/*
 * Tabs — Base UI Tabs (Root > List > Tab + Indicator, Panel).
 * One look for every tab type; only label size and the colour of inactive labels differ:
 *   step     screens of the flow          14px, inactive labels in normal ink
 *   sub      content inside a screen      14px, inactive labels muted
 *   segment  Current / New in Simulation  joined boxes, the active one filled in the tab-active blue — for a choice
 *            that changes what the whole screen means and must stay obvious
 *   version  (older look of Current / New)  16px, inactive labels muted
 * Shared: 24px between tabs (gap-6), label 6px above the line, 3px line.
 * The blue line is Tabs.Indicator, positioned by Base UI's --active-tab-left / --active-tab-width
 * variables, so it slides between tabs. Hover shows a light line on the tab itself.
 */

type Variant = 'step' | 'sub' | 'version' | 'segment'
const VariantContext = createContext<Variant>('step')

export const Tabs = BaseTabs.Root

export function TabsList({ variant = 'step', className, children, ...props }: Omit<ComponentProps<typeof BaseTabs.List>, 'className'> & { variant?: Variant; className?: string; children: ReactNode }) {
  return (
    <VariantContext.Provider value={variant}>
      <BaseTabs.List className={cn('relative z-0 flex gap-6', variant === 'segment' && 'gap-0', className)} {...props}>
        {children}
        {variant !== 'segment' && <BaseTabs.Indicator className="absolute bottom-0 left-0 h-0.75 w-(--active-tab-width) translate-x-(--active-tab-left) bg-tab-active transition-[translate,width] duration-200 ease-out" />}
      </BaseTabs.List>
    </VariantContext.Provider>
  )
}

const tabVariant: Record<Variant, string> = {
  step: 'pt-3 text-sm text-fg',
  sub: 'pt-2 text-sm text-fg-muted',
  version: 'pt-1.5 text-base text-fg-muted',
  segment: '-ml-px border border-b border-control px-4 py-1.5 text-sm text-fg first:ml-0 hover:border-control hover:bg-surface-muted data-active:border-tab-active data-active:bg-tab-active data-active:font-semibold data-active:text-fg-inverse data-active:hover:bg-tab-active',
}

export function Tab({ className, ...props }: Omit<ComponentProps<typeof BaseTabs.Tab>, 'className'> & { className?: string }) {
  const variant = useContext(VariantContext)
  return (
    <BaseTabs.Tab
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 border-b-3 border-transparent pb-1.5 whitespace-nowrap',
        'hover:border-line-strong hover:text-fg data-active:cursor-default data-active:border-transparent data-active:text-fg',
        'data-disabled:cursor-default data-disabled:text-fg-disabled data-disabled:hover:border-transparent',
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

export const TabsPanel = BaseTabs.Panel
