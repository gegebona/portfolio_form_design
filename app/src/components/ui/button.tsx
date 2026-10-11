import { Button as BaseButton } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'

/**
 * Button — Base UI Button (a <button> that handles disabled + focus correctly) styled with tokens.
 *
 * variant:  primary   one per screen, the main forward action (accent: blue)
 *           secondary everything else (outlined)
 *           link      text actions inside content ("Fill remaining", "Clear all")
 *           ghost     icon-only and quiet actions (row ×, ⋯)
 * tone:     onDark    the same variants on the dark action bar
 * size:     xs 24px, 12px text: actions inside 12px table rows, so they match the row's own text
 *           sm 28px · md 32px · lg 36px (Tailwind h-7 / h-8 / h-9)
 */
export const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap select-none disabled:cursor-default',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-on-accent hover:bg-accent-hover disabled:bg-line-strong disabled:text-fg-subtle',
        secondary: 'border border-control bg-surface text-fg hover:bg-surface-muted disabled:border-line disabled:bg-surface disabled:text-fg-disabled',
        link: 'h-auto px-0.5 text-link hover:underline disabled:text-fg-disabled disabled:no-underline',
        ghost: 'text-fg-secondary hover:bg-surface-muted hover:text-fg disabled:text-fg-disabled',
      },
      tone: {
        default: '',
        onDark: 'focus-visible:outline-fg-inverse',
      },
      size: {
        xs: 'h-6 px-2 text-xs',
        sm: 'h-7 px-2.5 text-sm',
        md: 'h-8 px-3.5 text-sm',
        lg: 'h-9 px-4.5 text-sm',
        icon: 'size-7 p-0',
        'icon-sm': 'size-5.5 p-0',
      },
    },
    compoundVariants: [
      { variant: 'secondary', tone: 'onDark', className: 'border-control bg-transparent text-fg-inverse hover:bg-fg-secondary disabled:border-fg-secondary disabled:bg-transparent disabled:text-fg-subtle' },
      { variant: 'link', tone: 'onDark', className: 'text-surface-strong hover:text-fg-inverse hover:no-underline' },
      { variant: 'link', className: 'h-auto px-0.5' },
    ],
    defaultVariants: { variant: 'secondary', tone: 'default', size: 'md' },
  },
)

export type ButtonProps = Omit<ComponentProps<typeof BaseButton>, 'className'> & VariantProps<typeof buttonVariants> & { className?: string }

export function Button({ className, variant, tone, size, ...props }: ButtonProps) {
  return <BaseButton className={cn(buttonVariants({ variant, tone, size }), className)} {...props} />
}
