import { addTransitionType, startTransition, useEffect, useLayoutEffect, useRef, useState, ViewTransition } from 'react'
import { Button } from './components/ui/button'
import { TooltipProvider } from './components/ui/tag'
import { Tab, Tabs, TabsList } from './components/ui/tabs'
import { Section } from './components/ui/layout'
import { Tabs as RTabs } from 'radix-ui'
import { Info } from 'lucide-react'
import { BOOK_AS_OF, BOOK_USER, type BookEntry } from './data/data'
import { getBook, nextBookId, setBook } from './state/book'
import { benchmarkById, missingData, prefsInvalid, near100, openEntry, parentCode, portfolioAlloc, PortfolioProvider, usePortfolio, publishSim } from './state/portfolio'
import { BookView } from './views/BookView'
import { ParentLink } from './views/ParentLink'
import { DataView } from './views/DataView'
import { PreferencesView } from './views/PreferencesView'
import { ComponentsView } from './views/ComponentsView'
import { AllocationView } from './views/AllocationView'
import { ReportingView } from './views/ReportingView'
import { SimulationView } from './views/SimulationView'
import { ExposureView } from './views/ExposureView'

const STEPS = [
  { id: 'data', label: 'Model portfolio data' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'components', label: 'Component selection' },
  { id: 'allocation', label: 'Component allocation' },
  { id: 'simulation', label: 'Simulation' },
] as const
type StepId = (typeof STEPS)[number]['id']
/** Reporting is a tab of the flow but not a step of the creation sequence, so Back / forward skip it. Exposure is a page
 *  tab of an existing portfolio (during creation it is a view inside Simulation). */
type FlowStep = StepId | 'reporting' | 'exposure'
/** Tabs that edit the working version: opening one switches the page to New (Current is read-only). */
const EDITS = new Set<FlowStep>(['data', 'preferences', 'components', 'allocation'])
type Route = FlowStep | 'book'

