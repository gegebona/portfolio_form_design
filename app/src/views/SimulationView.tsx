import { ChevronDown, ChevronRight, Info, MoreHorizontal, TriangleAlert } from 'lucide-react'
import { addTransitionType, Fragment, startTransition, useState, ViewTransition, type ReactNode } from 'react'
import { Button } from '../components/ui/button'
import { Section } from '../components/ui/layout'
import { Menu, MenuTrigger } from '../components/ui/menu'
import { Popover, PopoverTrigger } from '../components/ui/popover'
import { Radio, RadioGroup, Switch } from '../components/ui/selection'
import { Tab, Tabs, TabsList } from '../components/ui/tabs'
import { ConflictNote } from '../components/ui/tag'
import { WeightField } from '../components/ui/weight'
import { ASSET_CLASSES, BOOK_USER, CLASS_COLOR, type AssetClass } from '../data/data'
import { cn } from '../lib/cn'
import { setBookTaskStatus } from '../state/book'
import { f2, near100, round2, simAlloc, usePortfolio, type SimRow } from '../state/portfolio'
import { Overview, Swatch } from './Overview'

type Mode = 'current' | 'new'
type View = 'instrument' | 'class' | 'block' | 'exposure'
const VIEWS: [View, string][] = [['instrument', 'Instrument view'], ['class', 'Asset class view'], ['block', 'Building block view'], ['exposure', 'Exposure view']]

export function SimulationView() {
  const { state, update } = usePortfolio()
  // Kept in the flow state (not local) so the action bar knows which version is on screen: only New can be saved as a draft.
  const mode = state.sim.mode
  const setMode = (m: Mode) => update((s) => { s.sim.mode = m })
  const [view, setView] = useState<View>('instrument')
  // Compact by default: the strip is context, the tables below are the work. Full view is one click away.
  const [compact, setCompact] = useState(true)
  const [showZero, setShowZero] = useState(false)
  const rows = state.sim.rows
  // Changing view or version swaps the table in a transition tagged 'positions' (see the table boundary below).
  const switchTable = (fn: () => void) => startTransition(() => { addTransitionType('positions'); fn() })
  const cur = mode === 'current'
  const changes = rows.filter((r) => r.removed || Math.abs(r.nw - r.w) >= 0.005).length
  const total = cur ? rows.reduce((s, r) => s + r.w, 0) : rows.filter((r) => !r.removed).reduce((s, r) => s + r.nw, 0)

  const redistribute = () => update((s) => {
    const act = s.sim.rows.filter((r) => !r.removed)
    const t = act.reduce((x, r) => x + r.nw, 0)
    if (t <= 0) return
    act.forEach((r) => { r.nw = Math.round((r.nw * 10000) / t) / 100 })
    const diff = round2(100 - act.reduce((x, r) => x + r.nw, 0))
    if (diff) { const big = [...act].sort((a, b) => b.nw - a.nw)[0]; big.nw = round2(big.nw + diff) }
  })

  return (
    <Section
      screenHeading
      title="Simulation"
      description="Compare the current portfolio with the new allocation and fine-tune position weights."
      className="flex min-h-0 flex-1 flex-col"
    >
      {/* Version bar: Current / New switch the whole screen; the overview toggle sits right next to them. */}
      <div className="mt-3.5 flex flex-wrap items-end gap-x-7 gap-y-2 border-b border-line">
        <Tabs value={mode} onValueChange={(v) => switchTable(() => setMode(v as Mode))} className="pb-2.5">
          <TabsList variant="segment" aria-label="Portfolio version">
            <Tab value="current">Current</Tab>
            <Tab value="new">New {changes > 0 && <span className="text-xs font-normal opacity-80">{changes} {changes === 1 ? 'change' : 'changes'}</span>}</Tab>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-5 pb-1.25 before:h-4 before:w-px before:bg-line-strong">
          <Button variant="link" aria-pressed={compact} onClick={() => setCompact(!compact)}>{compact ? 'Full view' : 'Compact view'}</Button>
        </div>
        {!cur && (
          <div className="ml-auto flex items-center gap-1.5 pb-2.5 text-xs text-fg-muted">
            <Info className="size-3.5" strokeWidth={1.5} />
            Working version — changes stay here until you publish.
          </div>
        )}
        {cur && (
          <div className="ml-auto flex items-center gap-1.5 pb-2.5 text-xs text-fg-muted">
            <Info className="size-3.5" strokeWidth={1.5} />
            Read-only — the portfolio as it is today.
            <Button variant="link" className="text-xs" onClick={() => switchTable(() => setMode('new'))}>Switch to New</Button>
          </div>
        )}
      </div>
      <Overview rows={[{ label: 'Current', alloc: simAlloc(state, 'current') }, { label: 'New', alloc: simAlloc(state, 'new') }]} focus={cur ? 0 : 1} showChange compact={compact} />

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-line">
          <Tabs value={view} onValueChange={(v) => switchTable(() => setView(v as View))}>
            <TabsList variant="sub" aria-label="Positions view">
              {VIEWS.map(([v, l]) => <Tab key={v} value={v}>{l}</Tab>)}
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-4.5 pb-1.5">
            {!cur && <Button size="md" onClick={() => { location.hash = 'components' }}>+ Add component</Button>}
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
              <Switch checked={showZero} onCheckedChange={setShowZero} />
              Show zero-weighted positions
            </label>
          </div>
        </div>
        {/* The scrolling container is the boundary (its picture stays clipped): the old table fades out, the new one fades in. */}
        <ViewTransition update={{ positions: 'table-swap', default: 'none' }} default="none">
        <div className="min-h-0 flex-1 overflow-auto">
          {view === 'instrument' ? <InstrumentTable mode={mode} showZero={showZero} />
            : <GroupTable key={view} mode={mode} showZero={showZero} order={view === 'class' ? ASSET_CLASSES : undefined}
                keyOf={view === 'class' ? (r) => r.cls : view === 'block' ? (r) => (r.bb !== '—' ? r.bb : r.cls === 'Liquidity' ? 'Cash' : 'Single instruments') : (r) => r.ccy} />}
        </div>
        </ViewTransition>
        <div className="flex shrink-0 items-center justify-end gap-4 border-t border-line-strong px-2.5 pt-2.5">
          <span className="text-fg-muted">{cur ? 'Total weight' : 'Total new weight'}</span>
          <strong className={cn('text-lg font-semibold tabular-nums', !near100(total) && 'text-error')}>{f2(total)}%</strong>
          {!cur && <Button disabled={near100(total)} onClick={redistribute}>Redistribute to 100%</Button>}
        </div>
      </div>
    </Section>
  )
}

