import { createContext, startTransition, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  AREA_CLASS, BENCHMARKS, CATEGORIES, COMPONENTS, COMPONENT_INSTRUMENTS, EXCLUDABLE_INSTRUMENTS, PARENT_UPDATE, POSITIONS, RATINGS, ESG_SCORES,
  type AssetClass, type AutoUpdate, type BookEntry, type BookTask, type CategoryId, type Component, type Position,
} from '../data/data'
import { getBook } from './book'

/** kept: the user decided to keep a position that breaches a preference; keptOn records when (shown with the warning icon). */
export type SimRow = Position & {
  nw: number; removed: boolean; kept: boolean; keptOn?: string
  /** Customized automatic update: what the update did to this position, and the parent's target for an added one. */
  auto?: 'added' | 'reduced' | 'protected'; target?: number
  /** Customized: a position the user added. Its weight is fixed: only the user changes it, parent updates never do. */
  own?: boolean
  /** Weight in the version last published since the data load (set only once something was published). */
  pw?: number
}
/** Preferences a customized portfolio can set itself (minimum position size and maximum instruments are always inherited). */
export type PrefKey = CategoryId | 'rating' | 'esg' | 'inst'
export const PREF_KEYS: PrefKey[] = ['geography', 'sector', 'currency', 'category', 'rating', 'esg', 'inst']
/**
 * A customized portfolio: linked to its parent STANDARD portfolio, whose values it inherits except where it has its
 * own value (an override). Parent changes reach its NEW automatically; CURRENT changes only when NEW is published.
 */
export type CustomState = {
  parentId: string; parentName: string
  /** Outcome of the latest automatic update, or null when none is pending. */
  auto: AutoUpdate | null
  /** Whether a NEW version exists (it does not after an update that could not be applied, until a preference is edited). */
  hasNew: boolean
  version: number; published: string
  /** Preferences with the child's own value. */
  overrides: PrefKey[]
  /** The parent's current values (what an inherited preference shows, and what reset brings back). */
  parentPrefs: PortfolioState['prefs']
  /** Parent preference changes in the latest update: applied (inherited) or skipped (own value kept). */
  applied: PrefKey[]; skipped: PrefKey[]
  /** Inherited limits the latest update changed. */
  limits: { label: string; from: string; to: string }[]
}
export type CashEntry = { ccy: string; w: number }

export type PortfolioState = {
  /** ccy is fixed to EUR for every model portfolio; description is optional. */
  data: { code: string; name: string; description: string; ccy: string; benchmark: string }
  prefs: {
    minPos: string; maxInst: string
    sel: Record<CategoryId, string[]>
    /** Index of the first excluded rating; RATINGS.length = nothing excluded. */
    rating: number
    unrated: boolean
    /** Number of excluded ESG scores from the bottom (0 = none). */
    esg: number
    inst: string[]
  }
  comps: { added: string[]; inst: string[]; cash: CashEntry[] }
  /** Weights per allocation key ('c:<component id>', 'i:<isin>'); cash weights live on the cash entries. */
  weights: Record<string, number>
  /** mode: which version Simulation shows. Current is the published portfolio (read-only); New is the working version. */
  /** published: date of the last publication since the data load. Current stays the data-load version until the next
   *  load; the published weights sit next to it, and New starts again from them. */
  /** publishedAt: date and time of the latest successful publication in this session (any kind), for the New card. */
  sim: { rows: SimRow[]; mode: 'current' | 'new'; published?: string; publishedAt?: string; /** When Current was last updated (its data load, or its first publication). */ loadedOn?: string }
  /** Which book entry is open in the flow, and its open position task (shown at the top of Simulation). */
  /** creating: a brand-new portfolio in its creation workflow (the only time preference warnings are shown). */
  book: { id: string; task: BookTask | null; creating?: boolean }
  /** Set when the open portfolio is a customized version. */
  custom: CustomState | null
}

