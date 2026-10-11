import { Tooltip } from '@base-ui/react/tooltip'
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui/button'
import { SearchInput } from '../components/ui/input'
import { Section } from '../components/ui/layout'
import { Menu, MenuTrigger } from '../components/ui/menu'
import { Popover, PopoverTrigger } from '../components/ui/popover'
import { Select } from '../components/ui/select'
import { Checkbox } from '../components/ui/selection'
import { TooltipPopup } from '../components/ui/tag'
import { Tab, TabCount, Tabs, TabsList } from '../components/ui/tabs'
import { ASSET_CLASSES, BOOK_AS_OF, BOOK_STATUSES, BOOK_USER, CLASS_COLOR, type AssetClass, type BookEntry, type BookStatus } from '../data/data'
import { cn } from '../lib/cn'
import { getBook, setBook } from '../state/book'
import { f2, usePortfolio } from '../state/portfolio'
import { MiniTable } from './ComponentDetail'
import { Swatch } from './Overview'

/** Same table look as the Simulation positions table: muted sticky header, 12px rows, hairline dividers. */
const th = 'sticky top-0 z-2 border-b border-line bg-surface-subtle px-2.5 py-2 text-left font-normal whitespace-nowrap text-fg-muted'
const td = 'border-b border-line px-2.5 py-1.5 align-middle'
const tagBase = 'inline-block rounded-xs px-1.5 text-xs/4.5 whitespace-nowrap'
/** Portfolio type reads at a glance: grey fill = Standard, lavender fill = Multi, outline = Customized. */
const TYPE_TAG: Record<BookEntry['type'], string> = {
  Standard: 'bg-surface-strong',
  Multi: 'bg-type-multi',
  Customized: 'border border-control',
}
/** Status tags: green = Published, yellow = Draft. The label is always printed. */
const STATUS_TAG: Record<BookStatus, string> = {
  Published: 'bg-status-published text-fg',
  Draft: 'bg-status-draft text-fg',
}
const TYPES: BookEntry['type'][] = ['Standard', 'Multi', 'Customized']

type SortKey = 'id' | 'name' | 'type' | 'area' | 'benchmark' | 'perf1y' | 'creator' | 'status' | 'modified'
type Sort = { key: SortKey; dir: 'asc' | 'desc' }
/** Asset classes a portfolio holds, in the fixed chart order (Equity, Bonds, Alternatives, Liquidity). */
const classesOf = (e: BookEntry) => ASSET_CLASSES.filter((c) => (e.alloc[c] ?? 0) > 0).map((c) => [c, e.alloc[c] ?? 0] as [AssetClass, number])
/** The same, largest first: the first entry is the portfolio's main asset class. */
const byWeight = (e: BookEntry) => classesOf(e).sort((a, b) => b[1] - a[1])
const allocText = (e: BookEntry) => byWeight(e).map(([c, w]) => `${c} ${w}%`).join(', ')

/** Asset class cell: a mini allocation bar in the chart colours, the main class with its share, and "+n" for the rest (full split on hover). */
function AllocCell({ e }: { e: BookEntry }) {
  const main = byWeight(e)[0]
  const more = classesOf(e).length - 1
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={<span />} className="flex items-center gap-2 whitespace-nowrap">
        <span role="img" aria-label={allocText(e)} className="flex h-2 w-20 shrink-0 gap-0.5 bg-surface-strong">
          {classesOf(e).map(([c, w]) => <span key={c} className="h-full" style={{ width: `${w}%`, background: CLASS_COLOR[c] }} />)}
        </span>
        {main && <span>{main[0]} <span className="tabular-nums">{main[1]}%</span></span>}
        {more > 0 && <span className="text-fg-muted">+{more}</span>}
      </Tooltip.Trigger>
      <TooltipPopup>{allocText(e)}</TooltipPopup>
    </Tooltip.Root>
  )
}

/**
 * Tasks cell. The blue tag counts Open tasks only (they are what needs attention); deferred tasks stay reachable
 * through a quiet outlined tag; accepted and rejected ones show nothing. The panel lists every task with its status.
 */
function TaskTag({ e, onReview }: { e: BookEntry; onReview: () => void }) {
  const tasks = e.tasks ?? []
  const openN = tasks.filter((t) => t.status === 'Open').length
  const deferredN = tasks.filter((t) => t.status === 'Deferred').length
  if (!openN && !deferredN) return null
  const label = openN ? `${openN} open` : `${deferredN} deferred`
  return (
    <Popover
      trigger={<PopoverTrigger openOnHover delay={150} className={cn(tagBase, 'cursor-pointer hover:underline', openN ? 'bg-task' : 'border border-line-strong text-fg-muted')} aria-label={`${label} position task${openN + deferredN > 1 ? 's' : ''} for ${e.name}`}>{label}</PopoverTrigger>}
      title="Position tasks"
      description="An underlying component changed the weight of a position. Accept, reject or defer it in Simulation."
    >
      <MiniTable
        caption="New position weight in underlying component"
        heads={['Instrument', 'Underlying component', 'Status', 'Current weight %', 'New weight %']}
        numFrom={3}
        rows={tasks.map((t) => [<>{t.instrument}<span className="block text-fg-muted">{t.isin}</span></>, t.component, t.status, f2(t.current), f2(t.next)])}
      />
      <div className="mt-3 flex justify-end"><Button size="sm" onClick={onReview}>Review in Simulation</Button></div>
    </Popover>
  )
}

