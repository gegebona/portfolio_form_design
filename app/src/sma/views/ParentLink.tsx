import { ExternalLink } from 'lucide-react'
import { cn } from '../lib/cn'
import { parentCode, usePortfolio } from '../state/portfolio'

/** Link to a customized version's parent, shown by its code (name on hover): opens the parent's Simulation on its Current version in a new browser tab. */
export function ParentLink({ className }: { className?: string }) {
  const { state } = usePortfolio()
  const c = state.custom
  if (!c) return null
  return (
    <a href={`#sma/open/${c.parentId}/current`} target="_blank" rel="noopener" title={c.parentName} className={cn('inline-flex items-center gap-1 text-link hover:text-link-hover hover:underline', className)}>
      {parentCode(c)}
      <ExternalLink className="size-3" strokeWidth={1.75} aria-label="opens in a new tab" />
    </a>
  )
}
