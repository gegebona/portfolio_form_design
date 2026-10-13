import { ChevronDown, ChevronRight, Info, Lock, MoreHorizontal, TriangleAlert } from 'lucide-react'
import { addTransitionType, Fragment, startTransition, useState, ViewTransition, type ReactNode } from 'react'
import { Button } from '../components/ui/button'
import { Section } from '../components/ui/layout'
import { MultiCombobox } from '../components/ui/combobox'
import { Menu, MenuTrigger } from '../components/ui/menu'
import { Popover, PopoverTrigger } from '../components/ui/popover'
import { Radio, RadioGroup, Switch } from '../components/ui/selection'
import { Tabs as RTabs } from 'radix-ui'
import { Tab, Tabs, TabsList } from '../components/ui/tabs'
import { ConflictNote } from '../components/ui/tag'
import { WeightField } from '../components/ui/weight'
import { ADDABLE_POSITIONS, ASSET_CLASSES, BOOK_USER, CLASS_COLOR, PARENT_UPDATE, type AssetClass } from '../data/data'
import { cn } from '../lib/cn'
import { setBookTaskStatus } from '../state/book'
import { addOwnPosition, f2, isCreating, near100, parentCode, PREF_LABEL, removeOwnPosition, setOwnWeight, reductionShare, round2, simAlloc, usePortfolio, type SimRow } from '../state/portfolio'
import { ExposureView } from './ExposureView'
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
  // Open by default on Simulation: the strip explains the figures below. It folds away with one click.
  const [compact, setCompact] = useState(false)
  const [showZero, setShowZero] = useState(false)
  const [adding, setAdding] = useState(false)
  const rows = state.sim.rows
  // Changing view or version swaps the table in a transition tagged 'positions' (see the table boundary below).
  const switchTable = (fn: () => void) => startTransition(() => { addTransitionType('positions'); fn() })
  const cur = mode === 'current'
  const custom = state.custom
  const pub = state.sim.published
  // Changes are counted against the last published version when there is one, otherwise against Current.
  const changes = rows.filter((r) => r.removed || Math.abs(r.nw - (pub ? (r.pw ?? 0) : r.w)) >= 0.005).length
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
    <Section className="flex min-h-0 flex-1 flex-col pt-3 pb-2.5">
      {/* Version cards, as Current / Solve all / Custom in the client book: folder tabs on the content's top line. The open
          one takes the content's colour and joins it; the other sits back in grey. The info line stays on the right. */}
      <h2 className="sr-only">Simulation</h2>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2 border-b border-line">
        <RTabs.Root value={mode} onValueChange={(v) => switchTable(() => setMode(v as Mode))}>
          <RTabs.List aria-label="Portfolio version" className="-mb-px flex gap-1.5">
            <VersionCard value="current" title="Current" disabled={custom?.version === 0} hint={custom?.version === 0 ? 'Not published yet: there is no current version' : undefined} />
            <VersionCard value="new" title="New" disabled={!!custom && !custom.hasNew} hint={custom && !custom.hasNew ? `No new version: the update from ${parentCode(custom)} could not be applied` : undefined} />
          </RTabs.List>
        </RTabs.Root>
        {!cur && (
          <div className="ml-auto flex items-center gap-1.5 pb-2.5 text-xs text-fg-muted">
            <Info className="size-3.5" strokeWidth={1.5} />
            {pub ? `Working version — changes are compared with the version published on ${pub}.` : custom ? 'Pending, not published — Current stays active until you publish.' : 'Working version — changes stay here until you publish.'}
          </div>
        )}
        {cur && (
          <div className="ml-auto flex items-center gap-1.5 pb-2.5 text-xs text-fg-muted">
            <Info className="size-3.5" strokeWidth={1.5} />
            {pub ? `Read-only — Current is the last data load; the version published on ${pub} applies from the next load.` : 'Read-only — the portfolio as it is today.'}
            {(!custom || custom.hasNew) && <Button variant="link" className="text-xs" onClick={() => switchTable(() => setMode('new'))}>Switch to New</Button>}
          </div>
        )}
      </div>
      {/* The Exposure view carries its own asset allocation, so the summary strip would only repeat it there. */}
      {view !== 'exposure' && <Overview rows={[{ label: 'Current', alloc: simAlloc(state, 'current') }, { label: 'New', alloc: simAlloc(state, 'new') }]} focus={cur ? 0 : 1} showChange compact={compact} onToggleCompact={() => setCompact(!compact)} />}
      {custom?.auto && <AutoUpdate />}

      <div className="mt-2 flex min-h-0 flex-1 flex-col">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-line">
          <Tabs value={view} onValueChange={(v) => switchTable(() => setView(v as View))}>
            <TabsList variant="sub" aria-label="Positions view">
              {VIEWS.map(([v, l]) => <Tab key={v} value={v}>{l}</Tab>)}
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-4.5 pb-1.5">
            {!cur && !custom && <Button size="sm" onClick={() => { location.hash = 'sma/components' }}>+ Add component</Button>}
            {!cur && custom && <Button size="sm" aria-expanded={adding} onClick={() => setAdding(true)}>+ Add position</Button>}
            {view !== 'exposure' && (
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
                <Switch checked={showZero} onCheckedChange={setShowZero} />
                Show zero-weighted positions
              </label>
            )}
          </div>
        </div>
        {adding && !cur && custom && <AddPosition onClose={() => setAdding(false)} />}
        {/* The scrolling container is the boundary (its picture stays clipped): the old table fades out, the new one fades in. */}
        <ViewTransition update={{ positions: 'table-swap', default: 'none' }} default="none">
        <div className="min-h-0 flex-1 overflow-auto">
          {view === 'instrument' ? <InstrumentTable mode={mode} showZero={showZero} />
            : view === 'exposure' ? <ExposureView mode={mode} />
            : <GroupTable key={view} mode={mode} showZero={showZero} order={view === 'class' ? ASSET_CLASSES : undefined} hide={view === 'class' ? 'cls' : view === 'block' ? 'bb' : undefined}
                keyOf={view === 'class' ? (r) => r.cls : (r) => (r.bb !== '—' ? r.bb : r.cls === 'Liquidity' ? 'Cash' : 'Single instruments')} />}
        </div>
        </ViewTransition>
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-line-strong px-2.5 pt-1.5 text-xs">
          <span className="text-fg-muted">{cur ? 'Total weight' : 'Total new weight'}</span>
          <strong className={cn('text-sm font-semibold tabular-nums', !near100(total) && 'text-error')}>{f2(total)}%</strong>
          {!cur && !custom && <Button size="xs" disabled={near100(total)} onClick={redistribute}>Redistribute to 100%</Button>}
        </div>
      </div>
    </Section>
  )
}

