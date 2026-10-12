import { Check, TriangleAlert } from 'lucide-react'
import { startTransition, useEffect, useRef, useState, ViewTransition, type ReactNode } from 'react'
import { Button } from '../components/ui/button'
import { RemoveButton } from '../components/ui/chip'
import { MultiCombobox } from '../components/ui/combobox'
import { ExpandedCard, Shared } from '../components/ui/expanded-card'
import { SearchInput } from '../components/ui/input'
import { GroupLabel, Section } from '../components/ui/layout'
import { Select } from '../components/ui/select'
import { Checkbox } from '../components/ui/selection'
import { Tab, TabCount, Tabs, TabsList } from '../components/ui/tabs'
import { ConflictList } from '../components/ui/tag'
import { AREAS, CASH_CURRENCIES, COMPONENTS, COMPONENT_INSTRUMENTS, PROVIDERS, type Component } from '../data/data'
import { componentById, conflictGroups, conflictsIn, f2, instrumentByIsin, usePortfolio } from '../state/portfolio'
import { ComponentDetail } from './ComponentDetail'

export function ComponentsView() {
  const { state } = usePortfolio()
  const [q, setQ] = useState('')
  const [area, setArea] = useState('')
  const [provider, setProvider] = useState('')
  const [kind, setKind] = useState<'bb' | 'mp'>('bb')
  const [learn, setLearn] = useState<string | null>(null)
  // Learn more: the card expands into a large card and collapses back (React <ViewTransition>, shared names).
  const lastOpen = useRef<string | null>(null)
  const openLearn = (id: string) => { lastOpen.current = id; startTransition(() => setLearn(id)) }
  /** then: more state changes in the same transition (e.g. add the component: its row slides into the sidebar). */
  const closeLearn = (then?: () => void) => startTransition(() => { setLearn(null); then?.() })
  // After closing, focus goes back to that card's Learn more (the card was re-rendered, so look it up again).
  useEffect(() => {
    if (learn || !lastOpen.current) return
    document.getElementById('card-' + lastOpen.current)?.querySelector<HTMLElement>('button[aria-haspopup]')?.focus()
    lastOpen.current = null
  }, [learn])


  const ql = q.trim().toLowerCase()
  const filtered = COMPONENTS.filter((c) =>
    (!area || c.area === area) && (!provider || c.provider === provider) &&
    (!ql || `${c.name} ${c.desc} ${c.area} ${c.region} ${c.provider}`.toLowerCase().includes(ql)))
  const list = filtered.filter((c) => c.kind === kind)

  return (
    <Section screenHeading title="Component selection" description="Please add the components of the model portfolio." className="flex min-h-0 flex-1 flex-col">
      <div className="mt-4.5 grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_23.75rem] grid-rows-[minmax(0,1fr)] gap-7">
        <div className="flex min-h-0 flex-col">
          <div className="flex flex-wrap gap-x-3 gap-y-2.5">
            <SearchInput value={q} onValueChange={setQ} placeholder="Search components…" aria-label="Search components" className="flex-[1_1_15rem]" />
            <Select value={area} onValueChange={setArea} aria-label="Investment area" className="flex-[0_1_13rem]"
              items={[{ value: '', label: 'All investment areas' }, ...AREAS.map((a) => ({ value: a, label: a }))]} />
            <Select value={provider} onValueChange={setProvider} aria-label="Provider" className="flex-[0_1_13rem]"
              items={[{ value: '', label: 'All providers' }, ...PROVIDERS.map((a) => ({ value: a, label: a }))]} />
          </div>
          <Tabs value={kind} onValueChange={(v) => setKind(v as 'bb' | 'mp')}>
            <TabsList variant="sub" aria-label="Component type" className="mt-3.5 border-b border-line">
              <Tab value="bb">Building blocks <TabCount>{filtered.filter((c) => c.kind === 'bb').length}</TabCount></Tab>
              <Tab value="mp">Model portfolios <TabCount>{filtered.filter((c) => c.kind === 'mp').length}</TabCount></Tab>
            </TabsList>
          </Tabs>
          {/* 4px inner padding so the card focus outline is not clipped by the scroll container. */}
          <div className="-mx-1 mt-3 -mb-1 grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(15.625rem,1fr))] content-start gap-3 overflow-y-auto p-1 pr-2.5">
            {list.map((c) => <CatalogueCard key={c.id} c={c} expanded={learn === c.id} onLearnMore={() => openLearn(c.id)} />)}
            {!list.length && <div className="col-span-full px-1 py-2 text-fg-subtle">No components match these filters.</div>}
          </div>
        </div>
        <Basket />
      </div>
      <LearnMore id={learn} onClose={closeLearn} conflicts={learn ? conflictsIn(state, componentById(learn)) : []} />
    </Section>
  )
}

