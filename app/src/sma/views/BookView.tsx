import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, LoaderCircle, MoreHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/ui/button'
import { SearchInput } from '../components/ui/input'
import { Menu, MenuTrigger } from '../components/ui/menu'
import { Popover, PopoverTrigger } from '../components/ui/popover'
import { Select } from '../components/ui/select'
import { Tooltip } from '../components/ui/tag'
import { ASSET_CLASSES, BOOK_AS_OF, BOOK_USER, CLASS_COLOR, type AssetClass, type BookEntry } from '../data/data'
import { cn } from '../lib/cn'
import { getBook } from '../state/book'
import { f2, openEntry, startCustomized, startNew, usePortfolio } from '../state/portfolio'
import { MiniTable } from './ComponentDetail'

/** Client book table: dark 12px header labels on a light grey band, compact rows with hairline dividers, links in blue. */
const th = 'sticky top-0 z-2 border-b border-line bg-surface-subtle px-2.5 py-2 text-left font-normal whitespace-nowrap text-fg'
const td = 'border-b border-line px-2.5 py-1 align-middle'
/** Small filled count chip (tasks, customized versions), as the counts in the client book. */
const chip = 'inline-flex h-4.5 min-w-6 items-center justify-center rounded-xs px-1.5 text-xs tabular-nums'
/** Portfolio type in the green chip family of the client book's opportunities: light = Standard, dark = Multi, outline = Customized. */
const TYPE_CHIP: Record<BookEntry['type'], string> = {
  Standard: 'bg-status-published',
  Multi: 'bg-tag-green-strong text-fg-inverse',
  Customized: 'border border-tag-green-strong text-tag-green-strong',
}
/** Customized versions: what the latest automatic update from the parent left behind. */
const AUTO_LINE: Record<NonNullable<BookEntry['auto']>, string> = {
  ready: 'New version from parent update, not published',
  pending: 'Parent update waiting for the data load',
  invalid: 'Parent update not applied, retried at next data load',
}
/** The one list filter, as "View all portfolios" in the client book. */
const VIEWS = [
  { value: 'all', label: 'View all model portfolios' },
  { value: 'mine', label: 'View my model portfolios' },
  { value: 'Standard', label: 'View standard portfolios' },
  { value: 'Multi', label: 'View multi portfolios' },
  { value: 'Customized', label: 'View customized versions' },
  { value: 'Draft', label: 'View drafts' },
  { value: 'Published', label: 'View published portfolios' },
]

type SortKey = 'id' | 'name' | 'type' | 'area' | 'benchmark' | 'perf1y' | 'creator' | 'status' | 'modified' | 'tasks' | 'editedBy'
type Sort = { key: SortKey; dir: 'asc' | 'desc' }
/** Asset classes a portfolio holds, in the fixed chart order (Equity, Bonds, Alternatives, Liquidity). */
const classesOf = (e: BookEntry) => ASSET_CLASSES.filter((c) => (e.alloc[c] ?? 0) > 0).map((c) => [c, e.alloc[c] ?? 0] as [AssetClass, number])
/** The same, largest first: the first entry is the portfolio's main asset class. */
const byWeight = (e: BookEntry) => classesOf(e).sort((a, b) => b[1] - a[1])
const allocText = (e: BookEntry) => byWeight(e).map(([c, w]) => `${c} ${w}%`).join(', ')
const openTasks = (e: BookEntry) => (e.tasks ?? []).filter((t) => t.status === 'Open').length

/** Asset class cell: a mini allocation bar in the chart colours, the main class with its share, and "+n" for the rest (full split on hover). */
function AllocCell({ e }: { e: BookEntry }) {
  const main = byWeight(e)[0]
  const more = classesOf(e).length - 1
  return (
    <Tooltip content={allocText(e)}>
      <span className="flex items-center gap-2 whitespace-nowrap">
        <span role="img" aria-label={allocText(e)} className="flex h-2 w-20 shrink-0 gap-0.5 bg-surface-strong">
          {classesOf(e).map(([c, w]) => <span key={c} className="h-full" style={{ width: `${w}%`, background: CLASS_COLOR[c] }} />)}
        </span>
        {main && <span>{main[0]} <span className="tabular-nums">{main[1]}%</span></span>}
        {more > 0 && <span className="text-fg-muted">+{more}</span>}
      </span>
    </Tooltip>
  )
}

