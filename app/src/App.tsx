import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addTransitionType, startTransition, useEffect, useLayoutEffect, useRef, useState, ViewTransition } from 'react'
import { Button } from './components/ui/button'
import { TooltipProvider } from './components/ui/tag'
import { Checkbox } from './components/ui/selection'
import { Tab, Tabs, TabsList } from './components/ui/tabs'
import { cn } from './lib/cn'
import { BOOK_USER, type BookEntry } from './data/data'
import { getBook, nextBookId, setBook } from './state/book'
import { benchmarkById, missingData, near100, openEntry, portfolioAlloc, PortfolioProvider, usePortfolio, publishSim } from './state/portfolio'
import { BookView } from './views/BookView'
import { ParentLink } from './views/ParentLink'
import { DataView } from './views/DataView'
import { DesignSystemPage } from './design-system/DesignSystemPage'
import { PreferencesView } from './views/PreferencesView'
import { ComponentsView } from './views/ComponentsView'
import { AllocationView } from './views/AllocationView'
import { ReportingView } from './views/ReportingView'
import { SimulationView } from './views/SimulationView'
import { SmaApp } from './sma/App'

const STEPS = [
  { id: 'data', label: 'Model portfolio data' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'components', label: 'Component selection' },
  { id: 'allocation', label: 'Component allocation' },
  { id: 'simulation', label: 'Simulation' },
] as const
type StepId = (typeof STEPS)[number]['id']
/** Reporting is a tab of the flow but not a step of the creation sequence, so Back / forward skip it. */
type FlowStep = StepId | 'reporting'
/** sma: the SMA book, an independent copy of the prototype with its own routes under #sma. */
type Route = FlowStep | 'design' | 'book' | 'sma'

function readHash(): Route {
  const h = location.hash.slice(1)
  if (h === 'sma' || h.startsWith('sma/')) return 'sma'
  return h === 'design' || h === 'reporting' || STEPS.some((s) => s.id === h) ? (h as Route) : 'book'
}