const th = 'sticky top-0 z-2 border-b border-line bg-surface-subtle px-2.5 py-2 text-left font-normal whitespace-nowrap text-fg-muted'

const td = 'border-b border-line px-2.5 py-1.5 align-middle'

/**
 * Column widths in percent, shared by the four position tables so the space is spread evenly: text columns no wider
 * than their content needs, number columns with room to breathe. The tables use a fixed layout to honour them.
 */
function Cols({ w }: { w: number[] }) {
  return <colgroup>{w.map((x, i) => <col key={i} style={{ width: x + '%' }} />)}</colgroup>
}

type Method = 'equal' | 'proportional' | 'cash'
const METHODS: { id: Method; label: string; help: string }[] = [
  { id: 'equal', label: 'Equal', help: 'The same amount for each other position.' },
  { id: 'proportional', label: 'Proportional', help: "In proportion to each other position's current weight." },
  { id: 'cash', label: 'Cash', help: 'All of it through the cash position.' },
]

/**
 * How the other positions absorb a weight change of one position. `amount` is what they receive: by default the whole
 * weight of a removed position; negative when they give weight up (an accepted task that raises a position).
 * Returns the change per position (2 decimals, summing to exactly `amount`), or add = null with the limitation that
 * makes the method impossible. Nothing is applied here.
 */
function redistribution(all: SimRow[], id: string, method: Method, amountIn?: number) {
  const amount = amountIn ?? all.find((r) => r.id === id)?.nw ?? 0
  const others = all.filter((r) => !r.removed && r.id !== id)
  const targets = method === 'cash' ? others.filter((r) => r.cls === 'Liquidity').slice(0, 1) : others.filter((r) => r.nw > 0)
  if (!targets.length) return { amount, targets, add: null, why: method === 'cash' ? 'the rule that a cash position must exist' : 'the rule that weight only goes to positions already held' }
  const base = targets.reduce((t, r) => t + r.nw, 0)
  const add = new Map<string, number>()
  targets.forEach((r) => add.set(r.id, round2(method === 'proportional' ? (amount * r.nw) / base : amount / targets.length)))
  // Rounding leftovers go to the largest receiver so the total stays exact.
  const big = [...targets].sort((a, b) => b.nw - a.nw)[0]
  add.set(big.id, round2((add.get(big.id) ?? 0) + amount - [...add.values()].reduce((t, v) => t + v, 0)))
  if (targets.some((r) => r.nw + (add.get(r.id) ?? 0) < -0.004)) return { amount, targets, add: null, why: 'the rule that no weight can go below 0%' }
  return { amount, targets, add, why: '' }
}