const th = 'sticky top-0 z-2 border-b border-line bg-surface-subtle px-2.5 py-2 text-left font-normal whitespace-nowrap text-fg-muted'

const td = 'border-b border-line px-2.5 py-1.5 align-middle'

type Method = 'equal' | 'proportional' | 'cash'
const METHODS: { id: Method; label: string; help: string }[] = [
  { id: 'equal', label: 'Equal', help: 'The same share to each remaining position.' },
  { id: 'proportional', label: 'Proportional', help: "In proportion to each remaining position's current weight." },
  { id: 'cash', label: 'Cash', help: 'All of it to the cash position.' },
]

/**
 * Where the weight of a removed position would go. Returns the amount per receiving position (2 decimals, summing to
 * exactly the released weight), or add = null with the limitation that makes the method impossible. Nothing is applied here.
 */
function redistribution(all: SimRow[], id: string, method: Method) {
  const amount = all.find((r) => r.id === id)?.nw ?? 0
  const others = all.filter((r) => !r.removed && r.id !== id)
  const targets = method === 'cash' ? others.filter((r) => r.cls === 'Liquidity').slice(0, 1) : others.filter((r) => r.nw > 0)
  if (!targets.length) return { amount, targets, add: null, why: method === 'cash' ? 'the rule that a cash position must exist' : 'the rule that weight only goes to positions already held' }
  const base = targets.reduce((t, r) => t + r.nw, 0)
  const add = new Map<string, number>()
  targets.forEach((r) => add.set(r.id, round2(method === 'proportional' ? (amount * r.nw) / base : amount / targets.length)))
  // Rounding leftovers go to the largest receiver so the total stays exact.
  const big = [...targets].sort((a, b) => b.nw - a.nw)[0]
  add.set(big.id, round2((add.get(big.id) ?? 0) + amount - [...add.values()].reduce((t, v) => t + v, 0)))
  return { amount, targets, add, why: '' }
}

