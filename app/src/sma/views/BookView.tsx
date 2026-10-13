import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, LoaderCircle, MoreHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../components/ui/button'
import { SearchInput } from '../components/ui/input'
import { Menu, MenuTrigger } from '../components/ui/menu'
import { Popover, PopoverTrigger } from '../components/ui/popover'
import { Tab, TabCount, Tabs, TabsList } from '../components/ui/tabs'
import { ASSET_CLASSES, BOOK_AS_OF, type AssetClass, type BookEntry } from '../data/data'
import { cn } from '../lib/cn'
import { getBook } from '../state/book'
import { f2, openEntry, startCustomized, startNew, usePortfolio, type Alloc } from '../state/portfolio'
import { MiniTable } from './ComponentDetail'
import { Donut, Swatch } from './Overview'

/** Client book table: dark 12px header labels on a light grey band, compact rows with hairline dividers, links in blue. */
const th = 'sticky top-0 z-2 border-b border-line bg-shell-band px-1.5 py-2 text-left font-normal whitespace-nowrap text-fg'
const td = 'border-b border-line px-1.5 py-1.5 align-middle'
/** Small filled count chip (tasks, customized versions), as the counts in the client book. */
const chip = 'inline-flex h-4.5 min-w-6 items-center justify-center rounded-xs px-1.5 text-xs tabular-nums'
/** Portfolio type in the green chip family of the client book's opportunities: light = Standard, dark = Multi, outline = Customized. */
const TYPE_CHIP: Record<BookEntry['type'], string> = {
  Standard: 'bg-status-published',
  Multi: 'bg-tag-green-strong text-fg-inverse',
  Customized: 'border border-tag-green-strong text-tag-green-strong',
}
/** Type tabs above the table. */
const TYPE_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Customized', label: 'Customized' },
  { value: 'Multi', label: 'Multi' },
]

type SortKey = 'id' | 'name' | 'type' | 'area' | 'benchmark' | 'perf1y' | 'creator' | 'status' | 'modified' | 'tasks' | 'editedBy'
type Sort = { key: SortKey; dir: 'asc' | 'desc' }
/** Asset classes a portfolio holds, in the fixed chart order (Equity, Bonds, Alternatives, Liquidity). */
const classesOf = (e: BookEntry) => ASSET_CLASSES.filter((c) => (e.alloc[c] ?? 0) > 0).map((c) => [c, e.alloc[c] ?? 0] as [AssetClass, number])
/** The same, largest first: the first entry is the portfolio's main asset class. */
const byWeight = (e: BookEntry) => classesOf(e).sort((a, b) => b[1] - a[1])
const allocText = (e: BookEntry) => byWeight(e).map(([c, w]) => `${c} ${w}%`).join(', ')
const openTasks = (e: BookEntry) => (e.tasks ?? []).filter((t) => t.status === 'Open').length

/**
 * Asset allocation cell: the two largest asset classes with their weights, then "+N more" when there are others.
 * Hovering (or clicking) opens the same donut and table as the portfolio pages.
 */