function useToggleComponent() {
  const { animate } = usePortfolio()
  return (id: string, on: boolean) => animate((s) => {
    s.comps.added = on ? (s.comps.added.includes(id) ? s.comps.added : [...s.comps.added, id]) : s.comps.added.filter((x) => x !== id)
  })
}

/**
 * Catalogue card = one big checkbox: the label fills the card, so a click anywhere toggles it.
 * Every card has the same fixed height: the name and meta take one line each and the description two (the full text is
 * in Learn more).
 * "Learn more" sits on top of the label (not inside it), so it opens details without toggling.
 */
/** View-transition names a catalogue card shares with its expanded version. */
// The description is not shared: it wraps differently in the card and the panel, so it would stretch; it fades with the box.
const cardNames = (id: string) => ({ box: `card-${id}`, title: `card-title-${id}`, meta: `card-meta-${id}` })

function CatalogueCard({ c, expanded, onLearnMore }: { c: Component; expanded: boolean; onLearnMore: () => void }) {
  const { state } = usePortfolio()
  const toggle = useToggleComponent()
  const on = state.comps.added.includes(c.id)
  const cf = conflictsIn(state, c)
  // While expanded, the card's slot stays (keeps the grid still) but is empty and has no names: the expanded card holds them.
  const n = expanded ? undefined : cardNames(c.id)
  const card = (
    <div id={'card-' + c.id} className={'relative flex h-34 min-w-0 rounded-sm border bg-surface hover:bg-surface-subtle has-[[role=checkbox]:focus-visible]:outline-2 has-[[role=checkbox]:focus-visible]:outline-offset-1 has-[[role=checkbox]:focus-visible]:outline-focus ' + (on ? 'border-selected' : 'border-line-strong')}>
      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5 px-4 pt-3.5 pb-10">
        <Checkbox checked={on} onCheckedChange={(v) => toggle(c.id, v)} className="mt-0.5 focus-visible:outline-none" />
        <span className="flex min-w-0 flex-col">
          <Shared name={n?.title} className="line-clamp-1 font-semibold">{c.name}</Shared>
          <Shared name={n?.meta} className="mt-px line-clamp-1 text-xs text-fg-muted">{c.area} · {c.region} · {c.provider}</Shared>
          <span className="mt-2 line-clamp-2 text-xs text-fg-secondary">{c.desc}</span>
        </span>
      </label>
      <Button variant="link" className="absolute bottom-2 left-9.5" onClick={onLearnMore} aria-haspopup="dialog">Learn more</Button>
      {/* The conflict tag sits in the footer, beside Learn more, so every card keeps the same height. */}
      {cf.length > 0 && <ConflictList items={cf} groups={conflictGroups(c, state.prefs)} max={1} compact className="absolute right-3 bottom-2 max-w-48 whitespace-nowrap" />}
    </div>
  )
  if (expanded) return <div aria-hidden className="invisible grid">{card}</div>
  return <ViewTransition name={n!.box} share="card-expand" default="none">{card}</ViewTransition>
}