const INITIAL: PortfolioState = {
  data: { code: 'MP_STD_0001', name: 'SMA - Global - Equities', description: '', ccy: 'EUR', benchmark: 'glob-eq' },
  prefs: {
    minPos: '0.5', maxInst: '150',
    sel: { geography: ['em'], sector: ['energy', 'ind'], currency: ['EUR', 'JPY', 'SGD', 'SEK', 'DKK', 'NOK'], category: ['deriv'] },
    rating: 10, unrated: true, esg: 2, // Ba1 and below excluded
    inst: ['US0378331005', 'FR0000120271'],
  },
  comps: {
    added: ['keyeq', 'gem', 'gbond', 'defender', 'holt-world', 'holt-spx', 'ch-eq', 'jp-eq', 'hybond', 'gold', 'mp-balanced', 'mp-income'],
    inst: ['US02079K1079'],
    cash: [{ ccy: 'EUR', w: 2 }],
  },
  weights: {
    'c:keyeq': 18, 'c:gem': 6, 'c:gbond': 16, 'c:defender': 8, 'c:holt-world': 10, 'c:holt-spx': 9, 'c:ch-eq': 6, 'c:jp-eq': 4,
    'c:hybond': 7, 'c:gold': 3, 'c:mp-balanced': 6, 'c:mp-income': 2, 'i:US02079K1079': 3,
  },
  sim: { rows: POSITIONS.map((p) => ({ ...p, nw: p.w, removed: false, kept: false })), mode: 'new' },
  book: { id: '', task: null },
  custom: null,
}

type Recipe = (draft: PortfolioState) => void
/**
 * update   — plain state change (typing, dragging: must feel instant).
 * animate  — the same, inside startTransition, so <ViewTransition> boundaries it touches animate
 *            (adding/removing items, picking an option). Never use it for text input.
 */
type Ctx = { state: PortfolioState; update: (recipe: Recipe) => void; animate: (recipe: Recipe) => void }
const PortfolioContext = createContext<Ctx | null>(null)

/** Holds the whole flow; `update` takes a recipe that edits a copy of the state (small state, so copying is cheap). */
export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(INITIAL)
  const update = useCallback((recipe: (draft: PortfolioState) => void) => {
    setState((s) => {
      const draft = structuredClone(s)
      recipe(draft)
      return draft
    })
  }, [])
  const animate = useCallback((recipe: Recipe) => startTransition(() => update(recipe)), [update])
  const value = useMemo(() => ({ state, update, animate }), [state, update, animate])
  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext)
  if (!ctx) throw new Error('usePortfolio must be used inside <PortfolioProvider>')
  return ctx
}

// ---- Derived data -------------------------------------------------------------

/**
 * Mandatory data of the first step: code, name and benchmark (currency is fixed to EUR, description is optional).
 * While anything is missing the later steps are locked and the portfolio cannot be saved as a draft.
 */
export function missingData(s: PortfolioState): string[] {
  const d = s.data
  return [!d.code.trim() && 'code', !d.name.trim() && 'name', !BENCHMARKS.some((b) => b.id === d.benchmark) && 'benchmark'].filter((v): v is string => !!v)
}

/**
 * A new model portfolio starts empty: no name, code or benchmark, no preferences or exclusions, no building blocks,
 * model portfolios or instruments, no weights. The one thing that exists is the default EUR cash position at 0%.
 */
export function startNew(s: PortfolioState) {
  s.data = { code: '', name: '', description: '', ccy: 'EUR', benchmark: '' }
  s.prefs = { minPos: '', maxInst: '', sel: { geography: [], sector: [], currency: [], category: [] }, rating: RATINGS.length, unrated: false, esg: 0, inst: [] }
  s.comps = { added: [], inst: [], cash: [{ ccy: 'EUR', w: 0 }] }
  s.weights = {}
  s.book = { id: '', task: null, creating: true }
  s.custom = null
  s.sim.mode = 'new'
  s.sim.rows = POSITIONS.map((p) => ({ ...p, nw: p.w, removed: false, kept: false }))
  s.sim.published = undefined
  s.sim.publishedAt = undefined
  s.sim.loadedOn = undefined
}
/**
 * A brand-new portfolio in its creation workflow. Warning icons and conflict tags show everywhere; only the creation
 * workflow asks the user to decide (Keep / Remove an excluded instrument in Simulation).
 */