export default function App() {
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
    const on = () => show(readHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const go = (r: Route) => {
    history.replaceState(null, '', '#' + r)
    // The SMA book routes itself: tell it the hash moved back to its book.
    if (r === 'sma') window.dispatchEvent(new HashChangeEvent('hashchange'))
    show(r)
  }

  return (
    <PortfolioProvider>
      <HashOpener onOpen={go} />
      <TooltipProvider delayDuration={300}>
        {/* The MP book (incl. feedback) follows the client book shell: darker grey bands down both sides, and one wide
            central page holding the header, the toolbar band and the content. */}
        <div className={cn(route === 'sma' && 'h-dvh bg-shell-side')}>
        <div className={cn('flex h-dvh flex-col overflow-hidden', route === 'sma' && 'mx-auto w-[85%] bg-shell-well')}>
          <AppHeader route={route} onNavigate={go} wide={route === 'sma'} />
          {route === 'sma' ? <SmaApp /> : route === 'design' ? <DesignSystemPage /> : route === 'book' ? <BookView /> : <Flow step={route} onStep={go} onBook={() => go('book')} />}
        </div>
        </div>
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
    const m = location.hash.match(/^#open\/(\w+)\/(current|new)$/)
    const e = m && getBook().find((x) => x.id === m[1])
    if (!m || !e) return
    update((s) => openEntry(s, e, m[2] as 'current' | 'new'))
    onOpen('simulation')
  }, [])
  return null
}

function AppHeader({ route, onNavigate, wide }: { route: Route; onNavigate: (r: Route) => void; /** Inside the central page: the header uses the page's full width. */ wide?: boolean }) {
  const links: { id: string; label: string; note?: string; active: boolean; to: Route }[] = [
    { id: 'book', label: 'Model portfolio book', active: route !== 'design' && route !== 'sma', to: 'book' as Route },
    { id: 'sma', label: 'MP book', note: 'incl. feedback', active: route === 'sma', to: 'sma' as Route },
    { id: 'design', label: 'Design system', active: route === 'design', to: 'design' as Route },
  ]
  return (
    <header className="shrink-0 border-b border-line-strong bg-surface">
      <div className={cn('mx-auto flex min-h-14 items-stretch gap-12 px-6', !wide && 'max-w-340')}>
        <div className="flex h-6.5 w-22 items-center justify-center self-center border border-dashed border-line-strong text-xs tracking-widest text-fg-muted">[LOGO]</div>
        <nav className="flex gap-8" aria-label="Applications">
          {links.map((l) => (
            <a
              key={l.id}
              href={'#' + l.to}
              onClick={(e) => { e.preventDefault(); onNavigate(l.to) }}
              aria-current={l.active ? 'page' : undefined}
              className="flex flex-col justify-center border-b-2 border-transparent text-base text-fg hover:border-line-strong aria-[current=page]:border-tab-active"
            >
              {l.label}
              {l.note && <span className="-mt-0.5 text-xs text-fg-muted">{l.note}</span>}
            </a>
          ))}
        </nav>
        <ReduceMotion />
      </div>
    </header>
  )
}

function Flow({ step: asked, onStep, onBook }: { step: FlowStep; onStep: (r: FlowStep) => void; onBook: () => void }) {
  const { state, update } = usePortfolio()
  // Mandatory data of the first step gates everything: later steps stay locked and the draft cannot be saved.
  const missing = missingData(state)
  const blocked = missing.length > 0
  // Simulation's Current version is the published portfolio: read-only, so it can be neither saved as a draft nor published.
  const viewingCurrent = asked === 'simulation' && state.sim.mode === 'current'
  // Simulation needs a complete allocation: exactly 100%, never adjusted silently.
  const alloc = portfolioAlloc(state)
  const allocOk = near100(alloc.Equity + alloc.Bonds + alloc.Alternatives + alloc.Liquidity)
  // Preferences are optional, so the user may go straight from the data form to Component selection. Allocation and
  // Simulation need something to allocate: at least one building block, model portfolio or instrument (cash alone is not enough).
  const hasComponents = state.comps.added.length + state.comps.inst.length > 0
  const needsComponents = (id: string) => (id === 'allocation' || id === 'simulation') && !hasComponents
  // A customized portfolio has no Component selection or Component allocation: its components, instruments and weights
  // come from the parent, and only its preferences can be edited.
  const custom = state.custom
  const steps = custom ? STEPS.filter((s) => s.id !== 'components' && s.id !== 'allocation') : STEPS
  const step: FlowStep = blocked ? 'data' : custom
    ? (asked === 'components' || asked === 'allocation' ? 'simulation' : asked)
    : needsComponents(asked) ? 'components' : asked === 'simulation' && !allocOk ? 'allocation' : asked
  useEffect(() => { if (asked !== step) onStep(step) }, [asked, step])
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
   * this portfolio's Simulation, on Current.
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
    onStep('simulation')
  }
  return (
    <main className="mx-auto flex min-h-0 w-full max-w-340 flex-1 flex-col px-6">
      <nav aria-label="Breadcrumb" className="mt-3.5 mb-1.5 flex items-center gap-1.5 text-xs">
        <a href="#book" className="text-link hover:text-link-hover">Model portfolio book</a>
        <span aria-hidden className="text-fg-subtle">›</span>
        <span>{state.data.name || (custom ? 'New customized version' : 'New model portfolio')}</span>
      </nav>
      {/* The portfolio is the subject of every step: its name leads, its facts follow, and in Simulation a tag says which version is on screen. */}
      <div className="mb-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl">{state.data.name || (custom ? 'New customized version' : 'New model portfolio')}</h1>
        <span className="text-xs text-fg-muted">{[state.data.code, state.data.ccy].filter(Boolean).join(' · ')}</span>
        {custom && (
          <span className="self-center text-xs text-fg-muted">
            <span className="mr-1.5 rounded-xs border border-control px-1.5 text-xs/4.5 text-fg">Customized</span>
            of <ParentLink />
          </span>
        )}
        {step === 'simulation' && (
          <span className={cn('self-center rounded-xs px-1.5 text-xs/4.5 whitespace-nowrap', viewingCurrent ? 'border border-control text-fg-muted' : 'bg-surface-strong')}>
            {viewingCurrent ? (state.sim.published ? 'Current · last data load, read-only' : custom ? `Current version ${custom.version} · published, read-only` : 'Current version · published, read-only') : custom ? 'New version · pending, not published' : 'New version · working copy'}
          </span>
        )}
      </div>

      {/* Panel: tabs and action bar stay put; only the view scrolls (or its inner lists). */}
      <div className="mb-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border border-line-strong bg-surface">
        <Tabs value={step} onValueChange={(v) => onStep(v as FlowStep)}>
          <TabsList variant="step" className="border-b border-line px-5">
            {steps.map((s) => <Tab key={s.id} value={s.id} disabled={(blocked && s.id !== 'data') || needsComponents(s.id) || (s.id === 'simulation' && !allocOk)} title={blocked && s.id !== 'data' ? 'Complete the model portfolio data first' : needsComponents(s.id) ? 'Select at least one component first' : s.id === 'simulation' && !allocOk ? 'The allocation must total exactly 100%' : undefined}>{s.label}</Tab>)}
            <Tab value="reporting" disabled={blocked} title={blocked ? 'Complete the model portfolio data first' : undefined}>Reporting</Tab>
          </TabsList>
        </Tabs>

        <div className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto')}>
          {/* Animates only when a step change tags the transition 'forward' / 'back'; other updates inside stay instant. */}
          <ViewTransition update={{ forward: 'step-forward', back: 'step-back', default: 'none' }} default="none">
            <div className="flex min-h-0 flex-1 flex-col">
              {step === 'data' ? <DataView /> : step === 'preferences' ? <PreferencesView /> : step === 'components' ? <ComponentsView /> : step === 'allocation' ? <AllocationView /> : step === 'reporting' ? <ReportingView /> : <SimulationView />}
            </div>
          </ViewTransition>
        </div>

        {/* Reporting has its own action (Generate) and is not part of the Back / forward sequence. */}
        {step !== 'reporting' && <ActionBar
          back={prev && { label: prev.label, onClick: () => onStep(prev.id) }}
          next={next ? { label: next.label, onClick: () => onStep(next.id), disabled: blocked || needsComponents(next.id) || (next.id === 'simulation' && !allocOk) } : { label: 'Publish', onClick: () => save(true), disabled: !!publishBlock }}
          onSave={viewingCurrent || (custom && custom.version > 0) ? undefined : () => save()}
          saveDisabled={blocked}
          note={custom && step === 'simulation' ? (publishBlock ?? 'New is pending and not published. Current stays active until you publish.') : blocked ? `Still needed: ${missing.join(', ')}.` : step === 'components' && !hasComponents ? 'Select at least one component to continue.' : step === 'allocation' && !allocOk ? 'The allocation must total exactly 100% to open Simulation.' : step === 'simulation' ? publishBlock : undefined}
        />}
      </div>
    </main>
  )
}

