import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Download, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui/button'
import { SearchInput } from '../components/ui/input'
import { Section } from '../components/ui/layout'
import { Menu, MenuTrigger } from '../components/ui/menu'
import { Select } from '../components/ui/select'
import { Checkbox } from '../components/ui/selection'
import { Tab, TabCount, Tabs, TabsList } from '../components/ui/tabs'
import { BOOK_AS_OF, BOOK_STATUSES, BOOK_USER, MODEL_PORTFOLIOS, type BookEntry, type BookStatus } from '../data/data'
import { cn } from '../lib/cn'
import { usePortfolio } from '../state/portfolio'

/** Same table look as the Simulation positions table: muted sticky header, 12px rows, hairline dividers. */
const th = 'sticky top-0 z-2 border-b border-line bg-surface-subtle px-2.5 py-2 text-left font-normal whitespace-nowrap text-fg-muted'
const td = 'border-b border-line px-2.5 py-1.5 align-middle'
const tagBase = 'inline-block px-1.5 text-xs/4.5 whitespace-nowrap'
/** Portfolio type reads at a glance: grey fill = Standard, dark fill = Multi, outline = Customized. */
const TYPE_TAG: Record<BookEntry['type'], string> = {
  Standard: 'bg-surface-strong',
  Multi: 'bg-surface-inverse text-fg-inverse',
  Customized: 'border border-control',
}
const TYPES: BookEntry['type'][] = ['Standard', 'Multi', 'Customized']

type SortKey = 'id' | 'name' | 'type' | 'area' | 'benchmark' | 'perf1y' | 'creator' | 'status' | 'modified'
type Sort = { key: SortKey; dir: 'asc' | 'desc' }
function sortValue(e: BookEntry, k: SortKey): string | number {
  if (k === 'perf1y') return e.perf1y
  if (k === 'modified') return e.modified.split('/').reverse().join('')
  return e[k]
}

const today = () => new Date().toLocaleDateString('en-GB')
const nextId = (l: BookEntry[]) => String(Math.max(0, ...l.map((e) => Number(e.id) || 0)) + 1).padStart(3, '0')
const uniq = (v: string[]) => [...new Set(v)].sort()

/** The book survives going into the flow and back (module-level copy); a page reload restores the sample list. */
let saved: BookEntry[] = MODEL_PORTFOLIOS

/**
 * Model portfolio book: the landing list of every model portfolio.
 * Type tabs + filters + search narrow it; column headers sort it; customized versions sit under their parent
 * and can be collapsed. Row actions follow the lifecycle Draft → Pending → Published → Archived.
 */