export const isCreating = (s: PortfolioState) => !!s.book.creating
/** A component's conflicts with the exclusions (shown for every portfolio). */
export const conflictsIn = (s: PortfolioState, c: Component) => conflictsOf(c, s.prefs)
/** Opening an existing portfolio from the book shows the illustrative content again (the prototype stores one sample). */
export function restoreSample(s: PortfolioState) {
  const fresh = structuredClone(INITIAL)
  s.data = fresh.data
  s.prefs = fresh.prefs
  s.comps = fresh.comps
  s.weights = fresh.weights
  s.sim.rows = fresh.sim.rows
  s.sim.published = undefined
  s.sim.publishedAt = undefined
  s.sim.loadedOn = undefined
  s.custom = null
}

/**
 * Opens a customized version with its sample automatic update (prototype data, the same parent change for every child):
 *   - the parent adds Latin America to its geography exclusions (inherited here, so it reaches NEW at once), changes its
 *     sector exclusions (the child has its own value, so the parent value is skipped) and lowers its maximum number of
 *     instruments (an inherited limit, always applied);
 *   - after the next data load the parent requires a new instrument at its target weight, funded by reducing every
 *     eligible position proportionally, cash included; protected positions are left as they are.
 * CURRENT is the last published child version and never changes here.
 */
export function openCustomized(s: PortfolioState, e: BookEntry, parent: BookEntry | undefined) {
  restoreSample(s)
  s.data.name = e.name
  s.data.code = 'MP_' + e.id
  s.book = { id: e.id, task: null }
  s.sim.loadedOn = e.modified
  // Apple is on the inherited excluded list, so the child does not hold it: that weight sits in cash.
  s.sim.rows = s.sim.rows.filter((r) => r.id !== 'aapl').map((r) => (r.id === 'eur' ? { ...r, w: 3.5, nw: 3.5 } : r))
  const parentPrefs = structuredClone(s.prefs)
  // Child's own values (published in CURRENT): sector exclusions narrowed to Energy only.
  s.prefs.sel.sector = ['energy']
  const held = s.sim.rows.filter((r) => r.w > 0).length
  const draft = e.status === 'Draft'
  const custom: CustomState = {
    parentId: parent?.id ?? '', parentName: parent?.name ?? '', auto: e.auto ?? null, hasNew: draft || (!!e.auto && e.auto !== 'invalid'),
    version: e.version ?? (draft ? 0 : 1), published: e.modified, overrides: ['sector'], parentPrefs,
    applied: [], skipped: [], limits: [],
  }
  if (e.auto) {
    // Parent preference changes: geography (inherited → applied), sector (own value → skipped).
    parentPrefs.sel.geography = [...parentPrefs.sel.geography, 'latam']
    parentPrefs.sel.sector = [...parentPrefs.sel.sector, 'fin']
    if (e.auto === 'invalid') {
      // Nothing is applied, not even the preference changes (no partial update): the parent's new maximum equals what the
      // portfolio already holds, so the required instrument cannot be added.
      parentPrefs.maxInst = String(held)
    } else {
      custom.skipped = ['sector']
      custom.applied = ['geography']
      s.prefs.sel.geography = [...parentPrefs.sel.geography]
      custom.limits = [{ label: 'Maximum number of instruments', from: s.prefs.maxInst, to: '120' }]
      parentPrefs.maxInst = '120'
      s.prefs.maxInst = '120'
      if (e.auto === 'ready') fundRequired(s.sim.rows)
    }
  }
  s.custom = custom
  s.sim.mode = custom.hasNew ? 'new' : 'current'
}

/**
 * Opens a book entry in the flow. Standard: the sample portfolio with the entry's name and its first position task.
 * Customized: see openCustomized. `mode` picks the version Simulation shows first.
 */