/**
 * Tasks cell: a blue count chip of Open tasks (what needs attention); deferred tasks only show as an outlined chip.
 * Hovering or clicking opens the list of every task with its status.
 */
function TaskCount({ e, onReview }: { e: BookEntry; onReview: () => void }) {
  const tasks = e.tasks ?? []
  const openN = openTasks(e)
  const deferredN = tasks.filter((t) => t.status === 'Deferred').length
  if (!openN && !deferredN) return null
  const label = openN ? `${openN} open` : `${deferredN} deferred`
  return (
    <Popover
      trigger={<PopoverTrigger openOnHover delay={150} className={cn(chip, 'cursor-pointer', openN ? 'bg-task' : 'border border-line-strong text-fg-muted')} aria-label={`${label} position task${openN + deferredN > 1 ? 's' : ''} for ${e.name}`}>{openN || deferredN}</PopoverTrigger>}
      className="w-160"
      title="Position tasks"
      description="An underlying component changed the weight of a position. Accept, reject or defer it in Simulation."
    >
      <MiniTable
        caption="Weights in %, current → new"
        heads={['Instrument', 'Underlying component', 'Status', 'In component', 'In portfolio']}
        numFrom={3}
        rows={tasks.map((t) => [<>{t.instrument}<span className="block text-fg-muted">{t.isin}</span></>, t.component, t.status, `${f2(t.inCurrent)} → ${f2(t.inNext)}`, `${f2(t.current)} → ${f2(t.next)}`])}
      />
      <div className="mt-3 flex justify-end"><Button size="sm" onClick={onReview}>Review in Simulation</Button></div>
    </Popover>
  )
}

function sortValue(e: BookEntry, k: SortKey): string | number {
  if (k === 'area') { const m = byWeight(e)[0]; return m ? `${m[0]} ${String(999 - m[1]).padStart(3, '0')}` : '' }
  if (k === 'perf1y') return e.perf1y ?? -Infinity
  if (k === 'modified') return e.modified.split('/').reverse().join('')
  if (k === 'tasks') return openTasks(e)
  return e[k]
}



/**
 * Model portfolio book, in the client book pattern: one toolbar (view, search, task filter, count, create), then a
 * dense sortable table in the original column order. Customized versions sit indented under their parent and stay
 * collapsed until asked for (the arrow opens them). Rows load while scrolling. Publishing happens from NEW inside the flow, never from this list.
 */
/** Rows loaded at first, and with each scroll to the end of the list. */
const BATCH = 10