function LearnMore({ id, onClose, conflicts }: { id: string | null; onClose: (then?: () => void) => void; conflicts: string[] }) {
  const { state } = usePortfolio()
  const toggle = useToggleComponent()
  // Mounted only while open: opening / closing swaps the card and this in one update, so they morph.
  const c = id ? componentById(id) : null
  if (!c) return null
  const on = state.comps.added.includes(c.id)
  const kind = c.kind === 'mp' ? 'model portfolio' : 'building block'
  return (
    <ExpandedCard
      name={cardNames(c.id).box}
      titleName={cardNames(c.id).title}
      metaName={cardNames(c.id).meta}
      onClose={() => onClose()}
      title={c.name}
      meta={`${c.area} · ${c.region} · ${c.provider}`}
      headerExtra={conflicts.length > 0 && <ConflictList items={conflicts} groups={conflictGroups(c, state.prefs)} />}
      footer={
        <>
          {on && <span className="mr-auto inline-flex items-center gap-1.5 text-xs text-fg-muted"><Check className="size-3 text-selected" strokeWidth={3} />In this portfolio</span>}
          <Button onClick={() => onClose()}>Close</Button>
          {/* Same transition: the card collapses back and its row slides into (or out of) the sidebar. */}
          {!on && <Button variant="primary" onClick={() => onClose(() => toggle(c.id, true))}>Add {kind}</Button>}
        </>
      }
    >
      <ComponentDetail c={c} />
    </ExpandedCard>
  )
}

const B_SHOW = 5

/** Portfolio components sidebar: one group per kind, borderless rows with a red tick. */
function Basket() {
  const { state, animate } = usePortfolio()
  const toggle = useToggleComponent()
  const added = state.comps.added.map(componentById)
  const bb = added.filter((c) => c.kind === 'bb')
  const mp = added.filter((c) => c.kind === 'mp')
  const total = state.comps.added.length + state.comps.inst.length + state.comps.cash.length
  const nConf = added.filter((c) => conflictsIn(state, c).length).length
  const compRow = (c: Component) => <BasketRow key={c.id} label={c.name} warn={conflictsIn(state, c).length > 0} onRemove={() => toggle(c.id, false)} />

  return (
    <aside aria-label="Portfolio components" className="min-h-0 overflow-y-auto border-l border-line pr-1.5 pb-2 pl-7">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base">Portfolio components</h3>
        <span className="text-xs text-fg-muted">{total} {total === 1 ? 'component' : 'components'}</span>
      </div>
      {nConf > 0 && (
        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-fg-secondary">
          <TriangleAlert className="mt-0.5 size-3 shrink-0 text-error" strokeWidth={1.75} />
          {nConf} {nConf === 1 ? 'component conflicts' : 'components conflict'} with your exclusions
        </div>
      )}
      <BasketGroup title="Building blocks" rows={bb.map(compRow)} />
      <BasketGroup title="Model portfolios" rows={mp.map(compRow)} />
      <BasketGroup
        title="Instruments"
        add={
          <MultiCombobox
            options={COMPONENT_INSTRUMENTS.map((x) => ({ id: x.isin, label: x.name, sub: x.isin }))}
            value={state.comps.inst}
            onValueChange={(v) => animate((s) => { s.comps.inst = v })}
            placeholder="Add by ISIN or instrument name…"
            aria-label="Add instrument"
            showTrigger={false}
            tone="select"
            closeOnSelect
          />
        }
        rows={state.comps.inst.map((isin) => {
          const x = instrumentByIsin(isin)
          return <BasketRow key={isin} label={x.name} sub={isin} onRemove={() => animate((s) => { s.comps.inst = s.comps.inst.filter((i) => i !== isin) })} />
        })}
      />
      <BasketGroup
        title="Cash positions"
        add={<CashAdd />}
        rows={state.comps.cash.map((c) => (
          <CashRow key={c.ccy} ccy={c.ccy} w={c.w} />
        ))}
      />
    </aside>
  )
}