export function openEntry(s: PortfolioState, e: BookEntry, mode: 'current' | 'new' = 'new') {
  if (e.type === 'Customized') {
    openCustomized(s, e, getBook().find((x) => x.id === e.parent))
    if (mode === 'current' && s.custom && s.custom.version > 0) s.sim.mode = 'current'
    return
  }
  restoreSample(s)
  s.data.name = e.name
  s.data.code = 'MP_' + e.id
  const task = e.tasks?.[0] ?? null
  s.book = { id: e.id, task }
  s.sim.loadedOn = e.modified
  s.sim.mode = mode
  // An open task brings the official target into New (the rest of the portfolio is not adjusted until it is
  // accepted); a rejected or deferred one keeps the current weight.
  if (task) {
    const r = s.sim.rows.find((x) => x.id === task.rowId)
    if (r) r.nw = task.status === 'Accepted' || task.status === 'Open' ? task.next : r.w
  }
}

/**
 * Starts a new customized version of a published STANDARD portfolio: everything is inherited from the parent (its
 * preferences, components, weights, currency and benchmark); only a code and a name are needed. Nothing is published yet.
 */
export function startCustomized(s: PortfolioState, parent: BookEntry) {
  restoreSample(s)
  s.data.name = ''
  s.data.code = ''
  s.book = { id: '', task: null }
  s.sim.rows = s.sim.rows.filter((r) => r.id !== 'aapl').map((r) => (r.id === 'eur' ? { ...r, w: 3.5, nw: 3.5 } : r))
  s.custom = {
    parentId: parent.id, parentName: parent.name, auto: null, hasNew: true, version: 0, published: '',
    overrides: [], parentPrefs: structuredClone(s.prefs), applied: [], skipped: [], limits: [],
  }
  s.sim.mode = 'new'
}

/**
 * Publishing keeps the user on the portfolio's Simulation, on New. A portfolio that already had a Current (from the
 * data load) keeps it until the next load: the new figures become the Published weights, shown next to Current, and New
 * starts again from them (no pending change). A portfolio published for the first time has no data-load version yet, so
 * what was published becomes its Current as well as its Published weights.
 */
export function publishSim(s: PortfolioState, id: string, hadCurrent: boolean) {
  const today = new Date().toLocaleDateString('en-GB')
  s.sim.rows.forEach((r) => {
    const v = r.removed ? 0 : r.nw
    if (!hadCurrent) r.w = v
    r.pw = v
    r.nw = v; r.removed = false; r.auto = undefined; r.target = undefined
  })
  s.sim.published = today
  if (!hadCurrent) s.sim.loadedOn = today
  s.sim.publishedAt = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  // The user stays on New, which starts again from what was just published.
  s.sim.mode = 'new'
  s.book.id = id
  s.book.creating = false
  if (s.book.task && s.book.task.status !== 'Deferred') s.book.task = null
  if (s.custom) {
    const c = s.custom
    c.version += 1; c.published = today; c.hasNew = true
    c.auto = c.auto === 'invalid' ? 'invalid' : null
    c.applied = []; c.skipped = []; c.limits = []
  }
}

/** The parent is referred to by its model portfolio code. */
export const parentCode = (c: CustomState) => 'MP_' + c.parentId

/** Positions the automatic update may reduce: held, not protected. */
export const eligibleForReduction = (r: SimRow) => r.w > 0 && r.id !== PARENT_UPDATE.protectedId && !r.own

/**
 * Adds the parent's required instrument at the parent's target weight and funds it by reducing every eligible position
 * by the same share of its weight (cash included). Weights are rounded to 2 decimals; the rounding rest goes to the
 * largest eligible position so the total is exactly 100.00%.
 */