function InstrumentTable({ mode, showZero }: { mode: Mode; showZero: boolean }) {
  // The position being removed and the redistribution method picked for it (the panel opens under its row).
  const [removing, setRemoving] = useState<{ id: string; method: Method } | null>(null)
  const [onlyWarnings, setOnlyWarnings] = useState(false)
  const { state, update } = usePortfolio()
  const cur = mode === 'current'
  // The open position task of this portfolio sits on its instrument's row, first in the table (New only).
  const task = cur ? null : state.book.task
  const excluded = (r: SimRow) => !!r.isin && state.prefs.inst.includes(r.isin)
  const conflict = (r: SimRow) => excluded(r) && !r.kept
  const rows = (cur ? state.sim.rows.filter((r) => showZero || r.w > 0) : state.sim.rows.filter((r) => !r.removed && (showZero || r.w > 0 || r.nw > 0)))
    .slice()
    .sort((a, b) => (cur ? 0 : Number(b.id === task?.rowId) - Number(a.id === task?.rowId) || Number(conflict(b)) - Number(conflict(a))))
  // Warnings: positions that breach a preference. "To review" still need a keep-or-remove decision; "kept" were kept on purpose.
  const toReview = cur ? 0 : rows.filter((r) => conflict(r)).length
  const keptN = cur ? 0 : rows.filter((r) => excluded(r) && r.kept).length
  const shown = onlyWarnings && !cur && toReview + keptN > 0 ? rows.filter((r) => excluded(r)) : rows
  const edit = (id: string, fn: (r: SimRow) => void) => update((s) => { fn(s.sim.rows.find((r) => r.id === id)!) })
  /**
   * Position task decision. All three stay selectable and the latest one wins: Accepted applies the official target,
   * Rejected and Deferred keep the current weight. The weight field stays editable (a direct override is authoritative).
   */
  const decide = (status: 'Accepted' | 'Rejected' | 'Deferred') => {
    if (!task) return
    update((s) => {
      const r = s.sim.rows.find((x) => x.id === task.rowId)
      if (r) r.nw = status === 'Accepted' ? task.next : r.w
      if (s.book.task) s.book.task.status = status
    })
    setBookTaskStatus(state.book.id, task.rowId, status)
  }

  return (
    <>
    {toReview + keptN > 0 && (
      <div role="status" className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-2.5 py-1.5 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <TriangleAlert className={cn('size-3.5', toReview > 0 ? 'text-error' : 'text-fg-subtle')} strokeWidth={1.75} aria-hidden />
          {toReview > 0 ? `${toReview} ${toReview === 1 ? 'warning' : 'warnings'} to review` : 'No warnings to review'}
          {keptN > 0 && <span className="text-fg-muted">· {keptN} kept</span>}
        </span>
        <Button variant="link" className="text-xs" aria-pressed={onlyWarnings} onClick={() => setOnlyWarnings(!onlyWarnings)}>{onlyWarnings ? 'Show all positions' : 'Show only warnings'}</Button>
      </div>
    )}
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr>
          <th className={th}>Asset class</th><th className={th}>Instrument / account</th><th className={th}>Building block</th><th className={th}>Currency</th>
          <th className={cn(th, 'text-right')}>Price</th><th className={cn(th, 'text-right')}>ESG</th><th className={cn(th, 'text-right')}>{cur ? 'Weight %' : 'Current %'}</th>
          {!cur && <><th className={cn(th, 'text-right')}>New %</th><th className={cn(th, 'text-right')}>Change</th></>}
          {!cur && <th className={th}><span className="sr-only">Actions</span></th>}
        </tr>
      </thead>
      <tbody>
        {shown.map((r) => {
          const c = !cur && conflict(r)
          const edited = Math.abs(r.nw - r.w) >= 0.005
          const t = task && task.rowId === r.id ? task : null
          const plan = removing?.id === r.id ? redistribution(state.sim.rows, r.id, removing.method) : null
          return (
            <Fragment key={r.id}>
            <tr className={cn('group', c ? '*:bg-excluded-subtle' : t ? '*:bg-surface-muted' : 'hover:*:bg-surface-subtle')}>
              <td className={td}>
                {t && <span className="mb-0.75 block w-fit bg-task px-1.5 text-xs/4.5 whitespace-nowrap">Position task · {t.status}</span>}
                {r.cls}
              </td>
              <td className={td}>
                {r.name}
                {!cur && r.kept && excluded(r) && (
                  <Popover
                    className="w-90"
                    trigger={<PopoverTrigger openOnHover delay={150} aria-label={`${r.name}: kept despite a preference warning. Show details`} className="ml-1.5 inline-flex cursor-pointer align-[-2px] text-error"><TriangleAlert className="size-3.5" strokeWidth={1.75} /></PopoverTrigger>}
                    title="Portfolio preference warning · kept"
                    description={`${r.name} breaches the instrument exclusion preference: it is on the excluded instruments list.`}
                  >
                    <p className="text-xs text-fg-muted">Kept by {BOOK_USER}{r.keptOn ? ` on ${r.keptOn}` : ''}. Does not block Simulation or publication.</p>
                    <div className="mt-3 flex gap-1.5">
                      <Button size="sm" onClick={() => edit(r.id, (x) => { x.kept = false; x.keptOn = undefined })}>Review again</Button>
                      <Button size="sm" onClick={() => setRemoving({ id: r.id, method: 'proportional' })}>Remove…</Button>
                    </div>
                  </Popover>
                )}
                {r.isin && <span className="block text-fg-muted">{r.isin}</span>}
                {t && <span className="mt-0.75 block text-fg-muted">Official target {f2(t.next)}% from {t.component}</span>}
                {(c || (cur && excluded(r))) && <ConflictNote>Conflicts with exclusions: excluded instrument</ConflictNote>}
              </td>
              <td className={td}>{r.bb}</td>
              <td className={td}>{r.ccy}<span className="block text-fg-muted">{r.fx.toFixed(2)}</span></td>
              <td className={cn(td, 'text-right tabular-nums')}>{f2(r.price)}</td>
              <td className={cn(td, 'text-right tabular-nums')}>{r.esg === '—' ? <span className="text-fg-subtle" title="No ESG score received">—</span> : r.esg}</td>
              <td className={cn(td, 'text-right tabular-nums')}>{f2(r.w)}</td>
              {!cur && (
                <td className={td}>
                  <WeightField size="sm" strong={edited} value={r.nw} onValueChange={(v) => edit(r.id, (x) => { x.nw = v })} aria-label={`New weight of ${r.name} in percent`} className="ml-auto w-fit" />
                </td>
              )}
              {!cur && <td className={cn(td, 'text-right tabular-nums')}>{Math.abs(r.nw - r.w) < 0.005 ? <span className="text-fg-subtle">—</span> : (r.nw > r.w ? '+' : '') + f2(r.nw - r.w)}</td>}
              {!cur && (
                <td className={cn(td, 'text-right whitespace-nowrap')}>
                  {t ? (
                    <span className="inline-flex gap-1">
                      {(['Accepted', 'Rejected', 'Deferred'] as const).map((st) => (
                        <Button key={st} size="sm" aria-pressed={t.status === st} className={cn(t.status === st && 'border-control-active bg-surface-strong font-semibold')} onClick={() => decide(st)}>
                          {{ Accepted: 'Accept', Rejected: 'Reject', Deferred: 'Defer' }[st]}
                        </Button>
                      ))}
                    </span>
                  ) : c ? (
                    <span className="inline-flex gap-1">
                      <Button size="sm" onClick={() => edit(r.id, (x) => { x.kept = true; x.keptOn = new Date().toLocaleDateString('en-GB') })}>Keep</Button>
                      <Button size="sm" onClick={() => setRemoving({ id: r.id, method: 'proportional' })}>Remove…</Button>
                    </span>
                  ) : (
                    <Menu
                      trigger={<MenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Actions for ${r.name}`} />}><MoreHorizontal className="size-4" /></MenuTrigger>}
                      items={[
                        { label: 'Reset to current weight', onClick: () => edit(r.id, (x) => { x.nw = x.w }) },
                        { label: 'Remove position…', onClick: () => setRemoving({ id: r.id, method: 'proportional' }) },
                      ]}
                    />
                  )}
                </td>
              )}
            </tr>
            {plan && removing && (
              <tr>
                <td colSpan={10} className="border-b border-line bg-surface-muted px-6 py-4">
                  <div className="max-w-180">
                    <div className="text-sm font-semibold">Remove {r.name}</div>
                    <p className="text-fg-muted">{f2(plan.amount)}% will be released. Choose how to redistribute it.</p>
                    <RadioGroup aria-label="Redistribution method" value={removing.method} onValueChange={(v) => setRemoving({ id: r.id, method: v as Method })} className="mt-2 border-t border-line">
                      {METHODS.map((m) => {
                        const p = redistribution(state.sim.rows, r.id, m.id)
                        const cash = p.targets[0]
                        const effect = !p.add ? 'Not possible'
                          : m.id === 'equal' ? `+${f2(p.amount / p.targets.length)} each · ${p.targets.length} positions`
                          : m.id === 'proportional' ? `largest +${f2(Math.max(...p.add.values()))}`
                          : `${cash.name} ${f2(cash.nw)} → ${f2(cash.nw + p.amount)}`
                        return (
                          <label key={m.id} className="flex cursor-pointer items-start gap-2.5 border-b border-line py-2 hover:bg-surface-subtle">
                            <Radio value={m.id} className="mt-0.5" />
                            <span className="min-w-0 flex-1"><span className="block text-sm">{m.label}</span><span className="text-fg-muted">{m.help}</span></span>
                            <span className="whitespace-nowrap text-fg-muted tabular-nums">{effect}</span>
                          </label>
                        )
                      })}
                    </RadioGroup>
                    {!plan.add && (
                      <div role="alert" className="mt-3 border border-excluded-border bg-excluded-subtle px-3 py-2 text-conflict">
                        <strong className="block font-semibold">Automatic redistribution</strong>
                        The automatic redistribution for {r.name} could not be completed. {f2(plan.amount)}% could not be allocated without violating {plan.why}. No automatic changes were applied. The position can still be removed manually. Choose another redistribution method or cancel.
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
                      <span className="text-fg-muted">{plan.add ? 'The total weight stays unchanged.' : ''}</span>
                      <span className="inline-flex flex-wrap items-center gap-2">
                        <Button size="sm" onClick={() => setRemoving(null)}>Cancel</Button>
                        <Button size="sm" onClick={() => { edit(r.id, (x) => { x.removed = true; x.nw = 0 }); setRemoving(null) }}>Remove without redistributing</Button>
                        <Button size="sm" variant="primary" disabled={!plan.add} onClick={() => {
                          const add = plan.add
                          if (!add) return
                          update((s) => {
                            s.sim.rows.forEach((x) => {
                              if (x.id === r.id) { x.removed = true; x.nw = 0 } else if (add.has(x.id)) x.nw = round2(x.nw + (add.get(x.id) ?? 0))
                            })
                          })
                          setRemoving(null)
                        }}>Remove and redistribute</Button>
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            </Fragment>
          )
        })}
        {!shown.length && <tr><td colSpan={10} className={cn(td, 'text-fg-subtle')}>No positions.</td></tr>}
      </tbody>
    </table>
    </>
  )
}

/**
 * Read-only grouped view (Asset class, Building block, Exposure): one header row per group with its subtotal, and the
 * group's instruments underneath with their own weights. Groups collapse; weights are edited only in the Instrument view.
 * Columns, their order and their cell content match the Instrument view exactly, so switching view never moves a column.
 */
function GroupTable({ mode, showZero, keyOf, order }: { mode: Mode; showZero: boolean; keyOf: (r: SimRow) => string; /** Fixed group order; without it, groups sort by weight. */ order?: string[] }) {
  const { state } = usePortfolio()
  const [closed, setClosed] = useState<Set<string>>(new Set())
  const cur = mode === 'current'
  const wOf = (r: SimRow) => (cur ? r.w : r.nw)
  const sum = (l: SimRow[], f: (r: SimRow) => number) => l.reduce((t, r) => t + f(r), 0)
  const groups = new Map<string, SimRow[]>()
  state.sim.rows
    .filter((r) => (cur ? showZero || r.w > 0 : !r.removed && (showZero || r.w > 0 || r.nw > 0)))
    .forEach((r) => { const k = keyOf(r); groups.set(k, [...(groups.get(k) ?? []), r]) })
  const keys = [...groups.keys()].sort((a, b) => (order ? order.indexOf(a) - order.indexOf(b) : sum(groups.get(b) ?? [], wOf) - sum(groups.get(a) ?? [], wOf)))
  const toggle = (k: string) => setClosed((c) => { const n = new Set(c); if (n.has(k)) n.delete(k); else n.add(k); return n })
  const num = (v: ReactNode, strong?: boolean) => <td className={cn(td, 'text-right tabular-nums', strong && 'font-semibold')}>{v}</td>
  const change = (d: number) => (Math.abs(d) < 0.005 ? <span className="text-fg-subtle">—</span> : (d > 0 ? '+' : '') + f2(d))
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr>
          <th className={th}>Asset class</th><th className={th}>Instrument / account</th><th className={th}>Building block</th><th className={th}>Currency</th>
          <th className={cn(th, 'text-right')}>Price</th>
          <th className={cn(th, 'text-right')}>ESG</th>
          <th className={cn(th, 'text-right')}>{cur ? 'Weight %' : 'Current %'}</th>
          {!cur && <><th className={cn(th, 'text-right')}>New %</th><th className={cn(th, 'text-right')}>Change</th></>}
        </tr>
      </thead>
      <tbody>
        {keys.map((k) => {
          const list = [...(groups.get(k) ?? [])].sort((a, b) => wOf(b) - wOf(a))
          const open = !closed.has(k)
          const w = sum(list, (r) => r.w)
          const nw = sum(list, (r) => r.nw)
          return (
            <Fragment key={k}>
              <tr className="*:bg-surface-subtle">
                {/* Spans the descriptive columns, price and ESG: no group price or score, only supplied instrument values are shown. */}
                <td className={td} colSpan={6}>
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Button variant="ghost" size="icon-sm" aria-expanded={open} aria-label={`${open ? 'Collapse' : 'Expand'} ${k}`} onClick={() => toggle(k)}>
                      {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                    </Button>
                    <span>{k in CLASS_COLOR && <Swatch cls={k as AssetClass} />}{k}</span>
                    <span className="font-normal text-fg-muted">· {list.length} {list.length === 1 ? 'position' : 'positions'}</span>
                  </span>
                </td>
                {num(f2(w), true)}
                {!cur && <>{num(f2(nw), true)}{num(change(nw - w))}</>}
              </tr>
              {open && list.map((r) => (
                <tr key={r.id} className="hover:*:bg-surface-subtle">
                  <td className={cn(td, 'pl-10')}>{r.cls}</td>
                  <td className={td}>{r.name}{r.isin && <span className="block text-fg-muted">{r.isin}</span>}</td>
                  <td className={td}>{r.bb}</td>
                  <td className={td}>{r.ccy}<span className="block text-fg-muted">{r.fx.toFixed(2)}</span></td>
                  {num(f2(r.price))}
                  {num(r.esg === '—' ? <span className="text-fg-subtle" title="No ESG score received">—</span> : r.esg)}
                  {num(f2(r.w))}
                  {!cur && <>{num(f2(r.nw), Math.abs(r.nw - r.w) >= 0.005)}{num(change(r.nw - r.w))}</>}
                </tr>
              ))}
            </Fragment>
          )
        })}
        {!keys.length && <tr><td colSpan={9} className={cn(td, 'text-fg-subtle')}>No positions.</td></tr>}
      </tbody>
    </table>
  )
}