/** Label + count, then the add field (if any), then the list. Long lists show 5, then “+N more” (never “+1 more”). */
function BasketGroup({ title, rows, add }: { title: string; rows: ReactNode[]; add?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const cap = rows.length > B_SHOW + 1
  const shown = open || !cap ? rows : rows.slice(0, B_SHOW)
  // The whole group is a boundary too, so headings, fields and rows below a change glide together instead of jumping.
  return (
    <ViewTransition update="group-move">
    <div className="mt-4.5 border-t border-line pt-4">
      <div className="mb-2.5"><GroupLabel count={rows.length ? `${rows.length} added` : undefined}>{title}</GroupLabel></div>
      {add}
      <div className={add ? 'mt-3.5' : ''}>
        {rows.length ? <div className="flex flex-col gap-0.5">{shown}</div> : <div className="text-xs text-fg-subtle">None added</div>}
        {cap && <Button variant="link" className="ml-4.5" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Show less' : `+${rows.length - B_SHOW} more`}</Button>}
      </div>
    </div>
    </ViewTransition>
  )
}

/** Each row is its own view-transition boundary: it slides in when added, fades out when removed, and glides when rows above it change. */
function BasketRow({ label, sub, warn, onRemove }: { label: string; sub?: string; warn?: boolean; /** Omit for rows that cannot be removed (cash positions). */ onRemove?: () => void }) {
  return (
    <ViewTransition enter="item-in" exit="item-out" update="item-move">
    <div className="flex min-h-7.5 items-center gap-2.5">
      <Check className="size-3 shrink-0 text-selected" strokeWidth={3} aria-hidden />
      <span className="min-w-0 flex-1">{label}{sub && <span className="ml-1.5 text-xs text-fg-muted">{sub}</span>}</span>
      {warn && <TriangleAlert className="size-3 text-error" strokeWidth={1.75} aria-label="Conflicts with exclusions" />}
      {onRemove && <RemoveButton onClick={onRemove} label={'Remove ' + label} className="text-fg-subtle" />}
    </div>
    </ViewTransition>
  )
}

function CashAdd() {
  const { state, animate } = usePortfolio()
  const left = CASH_CURRENCIES.filter((c) => !state.comps.cash.some((x) => x.ccy === c))
  const [ccy, setCcy] = useState(left[0] ?? '')
  if (!left.length) return null
  const cur = left.includes(ccy) ? ccy : left[0]
  // A new cash position starts at 0%; its weight is set on Component allocation.
  const add = () => animate((s) => { s.comps.cash.push({ ccy: cur, w: 0 }) })
  return (
    <div className="flex gap-2">
      <Select value={cur} onValueChange={setCcy} items={left.map((c) => ({ value: c, label: c }))} aria-label="Cash currency" className="min-w-0 flex-1" />
      <Button onClick={add}>Add cash position</Button>
    </div>
  )
}

/** Cash row: the currency can be changed (to one not used yet); the row itself cannot be removed. */
function CashRow({ ccy, w }: { ccy: string; w: number }) {
  const { state, animate } = usePortfolio()
  const items = CASH_CURRENCIES.filter((c) => c === ccy || !state.comps.cash.some((x) => x.ccy === c)).map((c) => ({ value: c, label: c }))
  const change = (v: string) => animate((s) => { const e = s.comps.cash.find((x) => x.ccy === ccy); if (e) e.ccy = v })
  return (
    <div className="flex min-h-7.5 items-center gap-2.5">
      <Check className="size-3 shrink-0 text-selected" strokeWidth={3} aria-hidden />
      <Select value={ccy} onValueChange={change} items={items} aria-label={`Currency of the ${ccy} cash position`} className="h-7 w-22" />
      <span className="text-xs text-fg-muted">{f2(w)}%</span>
    </div>
  )
}
