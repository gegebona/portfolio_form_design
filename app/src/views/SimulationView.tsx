import { Info, MoreHorizontal, TriangleAlert } from 'lucide-react'
import { addTransitionType, startTransition, useState, ViewTransition, type ReactNode } from 'react'
import { Button } from '../components/ui/button'
import { Section } from '../components/ui/layout'
import { Menu, MenuTrigger } from '../components/ui/menu'
import { Switch } from '../components/ui/selection'
import { Tab, TabCount, Tabs, TabsList } from '../components/ui/tabs'
import { ConflictNote } from '../components/ui/tag'
import { WeightField } from '../components/ui/weight'
import { cn } from '../lib/cn'
import { setBookTaskStatus } from '../state/book'
import { f2, near100, round2, simAlloc, usePortfolio, type SimRow } from '../state/portfolio'
import { Overview } from './Overview'

type Mode = 'current' | 'new'
type View = 'instrument' | 'class' | 'block' | 'exposure'
const VIEWS: [View, string][] = [['instrument', 'Instrument view'], ['class', 'Asset class view'], ['block', 'Building block view'], ['exposure', 'Exposure view']]

export function SimulationView() {
  const { state, update } = usePortfolio()
  // Kept in the flow state (not local) so the action bar knows which version is on screen: only New can be saved as a draft.
  const mode = state.sim.mode
  const setMode = (m: Mode) => update((s) => { s.sim.mode = m })
  const [view, setView] = useState<View>('instrument')
  const [compact, setCompact] = useState(false)
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
      title={<>Simulation <span className="ml-1.5 text-base text-fg-subtle">{state.data.name}</span></>}
      description="Compare the current portfolio with the new allocation and fine-tune position weights."
      className="flex min-h-0 flex-1 flex-col"
    >
      {/* Version bar: Current / New switch the whole screen; the overview toggle sits right next to them. */}
      <div className="mt-3.5 flex flex-wrap items-end gap-x-7 gap-y-2 border-b border-line">
        <Tabs value={mode} onValueChange={(v) => switchTable(() => setMode(v as Mode))}>
          <TabsList variant="version" aria-label="Portfolio version">
            <Tab value="current">Current</Tab>
            <Tab value="new">New {changes > 0 && <TabCount>{changes} {changes === 1 ? 'change' : 'changes'}</TabCount>}</Tab>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-5 pb-1.25 before:h-4 before:w-px before:bg-line-strong">
          <Button variant="link" aria-pressed={compact} onClick={() => setCompact(!compact)}>{compact ? 'Full view' : 'Compact view'}</Button>
        </div>
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
            : <GroupTable mode={mode} showZero={showZero} title={{ class: 'Asset class', block: 'Building block', exposure: 'Currency' }[view]}
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

function InstrumentTable({ mode, showZero }: { mode: Mode; showZero: boolean }) {
  const { state, update } = usePortfolio()
  const cur = mode === 'current'
  // The open position task of this portfolio sits on its instrument's row, first in the table (New only).
  const task = cur ? null : state.book.task
  const excluded = (r: SimRow) => !!r.isin && state.prefs.inst.includes(r.isin)
  const conflict = (r: SimRow) => excluded(r) && !r.kept
  const rows = (cur ? state.sim.rows.filter((r) => showZero || r.w > 0) : state.sim.rows.filter((r) => !r.removed && (showZero || r.w > 0 || r.nw > 0)))
    .slice()
    .sort((a, b) => (cur ? 0 : Number(b.id === task?.rowId) - Number(a.id === task?.rowId) || Number(conflict(b)) - Number(conflict(a))))
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
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr>
          <th className={th}>Asset class</th><th className={th}>Instrument / account</th><th className={th}>Building block</th><th className={th}>Currency</th>
          <th className={cn(th, 'text-right')}>Price</th><th className={cn(th, 'text-right')}>{cur ? 'Weight %' : 'Current %'}</th>
          {!cur && <th className={cn(th, 'text-right')}>New %</th>}
          <th className={cn(th, 'text-right')}>ESG</th>
          {!cur && <th className={th}><span className="sr-only">Actions</span></th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const c = !cur && conflict(r)
          const edited = Math.abs(r.nw - r.w) >= 0.005
          const t = task && task.rowId === r.id ? task : null
          return (
            <tr key={r.id} className={cn('group', c ? '*:bg-excluded-subtle' : t ? '*:bg-surface-muted' : 'hover:*:bg-surface-subtle')}>
              <td className={td}>
                {t && <span className="mb-0.75 block w-fit bg-task px-1.5 text-xs/4.5 whitespace-nowrap">Position task · {t.status}</span>}
                {r.cls}
              </td>
              <td className={td}>
                {r.name}
                {r.isin && <span className="block text-fg-muted">{r.isin}</span>}
                {t && <span className="mt-0.75 block text-fg-muted">Official target {f2(t.next)}% from {t.component}</span>}
                {(c || (cur && excluded(r))) && <ConflictNote>Conflicts with exclusions: excluded instrument</ConflictNote>}
                {!cur && r.kept && excluded(r) && <span className="mt-0.75 inline-flex items-center gap-1 text-fg-muted"><TriangleAlert className="size-3" />Kept despite exclusion</span>}
              </td>
              <td className={td}>{r.bb}</td>
              <td className={td}>{r.ccy}<span className="block text-fg-muted">{r.fx.toFixed(2)}</span></td>
              <td className={cn(td, 'text-right tabular-nums')}>{f2(r.price)}</td>
              <td className={cn(td, 'text-right tabular-nums')}>{f2(r.w)}</td>
              {!cur && (
                <td className={td}>
                  <WeightField size="sm" strong={edited} value={r.nw} onValueChange={(v) => edit(r.id, (x) => { x.nw = v })} aria-label={`New weight of ${r.name} in percent`} className="ml-auto w-fit" />
                </td>
              )}
              <td className={cn(td, 'text-right tabular-nums')}>{r.esg}</td>
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
                      <Button size="sm" onClick={() => edit(r.id, (x) => { x.kept = true })}>Keep</Button>
                      <Button size="sm" onClick={() => edit(r.id, (x) => { x.removed = true; x.nw = 0 })}>Remove</Button>
                    </span>
                  ) : (
                    <Menu
                      trigger={<MenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Actions for ${r.name}`} />}><MoreHorizontal className="size-4" /></MenuTrigger>}
                      items={[
                        { label: 'Reset to current weight', onClick: () => edit(r.id, (x) => { x.nw = x.w }) },
                        { label: 'Remove position', onClick: () => edit(r.id, (x) => { x.removed = true; x.nw = 0 }) },
                      ]}
                    />
                  )}
                </td>
              )}
            </tr>
          )
        })}
        {!rows.length && <tr><td colSpan={9} className={cn(td, 'text-fg-subtle')}>No positions.</td></tr>}
      </tbody>
    </table>
  )
}

function GroupTable({ mode, showZero, title, keyOf }: { mode: Mode; showZero: boolean; title: string; keyOf: (r: SimRow) => string }) {
  const { state } = usePortfolio()
  const cur = mode === 'current'
  const groups = new Map<string, { n: number; w: number; nw: number }>()
  state.sim.rows.forEach((r) => {
    const k = keyOf(r)
    const g = groups.get(k) ?? { n: 0, w: 0, nw: 0 }
    if (cur || !r.removed) { g.n++; g.nw += r.removed ? 0 : r.nw }
    g.w += r.w
    groups.set(k, g)
  })
  const num = (v: ReactNode) => <td className={cn(td, 'text-right tabular-nums')}>{v}</td>
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr>
          <th className={th}>{title}</th><th className={cn(th, 'text-right')}>Positions</th>
          <th className={cn(th, 'text-right')}>{cur ? 'Weight %' : 'Current %'}</th>
          {!cur && <><th className={cn(th, 'text-right')}>New %</th><th className={cn(th, 'text-right')}>Change</th></>}
        </tr>
      </thead>
      <tbody>
        {[...groups.entries()].filter(([, g]) => showZero || g.w > 0 || (!cur && g.nw > 0)).map(([k, g]) => {
          const d = g.nw - g.w
          return (
            <tr key={k} className="hover:*:bg-surface-subtle">
              <td className={td}>{k}</td>{num(g.n)}{num(f2(g.w))}
              {!cur && <>{num(f2(g.nw))}{num(Math.abs(d) < 0.005 ? <span className="text-fg-subtle">—</span> : (d > 0 ? '+' : '') + f2(d))}</>}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
