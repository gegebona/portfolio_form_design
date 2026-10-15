import { ViewTransition, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * Screen section: 24px sides, title (20px regular) and a one-line description.
 * Type hierarchy: guidance (descriptions, hints, counts) is 12px muted, so it always reads quieter than the
 * portfolio's own content (14px body, 12px in dense tables).
 * screenHeading: the first heading of each step. It carries one fixed view-transition name, so when the step
 * changes it stays where it is and only its text cross-fades, while the rest of the screen slides.
 */
export function Section({ title, description, actions, screenHeading, className, children }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; screenHeading?: boolean; className?: string; children?: ReactNode }) {
  const heading = (
    <div>
      {title && <h2 className="mb-1 text-xl">{title}</h2>}
      {description && <p className="text-sm text-fg">{description}</p>}
    </div>
  )
  return (
    <section className={cn('px-6 pt-5 pb-5.5', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          {screenHeading ? (
            <ViewTransition name="screen-heading" share="morph" update="none">{heading}</ViewTransition>
          ) : heading}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

/** Label + quiet count, used above every field group ("Sector exclusions  2 excluded"). */
export function GroupLabel({ children, count, htmlFor, id }: { children: ReactNode; count?: ReactNode; htmlFor?: string; id?: string }) {
  const Label = htmlFor ? 'label' : 'span'
  return (
    <div className="mb-1.5 flex items-baseline gap-2">
      <Label htmlFor={htmlFor} id={id}>{children}</Label>
      {count && <span className="text-xs text-fg-muted">{count}</span>}
    </div>
  )
}