function InstrumentTable({ mode, showZero }: { mode: Mode; showZero: boolean }) {
  // The position being removed and the redistribution method picked for it (the panel opens under its row).
  // The position being removed, or whose position task is being accepted, and the redistribution method picked for it.
  const [removing, setRemoving] = useState<{ id: string; method: Method; kind?: 'remove' | 'accept' } | null>(null)
  const [onlyWarnings, setOnlyWarnings] = useState(false)
  const { state, update } = usePortfolio()
  const cur = mode === 'current'
  // A version published since the data load gets its own column; New is then compared with it.
  const pub = !!state.sim.published
  const base = (r: SimRow) => (pub ? (r.pw ?? 0) : r.w)
  // Customized: weights come from the parent, so New is read-only and its last column says what the automatic update did.
  const custom = !!state.custom
  // The open position task of this portfolio sits on its instrument's row, first in the table (New only).
  const task = cur ? null : state.book.task
  // Preference warnings belong to the creation workflow (a new portfolio or a draft). A published portfolio only ever
  // shows position tasks.
  const creating = isCreating(state)
  const excluded = (r: SimRow) => !!r.isin && state.prefs.inst.includes(r.isin)
  // The Keep / Remove decision belongs to the creation workflow; an existing portfolio only flags the instrument.
  const conflict = (r: SimRow) => creating && excluded(r) && !r.kept
  const flagOnly = (r: SimRow) => !cur && !creating && excluded(r)
  const needsDecision = (r: SimRow) => conflict(r) || (task?.rowId === r.id && task.status === 'Open')
  const rows = (cur ? state.sim.rows.filter((r) => showZero || r.w > 0 || (r.pw ?? 0) > 0) : state.sim.rows.filter((r) => !r.removed && (showZero || r.w > 0 || r.nw > 0 || (r.pw ?? 0) > 0)))
    .slice()
    // Rows that need a decision first (an undecided warning while creating, or an open task), then cash (set apart visually), then every
    // other position by descending weight. The order uses the current weight so rows do not jump while a new weight
    // is being typed; new positions (no current weight) follow by new weight.
    .sort((a, b) => (cur ? 0 : Number(needsDecision(b)) - Number(needsDecision(a)) || Number(!!b.own || b.auto === 'added') - Number(!!a.own || a.auto === 'added')) || Number(b.cls === 'Liquidity') - Number(a.cls === 'Liquidity') || b.w - a.w || b.nw - a.nw)
  // Warnings: positions that breach a preference. "To review" still need a keep-or-remove decision; "kept" were kept on purpose.
  const toReview = cur ? 0 : rows.filter((r) => conflict(r)).length
  const keptN = cur ? 0 : rows.filter((r) => excluded(r) && r.kept).length
  const flagged = cur || creating ? 0 : rows.filter(flagOnly).length
  // The warnings line and Keep / Remove belong to the creation workflow; an existing portfolio only flags the row itself.
  const summary = creating ? toReview + keptN > 0 : false
  const shown = onlyWarnings && !cur && summary ? rows.filter((r) => excluded(r)) : rows
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
    {summary && (
      <div role="status" className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-2.5 py-1.5 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <TriangleAlert className="size-3.5 text-error" strokeWidth={1.75} aria-hidden />
          {!creating ? `${flagged} ${flagged === 1 ? 'instrument conflicts' : 'instruments conflict'} with exclusions`
            : toReview > 0 ? `${toReview} ${toReview === 1 ? 'warning' : 'warnings'} to review` : 'No warnings to review'}
          {creating && keptN > 0 && <span className="text-fg-muted">· {keptN} kept</span>}
        </span>
        <Button variant="link" className="text-xs" aria-pressed={onlyWarnings} onClick={() => setOnlyWarnings(!onlyWarnings)}>{onlyWarnings ? 'Show all positions' : 'Show only warnings'}</Button>
      </div>
    )}
    <table className="w-full table-fixed border-collapse bg-surface text-xs">
      {/* The last column holds the row actions: wider when a position task needs its three decision buttons. */}
      <Cols w={cur ? (pub ? [10, 25, 24, 9, 9, 7, 8, 8] : [10, 28, 26, 9, 9, 7, 11])
        : pub ? (custom ? [8, 15, 15, 7, 7, 5, 7, 7, 7, 6, 16] : task ? [8, 16, 14, 7, 7, 5, 7, 7, 9, 6, 14] : [9, 16, 16, 7, 7, 5, 8, 8, 9, 6, 9])
        : custom ? [8, 17, 16, 7, 7, 5, 7, 7, 6, 20] : task ? [8, 18, 15, 7, 7, 5, 7, 9, 6, 18] : [9, 17, 18, 8, 8, 6, 8, 9, 6, 11]} />
      <thead>
        <tr>
          <th className={th}>Asset class</th><th className={th}>Instrument / account</th><th className={th}>Building block</th><th className={th}>Currency</th>
          <th className={cn(th, 'text-right')}>Price</th><th className={cn(th, 'text-right')}>ESG</th><th className={cn(th, 'text-right')}>{cur && !pub ? 'Weight %' : 'Current %'}</th>
          {pub && <th className={cn(th, 'text-right')} title={`Published on ${state.sim.published}`}>Published %</th>}
          {!cur && <><th className={cn(th, 'text-right')}>New %</th><th className={cn(th, 'text-right')}>Change</th></>}
          {!cur && <th className={th}>{custom ? 'Automatic update' : <span className="sr-only">Actions</span>}</th>}
        </tr>
      </thead>
      <tbody>
        {shown.map((r) => {
          const c = !cur && conflict(r)
          const flag = flagOnly(r)
          const edited = Math.abs(r.nw - base(r)) >= 0.005
          const t = task && task.rowId === r.id ? task : null
          // Accepting a task moves the position to its official target; the other positions absorb the difference.
          const accepting = removing?.kind === 'accept' && !!t
          const delta = t ? round2(t.next - r.w) : 0
          const amountFor = accepting ? -delta : undefined
          const plan = removing?.id === r.id ? redistribution(state.sim.rows, r.id, removing.method, amountFor) : null
          return (
            <Fragment key={r.id}>
            <tr className={cn('group', t ? (t.status === 'Open' ? '*:bg-task/25' : '*:bg-task/10') : r.cls === 'Liquidity' ? '*:border-b-line-strong *:bg-surface-subtle' : 'hover:*:bg-surface-subtle')}>
              <td className={td}>{r.cls}</td>
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
                {(c || flag || (cur && excluded(r))) && <ConflictNote>Excluded instrument</ConflictNote>}
              </td>
              <td className={td}>{r.bb}</td>
              <td className={td}>{r.ccy}<span className="block text-fg-muted">{r.fx.toFixed(2)}</span></td>
              <td className={cn(td, 'text-right tabular-nums')}>{f2(r.price)}</td>
              <td className={cn(td, 'text-right tabular-nums')}>{r.esg === '—' ? <span className="text-fg-subtle" title="No ESG score received">—</span> : r.esg}</td>
              <td className={cn(td, 'text-right tabular-nums')}>{f2(r.w)}</td>
              {pub && <td className={cn(td, 'text-right tabular-nums')}>{f2(r.pw ?? 0)}</td>}
              {!cur && (
                <td className={td}>
                  {custom && r.own
                    ? <WeightField size="sm" strong value={r.nw} onValueChange={(v) => update((s) => setOwnWeight(s, r.id, v))} aria-label={`Weight of ${r.name} in percent`} className="ml-auto w-fit" />
                    : custom
                    ? <span className={cn('block text-right tabular-nums', edited && 'font-semibold')}>{f2(r.nw)}</span>
                    : <WeightField size="sm" strong={edited} value={r.nw} onValueChange={(v) => edit(r.id, (x) => { x.nw = v })} aria-label={`New weight of ${r.name} in percent`} className="ml-auto w-fit" />}
                </td>
              )}
              {!cur && <td className={cn(td, 'text-right tabular-nums')}>{!edited ? <span className="text-fg-subtle">—</span> : (r.nw > base(r) ? '+' : '') + f2(r.nw - base(r))}</td>}
              {!cur && (
                <td className={cn(td, custom ? 'text-left' : 'text-right whitespace-nowrap')}>
                  {custom ? <UpdateNote r={r} /> : t ? (
                    <span className="inline-flex gap-1">
                      {(['Accepted', 'Rejected', 'Deferred'] as const).map((st) => (
                        <Button key={st} size="xs" aria-pressed={t.status === st} className={cn(t.status === st && 'border-control-active bg-surface-strong font-semibold')} onClick={() => (st === 'Accepted' && Math.abs(t.next - r.w) >= 0.005 ? setRemoving({ id: r.id, method: 'proportional', kind: 'accept' }) : decide(st))}>
                          {{ Accepted: 'Accept', Rejected: 'Reject', Deferred: 'Defer' }[st]}
                        </Button>
                      ))}
                    </span>
                  ) : c ? (
                    <span className="inline-flex gap-1">
                      <Button size="xs" onClick={() => edit(r.id, (x) => { x.kept = true; x.keptOn = new Date().toLocaleDateString('en-GB') })}>Keep</Button>
                      <Button size="xs" onClick={() => setRemoving({ id: r.id, method: 'proportional' })}>Remove…</Button>
                    </span>
                  ) : (
                    <Menu
                      trigger={<MenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Actions for ${r.name}`} />}><MoreHorizontal className="size-4" /></MenuTrigger>}
                      items={[
                        { label: pub ? 'Reset to published weight' : 'Reset to current weight', onClick: () => edit(r.id, (x) => { x.nw = pub ? (x.pw ?? 0) : x.w }) },
                        { label: 'Remove position…', onClick: () => setRemoving({ id: r.id, method: 'proportional' }) },
                      ]}
                    />
                  )}
                </td>
              )}
            </tr>
            {plan && removing && !custom && (
              <tr>
                <td colSpan={11} className="border-b border-line border-l-2 border-l-selected bg-surface px-6 py-4">
                  <div className="max-w-180">
                    <div className="text-sm font-semibold">{accepting ? `Accept the position task for ${r.name}` : `Remove ${r.name}`}</div>
                    <p className="text-fg-muted">
                      {accepting
                        ? `${r.name} goes from ${f2(r.w)}% to its official target of ${f2(t!.next)}%. ${f2(Math.abs(delta))}% ${delta > 0 ? 'must come from' : 'goes back to'} the other positions. Choose how.`
                        : `${f2(plan.amount)}% will be released. Choose how to redistribute it.`}
                    </p>
                    <RadioGroup aria-label="Redistribution method" value={removing.method} onValueChange={(v) => setRemoving({ ...removing, method: v as Method })} className="mt-2 border-t border-line">
                      {METHODS.map((m) => {
                        const p = redistribution(state.sim.rows, r.id, m.id, amountFor)
                        const cash = p.targets[0]
                        const sg = (v: number) => (v >= 0 ? '+' : '−') + f2(Math.abs(v))
                        const extreme = p.add ? [...p.add.values()].sort((a, b) => Math.abs(b) - Math.abs(a))[0] : 0
                        const effect = !p.add ? 'Not possible'
                          : m.id === 'equal' ? `${sg(p.amount / p.targets.length)} each · ${p.targets.length} positions`
                          : m.id === 'proportional' ? `largest ${sg(extreme)}`
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
                        The automatic redistribution for {r.name} could not be completed. {f2(Math.abs(plan.amount))}% could not be allocated without violating {plan.why}. No automatic changes were applied. {accepting ? 'The task can still be accepted without redistributing.' : 'The position can still be removed manually.'} Choose another redistribution method or cancel.
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
                      <span className="text-fg-muted">{plan.add ? (accepting ? 'The total weight comes back to exactly 100.00%.' : 'The total weight stays unchanged.') : ''}</span>
                      <span className="inline-flex flex-wrap items-center gap-2">
                        <Button size="sm" onClick={() => setRemoving(null)}>Cancel</Button>
                        {accepting
                          ? <Button size="sm" onClick={() => { decide('Accepted'); setRemoving(null) }}>Accept without redistributing</Button>
                          : <Button size="sm" onClick={() => { edit(r.id, (x) => { x.removed = true; x.nw = 0 }); setRemoving(null) }}>Remove without redistributing</Button>}
                        <Button size="sm" variant="primary" disabled={!plan.add} onClick={() => {
                          const add = plan.add
                          if (!add) return
                          if (accepting) decide('Accepted')
                          update((s) => {
                            s.sim.rows.forEach((x) => {
                              if (x.id === r.id) { if (!accepting) { x.removed = true; x.nw = 0 } } else if (add.has(x.id)) x.nw = round2(x.nw + (add.get(x.id) ?? 0))
                            })
                          })
                          setRemoving(null)
                        }}>{accepting ? 'Accept and redistribute' : 'Remove and redistribute'}</Button>
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            </Fragment>
          )
        })}
        {!shown.length && <tr><td colSpan={11} className={cn(td, 'text-fg-subtle')}>No positions.</td></tr>}
      </tbody>
    </table>
    </>
  )
}

/**
 * Read-only grouped view (Asset class, Building block, Exposure): one header row per group with its subtotal, and the
 * group's instruments underneath with their own weights. Groups collapse; weights are edited only in the Instrument view.
 * The column a view groups by is not repeated on every row: its room goes to the instrument's share of the group, and the
 * group row summarises what the group holds.
 */
function GroupTable({ mode, showZero, keyOf, order, hide }: { mode: Mode; showZero: boolean; keyOf: (r: SimRow) => string; /** Fixed group order; without it, groups sort by weight. */ order?: string[]; /** Column already given by the group header. */ hide?: 'cls' | 'bb' }) {
  const { state } = usePortfolio()
  const showCls = hide !== 'cls'
  const showBb = hide !== 'bb'
  const [closed, setClosed] = useState<Set<string>>(new Set())
  const cur = mode === 'current'
  const pub = !!state.sim.published
  const wOf = (r: SimRow) => (cur ? r.w : r.nw)
  const baseOf = (r: SimRow) => (pub ? (r.pw ?? 0) : r.w)
  const sum = (l: SimRow[], f: (r: SimRow) => number) => l.reduce((t, r) => t + f(r), 0)
  const groups = new Map<string, SimRow[]>()
  state.sim.rows
    .filter((r) => (cur ? showZero || r.w > 0 || (r.pw ?? 0) > 0 : !r.removed && (showZero || r.w > 0 || r.nw > 0 || (r.pw ?? 0) > 0)))
    .forEach((r) => { const k = keyOf(r); groups.set(k, [...(groups.get(k) ?? []), r]) })
  const keys = [...groups.keys()].sort((a, b) => (order ? order.indexOf(a) - order.indexOf(b) : sum(groups.get(b) ?? [], wOf) - sum(groups.get(a) ?? [], wOf)))
  const toggle = (k: string) => setClosed((c) => { const n = new Set(c); if (n.has(k)) n.delete(k); else n.add(k); return n })
  const num = (v: ReactNode, strong?: boolean) => <td className={cn(td, 'text-right tabular-nums', strong && 'font-semibold')}>{v}</td>
  const change = (d: number) => (Math.abs(d) < 0.005 ? <span className="text-fg-subtle">—</span> : (d > 0 ? '+' : '') + f2(d))
  return (
    <table className="w-full table-fixed border-collapse bg-surface text-xs">
      <Cols w={(() => {
        const raw = [...(showCls ? [12] : []), showBb ? 22 : 28, ...(showBb ? [showCls ? 20 : 24] : []), 9, 10, 8, 11, ...(cur ? [11, ...(pub ? [11] : [])] : [9, ...(pub ? [9] : []), 9, 8])]
        const t = raw.reduce((a, b) => a + b, 0)
        return raw.map((x) => (x / t) * 100)
      })()} />
      <thead>
        <tr>
          {showCls && <th className={th}>Asset class</th>}<th className={cn(th, !showCls && 'pl-10')}>Instrument / account</th>{showBb && <th className={th}>Building block</th>}<th className={th}>Currency</th>
          <th className={cn(th, 'text-right')}>Price</th>
          <th className={cn(th, 'text-right')}>ESG</th>
          <th className={cn(th, 'text-right')}>Share of group %</th>
          <th className={cn(th, 'text-right')}>{cur && !pub ? 'Weight %' : 'Current %'}</th>
          {pub && <th className={cn(th, 'text-right')}>Published %</th>}
          {!cur && <><th className={cn(th, 'text-right')}>New %</th><th className={cn(th, 'text-right')}>Change</th></>}
        </tr>
      </thead>
      <tbody>
        {keys.map((k) => {
          const list = [...(groups.get(k) ?? [])].sort((a, b) => wOf(b) - wOf(a))
          const open = !closed.has(k)
          const w = sum(list, (r) => r.w)
          const nw = sum(list, (r) => r.nw)
          const pw = sum(list, (r) => r.pw ?? 0)
          const total = sum(list, wOf)
          const mix = new Map<string, number>()
          list.forEach((r) => mix.set(r.cls, (mix.get(r.cls) ?? 0) + wOf(r)))
          const blocks = new Set(list.map((r) => r.bb).filter((b) => b !== '—')).size
          const summary = showCls
            ? [...mix.entries()].sort((a, b) => b[1] - a[1]).map(([c, v]) => `${c} ${total > 0 ? Math.round((v / total) * 100) : 0}%`).join(' · ')
            : blocks ? `${blocks} ${blocks === 1 ? 'building block' : 'building blocks'}` : ''
          return (
            <Fragment key={k}>
              <tr className="*:bg-surface-subtle">
                {/* Spans the descriptive columns, price and ESG: no group price or score, only supplied instrument values are shown. */}
                <td className={td} colSpan={6 + (hide ? 0 : 1)}>
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Button variant="ghost" size="icon-sm" aria-expanded={open} aria-label={`${open ? 'Collapse' : 'Expand'} ${k}`} onClick={() => toggle(k)}>
                      {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                    </Button>
                    <span>{k in CLASS_COLOR && <Swatch cls={k as AssetClass} />}{k}</span>
                    <span className="font-normal text-fg-muted">· {list.length} {list.length === 1 ? 'position' : 'positions'}{summary && ` · ${summary}`}</span>
                  </span>
                </td>
                {num(f2(w), true)}
                {pub && num(f2(pw), true)}
                {!cur && <>{num(f2(nw), true)}{num(change(nw - (pub ? pw : w)))}</>}
              </tr>
              {open && list.map((r) => (
                <tr key={r.id} className="hover:*:bg-surface-subtle">
                  {showCls && <td className={cn(td, 'pl-10')}>{r.cls}</td>}
                  <td className={cn(td, !showCls && 'pl-10')}>{r.name}{r.isin && <span className="block text-fg-muted">{r.isin}</span>}</td>
                  {showBb && <td className={td}>{r.bb}</td>}
                  <td className={td}>{r.ccy}<span className="block text-fg-muted">{r.fx.toFixed(2)}</span></td>
                  {num(f2(r.price))}
                  {num(r.esg === '—' ? <span className="text-fg-subtle" title="No ESG score received">—</span> : r.esg)}
                  {num(total > 0 ? <span className="text-fg-muted">{f2((wOf(r) / total) * 100)}</span> : <span className="text-fg-subtle">—</span>)}
                  {num(f2(r.w))}
                  {pub && num(f2(r.pw ?? 0))}
                  {!cur && <>{num(f2(r.nw), Math.abs(r.nw - baseOf(r)) >= 0.005)}{num(change(r.nw - baseOf(r)))}</>}
                </tr>
              ))}
            </Fragment>
          )
        })}
        {!keys.length && <tr><td colSpan={11} className={cn(td, 'text-fg-subtle')}>No positions.</td></tr>}
      </tbody>
    </table>
  )
}

/** Customized, New: what the automatic update did to a position. */
function UpdateNote({ r }: { r: SimRow }) {
  const { state, update } = usePortfolio()
  if (r.own) return (
    <span className="inline-flex flex-wrap items-center gap-x-2">
      <span className="inline-flex items-center gap-1"><Lock className="size-3" strokeWidth={1.75} aria-hidden />Own position · fixed weight</span>
      <Button variant="link" className="text-xs" onClick={() => update((s) => removeOwnPosition(s, r.id))}>Remove</Button>
    </span>
  )
  if (r.auto === 'added') return <span><span className="rounded-xs bg-selected/10 px-1.5 text-xs/4.5">Added</span> <span className="text-fg-muted">target of {state.custom && parentCode(state.custom)} {f2(r.target ?? 0)}%</span></span>
  if (r.auto === 'reduced') return <span className="text-fg-muted">{r.cls === 'Liquidity' ? 'Reduced proportionally · cash' : 'Reduced proportionally'}</span>
  if (r.auto === 'protected') return <span className="inline-flex items-center gap-1 text-fg-muted"><Lock className="size-3" strokeWidth={1.75} aria-hidden />Protected · {PARENT_UPDATE.protectedWhy.toLowerCase()}</span>
  return <span className="text-fg-subtle">—</span>
}

/**
 * Customized: summary of the latest automatic update from the parent, above the positions. Information only: no task,
 * no Accept / Reject / Defer. The user reviews New and publishes it like any other change.
 */
function AutoUpdate() {
  const { state } = usePortfolio()
  const c = state.custom!
  const inst = PARENT_UPDATE.instrument
  const rows = state.sim.rows
  const reduced = rows.filter((r) => r.auto === 'reduced').length
  const prot = rows.find((r) => r.id === PARENT_UPDATE.protectedId)
  const total = rows.filter((r) => !r.removed).reduce((t, r) => t + r.nw, 0)
  const held = rows.filter((r) => r.w > 0).length
  const sec = 'min-w-0 px-5 py-2 first:pl-2.5 [&+&]:border-l [&+&]:border-line'
  const title = 'mb-0.5 font-semibold text-fg'
  if (c.auto === 'invalid') {
    return (
      <div role="status" className="mt-2 border border-excluded-border bg-excluded-subtle px-3 py-2 text-xs text-conflict">
        <strong className="mb-0.5 flex items-center gap-1.5 font-semibold"><TriangleAlert className="size-3.5 text-error" strokeWidth={1.75} aria-hidden />Automatic update not applied</strong>
        {parentCode(c)} changed on {PARENT_UPDATE.changed} and now requires {inst.name} at {f2(inst.target)}% (target of {parentCode(c)}).
        No valid allocation was possible: the portfolio already holds {held} instruments, the new maximum of {parentCode(c)} ({c.parentPrefs.maxInst}).
        Nothing was applied, not even the preference changes. Current version {c.version} stays active; the update will be tried again automatically.
      </div>
    )
  }
  const pending = c.auto === 'pending'
  return (
    <div role="status" className="mt-2 grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,1.2fr)] border border-line border-l-2 border-l-selected text-xs leading-relaxed">
      <div className={sec}>
        <div className={title}>Automatic update</div>
        <div>{parentCode(c)} changed {PARENT_UPDATE.changed}</div>
        <div className="text-fg-muted">Based on Current version {c.version}</div>
      </div>
      <div className={sec}>
        <div className={title}>Preferences</div>
        {c.applied.map((k) => <div key={k}>Applied: {PREF_LABEL[k]}</div>)}
        {c.skipped.map((k) => <div key={k} className="text-fg-muted">Skipped, own value kept: {PREF_LABEL[k]}</div>)}
        {c.limits.map((l) => <div key={l.label}><Lock className="mr-1 inline size-3 align-[-1px]" strokeWidth={1.75} aria-hidden />{l.label}: {l.from} → {l.to}</div>)}
      </div>
      <div className={sec}>
        <div className={title}>Allocation</div>
        {pending ? (
          <>
            <div>Pending: {inst.name} will be added at {f2(inst.target)}% (target of {parentCode(c)}).</div>
            <div className="text-fg-muted">Weights stay as in Current until then.</div>
          </>
        ) : (
          <>
            <div>Added {inst.name} at {f2(inst.target)}% (target of {parentCode(c)})</div>
            <div className="text-fg-muted">{reduced} positions reduced by {reductionShare(rows).toFixed(2)}% of their weight, cash included</div>
            <div className="text-fg-muted">{prot ? `Protected: ${prot.name} (${PARENT_UPDATE.protectedWhy.toLowerCase()})` : ''} · Total {f2(total)}%</div>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Customized: add a single position of its own. The user sets its weight; the other positions give it up proportionally
 * (cash included, protected ones excluded). The weight then stays fixed: only the user changes it, parent updates never do.
 */
function AddPosition({ onClose }: { onClose: () => void }) {
  const { state, update } = usePortfolio()
  const held = new Set(state.sim.rows.filter((r) => !r.removed).map((r) => r.isin))
  const options = ADDABLE_POSITIONS.filter((p) => !held.has(p.isin) && !state.prefs.inst.includes(p.isin))
  const [id, setId] = useState('')
  const [w, setW] = useState(1)
  const pick = options.find((p) => p.id === id)
  return (
    <div className="mt-2 border border-line border-l-2 border-l-selected px-4 py-3 text-xs">
      <div className="text-sm font-semibold">Add a position</div>
      <p className="text-fg-muted">Its weight is taken from the other positions proportionally, cash included. The weight then stays fixed: changes to {state.custom && parentCode(state.custom)} never move it.</p>
      <div className="mt-2.5 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="add-pos-q" className="text-fg-muted">Instrument</label>
          {/* Searchable by name or ISIN (same control as on Component selection); one instrument at a time. */}
          {pick ? (
            <div className="flex h-8 w-78 items-center gap-2 rounded-sm border border-control px-2.5">
              <span className="min-w-0 flex-1 truncate">{pick.name} <span className="text-fg-muted">{pick.isin}</span></span>
              <Button variant="link" className="text-xs" onClick={() => setId('')}>Change</Button>
            </div>
          ) : (
            <MultiCombobox
              id="add-pos-q"
              tone="select"
              closeOnSelect
              options={options.map((p) => ({ id: p.id, label: p.name, sub: p.isin }))}
              value={[]}
              onValueChange={(v) => setId(v[v.length - 1] ?? '')}
              placeholder="Search by ISIN or instrument name…"
              className="w-78"
            />
          )}
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-fg-muted">Weight</span>
          <WeightField size="sm" value={w} onValueChange={setW} aria-label="Weight of the new position in percent" />
        </label>
        <span className="ml-auto inline-flex gap-2">
          <Button size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" variant="primary" disabled={!pick || w <= 0} onClick={() => { if (pick) update((s) => addOwnPosition(s, pick, w)); onClose() }}>Add position</Button>
        </span>
      </div>
    </div>
  )
}

/**
 * One version card (Radix Tabs trigger styled as a folder tab): the version's name, large and light. Grey while not shown; when open it takes the content's colour and covers the line below it.
 */
function VersionCard({ value, title, disabled, hint }: { value: Mode; title: string; disabled?: boolean; hint?: string }) {
  return (
    <RTabs.Trigger
      value={value}
      disabled={disabled}
      title={hint}
      className="w-64 cursor-pointer border border-line bg-shell-side px-3 py-1 text-left outline-none hover:bg-surface-strong focus-visible:outline-2 focus-visible:outline-focus data-disabled:cursor-default data-disabled:opacity-60 data-[state=active]:cursor-default data-[state=active]:border-b-shell-panel data-[state=active]:bg-shell-panel"
    >
      <span className="text-lg font-light">{title}</span>
    </RTabs.Trigger>
  )
}