/** Action bar (the page's own pale tone with a top rule, so it reads as the panel's footer without a heavy band): Back + Cancel on the left, Save as draft + the forward step (the one primary) on the right. */
function ActionBar({ back, next, onSave, saveDisabled, note }: { saveDisabled?: boolean; back?: { label: string; onClick: () => void }; next: { label: string; onClick: () => void; disabled?: boolean }; /** Omitted where nothing can be saved (the read-only Current version). */ onSave?: () => void; /** Short status next to the actions: what is still needed, or why saving is unavailable. */ note?: string }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 border-t border-line-strong bg-surface-muted px-6 py-3">
      <div className="flex items-center gap-2.5">
        {back && (
          <Button variant="secondary" size="lg" onClick={back.onClick}>
            <ChevronLeft className="size-3.5" strokeWidth={2} />
            {back.label}
          </Button>
        )}
        <Button variant="link" className="h-9 px-2">Cancel</Button>
      </div>
      <div className="flex items-center gap-2.5">
        {note && <span role="status" className="mr-1.5 text-xs text-fg-muted">{note}</span>}
        {onSave && <Button variant="secondary" size="lg" disabled={saveDisabled} onClick={onSave}>Save as draft</Button>}
        <Button variant="primary" size="lg" disabled={next.disabled} onClick={next.onClick}>
          {next.label}
          <ChevronRight className="size-3.5" strokeWidth={2} />
        </Button>
      </div>
    </div>
  )
}

const MOTION_KEY = 'reduce-motion'
function readReduceMotion() {
  try { return localStorage.getItem(MOTION_KEY) !== 'off' } catch { return true }
}
/**
 * Reduce motion (on by default): sets data-reduce-motion on <html>, which motion.css uses to switch off
 * view transitions and every CSS transition / animation. Remembered in this browser.
 */
function ReduceMotion() {
  const [on, setOn] = useState(readReduceMotion)
  useEffect(() => {
    document.documentElement.toggleAttribute('data-reduce-motion', on)
    try { localStorage.setItem(MOTION_KEY, on ? 'on' : 'off') } catch { /* storage unavailable */ }
  }, [on])
  return (
    <label className="flex cursor-pointer items-center gap-2 self-center text-xs text-fg-muted">
      <Checkbox checked={on} onCheckedChange={setOn} />
      Reduce motion
    </label>
  )
}