export function BookView() {
  const { update } = usePortfolio()
  const [list] = useState(getBook)

  const [q, setQ] = useState('')
  const [view, setView] = useState('all')
  const [onlyTasks, setOnlyTasks] = useState(false)
  const [sort, setSort] = useState<Sort>({ key: 'id', dir: 'asc' })
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  // No pages: the first rows show, and more load while scrolling down. A new search, filter or sort starts again from the top.
  const [more, setMore] = useState({ key: '', n: BATCH })
  const [loading, setLoading] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const sentinel = useRef<HTMLTableRowElement>(null)

  const ql = q.trim().toLowerCase()
  const inView = (e: BookEntry) =>
    view === 'all' || (view === 'mine' ? e.creator === BOOK_USER : e.type === view || e.status === view)
  const matches = (e: BookEntry) =>
    inView(e) && (!onlyTasks || openTasks(e) > 0) && (!ql || e.name.toLowerCase().includes(ql) || e.id.includes(ql))
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
  const listKey = [q, view, onlyTasks, sort.key, sort.dir].join('|')
  const shownN = more.key === listKey ? more.n : BATCH
  const hasMore = shownN < tops.length
  // When the last row comes into view, the next batch loads (a short loading row first, as it would from the server).
  useEffect(() => {
    const el = sentinel.current
    if (!el || !hasMore || loading) return
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return
      setLoading(true)
      setTimeout(() => { setMore({ key: listKey, n: shownN + BATCH }); setLoading(false) }, 600)
    }, { root: scroller.current, rootMargin: '0px 0px 40px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [listKey, shownN, hasMore, loading])
  const rows = tops.slice(0, shownN).flatMap((t) => {
    const kids = kidsOf(t.id)
    // Collapsed by default; a search, or a parent shown only because a version matches, opens the family.
    const forced = !!ql || !ids.has(t.id)
    const isOpen = forced || expanded.has(t.id)
    return [{ e: t, kids: kids.length, context: !ids.has(t.id), forced, isOpen }, ...(isOpen ? kids.map((e) => ({ e, kids: 0, context: false, forced: false, isOpen: false })) : [])]
  })

  /** Opening a portfolio lands on its Simulation; editing a draft starts at the first step. */
  const open = (e: BookEntry, step = 'simulation') => { update((s) => openEntry(s, e)); location.hash = 'sma/' + step }
  const create = () => { update(startNew); location.hash = 'sma/data' }
  /** Row actions. A customized version can only be created from a published STANDARD portfolio. */
  const actions = (e: BookEntry) => [
    { label: 'Open', onClick: () => open(e) },
    ...(e.status === 'Draft' ? [{ label: 'Edit', onClick: () => open(e, 'data') }] : []),
    ...(e.status === 'Published' && e.type === 'Standard' ? [{ label: 'Create customized version', onClick: () => { update((s) => startCustomized(s, e)); location.hash = 'sma/data' } }] : []),
  ]

  const toggle = (id: string) => setExpanded((c) => { const n = new Set(c); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const sortBy = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  const head = (key: SortKey, label: string, className?: string, title?: string) => {
    const on = sort.key === key
    const Arrow = sort.dir === 'asc' ? ArrowUp : ArrowDown
    return (
      <th className={cn(th, className)} aria-sort={on ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined} title={title}>
        <button type="button" onClick={() => sortBy(key)} className="inline-flex cursor-pointer items-center gap-1 hover:underline">
          {label}
          {on && <Arrow className="size-3" strokeWidth={1.75} aria-hidden />}
        </button>
      </th>
    )
  }
  const shownCount = tops.length + tops.reduce((n, t) => n + kidsOf(t.id).length, 0)

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-340 flex-1 flex-col px-6">
      {/* Toolbar, as in the client book: straight on the page grey, not part of the table. The view on the left, the
          filter toggle, the count and the main action on the right. */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 py-3">
          <Select aria-label="View" value={view} onValueChange={setView} items={VIEWS} className="w-64" />
          <SearchInput value={q} onValueChange={setQ} placeholder="Find model portfolio by name or ID" aria-label="Find model portfolio" className="w-72 max-w-full" />
          <div className="ml-auto flex items-center gap-4">
            {/* A grey filled toggle, as "Filter by opportunities" in the client book; dark while it filters. */}
            <Button aria-pressed={onlyTasks} onClick={() => setOnlyTasks(!onlyTasks)} className={cn('border-line-strong bg-surface-strong hover:bg-line-strong', onlyTasks && 'border-fg-secondary bg-fg-secondary text-fg-inverse hover:bg-fg')}>
              Filter by open tasks
            </Button>
            <span className="text-sm whitespace-nowrap" aria-live="polite">Showing {shownCount} of {list.length} portfolios</span>
            <Button variant="primary" onClick={create}>Create new model portfolio</Button>
          </div>
      </div>

      {/* The table: its own white card, apart from the toolbar and the page grey around it. */}
      <div className="mb-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border border-line-strong bg-surface">
        <div ref={scroller} className="min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {head('id', 'Code', 'pl-4')}{head('name', 'Model portfolio name')}{head('tasks', 'Tasks', 'text-center')}{head('type', 'Type')}
                {head('area', 'Asset allocation')}{head('benchmark', 'Benchmark')}
                {head('perf1y', 'Performance % (1Y)', 'text-right', `Performance as of ${BOOK_AS_OF}`)}
                {head('creator', 'Creator')}{head('status', 'Current status')}{head('editedBy', 'Last edited')}{head('modified', 'Last modified date')}
                <th className={cn(th, 'pr-4 text-right')}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ e, kids, context, forced, isOpen }) => (
                <tr key={e.id} className={cn('hover:bg-surface-subtle', e.parent && 'bg-surface-subtle hover:bg-surface-muted', context && 'text-fg-muted')}>
                  <td className={cn(td, 'pl-4 whitespace-nowrap tabular-nums')}>MP_{e.id}</td>
                  <td className={td}>
                    {/* Customized versions sit indented under their parent; the arrow opens or closes them. */}
                    <div className={cn('flex items-center gap-1', e.parent && 'pl-6')}>
                      {kids > 0 && !forced ? (
                        <Button variant="ghost" size="icon-sm" aria-expanded={isOpen} aria-label={`${isOpen ? 'Hide' : 'Show'} ${kids} customized versions of ${e.name}`} onClick={() => toggle(e.id)}>
                          {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                        </Button>
                      ) : !e.parent && <span className="w-5.5 shrink-0" />}
                      <span className="flex min-w-0 flex-col">
                        <a href="#sma/simulation" onClick={(ev) => { ev.preventDefault(); open(e) }} className="w-fit text-link hover:text-link-hover hover:underline">{e.name}</a>
                        {/* Automatic parent update: information, not a task (no chip, no action, no status of its own). */}
                        {e.auto && <span className="text-fg-muted">{AUTO_LINE[e.auto]}</span>}
                      </span>
                    </div>
                  </td>
                  <td className={cn(td, 'text-center')}><TaskCount e={e} onReview={() => open(e)} /></td>
                  <td className={td}><span className={cn(chip, TYPE_CHIP[e.type])}>{e.type}</span></td>
                  <td className={td}><AllocCell e={e} /></td>
                  <td className={td}>{e.benchmark}</td>
                  <td className={cn(td, 'text-right tabular-nums', e.perf1y === undefined ? '' : e.perf1y < 0 ? 'text-error' : 'text-link')}>
                    {e.perf1y === undefined ? <span className="text-fg-subtle" title="No performance yet">—</span> : (e.perf1y < 0 ? '−' : '') + Math.abs(e.perf1y).toFixed(2)}
                  </td>
                  <td className={cn(td, 'whitespace-nowrap')}>{e.creator}</td>
                  <td className={td}>{e.status}</td>
                  <td className={cn(td, 'whitespace-nowrap')}>{e.editedBy}</td>
                  <td className={cn(td, 'whitespace-nowrap tabular-nums')}>{e.modified}</td>
                  <td className={cn(td, 'pr-4 text-right')}>
                    <Menu
                      trigger={<MenuTrigger render={<Button variant="ghost" size="icon-sm" className="w-7 text-link hover:text-link-hover" aria-label={`Actions for ${e.name}`} />}><MoreHorizontal className="size-4" strokeWidth={2.5} /></MenuTrigger>}
                      items={actions(e)}
                    />
                  </td>
                </tr>
              ))}
              {hasMore && (
                <tr ref={sentinel}>
                  <td colSpan={12} className={cn(td, 'px-4 py-3 text-fg-muted')}>
                    <span className="inline-flex items-center gap-2">{loading && <LoaderCircle className="size-3.5 animate-spin" strokeWidth={1.75} aria-hidden />}{loading ? 'Loading more model portfolios…' : `${tops.length - shownN} more model portfolios`}</span>
                  </td>
                </tr>
              )}
              {!rows.length && (
                <tr><td colSpan={12} className={cn(td, 'px-4 py-4 text-fg-subtle')}>No model portfolio matches the view and search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