function fundRequired(rows: SimRow[]) {
  const { instrument: inst } = PARENT_UPDATE
  const pool = rows.filter(eligibleForReduction)
  const poolW = pool.reduce((t, r) => t + r.w, 0)
  const keep = 1 - inst.target / poolW
  rows.forEach((r) => {
    if (eligibleForReduction(r)) { r.nw = round2(r.w * keep); r.auto = 'reduced' }
    else if (r.id === PARENT_UPDATE.protectedId) r.auto = 'protected'
  })
  const { target, ...pos } = inst
  rows.unshift({ ...pos, nw: target, removed: false, kept: false, auto: 'added', target })
  const rest = round2(100 - rows.reduce((t, r) => t + r.nw, 0))
  if (rest) { const big = [...pool].sort((a, b) => b.w - a.w)[0]; big.nw = round2(big.nw + rest) }
}
/** Share of its weight each eligible position gives up (same for all), for the update summary. */
export function reductionShare(rows: SimRow[]) {
  const poolW = rows.filter(eligibleForReduction).reduce((t, r) => t + r.w, 0)
  return poolW ? (PARENT_UPDATE.instrument.target / poolW) * 100 : 0
}

/**
 * Customized own positions. Adding one (or raising its weight) takes the weight from the other positions proportionally,
 * cash included; lowering or removing it gives the weight back the same way. Protected positions and other own positions
 * never move. Rounding goes to the largest position so the total stays exactly 100.00%.
 */
function rebalanceOthers(rows: SimRow[], amount: number) {
  const pool = rows.filter((r) => !r.removed && r.nw > 0 && !r.own && r.id !== PARENT_UPDATE.protectedId)
  const poolW = pool.reduce((t, r) => t + r.nw, 0)
  if (poolW <= amount) return false
  const before = pool.reduce((t, r) => t + r.nw, 0)
  pool.forEach((r) => { r.nw = round2(r.nw * (1 - amount / poolW)) })
  const rest = round2(before - amount - pool.reduce((t, r) => t + r.nw, 0))
  if (rest) { const big = [...pool].sort((a, b) => b.nw - a.nw)[0]; big.nw = round2(big.nw + rest) }
  return true
}
export function addOwnPosition(s: PortfolioState, p: Position, weight: number) {
  if (!s.custom || !rebalanceOthers(s.sim.rows, weight)) return
  s.sim.rows.unshift({ ...p, nw: round2(weight), removed: false, kept: false, own: true })
  s.custom.hasNew = true
  s.sim.mode = 'new'
}
export function setOwnWeight(s: PortfolioState, id: string, weight: number) {
  const r = s.sim.rows.find((x) => x.id === id)
  if (!r || !rebalanceOthers(s.sim.rows, weight - r.nw)) return
  r.nw = round2(weight)
}
export function removeOwnPosition(s: PortfolioState, id: string) {
  const r = s.sim.rows.find((x) => x.id === id)
  if (!r) return
  rebalanceOthers(s.sim.rows, -r.nw)
  s.sim.rows = s.sim.rows.filter((x) => x.id !== id)
}

/** Editing a preference of a customized portfolio gives it its own value and creates or refreshes NEW. */
export function setOwnValue(s: PortfolioState, k: PrefKey) {
  if (!s.custom) return
  if (!s.custom.overrides.includes(k)) s.custom.overrides.push(k)
  if (!s.custom.hasNew) { s.custom.hasNew = true; s.sim.mode = 'new' }
}
/** Reset to inherit: the parent's current value goes into NEW and future parent changes flow again. */
export function resetToInherit(s: PortfolioState, k: PrefKey) {
  if (!s.custom) return
  const pp = s.custom.parentPrefs
  if (k === 'rating') { s.prefs.rating = pp.rating; s.prefs.unrated = pp.unrated }
  else if (k === 'esg') s.prefs.esg = pp.esg
  else if (k === 'inst') s.prefs.inst = [...pp.inst]
  else s.prefs.sel[k] = [...pp.sel[k]]
  s.custom.overrides = s.custom.overrides.filter((x) => x !== k)
  if (!s.custom.hasNew) { s.custom.hasNew = true; s.sim.mode = 'new' }
}
/** A preference's value as short text (for parent-vs-own comparisons). */
export function prefText(p: PortfolioState['prefs'], k: PrefKey) {
  if (k === 'rating') return [p.rating < RATINGS.length ? RATINGS[p.rating] + ' and below' : '', p.unrated ? 'not rated' : ''].filter(Boolean).join(', ') || 'None'
  if (k === 'esg') return p.esg > 0 ? `Score ${ESG_SCORES[p.esg - 1]} and below` : 'None'
  if (k === 'inst') return p.inst.map((x) => instrumentByIsin(x).name).join(', ') || 'None'
  return p.sel[k].map((id) => optionLabel(k, id)).join(', ') || 'None'
}
export const PREF_LABEL: Record<PrefKey, string> = {
  geography: 'Geography exclusions', sector: 'Sector exclusions', currency: 'Currency exclusions', category: 'Instrument category exclusions',
  rating: 'Credit rating exclusions', esg: 'ESG exclusions', inst: 'Excluded instruments',
}