/** The SMA book lives under #sma2: #sma2 is its book, #sma2/<step> a step of its flow. */
function readHash(): Route {
  const h = location.hash.replace(/^#sma2\/?/, '')
  return h === 'reporting' || h === 'exposure' || STEPS.some((s) => s.id === h) ? (h as Route) : 'book'
}
const hashOf = (r: Route) => (r === 'book' ? '#sma2' : '#sma2/' + r)

/** A full, independent copy of the model portfolio prototype (own book, own state), so the two can be compared. */
export function SmaApp() {
  const [route, setRoute] = useState<Route>(readHash)
  const current = useRef(route)
  // Route changes run in a transition tagged with the direction, so the step view slides forward or back.
  const show = (r: Route) => {
    const from = STEPS.findIndex((s) => s.id === current.current)
    const to = STEPS.findIndex((s) => s.id === r)
    current.current = r
    startTransition(() => {
      if (from > -1 && to > -1 && from !== to) addTransitionType(to > from ? 'forward' : 'back')
      setRoute(r)
    })
  }
  useEffect(() => {
    const on = () => { if (location.hash.startsWith('#sma2')) show(readHash()) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const go = (r: Route) => { history.replaceState(null, '', hashOf(r)); show(r) }

  return (
    <PortfolioProvider>
      <HashOpener onOpen={go} />
      <TooltipProvider delayDuration={300}>
        {route === 'book' ? <BookView /> : <Flow step={route} onStep={go} onBook={() => go('book')} />}
      </TooltipProvider>
    </PortfolioProvider>
  )
}

/**
 * Deep link #open/<book id>/<current|new>: opens that portfolio's Simulation on the given version (used by the parent
 * link of a customized version, which opens in a new tab).
 */
function HashOpener({ onOpen }: { onOpen: (r: Route) => void }) {
  const { update } = usePortfolio()
  useLayoutEffect(() => {
    const m = location.hash.match(/^#sma2\/open\/(\w+)\/(current|new)$/)
    const e = m && getBook().find((x) => x.id === m[1])
    if (!m || !e) return
    update((s) => openEntry(s, e, m[2] as 'current' | 'new'))
    onOpen('simulation')
  }, [])
  return null
}

function Flow({ step: askedIn, onStep: go, onBook }: { step: FlowStep; onStep: (r: FlowStep) => void; onBook: () => void }) {
  const { state, update } = usePortfolio()
  // A portfolio in its creation workflow keeps the step sequence; an existing one gets the page tabs.
  const creatingFlow = !!state.book.creating
  // Exposure is a view inside Simulation (as on the other screens), never a tab of its own.
  const asked: FlowStep = askedIn === 'exposure' ? 'simulation' : askedIn
  const mode = state.sim.mode
  const onStep = (r: FlowStep) => { if (EDITS.has(r) && mode === 'current') update((s) => { s.sim.mode = 'new' }); go(r) }
  const setMode = (m: 'current' | 'new') => { update((s) => { s.sim.mode = m }); if (m === 'current' && EDITS.has(asked)) go('simulation') }
  // Mandatory data of the first step gates everything: later steps stay locked and the draft cannot be saved.
  const missing = missingData(state)
  const blocked = missing.length > 0
  // Simulation's Current version is the published portfolio: read-only, so it can be neither saved as a draft nor published.
  const viewingCurrent = (asked === 'simulation' || asked === 'exposure') && mode === 'current'
  // Simulation needs a complete allocation: exactly 100%, never adjusted silently.
  const alloc = portfolioAlloc(state)
  const allocOk = near100(alloc.Equity + alloc.Bonds + alloc.Alternatives + alloc.Liquidity)
  // Preferences are optional, so the user may go straight from the data form to Component selection. Allocation and
  // Simulation need something to allocate: at least one building block, model portfolio or instrument (cash alone is not enough).
  const hasComponents = state.comps.added.length + state.comps.inst.length > 0
  const needsComponents = (id: string) => (id === 'allocation' || id === 'simulation' || id === 'exposure') && !hasComponents
  // A customized portfolio has no Component selection or Component allocation: its components, instruments and weights
  // come from the parent, and only its preferences can be edited.
  const custom = state.custom
  const steps = custom ? STEPS.filter((s) => s.id !== 'components' && s.id !== 'allocation') : STEPS
  // A new model portfolio has nothing to report on until its simulation is published (finalized).
  const reportingLocked = state.book.creating
  // Invalid limits on Preferences keep the user there until they are corrected (empty limits are fine: they are optional).
  const prefsBad = prefsInvalid(state)
  const afterPrefs = (id: string) => prefsBad && id !== 'data' && id !== 'preferences'
  const step: FlowStep = blocked ? 'data' : afterPrefs(asked) ? 'preferences' : asked === 'reporting' && reportingLocked ? 'simulation' : custom
    ? (asked === 'components' || asked === 'allocation' ? 'simulation' : asked)
    : needsComponents(asked) ? 'components' : (asked === 'simulation' || asked === 'exposure') && !allocOk ? 'allocation' : asked
  useEffect(() => { if (askedIn !== step) go(step) }, [askedIn, step])
  const i = steps.findIndex((s) => s.id === step)
  const prev = steps[i - 1]
  const next = steps[i + 1]
  // Publication gates: a decision on every open task and a total of exactly 100.00%. Deferred tasks do not block.
  const openTask = state.book.task?.status === 'Open'
  const simTotalOk = near100(state.sim.rows.filter((r) => !r.removed).reduce((t, r) => t + r.nw, 0))
  const publishBlock = custom && !custom.hasNew ? 'There is no new version to publish. Current stays active.'
    : viewingCurrent ? (state.sim.published ? 'Current is the last data load (read-only). Switch to New to make changes.' : 'Current is the published version (read-only). Switch to New to make changes.')
    : openTask ? 'To publish, accept, reject or defer the open position task.'
    : !simTotalOk ? 'To publish, the total weight must be exactly 100.00%.'
    : undefined
  /**
   * Writes the portfolio to the book. Save as draft keeps an existing entry's status (a new one is a Draft) and returns
   * to the book; Publish sets it to Published, drops task decisions that are settled (deferred ones stay) and stays on
   * this portfolio's Simulation, on New.
   */
  const save = (publish?: boolean) => {
    const a = portfolioAlloc(state)
    const fields = {
      name: state.data.name.trim(),
      benchmark: benchmarkById(state.data.benchmark)?.name ?? '',
      alloc: { Equity: Math.round(a.Equity), Bonds: Math.round(a.Bonds), Alternatives: Math.round(a.Alternatives), Liquidity: Math.round(a.Liquidity) },
      editedBy: BOOK_USER,
      modified: new Date().toLocaleDateString('en-GB'),
    }
    const l = getBook()
    const existing = l.find((e) => e.id === state.book.id)
    const id = existing ? existing.id : nextBookId(l)
    const hadCurrent = custom ? custom.version > 0 : !!existing && existing.status !== 'Draft'
    if (custom) {
      const own = { name: fields.name, editedBy: fields.editedBy, modified: fields.modified }
      if (!l.some((e) => e.id === state.book.id)) {
        // New customized version: listed under its parent, with the parent's benchmark and the inherited allocation.
        const parent = l.find((e) => e.id === custom.parentId)
        const entry: BookEntry = { id, type: 'Customized', parent: custom.parentId, creator: BOOK_USER, status: publish ? 'Published' : 'Draft', ...fields, benchmark: parent?.benchmark ?? fields.benchmark, version: publish ? 1 : undefined }
        const at = l.reduce((last, e, i) => (e.id === custom.parentId || e.parent === custom.parentId ? i : last), l.length - 1)
        setBook([...l.slice(0, at + 1), entry, ...l.slice(at + 1)])
      } else {
        // Publishing NEW replaces CURRENT: the version number goes up and a pending automatic update is settled (one that
        // could not be applied stays: the next data load retries). Saving a draft keeps everything else as it is.
        setBook(l.map((e): BookEntry => (e.id !== state.book.id ? e : publish
          ? { ...e, ...own, status: 'Published', auto: e.auto === 'invalid' ? 'invalid' : undefined, version: custom.version + 1 }
          : { ...e, ...own })))
      }
    } else if (l.some((e) => e.id === state.book.id)) {
      setBook(l.map((e): BookEntry => (e.id !== state.book.id ? e : publish
        ? { ...e, ...fields, status: 'Published', tasks: e.tasks?.filter((t) => t.status === 'Deferred') }
        : { ...e, ...fields })))
    } else setBook([...l, { id, type: 'Standard', creator: BOOK_USER, status: publish ? 'Published' : 'Draft', ...fields }])
    if (!publish) return onBook()
    update((s) => publishSim(s, id, hadCurrent))
    go('simulation')
  }
  // Version folder tabs, as Current / Solve all in the client book. A portfolio being created has only New.
  const entry = getBook().find((e) => e.id === state.book.id)
  const lastUpdate = state.sim.loadedOn || entry?.modified || BOOK_AS_OF
  const lastPublished = state.sim.publishedAt ?? (custom ? (custom.version > 0 ? custom.published : undefined) : entry?.status === 'Published' ? entry.modified : undefined)
  const pub = state.sim.published
  const name = state.data.name || (custom ? 'New customized version' : 'New model portfolio')
  const tabOff = (id: FlowStep) => (id === 'reporting' ? blocked || prefsBad || reportingLocked : (blocked && id !== 'data') || afterPrefs(id) || needsComponents(id) || ((id === 'simulation' || id === 'exposure') && !allocOk))
  const tabWhy = (id: FlowStep) => (blocked && id !== 'data' ? 'Complete the model portfolio data first' : afterPrefs(id) ? 'Correct the preferences first' : id === 'reporting' && reportingLocked ? 'Available once the simulation is published' : needsComponents(id) ? 'Select at least one component first' : (id === 'simulation' || id === 'exposure') && !allocOk ? 'The allocation must total exactly 100%' : undefined)
  return (
    <main className="flex min-h-0 w-full flex-1 flex-col">
      {/* No box around the flow (as the client book's portfolio page): the portfolio header sits on the page grey, then the tabs,
          the view (the only part that scrolls) and the action bar run edge to edge. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* As the client book's portfolio page: no page title, the breadcrumb carries the portfolio and its key facts. */}
        <header className="shrink-0 px-7 pt-3.5 pb-3">
          <h1 className="sr-only">{name}</h1>
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
            <a href="#sma2" className="text-link hover:text-link-hover">Model portfolio book</a>
            <span aria-hidden className="text-fg-muted">&lt;</span>
            {/* As the form design: code, name and currency side by side once they are filled in. */}
            {state.data.code || state.data.name
              ? <span className="inline-flex flex-wrap gap-x-3">{state.data.code && <span>{state.data.code}</span>}{state.data.name && <span>{state.data.name}</span>}<span className="ml-1">{state.data.ccy}</span></span>
              : <span>{name}</span>}
            {custom && (
              <span className="ml-2 text-xs text-fg-muted">
                <span className="mr-1.5 rounded-xs border border-control px-1.5 text-xs/4.5 text-fg">Customized</span>
                of <ParentLink />
              </span>
            )}
          </nav>
        </header>
        {/* Version folder tabs on the panel's top edge; the open one joins the panel below. A portfolio being created has
            no versions yet, so the panel starts right under the breadcrumb. */}
        {!creatingFlow && <div className="flex shrink-0 flex-wrap items-end gap-x-6 gap-y-2 px-4">
          <RTabs.Root value={creatingFlow ? 'new' : mode} onValueChange={(v) => setMode(v as 'current' | 'new')}>
            <RTabs.List aria-label="Portfolio version" className="-mb-px flex gap-1.5">
              {!creatingFlow && <VersionCard value="current" title="Current" sub={custom?.version === 0 ? 'Not published yet' : `Last updated: ${lastUpdate}`} disabled={custom?.version === 0} hint={custom?.version === 0 ? 'Not published yet: there is no current version' : undefined} />}
              <VersionCard value="new" title="New" sub={creatingFlow ? 'Not published yet' : lastPublished ? `Last published: ${lastPublished}` : 'No publication yet'} disabled={!!custom && !custom.hasNew} hint={custom && !custom.hasNew ? `No new version: the update from ${parentCode(custom)} could not be applied` : undefined} />
            </RTabs.List>
          </RTabs.Root>
          <div className="ml-auto flex items-center gap-1.5 pb-2.5 text-xs text-fg-muted">
            <Info className="size-3.5" strokeWidth={1.5} />
            {creatingFlow ? 'New model portfolio — nothing is published until you publish it.'
              : mode === 'current' ? (pub ? `Read-only — Current is the last data load; the version published on ${pub} applies from the next load.` : `Read-only — last updated on ${lastUpdate}.`)
              : pub ? `Working version — changes are compared with the version published on ${pub}.` : custom ? 'Pending, not published — Current stays active until you publish.' : 'Working version — changes stay here until you publish.'}
          </div>
        </div>}
        {/* The panel: one framed box holding the tabs, the working area (Stone 50) and the action bar. */}
        <div className="mx-4 flex min-h-0 flex-1 flex-col border border-line-strong">
        <Tabs value={step} onValueChange={(v) => onStep(v as FlowStep)}>
          <TabsList variant="step" className="border-b border-line bg-surface px-1">
            {/* The same tabs, in the same order, for a new and an existing portfolio (as on the other screens). */}
            {steps.map((s) => <Tab key={s.id} value={s.id} disabled={tabOff(s.id)} title={tabWhy(s.id)}>{s.label}</Tab>)}
            <Tab value="reporting" disabled={tabOff('reporting')} title={tabWhy('reporting')}>Reporting</Tab>
          </TabsList>
        </Tabs>

        {/* The working area is a light grey surface, so white fields, cards and tables stand out from it. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-shell-panel">
          {/* Animates only when a step change tags the transition 'forward' / 'back'; other updates inside stay instant. */}
          <ViewTransition update={{ forward: 'step-forward', back: 'step-back', default: 'none' }} default="none">
            <div className="flex min-h-0 flex-1 flex-col">
              {step === 'data' ? <DataView /> : step === 'preferences' ? <PreferencesView /> : step === 'components' ? <ComponentsView /> : step === 'allocation' ? <AllocationView /> : step === 'reporting' ? <ReportingView /> : step === 'exposure' ? <Section className="pt-4 pb-4"><ExposureView mode={mode} /></Section> : <SimulationView />}
            </div>
          </ViewTransition>
        </div>

        {/* Reporting has its own action (Generate) and is not part of the Back / forward sequence. */}
        {step !== 'reporting' && <ActionBar
          back={prev && { label: prev.label, onClick: () => onStep(prev.id) }}
          next={next ? { label: next.label, onClick: () => onStep(next.id), disabled: blocked || afterPrefs(next.id) || needsComponents(next.id) || (next.id === 'simulation' && !allocOk) } : { label: 'Publish', onClick: () => save(true), disabled: !!publishBlock }}
          onSave={viewingCurrent || (custom && custom.version > 0) ? undefined : () => save()}
          saveDisabled={blocked}
          note={custom ? (publishBlock ?? 'New is pending and not published. Current stays active until you publish.') : step === 'simulation' || !creatingFlow ? publishBlock : undefined}
        />}
        </div>
      </div>
    </main>
  )
}

/** Action bar (the page's own pale tone with a top rule, so it reads as the panel's footer without a heavy band): Back + Cancel on the left, Save as draft + the forward step (the one primary) on the right. */
function ActionBar({ back, next, onSave, saveDisabled, note }: { saveDisabled?: boolean; back?: { label: string; onClick: () => void }; next: { label: string; onClick: () => void; disabled?: boolean }; /** Omitted where nothing can be saved (the read-only Current version). */ onSave?: () => void; /** Short status next to the actions: what is still needed, or why saving is unavailable. */ note?: string }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 border-t border-line-strong bg-surface px-1.5 py-1.5">
      {/* As the form design: Cancel is the tertiary button on the left; Back, Save as draft and the forward step on the right. */}
      <div className="flex items-center gap-2.5">
        <Button variant="tertiary" size="sm" className="w-25">Cancel</Button>
        {back && <Button variant="secondary" size="sm" className="min-w-25" onClick={back.onClick}>{back.label}</Button>}
      </div>
      <div className="flex items-center gap-4.5">
        {note && <span role="status" className="mr-1.5 text-xs text-fg-muted">{note}</span>}
        {onSave && <Button variant="secondary" size="sm" className="min-w-25" disabled={saveDisabled} onClick={onSave}>Save as draft</Button>}
        <Button variant="primary" size="sm" className="min-w-25" disabled={next.disabled} onClick={next.onClick}>{next.label}</Button>
      </div>
    </div>
  )
}


function VersionCard({ value, title, sub, disabled, hint }: { value: 'current' | 'new'; title: string; sub: string; disabled?: boolean; hint?: string }) {
  return (
    <RTabs.Trigger
      value={value}
      disabled={disabled}
      title={hint}
      className="flex w-64 cursor-pointer flex-col justify-center border border-line bg-surface-subtle px-3 py-2 text-left outline-none hover:bg-surface-strong focus-visible:outline-2 focus-visible:outline-focus data-disabled:cursor-default data-disabled:opacity-60 data-[state=active]:cursor-default data-[state=active]:border-b-surface data-[state=active]:bg-surface"
    >
      <span className="text-base/5">{title}</span>
      <span className="self-end text-xs/4 text-fg-muted">{sub}</span>
    </RTabs.Trigger>
  )
}