export function BookView() {
  const { update } = usePortfolio()
  const [list, setListState] = useState(saved)
  const setList = (fn: (l: BookEntry[]) => BookEntry[]) => setListState((l) => (saved = fn(l)))

  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [area, setArea] = useState('all')
  const [creator, setCreator] = useState('all')
  const [mine, setMine] = useState(false)
  const [sort, setSort] = useState<Sort>({ key: 'id', dir: 'asc' })
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [size, setSize] = useState('10')
  const [page, setPage] = useState(0)

  const ql = q.trim().toLowerCase()
  const filtered = status !== 'all' || area !== 'all' || creator !== 'all' || mine
  const matches = (e: BookEntry) =>
    (type === 'all' || e.type === type) && (status === 'all' || e.status === status) && (area === 'all' || e.area === area) &&
    (creator === 'all' || e.creator === creator) && (!mine || e.creator === BOOK_USER) &&
    (!ql || e.name.toLowerCase().includes(ql) || e.id.includes(ql))
  const ids = new Set(list.filter(matches).map((e) => e.id))
  const cmp = (a: BookEntry, b: BookEntry) => {
    const x = sortValue(a, sort.key)
    const y = sortValue(b, sort.key)
    const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))
    return sort.dir === 'asc' ? c : -c
  }
  const kidsOf = (id: string) => list.filter((c) => c.parent === id && ids.has(c.id)).sort(cmp)
  // A parent stays visible (muted) while one of its customized versions matches.
  const tops = list.filter((e) => !e.parent && (ids.has(e.id) || kidsOf(e.id).length > 0)).sort(cmp)
  const per = Number(size)
  const pages = Math.max(1, Math.ceil(tops.length / per))
  const p = Math.min(page, pages - 1)
  const rows = tops.slice(p * per, p * per + per).flatMap((t) => {
    const kids = kidsOf(t.id)
    return [{ e: t, kids: kids.length, context: !ids.has(t.id) }, ...(collapsed.has(t.id) ? [] : kids.map((e) => ({ e, kids: 0, context: false })))]
  })

  const open = (e: BookEntry) => { update((s) => { s.data.name = e.name; s.data.code = 'MP_' + e.id }); location.hash = 'data' }
  const create = () => { update((s) => { s.data.name = 'New model portfolio'; s.data.code = 'MP_' + nextId(list) }); location.hash = 'data' }
  const patch = (id: string, change: Partial<BookEntry>) =>
    setList((l) => l.map((e) => (e.id === id ? { ...e, ...change, editedBy: BOOK_USER, modified: today() } : e)))
  const add = (src: BookEntry, change: Partial<BookEntry>) =>
    setList((l) => {
      const copy: BookEntry = { ...src, tasks: undefined, ...change, id: nextId(l), status: 'Draft', creator: BOOK_USER, editedBy: BOOK_USER, modified: today() }
      const at = l.findIndex((e) => e.id === src.id)
      return [...l.slice(0, at + 1), copy, ...l.slice(at + 1)]
    })
  const setTo = (e: BookEntry, s: BookStatus) => () => patch(e.id, { status: s })
  /** Row actions depend on where the portfolio is in its lifecycle. */
  const actions = (e: BookEntry) => [
    { label: e.status === 'Draft' ? 'Edit' : 'Open', onClick: () => open(e) },
    { label: 'Duplicate', onClick: () => add(e, { name: e.name + ' (copy)' }) },
    ...(e.status === 'Published' && e.type !== 'Customized' ? [{ label: 'Create customized version', onClick: () => add(e, { name: e.name + ' – customized', type: 'Customized', parent: e.id }) }] : []),
    ...(e.status === 'Draft' ? [{ label: 'Submit for approval', onClick: setTo(e, 'Pending') }] : []),
    ...(e.status === 'Pending' ? [{ label: 'Approve and publish', onClick: setTo(e, 'Published') }, { label: 'Return to draft', onClick: setTo(e, 'Draft') }] : []),
    ...(e.status === 'Published' ? [{ label: 'Archive', onClick: setTo(e, 'Archived') }] : []),
    ...(e.status === 'Archived' ? [{ label: 'Restore', onClick: setTo(e, 'Published') }] : []),
  ]

  const toggle = (id: string) => setCollapsed((c) => { const n = new Set(c); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const sortBy = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  const clear = () => { setStatus('all'); setArea('all'); setCreator('all'); setMine(false) }

  const exportCsv = () => {
    const out = tops.flatMap((t) => [t, ...kidsOf(t.id)]).filter((e) => ids.has(e.id))
    const lines = [
      ['ID', 'Model portfolio name', 'Type', 'Asset class', 'Benchmark', 'Performance % (1Y)', 'Created by', 'Status', 'Last modified', 'Last edited by'],
      ...out.map((e) => [e.id, e.name, e.type, e.area, e.benchmark, e.perf1y.toFixed(2), e.creator, e.status, e.modified, e.editedBy]),
    ]
    const csv = lines.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'model-portfolio-book.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const head = (key: SortKey, label: string, className?: string) => {
    const on = sort.key === key
    const Arrow = sort.dir === 'asc' ? ArrowUp : ArrowDown
    return (
      <th className={cn(th, className)} aria-sort={on ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
        <button type="button" onClick={() => sortBy(key)} className={cn('inline-flex cursor-pointer items-center gap-1 hover:text-fg', on && 'text-fg')}>
          {label}
          {on && <Arrow className="size-3" strokeWidth={1.75} aria-hidden />}
        </button>
      </th>
    )
  }
  const options = (all: string, values: string[]) => [{ value: 'all', label: all }, ...values.map((v) => ({ value: v, label: v }))]

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-340 flex-1 flex-col px-6">
      <div className="my-4 flex min-h-0 flex-1 flex-col border border-line-strong bg-surface">
        <Section
          title="Model portfolio book"
          description="All model portfolios and their customized versions."
          actions={<Button variant="primary" onClick={create}>Create model portfolio</Button>}
          className="pb-0"
        >
          <div className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-2">
            <SearchInput value={q} onValueChange={setQ} placeholder="Find model portfolio by name or ID…" aria-label="Find model portfolio" className="w-75 max-w-full" />
            <Select aria-label="Status" value={status} onValueChange={setStatus} items={options('All statuses', BOOK_STATUSES)} className="w-36" />
            <Select aria-label="Asset class" value={area} onValueChange={setArea} items={options('All asset classes', uniq(list.map((e) => e.area)))} className="w-40" />
            <Select aria-label="Created by" value={creator} onValueChange={setCreator} items={options('All creators', uniq(list.map((e) => e.creator)))} className="w-36" />
            <label className="ml-2 flex cursor-pointer items-center gap-2 text-xs">
              <Checkbox checked={mine} onCheckedChange={setMine} />
              My portfolios
            </label>
            {filtered && <Button variant="link" className="ml-2 text-xs" onClick={clear}>Clear filters</Button>}
          </div>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <Tabs value={type} onValueChange={(v) => { setType(v as string); setPage(0) }}>
              <TabsList variant="sub" aria-label="Portfolio type">
                <Tab value="all">All types <TabCount>{list.length}</TabCount></Tab>
                {TYPES.map((t) => <Tab key={t} value={t}>{t} <TabCount>{list.filter((e) => e.type === t).length}</TabCount></Tab>)}
              </TabsList>
            </Tabs>
            <div className="pb-1.5 text-xs text-fg-muted" aria-live="polite">
              {ids.size === list.length ? `${list.length} model portfolios` : `${ids.size} of ${list.length} model portfolios`}
            </div>
          </div>
        </Section>

        <div className="min-h-0 flex-1 overflow-auto border-t border-line">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {head('id', 'ID', 'pl-6')}{head('name', 'Model portfolio name')}{head('type', 'Type')}<th className={th}>Tasks</th>
                {head('area', 'Asset class')}{head('benchmark', 'Benchmark')}{head('perf1y', 'Performance % (1Y)', 'text-right')}
                {head('creator', 'Created by')}{head('status', 'Status')}{head('modified', 'Last modified')}
                <th className={cn(th, 'pr-6')}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ e, kids, context }) => (
                <tr key={e.id} className={cn('hover:bg-surface-subtle', e.parent && 'bg-surface-subtle hover:bg-surface-muted', (context || e.status === 'Archived') && 'text-fg-muted')}>
                  <td className={cn(td, 'pl-6 text-fg-muted tabular-nums')}>{e.id}</td>
                  <td className={td}>
                    <div className={cn('flex items-center gap-1.5', e.parent && 'pl-5.5')}>
                      {kids > 0 ? (
                        <Button variant="ghost" size="icon-sm" aria-expanded={!collapsed.has(e.id)} aria-label={`${collapsed.has(e.id) ? 'Show' : 'Hide'} customized versions of ${e.name}`} onClick={() => toggle(e.id)}>
                          {collapsed.has(e.id) ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                        </Button>
                      ) : <span className="w-5.5 shrink-0" />}
                      <a href="#data" onClick={(ev) => { ev.preventDefault(); open(e) }} className="text-link hover:text-link-hover hover:underline">{e.name}</a>
                      {kids > 0 && <span className="whitespace-nowrap text-fg-muted">{kids} customized</span>}
                    </div>
                  </td>
                  <td className={td}><span className={cn(tagBase, TYPE_TAG[e.type])}>{e.type}</span></td>
                  <td className={td}>
                    {e.tasks?.length ? (
                      <Menu
                        align="start"
                        trigger={<MenuTrigger className={cn(tagBase, 'cursor-pointer bg-surface-strong hover:bg-line-strong')} aria-label={`${e.tasks.length} open task${e.tasks.length > 1 ? 's' : ''} for ${e.name}`}>{e.tasks.length} open</MenuTrigger>}
                        items={e.tasks.map((t) => ({ label: `${t.label} · ${t.owner} · due ${t.due}`, onClick: () => open(e) }))}
                      />
                    ) : null}
                  </td>
                  <td className={td}>{e.area}</td>
                  <td className={td}>{e.benchmark}</td>
                  <td className={cn(td, 'text-right tabular-nums', e.perf1y < 0 && 'text-error')}>{e.perf1y < 0 ? '−' : ''}{Math.abs(e.perf1y).toFixed(2)}</td>
                  <td className={cn(td, 'whitespace-nowrap')}>{e.creator}</td>
                  <td className={td}>
                    {e.status === 'Published' ? e.status : e.status === 'Archived' ? <span className="text-fg-subtle">{e.status}</span> : <span className={cn(tagBase, 'border border-line-strong text-fg-muted')}>{e.status}</span>}
                  </td>
                  <td className={cn(td, 'whitespace-nowrap tabular-nums')}>{e.modified}<span className="text-fg-muted"> · {e.editedBy}</span></td>
                  <td className={cn(td, 'pr-6 text-right')}>
                    <Menu
                      trigger={<MenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Actions for ${e.name}`} />}><MoreHorizontal className="size-4" /></MenuTrigger>}
                      items={actions(e)}
                    />
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={11} className={cn(td, 'px-6 py-4 text-fg-subtle')}>No model portfolio matches the search and filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line-strong px-6 py-2.5 text-xs">
          <span className="text-fg-muted">Performance as of {BOOK_AS_OF}, net of fees.</span>
          <div className="flex items-center gap-2.5">
            <span className="text-fg-muted">Rows per page</span>
            <Select aria-label="Rows per page" value={size} onValueChange={(v) => { setSize(v); setPage(0) }} items={['10', '25', '50'].map((v) => ({ value: v, label: v }))} className="w-18" />
            <span className="tabular-nums">Page {p + 1} of {pages}</span>
            <Button size="sm" disabled={p === 0} onClick={() => setPage(p - 1)}>Previous</Button>
            <Button size="sm" disabled={p >= pages - 1} onClick={() => setPage(p + 1)}>Next</Button>
            <Button size="sm" className="ml-2" disabled={!ids.size} onClick={exportCsv}><Download className="size-3.5" strokeWidth={1.75} aria-hidden />Export CSV</Button>
          </div>
        </div>
      </div>
    </main>
  )
}