export const componentById = (id: string) => COMPONENTS.find((c) => c.id === id)!
export const instrumentByIsin = (isin: string) => COMPONENT_INSTRUMENTS.find((x) => x.isin === isin) ?? EXCLUDABLE_INSTRUMENTS.find((x) => x.isin === isin)!
export const benchmarkById = (id: string) => BENCHMARKS.find((b) => b.id === id)
export const optionLabel = (cat: CategoryId, id: string) => CATEGORIES.find((c) => c.id === cat)!.options.find((o) => o.id === id)!.label

/** Exclusions a component conflicts with (geography and sector), as labels. */
/** The same conflicts grouped by preference type (for the full list: type in grey, values in red). */
export function conflictGroups(c: Component, prefs: PortfolioState['prefs']) {
  return ([['Geography', 'geography', c.geo], ['Sector', 'sector', c.sector]] as const)
    .map(([label, cat, ids]) => ({ label, values: (ids ?? []).filter((id) => prefs.sel[cat].includes(id)).map((id) => optionLabel(cat, id)) }))
    .filter((g) => g.values.length > 0)
}
export function conflictsOf(c: Component, prefs: PortfolioState['prefs']) {
  const out: string[] = []
  ;([['geography', c.geo], ['sector', c.sector]] as const).forEach(([cat, ids]) => {
    ;(ids ?? []).forEach((id) => { if (prefs.sel[cat].includes(id)) out.push(optionLabel(cat, id)) })
  })
  return out
}

export type AllocItem = {
  key: string; kind: 'bb' | 'mp' | 'inst' | 'cash'; name: string; meta: string; cls: AssetClass
  comp?: Component; cashCcy?: string
}
/** Everything picked on Component selection, as rows for Component allocation. */
export function allocItems(s: PortfolioState): AllocItem[] {
  return [
    ...s.comps.added.map((id) => {
      const c = componentById(id)
      return { key: 'c:' + id, kind: c.kind, name: c.name, meta: `${c.area} · ${c.region} · ${c.provider}`, cls: AREA_CLASS[c.area] ?? 'Equity', comp: c } as AllocItem
    }),
    ...s.comps.inst.map((isin) => ({ key: 'i:' + isin, kind: 'inst', name: instrumentByIsin(isin).name, meta: 'Instrument · ' + isin, cls: 'Equity' }) as AllocItem),
    ...s.comps.cash.map((c) => ({ key: 'k:' + c.ccy, kind: 'cash', name: 'Cash position', meta: c.ccy, cls: 'Liquidity', cashCcy: c.ccy }) as AllocItem),
  ]
}
export function weightOf(s: PortfolioState, it: AllocItem) {
  return it.kind === 'cash' ? (s.comps.cash.find((c) => c.ccy === it.cashCcy)?.w ?? 0) : (s.weights[it.key] ?? 0)
}
export function setWeight(draft: PortfolioState, it: AllocItem, v: number) {
  if (it.kind === 'cash') { const c = draft.comps.cash.find((x) => x.ccy === it.cashCcy); if (c) c.w = v }
  else draft.weights[it.key] = v
}
export function removeItem(draft: PortfolioState, key: string) {
  const id = key.slice(2)
  if (key[0] === 'c') draft.comps.added = draft.comps.added.filter((x) => x !== id)
  else if (key[0] === 'i') draft.comps.inst = draft.comps.inst.filter((x) => x !== id)
  else draft.comps.cash = draft.comps.cash.filter((c) => c.ccy !== id)
  delete draft.weights[key]
}

