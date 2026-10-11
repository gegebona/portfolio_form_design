import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui/button'
import { SearchInput } from '../components/ui/input'
import { Section } from '../components/ui/layout'
import { Menu, MenuTrigger } from '../components/ui/menu'
import { MODEL_PORTFOLIOS, type BookEntry } from '../data/data'
import { cn } from '../lib/cn'

/** Same table look as the Simulation positions table: muted sticky header, 12px rows, hairline dividers. */
const th = 'sticky top-0 z-2 border-b border-line bg-surface-subtle px-2.5 py-2 text-left font-normal whitespace-nowrap text-fg-muted'
const td = 'border-b border-line px-2.5 py-1.5 align-middle'
/** Outlined tag (as CurrencyTag) for states that still need work; Published stays plain text. */
const tag = 'border border-line-strong px-1.5 text-xs/4.5 whitespace-nowrap text-fg-muted'

const openFlow = () => { location.hash = 'data' }

/**
 * Model portfolio book: the landing list of every model portfolio. Customized versions sit indented under the
 * portfolio they derive from. Search filters by name or ID; a parent stays visible while one of its versions matches.
 */
export function BookView() {
  const [q, setQ] = useState('')
  const ql = q.trim().toLowerCase()
  const hit = (e: BookEntry) => !ql || e.name.toLowerCase().includes(ql) || e.id.includes(ql)
  const rows = MODEL_PORTFOLIOS.filter((e) => {
    if (hit(e)) return true
    if (e.parent) return MODEL_PORTFOLIOS.some((p) => p.id === e.parent && hit(p))
    return MODEL_PORTFOLIOS.some((c) => c.parent === e.id && hit(c))
  })
  const total = MODEL_PORTFOLIOS.length

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-340 flex-1 flex-col px-6">
      <div className="my-4 flex min-h-0 flex-1 flex-col border border-line-strong bg-surface">
        <Section
          title="Model portfolio book"
          description="All model portfolios and their customized versions."
          actions={<Button variant="primary" onClick={openFlow}>Create model portfolio</Button>}
        >
          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <SearchInput value={q} onValueChange={setQ} placeholder="Find model portfolio by name or ID…" aria-label="Find model portfolio" className="w-90 max-w-full" />
            <div className="text-xs text-fg-muted" aria-live="polite">{ql ? `${rows.length} of ${total} model portfolios` : `${total} model portfolios`}</div>
          </div>
        </Section>

        <div className="min-h-0 flex-1 overflow-auto border-t border-line">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className={cn(th, 'pl-6')}>ID</th><th className={th}>Model portfolio name</th><th className={th}>Tasks</th><th className={th}>Type</th>
                <th className={th}>Asset class</th><th className={th}>Benchmark</th><th className={cn(th, 'text-right')}>Performance % (1Y)</th>
                <th className={th}>Created by</th><th className={th}>Status</th><th className={th}>Last modified</th>
                <th className={cn(th, 'pr-6')}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className={cn('hover:bg-surface-subtle', e.parent && 'bg-surface-subtle hover:bg-surface-muted')}>
                  <td className={cn(td, 'pl-6 tabular-nums text-fg-muted')}>{e.id}</td>
                  <td className={cn(td, e.parent && 'pl-7')}>
                    <a href="#data" className="text-link hover:text-link-hover hover:underline">{e.name}</a>
                  </td>
                  <td className={td}>{e.tasks ? <span className="bg-surface-strong px-1.5 text-xs/4.5 whitespace-nowrap">{e.tasks} open</span> : null}</td>
                  <td className={td}>{e.type}</td>
                  <td className={td}>{e.area}</td>
                  <td className={td}>{e.benchmark}</td>
                  <td className={cn(td, 'text-right tabular-nums')}>{e.perf1y.toFixed(2)}</td>
                  <td className={cn(td, 'whitespace-nowrap')}>{e.creator}</td>
                  <td className={td}>{e.status === 'Published' ? e.status : <span className={tag}>{e.status}</span>}</td>
                  <td className={cn(td, 'whitespace-nowrap tabular-nums')}>{e.modified}<span className="text-fg-muted"> · {e.editedBy}</span></td>
                  <td className={cn(td, 'pr-6 text-right')}>
                    <Menu
                      trigger={<MenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Actions for ${e.name}`} />}><MoreHorizontal className="size-4" /></MenuTrigger>}
                      items={[{ label: 'Open', onClick: openFlow }]}
                    />
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={11} className={cn(td, 'px-6 py-4 text-fg-subtle')}>No model portfolio matches “{q.trim()}”.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
