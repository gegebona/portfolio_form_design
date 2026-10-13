import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn'

/** Building blocks of the Design system page itself (not part of the product UI). */

export function DocSection({ id, kicker, title, lead, badge, children }: { id: string; kicker: string; title: string; lead: ReactNode; badge?: string; children: ReactNode }) {
  return (
    <section id={id} className="mb-4 scroll-mt-4 border border-line-strong bg-surface px-7 pt-6 pb-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-fg-muted">{kicker}</div>
          <h2 className="mb-1 text-xl">{title}</h2>
          <div className="max-w-195 text-fg-muted">{lead}</div>
        </div>
        {badge && <span className="shrink-0 border border-line px-2 py-px text-xs text-fg-muted">{badge}</span>}
      </div>
      {children}
    </section>
  )
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-6 mb-2.5 text-xs font-semibold">{children}</h3>
}

/** Inline code chip. */
export function C({ children }: { children: ReactNode }) {
  return <code className="bg-surface-muted px-1.25 py-px font-mono text-xs">{children}</code>
}

/** Code block (dark), for snippets developers copy. */
export function Code({ children, className }: { children: string; className?: string }) {
  return (
    <pre className={cn('overflow-x-auto bg-surface-inverse px-4 py-3 font-mono text-xs/5 text-fg-inverse', className)}>
      <code>{children.trim()}</code>
    </pre>
  )
}

/** Live demo area: subtle fill so white components stand out. */
export function Demo({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center gap-4 border border-line bg-surface-subtle p-5', className)}>{children}</div>
}

/** Caption above a demo item. */
export function Cap({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-xs text-fg-muted">{label}</span>
      {children}
    </div>
  )
}

/** Simple doc table. */
export function DocTable({ heads, rows, className }: { heads: string[]; rows: ReactNode[][]; className?: string }) {
  return (
    <table className={cn('w-full border-collapse text-xs', className)}>
      <thead>
        <tr>{heads.map((h) => <th key={h} className="border-b border-line bg-surface-subtle px-2.5 py-1.5 text-left font-normal text-fg-muted">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j} className="border-b border-line px-2.5 py-1.5 align-top">{v}</td>)}</tr>)}
      </tbody>
    </table>
  )
}

/** Reads a CSS variable's resolved value (theme tokens are emitted with @theme static). */
export function useCssVar(name: string) {
  const [v, setV] = useState('')
  useEffect(() => { setV(getComputedStyle(document.documentElement).getPropertyValue(name).trim()) }, [name])
  return v
}

/** Anatomy line: Radix parts as a tree. */
export function Anatomy({ children }: { children: string }) {
  return <div className="mt-2 font-mono text-xs text-fg-secondary">{children}</div>
}