export type Alloc = Record<AssetClass, number>
const emptyAlloc = (): Alloc => ({ Equity: 0, Bonds: 0, Alternatives: 0, Liquidity: 0 })
export function portfolioAlloc(s: PortfolioState): Alloc {
  const a = emptyAlloc()
  allocItems(s).forEach((it) => { a[it.cls] += weightOf(s, it) })
  return a
}
/** The benchmark picked on Model portfolio data, mapped to asset classes. */
export function benchmarkAlloc(s: PortfolioState): Alloc {
  const a = emptyAlloc()
  benchmarkById(s.data.benchmark)?.parts.forEach(([name, w]) => {
    const cls: AssetClass = /cash/i.test(name) ? 'Liquidity' : /bloomberg|bond|treasury|aggregate/i.test(name) ? 'Bonds' : 'Equity'
    a[cls] += w
  })
  return a
}
export function simAlloc(s: PortfolioState, mode: 'current' | 'new' | 'published'): Alloc {
  const a = emptyAlloc()
  s.sim.rows.forEach((r) => { if (mode === 'current') a[r.cls] += r.w; else if (mode === 'published') a[r.cls] += r.pw ?? 0; else if (!r.removed) a[r.cls] += r.nw })
  return a
}

/** Exclusions as one short line; long lists become counts ("6 currencies"). */
export function exclusionSummary(p: PortfolioState['prefs']) {
  const parts: string[] = []
  const add = (cat: CategoryId, noun: string) => {
    const l = p.sel[cat].map((id) => optionLabel(cat, id))
    if (l.length) parts.push(l.length > 3 ? `${l.length} ${noun}` : l.join(', '))
  }
  add('geography', 'regions'); add('sector', 'sectors'); add('currency', 'currencies'); add('category', 'categories')
  const rating: string[] = []
  if (p.rating < RATINGS.length) rating.push(RATINGS[p.rating] + ' and below')
  if (p.unrated) rating.push('not rated')
  if (rating.length) parts.push('rating ' + rating.join(', '))
  if (p.esg > 0) parts.push('ESG score ' + ESG_SCORES[p.esg - 1] + ' and below')
  if (p.inst.length) parts.push(p.inst.length === 1 ? instrumentByIsin(p.inst[0]).name : p.inst.length + ' instruments')
  return parts
}

/** Active exclusions grouped by preference, every excluded value as its own label (for the tag summary in the overview strip). */
export function exclusionGroups(p: PortfolioState['prefs']): { label: string; values: string[] }[] {
  const groups: { label: string; values: string[] }[] = []
  const add = (label: string, values: string[]) => { if (values.length) groups.push({ label, values }) }
  add('Geography', p.sel.geography.map((id) => optionLabel('geography', id)))
  add('Sector', p.sel.sector.map((id) => optionLabel('sector', id)))
  add('Currency', p.sel.currency.map((id) => optionLabel('currency', id)))
  add('Instrument category', p.sel.category.map((id) => optionLabel('category', id)))
  add('Credit rating', [...(p.rating < RATINGS.length ? [RATINGS[p.rating] + ' and below'] : []), ...(p.unrated ? ['Not rated'] : [])])
  add('ESG', p.esg > 0 ? ['Score ' + ESG_SCORES[p.esg - 1] + ' and below'] : [])
  add('Instruments', p.inst.map((isin) => instrumentByIsin(isin).name))
  return groups
}

// ---- Number helpers ----
export const f2 = (n: number) => (Math.round(n * 100) / 100).toFixed(2)
export const pct = (n: number) => Math.round(n * 10) / 10 + '%'
export const round2 = (n: number) => Math.round(n * 100) / 100
export const near100 = (t: number) => Math.abs(t - 100) < 0.005