function sortValue(e: BookEntry, k: SortKey): string | number {
  if (k === 'area') { const m = byWeight(e)[0]; return m ? `${m[0]} ${String(999 - m[1]).padStart(3, '0')}` : '' }
  if (k === 'perf1y') return e.perf1y ?? -Infinity
  if (k === 'modified') return e.modified.split('/').reverse().join('')
  return e[k]
}

const today = () => new Date().toLocaleDateString('en-GB')
const nextId = (l: BookEntry[]) => String(Math.max(0, ...l.map((e) => Number(e.id) || 0)) + 1).padStart(3, '0')
const uniq = (v: string[]) => [...new Set(v)].sort()


/**
 * Model portfolio book: the landing list of every model portfolio.
 * Type tabs + filters + search narrow it; column headers sort it; customized versions sit under their parent
 * and stay collapsed until asked for, so a portfolio with many versions is still one row. Publishing happens from NEW inside the flow, never from this list.
 */
export function BookView() {
  const { update } = usePortfolio()
  const [list, setListState] = useState(getBook)
  const setList = (fn: (l: BookEntry[]) => BookEntry[]) => setListState((l) => setBook(fn(l)))

  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [area, setArea] = useState('all')
  const [creator, setCreator] = useState('all')
  const [sort, setSort] = useState<Sort>({ key: 'id', dir: 'asc' })
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [size, setSize] = useState('10')
  const [page, setPage] = useState(0)

  const ql = q.trim().toLowerCase()
  const filtered = status !== 'all' || area !== 'all' || creator !== 'all'
  const matches = (e: BookEntry) =>
    (type === 'all' || e.type === type) && (status === 'all' || e.status === status) && (area === 'all' || (e.alloc[area as AssetClass] ?? 0) > 0) &&
    (creator === 'all' || e.creator === creator) &&
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
    // Collapsed by default; a search, or a parent shown only because a version matches, opens the family.
    const forced = !!ql || !ids.has(t.id)
    const isOpen = forced || expanded.has(t.id)
    return [{ e: t, kids: kids.length, context: !ids.has(t.id), forced, isOpen }, ...(isOpen ? kids.map((e) => ({ e, kids: 0, context: false, forced: false, isOpen: false })) : [])]
  })

  /** Opening a portfolio lands on its Simulation; editing a draft starts at the first step. */
  const open = (e: BookEntry, step = 'simulation') => { update((s) => {
      s.data.name = e.name
      s.data.code = 'MP_' + e.id
      const task = e.tasks?.[0] ?? null
      s.book = { id: e.id, task }
      s.sim.mode = 'new'
      // The task proposes a change; start from the current weight each time the portfolio is opened.
      if (task) {
        const r = s.sim.rows.find((x) => x.id === task.rowId)
        if (r) r.nw = task.status === 'Accepted' ? task.next : r.w
      }
    })
    location.hash = step
  }
  const create = () => { update((s) => { s.data.name = ''; s.data.code = ''; s.data.description = ''; s.data.ccy = 'EUR'; s.data.benchmark = ''; s.comps = { added: [], inst: [], cash: [{ ccy: 'EUR', w: 0 }] }; s.weights = {}; s.book = { id: '', task: null } }); location.hash = 'data' }
  const add = (src: BookEntry, change: Partial<BookEntry>) =>
    setList((l) => {
      const copy: BookEntry = { ...src, tasks: undefined, perf1y: undefined, ...change, id: nextId(l), status: 'Draft', creator: BOOK_USER, editedBy: BOOK_USER, modified: today() }
      const at = l.findIndex((e) => e.id === src.id)
      return [...l.slice(0, at + 1), copy, ...l.slice(at + 1)]
    })
  /** Row actions. A customized version can only be created from a published STANDARD portfolio. */
  const actions = (e: BookEntry) => [
    { label: 'Open', onClick: () => open(e) },
    ...(e.status === 'Draft' ? [{ label: 'Edit', onClick: () => open(e, 'data') }] : []),
    ...(e.status === 'Published' && e.type === 'Standard' ? [{ label: 'Create customized version', onClick: () => add(e, { name: e.name + ' – customized', type: 'Customized', parent: e.id }) }] : []),
  ]

  const toggle = (id: string) => setExpanded((c) => { const n = new Set(c); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const sortBy = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  const clear = () => { setStatus('all'); setArea('all'); setCreator('all') }


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
      <div className="my-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border border-line-strong bg-surface">
        <Section
          title="Model portfolio book"
          description="All model portfolios and their customized versions."
          actions={<Button variant="primary" onClick={create}>Create new model portfolio</Button>}
          className="pb-0"
        >
          {/* Filters, type tabs and paging use the table's own 12px text, so the controls do not outweigh the list they filter. */}
          <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2">
            <SearchInput value={q} onValueChange={setQ} placeholder="Find model portfolio by name or ID…" aria-label="Find model portfolio" className="h-7 w-75 max-w-full text-xs" />
            <Select aria-label="Status" value={status} onValueChange={setStatus} items={options('All statuses', BOOK_STATUSES)} className="h-7 w-36 text-xs" />
            <Select aria-label="Asset class" value={area} onValueChange={setArea} items={options('All asset classes', ASSET_CLASSES.filter((c) => list.some((e) => (e.alloc[c] ?? 0) > 0)))} className="h-7 w-40 text-xs" />
            <Select aria-label="Created by" value={creator} onValueChange={setCreator} items={options('All creators', uniq(list.map((e) => e.creator)))} className="h-7 w-36 text-xs" />
            <label className="ml-2 flex cursor-pointer items-center gap-2 text-xs">
              {/* A shortcut for the creator filter: ticking it selects the signed-in user there, so the two can never disagree. */}
              <Checkbox checked={creator === BOOK_USER} onCheckedChange={(v) => setCreator(v ? BOOK_USER : 'all')} />
              My portfolios
            </label>
            {filtered && <Button variant="link" className="ml-2 text-xs" onClick={clear}>Clear filters</Button>}
          </div>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <Tabs value={type} onValueChange={(v) => { setType(v as string); setPage(0) }}>
              <TabsList variant="sub" aria-label="Portfolio type">
                <Tab value="all" className="text-xs">All types <TabCount>{list.length}</TabCount></Tab>
                {TYPES.map((t) => <Tab key={t} value={t} className="text-xs">{t} <TabCount>{list.filter((e) => e.type === t).length}</TabCount></Tab>)}
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
                {head('area', 'Asset allocation')}{head('benchmark', 'Benchmark')}{head('perf1y', 'Performance % (1Y)', 'text-right')}
                {head('creator', 'Created by')}{head('status', 'Status')}{head('modified', 'Last modified')}
                <th className={cn(th, 'pr-6')}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ e, kids, context, forced, isOpen }) => (
                <tr key={e.id} className={cn('hover:bg-surface-subtle', e.parent && 'bg-surface-subtle hover:bg-surface-muted', context && 'text-fg-muted')}>
                  <td className={cn(td, 'pl-6 text-fg-muted tabular-nums')}>{e.id}</td>
                  <td className={td}>
                    <div className={cn('flex items-center gap-1.5', e.parent && 'pl-5.5')}>
                      {kids > 0 && !forced ? (
                        <Button variant="ghost" size="icon-sm" aria-expanded={isOpen} aria-label={`${isOpen ? 'Hide' : 'Show'} customized versions of ${e.name}`} onClick={() => toggle(e.id)}>
                          {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                        </Button>
                      ) : <span className="w-5.5 shrink-0" />}
                      <a href="#simulation" onClick={(ev) => { ev.preventDefault(); open(e) }} className="text-link hover:text-link-hover hover:underline">{e.name}</a>
                      {kids > 0 && <span className="whitespace-nowrap text-fg-muted">{kids} customized</span>}
                    </div>
                  </td>
                  <td className={td}><span className={cn(tagBase, TYPE_TAG[e.type])}>{e.type}</span></td>
                  <td className={td}>
                    <TaskTag e={e} onReview={() => open(e)} />
                  </td>
                  <td className={td}><AllocCell e={e} /></td>
                  <td className={td}>{e.benchmark}</td>
                  <td className={cn(td, 'text-right tabular-nums', e.perf1y !== undefined && e.perf1y < 0 && 'text-error')}>
                    {e.perf1y === undefined ? <span className="text-fg-subtle" title="No performance yet">—</span> : (e.perf1y < 0 ? '−' : '') + Math.abs(e.perf1y).toFixed(2)}
                  </td>
                  <td className={cn(td, 'whitespace-nowrap')}>{e.creator}</td>
                  <td className={td}>
                    <span className={cn(tagBase, STATUS_TAG[e.status])}>{e.status}</span>
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
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-fg-muted">
            <span>{ASSET_CLASSES.map((c) => <span key={c} className="mr-3 whitespace-nowrap"><Swatch cls={c} />{c}</span>)}</span>
            <span>Performance as of {BOOK_AS_OF}.</span>
          </span>
          <div className="flex items-center gap-2.5">
            <span className="text-fg-muted">Rows per page</span>
            <Select aria-label="Rows per page" value={size} onValueChange={(v) => { setSize(v); setPage(0) }} items={['10', '25', '50'].map((v) => ({ value: v, label: v }))} className="h-7 w-18 text-xs" />
            <span className="tabular-nums">Page {p + 1} of {pages}</span>
            <Button size="xs" disabled={p === 0} onClick={() => setPage(p - 1)}>Previous</Button>
            <Button size="xs" disabled={p >= pages - 1} onClick={() => setPage(p + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </main>
  )
}