function AllocCell({ e }: { e: BookEntry }) {
  const top = byWeight(e)
  const shown = top.slice(0, 2)
  const more = top.length - shown.length
  const alloc = { Equity: 0, Bonds: 0, Alternatives: 0, Liquidity: 0, ...e.alloc } as Alloc
  return (
    <Popover
      className="w-auto"
      title="Asset allocation"
      trigger={
        <PopoverTrigger openOnHover delay={150} aria-label={`Asset allocation of ${e.name}: ${allocText(e)}`} className="cursor-pointer text-left whitespace-nowrap">
          {shown.map(([c, w], i) => <span key={c}>{i > 0 && <span className="text-fg-subtle"> · </span>}{c} <span className="tabular-nums">{w}%</span></span>)}
          {more > 0 && <span className="ml-1.5 text-link hover:underline">+{more} more</span>}
        </PopoverTrigger>
      }
    >
      <div className="flex items-center gap-6 text-xs">
        <Donut alloc={alloc} label={e.name} />
        <table className="border-collapse">
          <tbody>
            {ASSET_CLASSES.map((c) => (
              <tr key={c} className="border-t border-line first:border-t-0">
                <td className="py-0.75 pr-6 whitespace-nowrap"><Swatch cls={c} />{c}</td>
                <td className="py-0.75 text-right font-semibold tabular-nums">{e.alloc[c] ?? 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Popover>
  )
}

/**
 * Tasks cell: an amber count chip of Open tasks (what needs attention, in the client book's alert yellow); deferred tasks only show as an outlined chip.
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
      trigger={<PopoverTrigger openOnHover delay={150} className={cn(chip, 'cursor-pointer', openN ? 'bg-tag-yellow-strong' : 'border border-line-strong text-fg-muted')} aria-label={`${label} position task${openN + deferredN > 1 ? 's' : ''} for ${e.name}`}>{openN || deferredN}</PopoverTrigger>}
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
 * Model portfolio book, in the client book pattern: search in the header, a toolbar band (type tabs, count, create), then a
 * dense sortable table in the original column order. Customized versions sit indented under their parent, on a grey
 * row, open by default (the arrow folds them away). Rows load while scrolling. Publishing happens from NEW inside the flow, never from this list.
 */
/** Rows loaded at first, and with each scroll to the end of the list. */
const BATCH = 10

export function BookView() {
  const { update } = usePortfolio()
  const [list] = useState(getBook)

  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  // The search lives in the header's top-right slot (rendered by the app shell).
  const [searchSlot, setSearchSlot] = useState<HTMLElement | null>(null)
  useEffect(() => setSearchSlot(document.getElementById('header-search')), [])
  const [sort, setSort] = useState<Sort>({ key: 'id', dir: 'asc' })
  // Customized versions are shown under their parent by default; the arrow folds a family away.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  // No pages: the first rows show, and more load while scrolling down. A new search, filter or sort starts again from the top.
  const [more, setMore] = useState({ key: '', n: BATCH })
  const [loading, setLoading] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const sentinel = useRef<HTMLTableRowElement>(null)

  const ql = q.trim().toLowerCase()
  const matches = (e: BookEntry) =>
    (type === 'all' || e.type === type) && (!ql || e.name.toLowerCase().includes(ql) || e.id.includes(ql))
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
  const listKey = [q, type, sort.key, sort.dir].join('|')
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
    // Open by default; a search, or a parent shown only because a version matches, always opens the family.
    const forced = !!ql || !ids.has(t.id)
    const isOpen = forced || !collapsed.has(t.id)
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

  const toggle = (id: string) => setCollapsed((c) => { const n = new Set(c); if (n.has(id)) n.delete(id); else n.add(id); return n })
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
    <main className="flex min-h-0 w-full flex-1 flex-col">
      {searchSlot && createPortal(
        <SearchInput value={q} onValueChange={setQ} placeholder="Find model portfolio by name or code" aria-label="Find model portfolio" className="h-7 w-64 text-xs" />,
        searchSlot,
      )}
      {/* Toolbar band, as in the client book: the type tabs on the left, the count and the main action on the right. */}
      <div className="flex shrink-0 flex-wrap items-end gap-x-3 gap-y-2 border-b border-line bg-shell-band px-4 pt-1.5">
        <Tabs value={type} onValueChange={setType}>
          <TabsList variant="sub" aria-label="Portfolio type">
            {TYPE_TABS.map((t) => (
              <Tab key={t.value} value={t.value} className="pt-1.5 text-xs">{t.label} <TabCount>{t.value === 'all' ? list.length : list.filter((e) => e.type === t.value).length}</TabCount></Tab>
            ))}
          </TabsList>
        </Tabs>
        {/* The count shares the tab labels' baseline; the button keeps some air above and below. */}
        <div className="ml-auto flex items-end gap-5 text-xs">
          <span className="pb-2 whitespace-nowrap" aria-live="polite">Showing {shownCount} of {list.length} portfolios</span>
          <Button variant="primary" size="sm" onClick={create} className="mb-1.5 text-xs">Create new model portfolio</Button>
        </div>
      </div>

      {/* The table: white rows under a grey header band, inset in the page's lightest grey. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pt-3">
        <div ref={scroller} className="min-h-0 flex-1 overflow-auto border-x border-t border-line bg-surface">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className={cn(th, 'w-8 px-0')}><span className="sr-only">Customized versions</span></th>{head('id', 'Code', 'pl-1')}{head('name', 'Model portfolio name')}{head('tasks', 'Tasks', 'text-center')}{head('type', 'Type')}
                {head('area', 'Asset allocation')}{head('benchmark', 'Benchmark')}
                {head('perf1y', 'Perf. 1Y %', 'text-right', `Performance % over one year, as of ${BOOK_AS_OF}`)}
                {head('creator', 'Creator')}{head('status', 'Current status')}{head('editedBy', 'Last modified by')}{head('modified', 'Last modified date')}
                <th className={cn(th, 'pr-4 text-right')}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ e, kids, context, forced, isOpen }) => (
                <tr key={e.id} className={cn('hover:bg-surface-subtle', e.parent && 'bg-shell-band hover:bg-surface-muted', context && 'text-fg-muted')}>
                  {/* Its own narrow column, so names line up with their header; a parent's arrow folds its customized versions. */}
                  <td className={cn(td, 'px-0 pl-2')}>
                    {kids > 0 && !forced && (
                      <Button variant="ghost" size="icon-sm" aria-expanded={isOpen} aria-label={`${isOpen ? 'Hide' : 'Show'} ${kids} customized versions of ${e.name}`} onClick={() => toggle(e.id)}>
                        {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                      </Button>
                    )}
                  </td>
                  <td className={cn(td, 'pl-1 whitespace-nowrap tabular-nums')}>MP_{e.id}</td>
                  <td className={cn(td, e.parent && 'pl-6')}>
                    {/* Customized versions sit indented under their parent. */}
                    <a href="#sma/simulation" onClick={(ev) => { ev.preventDefault(); open(e) }} className="whitespace-nowrap text-link hover:text-link-hover hover:underline">{e.name}</a>
                  </td>
                  <td className={cn(td, 'text-center')}><TaskCount e={e} onReview={() => open(e)} /></td>
                  <td className={td}><span className={cn(chip, TYPE_CHIP[e.type])}>{e.type}</span></td>
                  <td className={td}><AllocCell e={e} /></td>
                  <td className={cn(td, 'min-w-36')}>{e.benchmark}</td>
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
                  <td colSpan={13} className={cn(td, 'px-4 py-3 text-fg-muted')}>
                    <span className="inline-flex items-center gap-2">{loading && <LoaderCircle className="size-3.5 animate-spin" strokeWidth={1.75} aria-hidden />}{loading ? 'Loading more model portfolios…' : `${tops.length - shownN} more model portfolios`}</span>
                  </td>
                </tr>
              )}
              {!rows.length && (
                <tr><td colSpan={13} className={cn(td, 'px-4 py-4 text-fg-subtle')}>No model portfolio matches the view and search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
